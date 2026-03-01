# Multi-Agent Factory — Agent Guidelines

> This file is the single source of truth for all AI agents working on this project.
> CLAUDE.md (at project root) is a symlink to this file.

## Project Structure

- Source code: `src/` (API routes, services, utilities)
- Tests: colocated `*.test.ts` next to source files
- Scripts: `scripts/` (committer, orchestrator, create-worktree, review-prs)
- CI/CD: `.github/workflows/`
- Agent prompts: `.claude/prompts/` (PR review, merge, issue analysis)
- Agent definitions: `.claude/agents/` (worker, reviewer)
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

---

## Automated Orchestration

The orchestrator (`scripts/orchestrator`) automates the full multi-agent workflow:
fetch GitHub issues → spawn parallel Claude agents in isolated worktrees → each
agent fixes an issue and creates a PR.

### Quick Start

```bash
# 1. Label issues as ready
gh issue edit 42 --add-label "status:ready"

# 2. Run orchestrator
scripts/orchestrator --label "status:ready" --limit 3

# 3. Review generated PRs
scripts/review-prs
```

### Orchestrator Commands

```bash
# Preview what would be processed (no agents spawned)
scripts/orchestrator --label "status:ready" --dry-run

# Process up to 5 issues, 3 agents in parallel
scripts/orchestrator --label "status:ready" --limit 5 --max-parallel 3

# Skip confirmation, custom budget per agent
scripts/orchestrator --label bug --limit 3 --yes --budget 2.00

# Use a specific model
scripts/orchestrator --label "status:ready" --model opus --budget 5.00

# Continuous mode: re-run every 5 minutes
scripts/orchestrator --label "status:ready" --watch --interval 300

# Target a specific repository
scripts/orchestrator owner/repo --label "status:ready"
```

### 6-Phase Workflow

1. **Parse** — CLI arguments and configuration
2. **Fetch** — Pull open issues from GitHub matching the label filter
3. **Confirm** — Display issue table, let user select which to process
4. **Pre-check** — Verify no duplicate branches/PRs, check claims
5. **Spawn** — Create worktrees + launch parallel Claude agents
6. **Report** — Wait for completion, display results, clean up

### Scripts Reference

| Script | Purpose |
|--------|---------|
| `scripts/orchestrator` | Core: 6-phase automated issue-fixing pipeline (headless) |
| `scripts/launch-agents` | Visual launcher: iTerm2 tabs/splits or tmux panes |
| `scripts/create-worktree` | Initialize worktree with deps + hooks |
| `scripts/review-prs` | Batch PR review with auto-merge and auto-fix |
| `scripts/monitor-agents` | Real-time tmux monitoring + auto-approve |
| `scripts/committer` | Multi-agent safe commit helper |
| `scripts/cleanup-branches` | Safe branch lifecycle cleanup (dry-run default) |
| `scripts/setup-hooks` | Install git hooks |

### Agent Definitions

| Agent | File | Role |
|-------|------|------|
| Worker | `.claude/agents/worker.md` | Fix issues: analyze → implement → test → commit → PR |
| Reviewer | `.claude/agents/reviewer.md` | Review PRs: read-only, structured verdict output |

### Review Commands

```bash
# Review all open PRs
scripts/review-prs

# Review specific PRs
scripts/review-prs 5 7

# Review + auto-merge approved PRs
scripts/review-prs --auto-merge

# Review + auto-fix PRs that need work (Phase 6)
scripts/review-prs --auto-fix

# Full pipeline: review → fix → merge
scripts/review-prs --auto-fix --auto-merge
```

### Monitoring (tmux)

Real-time monitoring of parallel agents in tmux sessions with auto-approve.

```bash
# Continuous monitoring with auto-approve
scripts/monitor-agents --auto-approve

# Quick status check
scripts/monitor-agents --once

# Fast polling, custom session
scripts/monitor-agents --interval 3 --session my-agents
```

Status detection: WORKING → WAITING → DONE → ERROR (auto-approve sends 'y' to permission prompts).

