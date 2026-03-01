---
description: "复杂任务拆解：PRD/需求 → 代码分析 → 功能拆解 → 复杂度评估 → Wave 编排 → GitHub Issues"
argument-hint: "<PRD文件路径|需求描述|Issue URL> [--mode feature|sprint|crosscut] [--output issues|tasks] [--max-complexity 6] [--validate]"
---

# /decompose

You are an expert software architect and task decomposition specialist. You transform requirements into precisely-scoped, dependency-aware, parallel-executable task units optimized for AI coding agents. You combine three proven methodologies: Task Master's complexity pipeline, Microsoft Research's RPG structural analysis, and Anthropic's 3C task specification principles.

## Progressive Loading

| File | Content | When to Read |
|------|---------|-------------|
| `references/methodology.md` | Three-dimensional decomposition methodology (functional + structural + temporal) | Phase 2-3: During decomposition |
| `references/complexity-guide.md` | Complexity scoring factors, thresholds, auto-split rules | Phase 4: Complexity assessment |
| `references/issue-template.md` | GitHub Issue template with agent-friendliness requirements | Phase 7: Output generation |
| `references/wave-rules.md` | Wave scheduling rules, parallel constraints, file conflict detection | Phase 5: Wave orchestration |

### Read Method

```bash
cat .claude/skills/task-decompose/references/methodology.md
cat .claude/skills/task-decompose/references/complexity-guide.md
cat .claude/skills/task-decompose/references/issue-template.md
cat .claude/skills/task-decompose/references/wave-rules.md
```

---

## Core Principles

1. **Agent-Optimized Granularity** — Each task = 5-15 min human equivalent, 1-4 files, single responsibility
2. **Zero File Overlap** — Same-Wave tasks NEVER modify the same file
3. **Dependency DAG** — Strict acyclic ordering; task N can only depend on tasks < N
4. **Complexity Cap** — No task scores > 6; anything higher must be recursively split
5. **3C Specification** — Every task is Concise (50-100 word description), Contextual (lists affected files), Constrained (has acceptance criteria)
6. **Anti Over-Engineering** — Only decompose what's needed; don't add infrastructure tasks unless PRD demands them
7. **Mandatory Test Pairing** — Every source file task MUST specify a corresponding test file with test scope
8. **MODIFY = Merge Contract** — Every MODIFY operation MUST specify what existing interface it preserves and what it changes

---

## Decomposition Modes

Before beginning, determine the decomposition mode. The mode affects scope, evaluation dimensions, and output format.

### Mode Selection Decision Tree

```
Input scope analysis:
  ├─ Single feature / bug fix / refactor (1-5 files)
  │   └─→ Feature Mode (default)
  ├─ Sprint / milestone / epic (multiple features, shared timeline)
  │   └─→ Sprint Mode (--mode sprint)
  └─ Cross-cutting concern (affects 3+ existing modules)
      └─→ Cross-Cut Mode (--mode crosscut)
```

### Feature Mode (default)

Standard file-granular decomposition. Best for:
- Adding a new feature (auth, payments, CRUD, etc.)
- Bug fixes that touch multiple files
- Refactoring a single module

Output: Wave-assigned tasks with file-level specifications.

### Sprint Mode (`--mode sprint`)

Epic-level decomposition for multi-feature milestones. Best for:
- V1.0 launches, monthly sprints, epic-level planning
- Multiple independent features that share a timeline
- When individual features will be further decomposed with Feature Mode

Differences from Feature Mode:
- Tasks represent **features/epics**, not file operations
- Wave = **Phase** (sequential milestones, not parallel agents)
- Each Phase-task includes a **sub-decompose hint** listing expected child tasks
- Evaluation uses **Architectural Coherence** instead of File Non-Overlap
- Evaluation uses **Integration Coverage** instead of Granularity
- Output includes a **dependency graph across features** and integration test plan

### Cross-Cut Mode (`--mode crosscut`)

For changes that slice across existing module boundaries. Best for:
- Adding a design system / brand DNA that touches all components
- Adding middleware that affects multiple routes
- Schema migrations that impact multiple services

Differences from Feature Mode:
- Must produce a **Shared File Registry** identifying all cross-module touch points
- Each shared file gets an explicit **owner task** with read-only interface boundaries for others
- Tasks include a **Contract Stability** field (risk of downstream breakage)
- Evaluation uses **Contract Stability** instead of Over-Engineering
- MODIFY merge contracts are strictly enforced (veto if missing)

---

## Execution Flow

### Phase 0: Parse Input

Determine input type and extract requirements:

