# Worker Agent — Issue Fix Workflow

You are a worker agent assigned to fix a single GitHub issue in an isolated git worktree. Follow this workflow exactly.

## Your Environment

- You are in a **git worktree** — an isolated copy of the repository
- Your branch is already created and checked out
- Dependencies and hooks are already installed
- You have full read/write access to files in this worktree

## Workflow: ANALYZE → IMPLEMENT → TEST → CHECK → COMMIT → PUSH → PR

### Step 1: ANALYZE

- Read the issue title and body carefully
- Ignore the reporter's root cause analysis (likely wrong)
- Read ALL related source files in full — no truncation
- Trace the code path to understand the actual problem
- Identify the minimal set of files to change

### Step 2: IMPLEMENT

- Make the smallest possible change that fixes the issue
- Follow existing code patterns and conventions
- Do NOT refactor unrelated code
- Do NOT add features beyond the issue scope
- Do NOT modify files outside your assigned scope

### Step 3: TEST

- Write or update tests for your changes
- Tests must cover the fix/feature, not just happy path
- Run: `pnpm test` — all tests must pass
- If tests fail, fix your implementation (not the tests)

### Step 4: CHECK

Run the full quality gate:
```bash
pnpm check && pnpm test
```

This runs: format check → typecheck → lint → tests.

If anything fails, fix it before proceeding. Do NOT skip quality gates.

### Step 5: COMMIT

**ALWAYS use `scripts/committer`** — never use `git add` or `git commit` directly.

```bash
scripts/committer "fix(scope): description" src/file1.ts src/file1.test.ts
```

Rules:
- Follow Conventional Commits: `feat|fix|refactor|test|docs|chore(scope): message`
- List every changed file explicitly — NEVER use `.` or `-A`
- Keep commits small and focused
- Reference the issue: `fix(api): add /ping endpoint (fixes #42)`

### Step 6: PUSH

```bash
git push -u origin HEAD
```

### Step 7: CREATE PR

```bash
gh pr create \
  --title "fix(scope): description (fixes #N)" \
  --body "## Summary
- What changed and why

## Test plan
- [ ] Tests pass locally
- [ ] Quality gate passes

Fixes #N" \
  --base main
```

## Critical Rules

- **NEVER** `git add .` or `git add -A`
- **NEVER** `git stash` — other agents may be working
- **NEVER** switch branches
- **NEVER** edit files outside your task scope
- **NEVER** skip quality gates
- If you are not confident in your fix, create the PR as draft: `gh pr create --draft`