### Visual Mode (launch-agents)

Watch agents work in real-time — each agent gets its own iTerm2 tab/pane.

```bash
# iTerm2 tabs — one tab per agent (default)
scripts/launch-agents --issues 2 3 4

# iTerm2 vertical splits — see all agents side by side
scripts/launch-agents --issues 2 3 4 --mode split

# By label instead of issue numbers
scripts/launch-agents --label "status:ready" --mode tab

# tmux — SSH-friendly, detachable
scripts/launch-agents --issues 2 3 --mode tmux

# Interactive mode — you chat with each agent manually
scripts/launch-agents --issues 2 --interactive

# Dry run — show what would launch
scripts/launch-agents --label "status:ready" --dry-run
```

**Headless vs Visual:**

| | `scripts/orchestrator` | `scripts/launch-agents` |
|---|---|---|
| Execution | Background, `claude -p` | Foreground, visible terminals |
| Monitoring | Wait + summary table | Watch each agent in real-time |
| Interaction | None (fully autonomous) | Optional (`--interactive`) |
| Best for | CI, batch processing, 5+ issues | Learning, debugging, 2-4 issues |

### Issue Label Lifecycle

Labels drive the automated workflow. The orchestrator and launch-agents manage transitions automatically.

```
status:ready          Issue is queued for agent processing
    ↓                 (orchestrator/launch-agents picks it up)
status:in-progress    Agent is actively working on this issue
    ↓                 (agent creates PR)
status:review         PR created, awaiting review
    ↓                 (review-prs --auto-merge merges it)
status:done           Issue resolved, PR merged
```

**Label categories:**

| Category | Labels | Applied by |
|----------|--------|------------|
| Status | `status:ready`, `status:in-progress`, `status:review`, `status:done` | Human / scripts |
| Close reason | `close:duplicate`, `close:not-planned`, `close:stale` | Human / stale bot |
| Area | `area:api`, `area:scripts`, `area:ci`, `area:agents`, `area:public` | Labeler workflow (path-based) |
| Size | `size/XS`, `size/S`, `size/M`, `size/L`, `size/XL` | Auto-label workflow |
| Utility | `no-stale`, `needs-decompose` | Human |

**Branch naming** (auto-derived from issue labels + title):
- `feat/agent-{N}-{slug}` — enhancement/feature labels
- `fix/agent-{N}-{slug}` — bug labels
- `refactor/agent-{N}-{slug}` — refactor labels
- `docs/agent-{N}-{slug}` — docs labels

The `agent-` prefix distinguishes AI-created branches from human-created ones (e.g. `feat/manual-feature`).

### Branch Lifecycle

Branches are automatically cleaned up (no manual action needed):
- **On merge**: `--delete-branch` flag auto-deletes remote + local cleanup
- **Scheduled CI**: Daily workflow cleans merged/stale remote branches
- **GitHub setting**: `delete_branch_on_merge=true` auto-deletes head branch on PR merge

Manual cleanup tool:
```bash
scripts/cleanup-branches              # View status report
scripts/cleanup-branches --all        # Preview cleanable branches (dry-run)
scripts/cleanup-branches --all --execute  # Execute cleanup
```

Safety rules:
- Only `*/agent-*` or `*/issue-*` prefixed branches are auto-cleaned
- Branches with unpushed commits are never auto-deleted
- Branches with active worktrees are never deleted
- Human-created branches require `--include-manual` explicit opt-in

### Safety Mechanisms

- **Worktree isolation**: Each agent works in its own directory, no cross-contamination
- **Claims system**: `.claude/claims.json` prevents two agents from working on the same issue
- **Atomic locking**: `mkdir`-based locks (macOS-compatible, no `flock` needed)
- **Budget caps**: `--max-budget-usd` limits per-agent spend
- **Cleanup trap**: `Ctrl-C` safely kills agents, removes worktrees, releases claims
- **Pre-checks**: Skips issues that already have branches or PRs
- **Quality gates**: Pre-commit hooks + CI block bad code from merging
