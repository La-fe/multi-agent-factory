# Multi-Agent Factory — Agent Guidelines

> This file is the single source of truth for all AI agents working on this project.
> CLAUDE.md is a symlink to this file.

## Project Structure

- Source code: `src/` (API routes, services, utilities)
- Tests: colocated `*.test.ts` next to source files
- Scripts: `scripts/` (committer, pre-commit helpers)
- CI/CD: `.github/workflows/`
- Agent prompts: `.claude/prompts/` (PR review, merge, issue analysis)
- Git hooks: `git-hooks/`

## Build, Test, and Development Commands

- Runtime: Node **22+**
- Install deps: `pnpm install`
- Dev mode: `pnpm dev`
- Type-check: `pnpm typecheck`
- Lint: `pnpm lint`
- Format: `pnpm format`
- Full check: `pnpm check` (format + typecheck + lint)
- Tests: `pnpm test`
- Coverage: `pnpm test:coverage` (70% threshold)

## Commit Guidelines

- **Always use `scripts/committer`** for commits:
  ```bash
  scripts/committer "fix(api): handle missing todo ID" src/routes/todos.ts src/routes/todos.test.ts
  ```
- Follow Conventional Commits: `feat|fix|refactor|test|docs|chore(scope): message`
- Group related changes; avoid bundling unrelated refactors
- Keep commits small and focused — easier to review, easier to revert

## Coding Style

- Language: TypeScript (ESM)
- Strict typing; avoid `any`
- Files under ~500 LOC; extract helpers when growing
- Add brief comments for tricky or non-obvious logic only
- Use existing patterns; don't reinvent utilities that already exist

## Testing Guidelines

- Framework: Vitest with V8 coverage
- Naming: `*.test.ts` colocated with source
- Run `pnpm test` before pushing
- Coverage thresholds: 70% lines/branches/functions/statements
- Write tests for behavior, not implementation details

---

## Multi-Agent Safety Rules

> These rules prevent 30 parallel agents from destroying each other's work.
> EVERY agent must follow these. No exceptions.

### DO NOT:
- **Never** `git add .` or `git add -A` — use `scripts/committer` with explicit file paths
- **Never** create/apply/drop `git stash` — other agents may be working
- **Never** switch branches unless explicitly asked
- **Never** create/remove git worktrees unless explicitly asked
- **Never** run `git reset --hard` or `git clean -fd`
- **Never** edit files outside your assigned task scope

### DO:
- **Scope commits** to your own changes only
- **Use `scripts/committer`** for every commit (it clears staging first)
- **Continue working** if you see unrecognized files — they belong to another agent
- **Auto-resolve** formatting-only diffs without asking
- **Report** briefly at end if other agents' files are present in your working directory

### When user says:
- `"push"` → you may `git pull --rebase` first, then push (never discard others' work)
- `"commit"` → scope to your changes only
- `"commit all"` → commit everything in grouped conventional-commit chunks

### Parallel Workflow Pattern:
```bash
# Each agent gets its own worktree
git worktree add -b feat/agent-1-task /tmp/agent-1 main
git worktree add -b feat/agent-2-task /tmp/agent-2 main

# Agent works in isolation
cd /tmp/agent-1
# ... make changes ...
scripts/committer "feat(api): add pagination" src/routes/todos.ts

# Push and create PR
git push -u origin feat/agent-1-task
gh pr create --title "feat: add pagination" --body "..."
```

---

## Task Decomposition Pattern

When given a large task, break it down like this:

1. **Identify independent units** — features that don't touch the same files
2. **Create GitHub Issues** for each unit
3. **Assign to separate agents** via worktrees
4. **Each agent**: implement → test → commit → push → create PR
5. **Review agent**: runs `/reviewpr` on each PR
6. **Merge agent**: runs `/landpr` to merge passing PRs

Example decomposition for "Build a TODO API":
```
Issue #1: POST /todos (create) ← Agent A in worktree-1
Issue #2: GET /todos (list)    ← Agent B in worktree-2
Issue #3: PUT /todos/:id       ← Agent C in worktree-3
Issue #4: DELETE /todos/:id    ← Agent D in worktree-4
```

All four agents can work simultaneously because they touch different route handlers.

---

## Quality Gates

Every commit must pass these checks (enforced by pre-commit hooks and CI):

1. **Lint**: `oxlint` — catches bugs, performance issues, suspicious patterns
2. **Format**: `oxfmt` — consistent code style
3. **Type-check**: `tsc --noEmit` — TypeScript strict mode
4. **Tests**: `vitest` — 70% coverage minimum
5. **Security**: no secrets in commits (checked by CI)

If a check fails, fix it before committing. Do not bypass hooks.
