---
description: Triage open issues — classify, label, and assess agent-readiness
---

# /triage [issue-number | --all]

Goal: assess open issues for agent-readiness and apply appropriate labels.

## Process

### 1. Fetch Issues

```bash
# Single issue
gh issue view <number> --json number,title,body,labels

# All unlabeled open issues
gh issue list --state open --json number,title,body,labels | jq '[.[] | select(.labels | length <= 1)]'
```

### 2. Classify Each Issue

For each issue, determine:

| Dimension | Options | How to Decide |
|-----------|---------|---------------|
| **Type** | `bug` / `enhancement` / `refactor` / `docs` / `chore` | Does it report broken behavior (bug) or request new capability (enhancement)? |
| **Scope** | `small` / `medium` / `large` | 1 file = small, 2-5 files = medium, 5+ = large |
| **Agent-ready?** | Yes / No | Does it pass the 4-point confidence check? |

### 3. Confidence Pre-Assessment

Apply the worker agent's confidence check criteria:

1. **Clarity** — Is the problem clearly described? (not "it's broken")
2. **Locatability** — Are specific files/functions mentioned or inferable?
3. **Scope** — Is it bounded to a reasonable change? (not "rewrite the API")
4. **Specificity** — Is the expected behavior concrete? (not "make it better")

Score 1-10. Issues scoring **>= 7** get `status:ready`. Issues scoring **< 7** need improvement.

### 4. Apply Labels

```bash
# Agent-ready issue
gh issue edit <N> --add-label "status:ready"
gh issue edit <N> --add-label "enhancement"  # or "bug"

# Needs improvement
gh issue edit <N> --add-label "needs-info"
gh issue comment <N> --body "This issue needs more detail for agent processing:
- [ ] Add specific expected behavior
- [ ] List files likely affected
- [ ] Add acceptance criteria"

# Too large — needs decomposition
gh issue comment <N> --body "This issue is too large for a single agent. Use \`/decompose\` to split it into smaller tasks."
gh issue edit <N> --add-label "needs-decompose"
```

### 5. Output Report

```
## Triage Report

| # | Title | Type | Scope | Score | Action |
|---|-------|------|-------|-------|--------|
| 5 | Add /ping endpoint | enhancement | small | 9/10 | ✅ status:ready |
| 6 | API is slow | bug | ??? | 3/10 | ❌ needs-info |
| 7 | Build tag system | enhancement | large | 8/10 | ⚠️ needs-decompose |

### Ready for orchestrator: 1 issue
### Needs info: 1 issue
### Needs decomposition: 1 issue
```

## Labels Used

| Label | Meaning |
|-------|---------|
| `status:ready` | Issue is agent-processable, orchestrator can pick it up |
| `needs-info` | Issue needs more detail before agent can work on it |
| `needs-decompose` | Issue is too large, needs `/decompose` first |
| `bug` | Reports broken behavior |
| `enhancement` | Requests new capability |
