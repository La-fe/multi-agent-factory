---
description: Decompose a feature into parallel agent tasks
---

# /decompose <feature description>

Goal: break a feature into independent tasks that can be assigned to parallel AI agents.

## Process

1. **Understand the feature** — what's the end state?

2. **Map the files** — which files will be created/modified?

3. **Find independence** — group changes by file boundaries:
   - Tasks that touch DIFFERENT files = can run in parallel
   - Tasks that touch the SAME file = must be sequential

4. **Create GitHub Issues** for each task:
   ```bash
   gh issue create --title "feat(scope): task description" --body "..."
   ```

5. **Output the execution plan**:

### Parallel Wave 1 (independent — launch all at once)
| Agent | Worktree Branch | Issue | Files |
|-------|----------------|-------|-------|
| A | feat/task-1 | #10 | src/routes/new-route.ts |
| B | feat/task-2 | #11 | src/services/new-service.ts |
| C | feat/task-3 | #12 | src/utils/new-helper.ts |

### Sequential Wave 2 (depends on Wave 1)
| Agent | Branch | Issue | Files | Depends On |
|-------|--------|-------|-------|------------|
| D | feat/task-4 | #13 | src/routes/new-route.ts | #10 |

### Launch Commands
```bash
# Wave 1 — launch all simultaneously
git worktree add -b feat/task-1 /tmp/agent-a main
git worktree add -b feat/task-2 /tmp/agent-b main
git worktree add -b feat/task-3 /tmp/agent-c main

# In separate terminals:
cd /tmp/agent-a && claude "Fix issue #10: ..."
cd /tmp/agent-b && claude "Fix issue #11: ..."
cd /tmp/agent-c && claude "Fix issue #12: ..."
```

## Rules
- Maximum 5 parallel agents per wave (more = more merge conflicts)
- Each task must have clear acceptance criteria
- Each task must include "write tests" in scope
- Integration tests go in Wave 2 (after individual pieces land)
