# Complexity Scoring Guide

## Scoring Scale (1-10)

Each task is scored on a 1-10 scale. The score determines whether the task needs further splitting.

### Factor Weights

| Factor | Weight | Scoring Guide |
|--------|--------|--------------|
| File count | 25% | 1 file=1, 2 files=3, 3 files=5, 4 files=7, 5+=9 |
| Modifies existing code | 25% | No=1, Minor change=4, Major refactor=7, Architecture change=9 |
| External dependencies | 15% | None=1, 1 stable lib=3, Multiple/unstable=6, External API=8 |
| Test difficulty | 15% | Unit only=2, Integration=5, E2E/mock-heavy=7, External service=9 |
| State management | 10% | Stateless=1, Local state=3, Shared state=6, Distributed=9 |
| Domain complexity | 10% | Boilerplate=1, Standard pattern=3, Business logic=6, Algorithm=9 |

### Score Calculation

```
score = sum(factor_score × weight) / sum(weights)
round to nearest integer
```

### Decision Rules

| Score | Category | Action |
|-------|----------|--------|
| 1-3 | Simple | Ship as-is. Single file, pure creation, no dependencies. |
| 4-6 | Medium | Ship as-is. 2-3 files, may modify existing code. |
| 7-8 | Complex | MUST SPLIT. Too many concerns in one task. |
| 9-10 | Very Complex | MUST SPLIT into 3+ subtasks. Usually an architecture task. |

### Configurable Threshold

Default max complexity: **6** (all tasks ≤ 6 allowed)

Override with `--max-complexity N`:
- `--max-complexity 4` → Stricter, more tasks, more parallelism
- `--max-complexity 8` → Looser, fewer tasks, less overhead

## Split Strategies

When a task scores ≥ 7, apply these strategies:

### Strategy 1: Layer Split
Original: "Add user authentication" (score 9)
Split into:
- Data model + store (score 4)
- Business logic / utilities (score 3)
- API routes / handlers (score 5)
- Integration + wiring (score 4)

### Strategy 2: Operation Split
Original: "CRUD for products" (score 8)
Split into:
- Create operation (score 3)
- Read/List operations (score 3)
- Update operation (score 4)
- Delete operation (score 2)

### Strategy 3: Concern Split
Original: "Payment integration with Stripe" (score 9)
Split into:
- Stripe SDK setup + config (score 2)
- Payment intent creation (score 5)
- Webhook handling (score 5)
- Error handling + retries (score 4)

### Strategy 4: Phase Split
Original: "Migrate database schema" (score 8)
Split into:
- Write migration script (score 4)
- Update model types (score 3)
- Update queries (score 5)
- Update tests (score 3)

### Strategy 5: Security Split (Multi-Tenant)
Original: "Add products table with tenant isolation" (score 8)
Split into:
- Schema migration + types (score 3)
- RLS policies + security migration (score 4)
- Service layer with tenant context (score 5)
- Tests with cross-tenant isolation verification (score 3)

---

## Over-Engineering Detection

A task is over-engineered if ANY of these are true:

1. **Unnecessary abstraction**: Creates a generic utility for a one-time operation
   - Signal: task title contains "utility", "helper", "framework" for single-use code

2. **Gold plating**: Adds features not in the PRD
   - Signal: task requirements can't be traced back to a PRD requirement

3. **Premature optimization**: Adds caching/pooling/batching before measuring
   - Signal: task title contains "optimize", "cache", "pool" without performance data

4. **Defense in depth overkill**: Multiple validation layers for internal-only data flow
   - Signal: validating data that was just validated one function call ago

5. **Config-driven everything**: Making hardcoded values configurable "for flexibility"
   - Signal: env vars / config for values that change < 1x/year

6. **Speculative infrastructure**: Building for hypothetical future requirements
   - Signal: "we might need this later", "for extensibility", "in case we add..."

When detected, either:
- Remove the task entirely
- Merge it into a simpler parent task
- Flag as "WARN: potential over-engineering" in quality gate

---

## Environment Constraint Checks

Before finalizing complexity scores, verify that tasks are feasible in the deploy target:

| Constraint | Check | Common Failure |
|-----------|-------|----------------|
| Serverless timeout | Task generates video/PDF/heavy compute | Vercel: 10s (hobby) / 60s (pro) |
| Binary dependencies | Task needs ffmpeg, sharp, puppeteer | Not available in edge/serverless |
| File system access | Task writes to local filesystem | Serverless has ephemeral /tmp only |
| Long-running process | Task runs background jobs | Need separate worker (not request handler) |
| Memory limits | Task processes large files in memory | Lambda: 128MB-10GB, Vercel: 1-3GB |

If a task violates an environment constraint:
- Score = 10 (Very Complex) regardless of other factors
- Decision = MUST REDESIGN (not just split)
- Include an architectural note on how to resolve (e.g., "use background job queue")
