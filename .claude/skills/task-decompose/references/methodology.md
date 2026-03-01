# Three-Dimensional Decomposition Methodology

## Overview

This methodology combines three proven approaches:
1. **Task Master's PRD-to-Task Pipeline** — sequential ID assignment, dependency inference, complexity scoring
2. **Microsoft Research RPG** — Repository Planning Graph with functional + structural dual decomposition
3. **Anthropic's 3C Principle** — Concise, Contextual, Constrained task specifications

---

## Dimension 1: Functional Decomposition (What to Build)

Break requirements into a **Capability → Feature** hierarchy.

### Rules

1. **Capability** = a user-facing ability (e.g., "User Authentication", "Payment Processing")
2. **Feature** = an implementable unit within a Capability (e.g., "User Registration", "Password Hashing")
3. Each Feature should be testable in isolation
4. Features should follow the Single Responsibility Principle
5. Aim for 3-8 Features per Capability

### Decomposition Checklist

For each requirement, ask:
- Can this be split into independent sub-capabilities? → Split
- Does this have both a "data" and "behavior" aspect? → Separate model from logic
- Does this have both "happy path" and "edge cases"? → Core first, edge cases as follow-up
- Does this touch both "creation" and "consumption"? → Separate write from read paths

### Common Patterns

| Requirement Pattern | Decomposition Strategy |
|-------------------|----------------------|
| CRUD for entity X | Split by operation: Create, Read, Update, Delete |
| Integration with API X | Split: client wrapper → business logic → error handling |
| UI component with logic | Split: data layer → component → styling → interaction |
| Migration/upgrade | Split: schema change → data migration → code update → cleanup |
| AI feature | Split: prompt/config → API integration → response processing → fallback |
| Multi-tenant feature | Split: schema + RLS → service logic → tenant-aware middleware → admin view |
| Cross-cutting concern | Split: interface contract → core implementation → per-module integration |

---

## Dimension 2: Structural Decomposition (Where Code Goes)

Map Features to **file operations**: CREATE, MODIFY, DELETE.

### File Operation Rules

1. **CREATE** operations are easier — no conflict with existing code
2. **MODIFY** operations require a **Merge Contract**: what is preserved, what is added, what is changed
3. A MODIFY that changes > 50 lines of an existing file should be reviewed for splitting
4. Every source file gets a corresponding test file

### Merge Contract Format

Every MODIFY must specify:

```
MODIFY src/path/file.ts
  Merge Contract:
    PRESERVES: [list of exports, interfaces, functions that must not change]
    ADDS: [new exports, imports, functions being introduced]
    MODIFIES: [existing functions being changed + specific description of what changes]
```

Purpose: In multi-agent execution, agents work on isolated branches. Without merge contracts, agent B may destructively overwrite agent A's changes to the same file. The contract makes the expected final state explicit.

### Module Boundary Detection

Identify natural module boundaries by looking for:
- Directory structure: `src/auth/`, `src/payments/`, `src/api/`
- Export boundaries: index.ts files that re-export public APIs
- Type boundaries: separate type definition files
- Test boundaries: files that are tested independently

### File Conflict Resolution

When two Features need to MODIFY the same file:

1. **Additive changes** (both add new exports/routes) → can be in same Wave if changes are to different sections AND both have merge contracts
2. **Overlapping changes** (both modify same function) → MUST be in different Waves with explicit ordering
3. **Shared dependency** (both import from same new module) → create the shared module as a Wave 1 task
4. **3+ tasks on same file** → extract a dedicated "wiring" task that owns the file

### Shared File Registry

For any file touched by 2+ tasks, create a registry entry:

```
| File | Owner Task | Other Tasks | Access Type | Wave Order |
|------|-----------|-------------|-------------|------------|
| src/middleware.ts | T3 (CREATE) | T7 (ADD route), T10 (ADD header) | Owner → serial readers | T3 → T7 → T10 |
```

Rules:
- Owner = the task that creates the file OR does the most significant change
- Non-owners must reference the owner's merge contract
- Append-only files (.env.example, barrel exports) can be parallel

---

## Dimension 3: Temporal Decomposition (When to Build)

Order tasks by dependency topology:

### Topological Sort Algorithm

```
1. Identify all tasks with 0 dependencies → Wave 1
2. Remove Wave 1 tasks from the graph
3. Identify newly-freed tasks (all deps now in Wave 1) → Wave 2
4. Repeat until all tasks assigned
5. If unassigned tasks remain → circular dependency detected → ERROR
```

