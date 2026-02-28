---
description: Decompose a feature into parallel agent tasks and create GitHub Issues
---

# /decompose <feature description>

Goal: break a feature into independent, agent-friendly GitHub Issues that can be processed by `scripts/orchestrator`.

## Process

### 1. Understand the Feature
- What's the end state? What user-facing behavior changes?
- Read existing code to understand current patterns

### 2. Map the Files
- Which files will be CREATED? Which MODIFIED?
- Identify file boundaries — changes to different files = parallelizable

### 3. Find Independence
Group changes into tasks that can run simultaneously:
- Tasks touching **DIFFERENT** files → Wave 1 (parallel)
- Tasks touching the **SAME** file → Wave 2 (sequential, after Wave 1)
- Maximum **5 agents** per wave

### 4. Write Agent-Friendly Issues

Each Issue **MUST** include these sections for the orchestrator's worker agent:

```markdown
## Summary
One sentence: what this task adds/fixes.

## Requirements
- Specific behavior with API shape / response format
- Edge cases to handle
- Concrete acceptance criteria

## Files to create / modify
- CREATE: `src/feature.ts`
- CREATE: `src/feature.test.ts`
- MODIFY: `src/app.ts` (register route)

## Acceptance criteria
- [ ] Endpoint returns correct JSON shape
- [ ] Tests cover happy path + edge cases
- [ ] `pnpm check && pnpm test` passes
```

**Why this structure matters:** The worker agent's confidence check evaluates:
1. Is the problem clearly described? → **Summary**
2. Can I locate the relevant code? → **Files to create/modify**
3. Is the scope reasonable? → **Acceptance criteria** (bounded)
4. Is a specific fix suggested? → **Requirements** (concrete)

Issues missing these sections → agent confidence < 7 → skipped.

### 5. Create Issues on GitHub

```bash
gh issue create \
  --title "feat(scope): task description" \
  --label "enhancement" \
  --label "status:ready" \
  --body "$(cat <<'EOF'
## Summary
...

## Requirements
...

## Files to create / modify
...

## Acceptance criteria
...
EOF
)"
```

**Critical:** Add the `status:ready` label — this is what `scripts/orchestrator --label status:ready` filters on.

### 6. Output the Execution Plan

#### Wave 1 — Parallel (launch all at once)
| Agent | Issue | Branch | New Files | Modified Files |
|-------|-------|--------|-----------|----------------|
| A | #N | feat/issue-N | src/feature-a.ts | src/app.ts |
| B | #M | feat/issue-M | src/feature-b.ts | — |

#### Wave 2 — Sequential (depends on Wave 1)
| Agent | Issue | Branch | Depends On | Why |
|-------|-------|--------|------------|-----|
| C | #K | feat/issue-K | #N, #M | Touches files modified in Wave 1 |

#### Launch Commands
```bash
# Wave 1 — run all 3 issues in parallel
scripts/orchestrator --label "status:ready" --limit 3 --max-parallel 3 --yes

# Wait for PRs, review them
scripts/review-prs --auto-merge

# Wave 2 — after Wave 1 is merged
scripts/orchestrator --label "wave:2" --limit 2 --yes
```

## Rules
- Maximum 5 parallel agents per wave
- Each task MUST have concrete acceptance criteria
- Each task MUST include "write tests" in scope
- Each task MUST list files to create/modify
- Integration tests go in Wave 2
- Never create issues with scope "Large (5+ files)" — split further
- Use `status:ready` label for orchestrator pickup
