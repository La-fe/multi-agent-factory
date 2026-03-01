# GitHub Issue Template for Agent-Executable Tasks

## Template

Every Issue created by /decompose MUST follow this structure. This is the contract that worker agents depend on for their confidence check.

```markdown
## Summary
[One sentence: what this task does and why.]

## Context
- Current codebase state: [relevant info from Phase 1 analysis]
- Why this task exists: [which PRD requirement it serves]
- Related tasks: [what was completed before this, what comes after]

## Requirements
- [Specific behavior 1]
- [Specific behavior 2]
- [API shape / response format if applicable]
- [Edge cases to handle]

## Files
- CREATE: `src/path/file.ts` — [what this file contains]
- CREATE: `src/path/file.test.ts` — [test scope: unit tests for X, Y, Z]
- MODIFY: `src/existing.ts` — [specific change: add export X, modify function Y]
  - Merge Contract:
    - PRESERVES: [existing exports/interfaces unchanged]
    - ADDS: [new exports/functions]
    - MODIFIES: [changed functions + what changes]

## Acceptance Criteria
- [ ] [Specific testable condition 1]
- [ ] [Specific testable condition 2]
- [ ] Tests cover happy path + edge cases
- [ ] `pnpm check && pnpm test` passes
- [ ] No lint errors introduced

## Test Specifications
- Test file: `src/path/file.test.ts`
- Test scope: [unit/integration/e2e]
- Key test cases:
  - [ ] [Happy path scenario]
  - [ ] [Error/edge case scenario]
  - [ ] [Boundary condition]

## Environment Variables
[If this task introduces new env variables]
- `VAR_NAME`: type (required/optional, default: "value") — used by `src/path/file.ts`

## External Input Dependencies
[If this task requires non-code inputs from humans]
- [Input description] — source: [who provides it] — blocks: [what it blocks]

## Security
[If multi-tenant or security-sensitive]
- RLS Policy: [policy description]
- Migration: `supabase/migrations/XXX_add_rls_[table].sql`
- Tenant isolation: [how isolation is verified]

## Wave
Wave N — Can run in parallel with: #X, #Y
Depends on: #A, #B (must be merged first)
Shared files: [any files in Shared File Registry for this task]

## Scope
[XS|S|M|L] ([1|2-3|4-5|6+] files, estimated [lines] LOC)
```

## Agent Friendliness Checklist

Before creating an Issue, verify it passes ALL 7 checks:

| # | Check | Why It Matters |
|---|-------|---------------|
| 1 | Title uses conventional commit format | Agent can infer branch name: `feat/agent-N-slug` |
| 2 | Has explicit file paths (CREATE/MODIFY) | Agent knows exactly where to work |
| 3 | Has acceptance criteria with checkboxes | Agent can self-verify completion |
| 4 | Has scope estimate (XS/S/M/L) | Orchestrator can set appropriate budget |
| 5 | Has Wave + parallel info | Orchestrator knows scheduling constraints |
| 6 | Has test file path + test scope | Agent creates tests alongside source code |
| 7 | Every MODIFY has a Merge Contract | Agent preserves existing code, avoids destructive overwrites |

## Title Format

```
type(scope): concise description
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
Scope: module or area name (e.g., `auth`, `payments`, `api`)

Examples:
- `feat(auth): add user registration with email/password`
- `feat(auth): add JWT sign and verify utilities`
- `fix(api): handle missing todo ID in PATCH endpoint`
- `refactor(store): add userId field for data isolation`

## Scope Estimation Guide

| Size | Files | LOC | Agent Budget | Human Time |
|------|-------|-----|-------------|-----------|
| XS | 1 | < 50 | $0.30 | < 15 min |
| S | 1-2 | 50-150 | $0.80 | 15-30 min |
| M | 2-3 | 150-400 | $1.50 | 30-60 min |
| L | 4-5 | 400-800 | $3.00 | 1-2 hours |

Tasks larger than L should be split further.

## Label Convention

| Label | Purpose | Applied By |
|-------|---------|-----------|
| `enhancement` | New feature tasks | /decompose |
| `bug` | Bug fix tasks | /decompose |
| `status:ready` | Ready for agent pickup | /decompose (Wave 1 only) |
| `wave:N` | Wave assignment | /decompose |
| `size/XS` through `size/XL` | Scope indicator | /decompose |
| `area:*` | Module area | /decompose (if labels exist) |
| `has-merge-contract` | Task includes MODIFY with merge contract | /decompose |

## gh issue create Command

```bash
gh issue create \
  --title "feat(scope): description" \
  --label "enhancement" \
  --label "wave:N" \
  --label "size/S" \
  --body "$(cat <<'EOF'
## Summary
...

## Context
...

## Requirements
...

## Files
...

## Acceptance Criteria
...

## Test Specifications
...

## Environment Variables
[none | list]

## External Input Dependencies
[none | list]

## Security
[N/A | details]

## Wave
...

## Scope
...
EOF
)"
```

**Important**: Only Wave 1 tasks get `--label "status:ready"`. Wave 2+ tasks wait for prior Wave completion.