### Dependency Types

| Type | Example | Priority |
|------|---------|----------|
| Data dependency | "routes.ts needs user-store.ts to exist" | Must be in later Wave |
| API dependency | "frontend needs backend API to be deployed" | Must be in later Wave |
| Merge dependency | "T7 MODIFYs file that T3 CREATEs" | T7 must be after T3 |
| Test dependency | "integration test needs all units to pass" | Always last Wave |
| No dependency | "two independent utility functions" | Same Wave (parallel) |
| External input | "needs Stripe webhook secret from dashboard" | Flag as external blocker |

---

## Sprint-Level Decomposition (Sprint Mode)

When decomposing an entire sprint or milestone:

### Phase Graph (replaces Wave assignment)

```
Phase 1: Foundation (must complete before any features)
  - Database schema + migrations
  - Shared types and utilities
  - Configuration and env setup

Phase 2: Core Features (parallel feature tracks)
  Track A: Feature X (3-4 sub-tasks, internally wave-ordered)
  Track B: Feature Y (3-4 sub-tasks, internally wave-ordered)
  Track C: Feature Z (2-3 sub-tasks)

Phase 3: Integration (after all Phase 2 tracks complete)
  - Cross-feature wiring
  - Integration tests
  - E2E test suite

Phase 4: Polish (after Phase 3)
  - Performance optimization (only if PRD specifies targets)
  - Error handling improvements
  - Documentation
```

### Sub-Decompose Hints

Each Phase 2 feature-task should include a hint for future Feature Mode decomposition:

```
Feature: User Authentication
  Sub-decompose hint:
    - Data model (User schema + RLS) — 1 task
    - Auth logic (register, login, verify) — 2-3 tasks
    - API routes — 1 task
    - Middleware — 1 task
  Estimated sub-tasks: 5-6
  Estimated agent cost: $4-6
```

---

## Cross-Cutting Decomposition (Cross-Cut Mode)

When a feature touches many existing modules:

### Interface-First Strategy

1. **Define the interface contract** — what the cross-cutting concern exposes to consumers
2. **Implement the core** — the cross-cutting module itself
3. **Integrate per-module** — one task per module that needs to consume the interface
4. **Verify isolation** — ensure each integration task is self-contained

### Shared File Ownership Model

```
Ownership levels:
  OWNER: Creates the file or does primary modification. Full write access.
  WRITER: Has a merge contract to modify specific parts. Must preserve owner's interface.
  READER: Only imports from the file. No modifications allowed.
```

### Contract Stability Assessment

For each MODIFY in cross-cut mode, assess downstream risk:

| Risk Level | Signal | Action |
|-----------|--------|--------|
| Low | Adding new export, no existing API changes | Proceed |
| Medium | Changing function signature with backward-compatible default | Add migration note |
| High | Removing/renaming export used by 3+ files | Dedicated migration task |
| Critical | Changing shared type shape (schema, interface) | Must be Wave 1 + all consumers in later Waves |

---

## Anti-Patterns to Avoid

### Over-Decomposition
- **Symptom**: Tasks like "Create empty file", "Add import statement", "Add one function"
- **Rule**: If a task would take < 5 minutes for a human, merge it with its parent

### Under-Decomposition
- **Symptom**: Tasks like "Build the entire authentication system"
- **Rule**: If a task touches > 4 files or would take > 2 hours, split it

### Phantom Dependencies
- **Symptom**: "Task B depends on Task A" when B only needs A's type definitions, not implementation
- **Rule**: Only declare dependency if B needs A's runtime output to function

### Premature Abstraction
- **Symptom**: "Create utility library for X" when X is used in exactly one place
- **Rule**: Inline first, abstract only when the same pattern appears 3+ times

### Missing Merge Contracts
- **Symptom**: Two tasks both say "MODIFY src/app.ts" without specifying what each changes
- **Rule**: Every MODIFY must include a PRESERVES/ADDS/MODIFIES contract

### Test Amnesia
- **Symptom**: Tasks create source files without corresponding test files
- **Rule**: Every source file task specifies test file path + test scope

### Invisible Environment Variables
- **Symptom**: Tasks introduce new env variables but don't track them
- **Rule**: Every task lists new env variables with type, required/optional, and consuming file

### Unspecified External Providers
- **Symptom**: Task says "integrate with email service" but doesn't name the provider
- **Rule**: External services must be specified (SendGrid, Resend, etc.) or flagged as a decision gate
