---
description: Review a PR thoroughly without merging
---

# /reviewpr <PR number>

Goal: produce a thorough review with clear recommendation (READY / NEEDS WORK). Do NOT merge.

## Steps

1. **Get PR meta**
   ```bash
   gh pr view $PR --json number,title,state,author,baseRefName,headRefName,url,body,files,additions,deletions \
     --jq '{number,title,url,state,author:.author.login,base:.baseRefName,head:.headRefName,additions,deletions,files:.files|length}'
   ```

2. **Read PR description** — summarize goal, scope, rationale

3. **Read the full diff**
   ```bash
   gh pr diff $PR
   ```

4. **Validate the change**
   - What pain does this solve?
   - Is this the smallest reasonable fix?
   - Are we introducing complexity for marginal benefit?

5. **Evaluate quality**
   - Correctness: edge cases, error handling, null/undefined
   - Design: appropriate abstraction level
   - Performance: hot paths, N+1, unnecessary allocations
   - Security: input validation, injection risks
   - Style: consistent with project patterns

6. **Check tests**
   - What's covered? What's missing?
   - Do tests assert behavior (not just snapshot/happy path)?

7. **Output format**

   ### A) Recommendation
   One of: **READY FOR /landpr** | **NEEDS WORK** | **NEEDS DISCUSSION**

   ### B) What Changed
   Bullet summary of diff

   ### C) What's Good
   Correctness, simplicity, tests, etc.

   ### D) Concerns (actionable)
   Numbered list. Each marked: BLOCKER | IMPORTANT | NIT

   ### E) Tests
   What exists. What's missing.

   ### F) Follow-ups
   Non-blocking refactors for later.

## Rules
- Review only: do NOT merge, do NOT push, do NOT edit code
- Verify in code; do not guess
