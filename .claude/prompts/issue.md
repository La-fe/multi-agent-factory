---
description: Analyze a GitHub issue and propose a fix or implementation
---

# /issue <number>

## For Bugs

1. Read the issue **in full** (all comments, linked issues)
2. **Ignore** the reporter's root cause guess — find it yourself
3. Read all related source files (no truncation, no skimming)
4. Trace the code path to find **actual root cause**
5. Propose fix with specific file + line references
6. Do NOT implement unless explicitly asked

## For Features

1. Read all related source files
2. Propose concise implementation approach
3. List affected files and changes
4. Estimate: small (1 file) / medium (2-5 files) / large (5+ files)
5. Identify if it can be parallelized (independent sub-tasks)
6. Do NOT implement unless explicitly asked

## Output Format

### Summary
One sentence: what's the issue about.

### Root Cause (bugs) / Approach (features)
Technical explanation with file:line references.

### Proposed Changes
```
src/health.ts:12         — add null check for degraded status
src/app.ts:18            — handle missing route gracefully
src/health.test.ts       — add regression test
```

### Parallelizable?
Yes/No. If yes, list independent sub-tasks that can be assigned to separate agents.