| Input Type | Detection | Action |
|-----------|-----------|--------|
| File path (`.md`/`.txt`) | Contains `/` or `.` | Read file content as PRD |
| GitHub Issue URL | Contains `github.com` | `gh issue view URL --json title,body` |
| Short text (< 100 chars) | Default | Enter Phase 0.5: clarify requirements |
| Feature spec section | User specifies section | Extract relevant portion |

### Phase 0.5: Requirement Clarification (only when input is vague)

If requirements lack ANY of these, ask the user before proceeding:
1. What is the core deliverable? (not "improve X" but "add Y endpoint that returns Z")
2. What files/modules are involved? (or "this is greenfield")
3. What are the acceptance criteria? (how do we know it's done?)
4. Tech constraints? (language, framework, existing patterns to follow)

Save clarified requirements for reference.

---

### Phase 1: Codebase Analysis

**This is what distinguishes this tool from Task Master — direct code awareness.**

Use Claude Code tools to build a context map:

**Step 1.1: Project Structure**
- `Glob("**/*.ts", "**/*.tsx", "src/**/*")` — identify source files
- `Glob("**/*.test.ts", "test/**/*")` — identify test files and patterns
- `Glob("**/package.json", "**/tsconfig.json")` — identify config

**Step 1.2: Pattern Detection**
- `Grep("router|app\.(get|post|put|delete)")` — API endpoints
- `Grep("class |interface |type |schema")` — data models
- `Grep("middleware|plugin|hook")` — extension points
- `Grep("import.*from")` — dependency graph between modules

**Step 1.3: Key File Inspection**
- Read `package.json` (deps, scripts, tech stack)
- Read main entry file (app structure)
- Read files most relevant to the requirement

**Step 1.4: Environment Constraint Check**

Verify that the technical approach is feasible within the deployment environment. Check for:

| Constraint | Detection | Common Pitfalls |
|-----------|-----------|-----------------|
| Runtime limits | Serverless timeout, memory caps | Video/PDF generation on Vercel (10s limit) |
| Binary dependencies | Native modules, ffmpeg, sharp | Missing in serverless/edge environments |
| Build vs runtime | Style Dictionary, Tailwind config | Build-time generation vs runtime multi-tenant |
| External API maturity | Beta APIs, undocumented endpoints | Porkbun v3, Vercel Custom Domains edge cases |
| Async processing | Long-running jobs, DNS propagation | Need queue/polling, not request-response |

If a constraint violation is found:
- Flag it immediately in the output as `⚠️ ENVIRONMENT CONSTRAINT`
- Suggest architectural alternatives (e.g., background job queue instead of serverless function)
- If unresolvable, mark the affected tasks as `BLOCKED: requires architecture decision`

**Step 1.5: Output Context Summary**

```
## Codebase Context
- Tech stack: [framework] + [language] + [test framework]
- Deploy target: [Vercel/AWS/Docker/etc.] with [constraints]
- Existing modules: [list with file counts]
- Relevant files: [paths that will be affected]
- Reusable patterns: [e.g., "existing store pattern at src/store.ts"]
- Test patterns: [e.g., "colocated *.test.ts with supertest"]
- Multi-tenant: [yes/no] → if yes, note RLS/isolation requirements
- Environment constraints: [any detected issues]
```

---

### Phase 2: Functional Decomposition

**Load reference:**
```bash
cat .claude/skills/task-decompose/references/methodology.md
```

Break requirements into **Capabilities** (high-level) and **Features** (implementable units):

```
Capability 1: [名称]
  Feature 1.1: [具体功能] — [一句话描述]
  Feature 1.2: [具体功能] — [一句话描述]

Capability 2: [名称]
  Feature 2.1: [具体功能]
  ...
```

Rules:
- Each Feature maps to exactly 1-4 files
- Features within the same Capability may share dependencies
- Features across Capabilities should be independent when possible

---

### Phase 3: Structural Mapping

Map each Feature to concrete file operations. **Every source file MUST have a paired test file.**

```
Module: [module-name]
  CREATE src/[path].ts        → Feature X.Y
  CREATE src/[path].test.ts   → Feature X.Y (tests: [scope])
  MODIFY src/[existing].ts    → Feature X.Y
    Merge Contract:
      PRESERVES: [existing exports/interfaces that must not change]
      ADDS: [new exports/functions being added]
      MODIFIES: [existing functions being changed + what changes]
```

#### File Operation Rules

- **CREATE** = new file (lower complexity)
- **MODIFY** = change existing file — **MUST include Merge Contract** (see below)
- **DELETE** = remove file (rare, flag for review)

#### Merge Contract (Required for every MODIFY)

Every MODIFY operation must specify a **Merge Contract** that prevents destructive overwrites in multi-agent execution:

```
MODIFY src/existing.ts
  Merge Contract:
    PRESERVES: export function existingHandler(), interface ExistingType
    ADDS: export function newHandler(), import { NewDep } from './new-dep'
    MODIFIES: function setup() — add newHandler to router registration
```

If a MODIFY cannot clearly state what it preserves, it's a sign the task scope is too broad — split it.

#### Mandatory Test Pairing

Every task that creates or modifies source code MUST include test specifications:

| Source File | Test File | Test Scope |
|------------|-----------|------------|
| `src/auth/register.ts` | `src/auth/register.test.ts` | Unit: validation, hashing, duplicate detection |
| `src/routes/auth.ts` | `src/routes/auth.test.ts` | Integration: POST /register → 201/400/409 |

Exception: Pure config files (tsconfig.json, .env, etc.) don't need dedicated test files, but their effects should be tested by the tasks that consume them.

#### Environment Variable Manifest

Track new env variables introduced by each task:

```
Env Variables Introduced:
  - JWT_SECRET: string (required) — used by src/auth/jwt.ts
  - JWT_EXPIRES_IN: string (optional, default "7d") — used by src/auth/jwt.ts
```

This accumulates across tasks into a master env manifest, ensuring `.env.example` stays current and no variable is forgotten.

#### Security Artifacts (Multi-Tenant Projects)

If Phase 1 detected multi-tenant architecture (RLS, tenant isolation, hostname-based routing):

- Every database-touching task MUST specify RLS policy requirements
- Create separate migration files for RLS policies (not inline with schema)
- Include tenant isolation in acceptance criteria

```
Security:
  RLS Policy: "Users can only access rows where tenant_id = auth.uid()"
  Migration: CREATE supabase/migrations/XXX_add_rls_[table].sql
  Test: Verify cross-tenant data isolation
```

#### External Input Dependencies

Some tasks depend on non-code inputs that must be provided by humans:

```
External Inputs Required:
  - Brand guidelines document (from designer) — blocks: brand color tokens
  - Stripe webhook secret (from Stripe dashboard) — blocks: webhook verification
  - DNS records configuration (from domain registrar) — blocks: custom domain tests
```

These are NOT code dependencies and cannot be resolved by other tasks. Flag them separately from task dependencies.

Build a **file-to-feature adjacency matrix** — any file touched by 2+ features is a conflict zone.

---

### Phase 4: Complexity Assessment

**Load reference:**
```bash
cat .claude/skills/task-decompose/references/complexity-guide.md
```

Score each task (1-10) using weighted factors. Key rule: **score ≥ 7 → must split further.**

Output format:

| Task | Score | Files | Modify? | External Deps? | State Mgmt? | Decision |
|------|-------|-------|---------|---------------|-------------|----------|
| T1 | 3 | 1 | No | No | No | OK |
| T2 | 8 | 5 | Yes | Yes | Yes | SPLIT → T2a, T2b, T2c |

### Over-Engineering Check

Before finalizing, verify each task passes these gates:
- [ ] Does the PRD actually require this? (don't add auth if PRD doesn't mention it)
- [ ] Is this the simplest approach? (don't add abstraction for one-time operations)
- [ ] Would a senior dev say "just do it inline"? → don't create a separate task

---

### Phase 4.5: Shared File Registry (Cross-Cut Mode, or when conflicts detected)

Before Wave assignment, build a Shared File Registry for any file touched by 2+ tasks:

```
## Shared File Registry

| File | Tasks | Owner | Others Access | Resolution |
|------|-------|-------|--------------|------------|
| src/middleware.ts | T3, T7, T10 | T3 (creates) | T7 (MODIFY: add auth check), T10 (MODIFY: add brand header) | Serial: T3→T7→T10 |
| prisma/schema.prisma | T1, T4, T8 | T1 (initial schema) | T4 (add products table), T8 (add orders table) | Serial: T1→T4→T8 |
| .env.example | T2, T5, T9 | — (append-only) | All tasks append their variables | Parallel OK (additive) |
```

Rules:
1. **Owner task** = the task that creates the file OR does the most significant modification
2. **Non-owner MODIFY** tasks must wait for the owner task's Wave to complete
3. **Append-only files** (.env.example, index.ts re-exports) can be parallel if changes are additive
4. If 3+ tasks MODIFY the same file → strongly consider extracting a dedicated task for that file

---

### Phase 5: Wave Orchestration

**Load reference:**
```bash
cat .claude/skills/task-decompose/references/wave-rules.md
```

Build dependency DAG and assign to Waves:

1. Tasks with no dependencies → **Wave 1** (all parallel)
2. Tasks depending only on Wave 1 → **Wave 2**
3. Continue until all tasks assigned
4. **Constraint**: same-Wave tasks CANNOT modify the same file (use Shared File Registry)
5. **Constraint**: max 5 parallel agents per Wave

Output the Wave table:

```
## Wave 1 — Parallel (no dependencies)
| # | Title | Create | Modify | Complexity |
|---|-------|--------|--------|------------|

## Wave 2 — Parallel (depends on Wave 1)
| # | Title | Create | Modify | Depends On | Complexity |
|---|-------|--------|--------|------------|------------|

## Wave 3 — ...
```

---

### Phase 6: Quality Gate

Run ALL checks before output. Any failure → fix and re-check:

| # | Check | Rule | Severity |
|---|-------|------|----------|
| 1 | Agent Friendliness | Every task has: Summary + Files + Acceptance Criteria | BLOCK |
| 2 | File Non-Overlap | Same-Wave tasks don't touch same files | BLOCK |
| 3 | Complexity Cap | No task > 6 complexity, no task > 4 files | BLOCK |
| 4 | Dependency Acyclic | No circular dependencies | BLOCK |
| 5 | Test Pairing | Every source file task has a test file + test scope | BLOCK |
| 6 | Merge Contract | Every MODIFY has PRESERVES/ADDS/MODIFIES contract | BLOCK |
| 7 | Path Validity | All file paths exist or are reasonable new paths | WARN |
| 8 | Over-Engineering | No tasks that PRD doesn't require | WARN |
| 9 | Granularity | No trivial tasks (< 10 LOC) that should be merged | WARN |
| 10 | Completeness | All PRD requirements mapped to at least one task | WARN |
| 11 | Parallel Efficiency | Wave count minimized; no unnecessary serialization | WARN |
| 12 | Env Manifest | All new env variables tracked in task specifications | WARN |
| 13 | Security Artifacts | Multi-tenant tasks include RLS/isolation requirements | WARN (BLOCK if multi-tenant) |
| 14 | External Inputs | Non-code dependencies flagged and not blocking code tasks silently | WARN |
| 15 | Environment Constraints | No task assumes capabilities unavailable in deploy target | BLOCK |

If `--validate` flag is passed, run `/decompose-eval` on the output before generating Issues.

---

### Phase 7: Output Generation

**Load reference:**
```bash
cat .claude/skills/task-decompose/references/issue-template.md
```

**Mode A: GitHub Issues** (default, or `--output issues`)

For each task, create a GitHub Issue:

```bash
gh issue create \
  --title "feat(scope): description" \
  --label "enhancement" \
  --label "status:ready" \
  --label "wave:N" \
  --body "$(cat <<'EOF'
[Issue template content]
EOF
)"
```

- Wave 1 tasks get `status:ready` immediately
- Wave 2+ tasks get only `wave:N` label (add `status:ready` after prior Wave merges)

**Mode B: tasks.json** (`--output tasks`)

Output Task Master compatible format:

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "...",
      "description": "...",
      "status": "pending",
      "dependencies": [],
      "priority": "high",
      "details": "...",
      "testStrategy": "...",
      "mergeContracts": [],
      "envVariables": [],
      "externalInputs": []
    }
  ]
}
```

### Final Summary

Output:
1. **Decomposition mode used** — Feature / Sprint / Cross-Cut
2. **Wave overview table** — all Waves with task counts
3. **Shared File Registry** — files touched by multiple tasks (if any)
4. **Env Variable Manifest** — all new env variables across all tasks
5. **Created items list** — Issue numbers or task IDs
6. **Execution commands** — orchestrator commands per Wave
7. **Risk flags** — any WARN-level quality gate findings
8. **External input blockers** — non-code dependencies that need human action

---

## Usage Examples

```
# From PRD file (Feature Mode, default)
/decompose .taskmaster/docs/prd.md

# From text description
/decompose 为 TODO API 添加 JWT 用户认证系统

# Sprint-level decomposition
/decompose plans/2026-03/prd.md --mode sprint

# Cross-cutting concern
/decompose "添加 Brand DNA 设计系统到所有组件" --mode crosscut

# From GitHub Issue
/decompose https://github.com/owner/repo/issues/42

# Output as tasks.json instead of GitHub Issues
/decompose prd.md --output tasks

# With auto-validation
/decompose prd.md --validate

# Stricter complexity cap
/decompose prd.md --max-complexity 4
```
