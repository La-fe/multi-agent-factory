# Task Decompose Plugin Suite

Complex task decomposition for AI multi-agent execution.

## Plugins

| Plugin | Command | Purpose |
|--------|---------|---------|
| task-decompose | `/decompose` | PRD/需求 → 代码分析 → 功能拆解 → Wave 编排 → GitHub Issues |
| task-decompose-eval | `/decompose-eval` | 模式感知 12 维度质量评估 + 过度设计检测 |

## Quick Start

```bash
# Decompose from PRD file (Feature Mode)
/decompose .taskmaster/docs/prd.md

# Decompose from text
/decompose 为 TODO API 添加 JWT 用户认证系统

# Sprint-level decomposition
/decompose plans/2026-03/prd.md --mode sprint

# Cross-cutting concern
/decompose "添加 Brand DNA 设计系统" --mode crosscut

# Decompose with auto-validation
/decompose prd.md --validate

# Evaluate existing decomposition
/decompose-eval [decomposition output]
```

## Three Decomposition Modes

| Mode | When to Use | Task Granularity | Evaluation Focus |
|------|-------------|-----------------|-----------------|
| **Feature** (default) | Single feature, bug fix, refactor | File-level (1-4 files/task) | File Non-Overlap, Agent Friendliness |
| **Sprint** | Epic, milestone, V1.0 launch | Feature-level (each task = sub-decomposable) | Architectural Coherence, Integration Coverage |
| **Cross-Cut** | Design system, middleware, schema migration | Module-level with shared file governance | Contract Stability, Shared File Governance |

## Methodology

Three-dimensional decomposition combining:
1. **Task Master** — PRD → complexity scoring → dependency-aware task graph
2. **Microsoft RPG** — Functional + structural dual decomposition
3. **Anthropic 3C** — Concise, Contextual, Constrained task specifications

## Key Improvements (v2.0)

Validated through 10 iterations against real-world tasks:

| Improvement | Problem Solved |
|------------|---------------|
| Mandatory Test Pairing | Test files were consistently missing (scored 3/10 in all iterations) |
| MODIFY Merge Contracts | Multi-agent file modifications caused destructive overwrites |
| Shared File Registry | 3+ tasks touching middleware.ts/schema.sql caused merge conflicts |
| Environment Constraint Check | Tasks assuming capabilities unavailable in deploy target (e.g., Remotion on Vercel) |
| Env Variable Manifest | Environment variables lost across tasks, .env.example never updated |
| Security Artifacts (RLS) | Multi-tenant apps missing tenant isolation in decomposition |
| External Input Dependencies | Non-code blockers (API keys, design assets) invisible in task graph |
| Three Decomposition Modes | Sprint-level and cross-cutting tasks need different evaluation dimensions |

## Evaluation Dimensions

12 dimensions (mode-dependent activation) with weighted scoring:

| Dimension | Feature | Sprint | Cross-Cut |
|-----------|---------|--------|-----------|
| Agent Friendliness | 15% | 10% | 12% |
| File Non-Overlap | 15% | — | 10% |
| Complexity | 12% | 10% | 10% |
| Dependencies | 12% | 12% | 12% |
| Over-Engineering | 12% | 10% | — |
| Granularity | 8% | — | 8% |
| Test Coverage | 8% | 8% | 8% |
| Parallel Efficiency | 8% | 8% | 5% |
| Completeness | 5% | 10% | 5% |
| Path Validity | 5% | 5% | 5% |
| Architectural Coherence | — | 15% | — |
| Integration Coverage | — | 12% | — |
| Contract Stability | — | — | 15% |
| Shared File Governance | — | — | 10% |

## Veto Rules (8 checks)

Any veto → decomposition is unqualified regardless of score:
1. Circular dependency
2. File conflict in same Wave
3. Missing acceptance criteria (>50%)
4. Complexity explosion (>5 files)
5. Ghost task (no PRD trace)
6. Missing merge contract (MODIFY without contract)
7. Test-free decomposition (zero test files)
8. Environment constraint violation
