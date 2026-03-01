# Wave Orchestration Rules

## Core Algorithm

### Step 1: Build Dependency Graph

For each task, record:
- `id`: unique task identifier
- `depends_on`: list of task IDs that must complete first
- `files_create`: list of new files this task creates
- `files_modify`: list of existing files this task modifies
- `merge_contracts`: for each MODIFY, what is preserved/added/changed
- `env_variables`: new environment variables introduced
- `external_inputs`: non-code inputs required from humans

### Step 2: Shared File Registry Check

Before topological assignment, build the Shared File Registry:

```
for each file in all tasks' files_modify + files_create:
    tasks_touching_file = [tasks that CREATE or MODIFY this file]
    if len(tasks_touching_file) > 1:
        add to shared_file_registry:
            file: path
            owner: task that CREATEs it (or has most significant MODIFY)
            others: remaining tasks with access type (MODIFY/READ)
            resolution: serial (owner first) or parallel (if additive-only)
```

Shared file entries create implicit dependencies:
- Non-owner MODIFY tasks depend on the owner task
- If no clear owner exists, the file becomes a serialization point

### Step 3: Topological Assignment

```
available = tasks with no dependencies
wave_number = 1

while available is not empty:
    wave[wave_number] = []

    for task in available:
        # Check file conflict with already-assigned tasks in this wave
        if no_file_conflict(task, wave[wave_number]):
            wave[wave_number].append(task)

    # If a task conflicts with all existing wave members, start new wave
    for remaining in (available - wave[wave_number]):
        wave_number += 1
        wave[wave_number] = [remaining]

    # Remove assigned tasks, recalculate available
    remove_assigned_from_graph()
    available = tasks_with_all_deps_in_completed_waves()
    wave_number += 1
```

### Step 4: Validate

- No circular dependencies
- No orphan tasks (tasks that nothing depends on AND don't deliver a PRD requirement)
- No wave exceeds max parallel (default: 5)
- All shared file ordering is respected
- All merge contracts are non-contradictory (two tasks don't both MODIFY the same function)

## File Conflict Rules

Two tasks CONFLICT if they share any file in their `files_modify` lists.

| Task A | Task B | Conflict? | Resolution |
|--------|--------|-----------|------------|
| CREATE `src/a.ts` | CREATE `src/b.ts` | No | Same Wave OK |
| CREATE `src/a.ts` | MODIFY `src/a.ts` | Yes | B must be in later Wave |
| MODIFY `src/app.ts` | MODIFY `src/app.ts` | Yes | Must be in different Waves |
| CREATE `src/a.ts` | CREATE `src/a.ts` | ERROR | Duplicate task — merge |
| MODIFY `src/app.ts` (add route) | MODIFY `src/app.ts` (add middleware) | Yes | Different Waves, verify merge contracts don't conflict |
| MODIFY `.env.example` (append VAR_A) | MODIFY `.env.example` (append VAR_B) | Soft | Parallel OK if both are additive appends |

### Additive-Only Exception

Some files can be modified in parallel if ALL conditions are met:
1. Both tasks only ADD new content (no modifications to existing lines)
2. Changes are to different sections of the file
3. Both tasks have merge contracts specifying PRESERVES for all existing content
4. File type supports clean auto-merge (e.g., barrel exports, env files, route registrations)

Mark these as `parallel-safe` in the Shared File Registry.

## Wave Sizing

| Wave Size | When | Trade-off |
|-----------|------|-----------|
| 1-2 tasks | Bottleneck wave | Minimize; may indicate decomposition problem |
| 3-5 tasks | Optimal | Good parallelism, manageable review |
| 6+ tasks | Over-parallel | Split into sub-waves; review burden too high |

## Dependency Patterns

### Pattern 1: Foundation → Features (Most Common)
```
Wave 1: [setup, data model, shared utilities]  → 2-3 tasks
Wave 2: [feature A, feature B, feature C]       → 3-5 tasks (parallel)
Wave 3: [integration, wiring, final tests]      → 1-2 tasks
```

### Pattern 2: Layered Architecture
```
Wave 1: [types, schemas, interfaces]
Wave 2: [data layer, storage]
Wave 3: [business logic, services]
Wave 4: [API routes, controllers]
Wave 5: [integration tests]
```

### Pattern 3: Independent Modules
```
Wave 1: [module A, module B, module C]  → all parallel, no deps
Wave 2: [integration across modules]
```

### Pattern 4: Shared File Serialization
```
Wave 1: [T1 creates middleware.ts, T2 creates store.ts, T3 creates types.ts]
Wave 2: [T4 modifies middleware.ts (add auth), T5 uses store.ts (read-only)]
Wave 3: [T6 modifies middleware.ts (add brand), T7 integration tests]
```

## Execution Commands

After Wave assignment, generate orchestrator commands:

```bash
# Wave 1 — launch
scripts/orchestrator --label "wave:1" --max-parallel 5 --yes

# Wait for Wave 1 PRs to merge
scripts/review-prs --auto-merge

# Wave 2 — mark ready + launch
gh issue edit ISSUE_IDS --add-label "status:ready"
scripts/orchestrator --label "wave:2" --max-parallel 5 --yes

# Repeat for each Wave
```

## Parallel Efficiency Metric

```
efficiency = total_tasks / (wave_count × max_parallel_per_wave)
```

| Efficiency | Rating | Meaning |
|-----------|--------|---------|
| > 0.7 | Excellent | Most waves are full |
| 0.4-0.7 | Good | Some serialization, acceptable |
| 0.2-0.4 | Poor | Too many dependencies, consider restructuring |
| < 0.2 | Bad | Nearly serial; decomposition needs rework |

## Risk Flags

Flag these situations in the output:

1. **Bottleneck task**: A single task that blocks 3+ downstream tasks
   → Consider splitting the bottleneck into smaller parallel pieces

2. **Long critical path**: More than 4 Waves
   → Review if some dependencies are phantom (not actually needed)

3. **Single-task wave**: A Wave with only 1 task
   → Either it's the final integration task (OK) or a dependency problem

4. **All-MODIFY wave**: A Wave where every task modifies existing files
   → Higher merge conflict risk; consider worktree isolation

5. **Shared file hotspot**: A file in the Shared File Registry touched by 3+ tasks
   → Consider extracting a dedicated task that owns all changes to this file

6. **Environment constraint violation**: A task assumes capabilities the deploy target lacks
   → Must redesign before wave assignment; do not schedule impossible tasks

7. **Missing external inputs**: A task requires human-provided inputs that aren't available
   → Flag as a blocker; do not include in Wave scheduling until input is confirmed
