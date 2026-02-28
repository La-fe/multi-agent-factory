# Multi-Agent Factory

> 学习 Peter Steinberger（OpenClaw 作者，238K Stars）如何用 30 个并行 AI Agent 一天提交 627 次代码。

基于 OpenClaw 项目逆向工程，提取并教学化的多 Agent 开发基础设施。

## 快速开始

```bash
git clone <repo> && cd multi-agent-factory
pnpm install
scripts/setup-hooks    # 安装 git hooks（质量门）
pnpm check && pnpm test  # 验证环境
```

然后阅读 **[TUTORIAL.md](./TUTORIAL.md)** 开始学习。

## 这是什么？

一个**可直接使用的项目模板**，内含：

| 文件 | 来源 | 作用 |
|------|------|------|
| `scripts/committer` | OpenClaw | 多 Agent 安全提交（防止 `git add .` 灾难） |
| `AGENTS.md` / `CLAUDE.md` | OpenClaw | AI Agent 行为手册 + 多 Agent 安全规则 |
| `git-hooks/pre-commit` | OpenClaw | 自动 lint + format（每次 commit 过质量门） |
| `.claude/prompts/reviewpr.md` | OpenClaw | AI 审查 PR 的 9 步流程 |
| `.claude/prompts/landpr.md` | OpenClaw | AI 合并 PR 的完整流程 |
| `.claude/prompts/decompose.md` | 原创 | AI 任务分解（大功能 → 并行子任务） |
| `.github/workflows/ci.yml` | OpenClaw | 智能 CI（docs-only 跳过重型任务） |
| `vitest.config.ts` | OpenClaw | 70% 覆盖率门槛 |

## Peter 的 627 次提交是怎么做到的？

```
人类（Peter）: 定目标 + 定规则 + 睡觉
     ↓
30 个 AI Agent: 并行写代码（各自在独立 worktree 中）
     ↓
scripts/committer: 每个 Agent 只提交自己的文件（不互相污染）
     ↓
pre-commit hooks: 12 道质量检查自动拦截坏代码
     ↓
CI: 测试不过 → AI 自动修复 → 重新提交
     ↓
通过 → 自动提交。每个循环 ~2 分钟。
```

## 核心命令

```bash
# 安全提交（多 Agent 必须用这个）
scripts/committer "feat(api): add pagination" src/routes/todos.ts

# 质量检查
pnpm check         # format + typecheck + lint
pnpm test          # 运行测试
pnpm test:coverage # 覆盖率报告

# 并行开发
git worktree add -b feat/task-1 .worktrees/agent-a main
cd .worktrees/agent-a && claude "实现 Issue #1..."

# PR 工作流（在 Claude Code 中）
/reviewpr 1    # 审查 PR
/landpr 1      # 合并 PR
/decompose ... # 分解大任务
```

## 文件结构

```
multi-agent-factory/
├── AGENTS.md              ← AI 行为手册
├── CLAUDE.md → AGENTS.md  ← Claude Code 自动读取
├── TUTORIAL.md            ← 完整教程
├── scripts/
│   ├── committer          ← 核心：多 Agent 安全提交
│   ├── setup-hooks        ← 安装 git hooks
│   └── pre-commit/        ← pre-commit 辅助
├── git-hooks/pre-commit   ← 自动 lint + format
├── .claude/prompts/       ← Agent 工作流
│   ├── reviewpr.md        ← PR 审查
│   ├── landpr.md          ← PR 合并
│   ├── issue.md           ← Issue 分析
│   └── decompose.md       ← 任务分解
├── .github/workflows/     ← CI/CD
├── src/                   ← Demo TODO API
└── vitest.config.ts       ← 测试配置
```

## License

MIT
