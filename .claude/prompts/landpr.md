---
description: Land a PR (review + fix + test + merge)
---

# /landpr <PR number>

Goal: PR must end in GitHub state = MERGED. Never CLOSED.

## Steps

1. **Assign PR** to self
   ```bash
   gh pr edit $PR --add-assignee @me
   ```

2. **Clean state**
   ```bash
   git status  # must be clean
   ```

3. **Get PR meta**
   ```bash
   contrib=$(gh pr view $PR --json author --jq .author.login)
   head=$(gh pr view $PR --json headRefName --jq .headRefName)
   ```

4. **Fast-forward main**
   ```bash
   git checkout main && git pull --ff-only
   ```

5. **Checkout PR**
   ```bash
   gh pr checkout $PR
   ```

6. **Rebase onto main**
   ```bash
   git rebase main
   ```

7. **Fix + improve** (if needed)
   - Implement fixes
   - Add/adjust tests
   - Update CHANGELOG.md if user-facing

8. **Run full quality gate**
   ```bash
   pnpm check && pnpm test
   ```

9. **Commit via committer**
   ```bash
   scripts/committer "fix(scope): summary (#$PR) thanks @$contrib" <changed-files>
   ```

10. **Push**
    ```bash
    git push --force-with-lease
    ```

11. **Merge**
    ```bash
    gh pr merge $PR --rebase  # or --squash
    ```

12. **Sync main**
    ```bash
    git checkout main && git pull --ff-only
    ```

13. **Verify**
    ```bash
    gh pr view $PR --json state --jq .state  # must be "MERGED"
    ```

14. **Comment** with summary
    ```bash
    gh pr comment $PR -F - <<'EOF'
    Landed via rebase onto main.
    Gate: pnpm check && pnpm test ✅
    Thanks @$contrib!
    EOF
    ```

## Rules
- Never `gh pr close` — always merge
- Always run gate before merge
- Use `scripts/committer` for all commits
