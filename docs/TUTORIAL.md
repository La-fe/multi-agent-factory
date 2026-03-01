# Multi-Agent Factory 完全教程

> 学习 Peter Steinberger（OpenClaw 作者）如何用 30 个 AI Agent 一天提交 627 次代码。
> 你不需要 30 个 Agent。你只需要理解这个模式，从 2-3 个开始。

---

## 目录

1. [核心理念](#1-核心理念)
2. [项目设置](#2-项目设置)
3. [理解基础设施](#3-理解基础设施)
4. [单 Agent 工作流](#4-单-agent-工作流)
5. [多 Agent 并行开发](#5-多-agent-并行开发)
6. [PR 审查与合并](#6-pr-审查与合并)
7. [实战演练：添加监控系统](#7-实战演练添加监控系统)
8. [进阶：自动化循环](#8-进阶自动化循环)

---

## 1. 核心理念

Peter 能一天 627 次提交，不是因为他打字快，而是因为：

```
人类定规则 → AI 按规则执行 → 质量门自动验证 → 通过则提交
     ↑                                              ↓
     └──── 不通过？AI 自动修复后重试 ←──────────────┘
```

**三个关键：**

1. **AGENTS.md** — AI 的"员工手册"，定义行为边界
2. **scripts/committer** — 原子提交脚本，防止多 Agent 互相污染
3. **质量门** — pre-commit hooks + CI，坏代码提不进来

人类唯一的工作：**定义"什么是好的"**。剩下的，AI 自己闭环。

---

## 2. 项目设置

### 2.1 克隆并初始化

```bash
git clone <this-repo> my-project
cd my-project
pnpm install
```

### 2.2 安装 Git Hooks

```bash
scripts/setup-hooks
```

这会把 `git-hooks/pre-commit` 安装到 `.git/hooks/`，每次 commit 自动运行 lint + format。

### 2.3 验证环境

```bash
pnpm check    # format + typecheck + lint
pnpm test     # run all tests
```

全部通过 = 环境就绪。

### 2.4 创建 GitHub 仓库

```bash
gh repo create my-project --public --source=. --push
```

---

## 3. 理解基础设施

### 3.1 文件地图

```
my-project/
├── CLAUDE.md → docs/AGENTS.md  ← Claude Code 自动读取
├── docs/
│   ├── AGENTS.md          ← AI 行为手册（CLAUDE.md 是它的符号链接）
│   └── TUTORIAL.md        ← 完整教程
├── scripts/
│   ├── committer          ← 多 Agent 安全提交脚本
│   ├── setup-hooks        ← 安装 git hooks
│   └── pre-commit/        ← pre-commit 辅助工具
├── git-hooks/
│   └── pre-commit         ← 自动 lint + format
├── .claude/prompts/       ← Agent 工作流提示词
│   ├── reviewpr.md        ← PR 审查流程
│   ├── landpr.md          ← PR 合并流程
│   ├── issue.md           ← Issue 分析流程
│   └── decompose.md       ← 任务分解流程
├── .github/
│   ├── workflows/ci.yml   ← CI 质量门
│   └── ISSUE_TEMPLATE/    ← Issue 模板
├── src/                   ← 业务代码
│   ├── index.ts           ← 入口（启动 HTTP 服务）
│   ├── app.ts             ← Express 路由注册
│   ├── health.ts          ← GET /health 端点
│   ├── ping.ts            ← GET /ping 端点
│   ├── version.ts         ← GET /version 端点
│   ├── uptime.ts          ← GET /uptime 端点
│   └── *.test.ts          ← 各端点的单元测试
└── vitest.config.ts       ← 测试配置（70% 覆盖率门槛）
```

### 3.2 为什么用 `scripts/committer` 而不是 `git commit`？

普通 commit：
```bash
git add .           # ← 危险！会把其他 Agent 的文件也加进去
git commit -m "..."
```

安全 commit：
```bash
scripts/committer "feat(api): add metrics endpoint" src/metrics.ts src/metrics.test.ts
```

`committer` 做了什么：
1. `git restore --staged :/` — 清空暂存区（清除其他 Agent 的文件）
2. `git add --force -- <指定文件>` — 只添加你的文件
3. 验证是否有变更
4. 处理 `index.lock` 冲突（多 Agent 并行时常见）

### 3.3 AGENTS.md 中的 Multi-Agent Safety Rules

```markdown
## 永远不要：
- git add .
- git stash
- git checkout 其他分支
- 修改不属于你任务范围的文件

## 永远要：
- 用 scripts/committer 提交
- 看到不认识的文件？无视，继续干活
- scope commit 到你自己的更改
```

这些规则确保 30 个 Agent 能在同一个 repo 同时工作不冲突。

---

## 4. 单 Agent 工作流

在上多 Agent 之前，先掌握单 Agent 的完整循环。

> **项目已内置** `/health`、`/ping`、`/version`、`/uptime` 四个端点。
> 下面用一个**尚未实现**的 `GET /metrics` 端点作为练习。

### 4.1 推荐方式：脚本自动化（无需手动创建分支）

整个流程只需 3 步：**创建 Issue → 运行脚本 → 审查合并**。
分支、worktree、提交、推送、创建 PR 全部由脚本 + Agent 自动完成。

```bash
# Step 1: 创建 Issue 并打标签
gh issue create --title "feat(api): add metrics endpoint" \
  --body "Add GET /metrics that returns { requests_total: number, uptime_seconds: number, version: string }

## Suspected files
- src/metrics.ts (new)
- src/app.ts (add route)

## Acceptance criteria
- [ ] GET /metrics returns 200 with JSON
- [ ] Unit tests cover happy path
- [ ] pnpm check && pnpm test passes"

# 将 53 替换为上一步返回的 Issue 编号
gh issue edit 53 --add-label "status:ready"
```

```bash
# Step 2: 启动编排器（自动创建 worktree + 分支 + 启动 Agent + 提交 + 推送 + 创建 PR）
scripts/orchestrator --label "status:ready" --limit 1
```

```bash
# Step 3: 审查并合并
scripts/review-prs --auto-merge
```

**就这么简单。** 编排器自动完成了：
1. 从 GitHub 拉取 `status:ready` 的 Issue
2. 创建独立 worktree + 分支（`feat/agent-N-add-metrics-endpoint`）
3. 启动 Claude Agent，Agent 读取 Issue → 写代码 → 写测试 → 运行质量门 → 提交 → 推送 → 创建 PR
4. 更新 Issue 标签（`status:ready` → `status:in-progress` → `status:review`）

### 4.2 可视化方式：实时观看 Agent 工作

如果你想看 Agent 在干什么（推荐初次使用时体验）：

```bash
# iTerm2 标签页模式 — 每个 Agent 一个标签页
scripts/launch-agents --issues <N>

# 或交互模式 — 你可以和 Agent 对话
scripts/launch-agents --issues <N> --interactive
```

### 4.3 手动方式（学习用，理解底层原理）

<details>
<summary>点击展开手动流程</summary>

这是编排器背后的底层操作。了解它有助于调试，但日常不需要手动执行。

```bash
# 1. 创建 Issue
gh issue create --title "feat(api): add metrics endpoint" \
  --body "Add GET /metrics that returns { requests_total: number, uptime_seconds: number, version: string }"

# 2. 创建 worktree（脚本自动安装依赖 + hooks）
scripts/create-worktree feat/metrics-endpoint

# 3. 进入 worktree，启动 Claude Code
cd .worktrees/feat/metrics-endpoint
claude

# 4. 在 Claude Code 中对话：
#    > 读最新的 issue，然后实现它。完成后用 scripts/committer 提交。

# 5. Agent 完成后推送并创建 PR
git push -u origin feat/metrics-endpoint
gh pr create --title "feat(api): add metrics endpoint" --body "Closes #N"

# 6. 审查 + 合并（在另一个 Claude Code session）
#    > /reviewpr <PR#>
#    > /landpr <PR#>

# 7. 清理 worktree
cd ../..
git worktree remove .worktrees/feat/metrics-endpoint
```

</details>

### 4.4 审查与合并命令

```bash
# 批量审查所有开放 PR
scripts/review-prs

# 审查 + 自动合并通过的 PR
scripts/review-prs --auto-merge

# 或在 Claude Code 中手动审查指定 PR
# > /reviewpr <PR#>
# > /landpr <PR#>
```

---

## 5. 多 Agent 并行开发

这是核心。当你有一个大功能需要实现时，你只需要做 3 件事：
**拆解需求 → 运行脚本 → 审查合并**。分支、worktree、提交、PR 全自动。

### 5.1 第一步：拆解任务（/decompose）

> **前提**：必须在项目目录内运行 `claude`，`/decompose` 命令才能被识别。
> Claude Code 从当前目录的 `.claude/prompts/` 加载自定义命令。

```bash
# 在项目目录内启动 Claude Code
cd my-project
claude
```

在 Claude Code 中输入：
```
> /decompose "给 API 添加监控系统：请求计数器、响应时间 P99、
> 错误率统计，并提供 GET /metrics 聚合端点"
```

Claude 会：
1. 分析功能涉及的文件和依赖关系
2. 按 Wave 编排（无依赖 → Wave 1 并行，有依赖 → Wave 2 串行）
3. **自动用 `gh issue create` 创建所有子 Issue 并打上 `status:ready` 标签**

输出类似：

| Wave | Issue | 任务 | 文件 |
|------|-------|------|------|
| 1 | `feat(api): add request counter middleware` | 请求计数中间件 | src/counter.ts |
| 1 | `feat(api): add response timer middleware` | 响应时间追踪 | src/timer.ts |
| 1 | `feat(api): add error tracker middleware` | 错误率统计 | src/error-tracker.ts |
| 2 | `feat(api): add /metrics aggregation endpoint` | 聚合 /metrics 端点 | src/metrics.ts, MODIFY src/app.ts |

### 5.2 第二步：启动编排器

```bash
# Wave 1 — 3 个 Issue 并行处理
# 编排器自动：创建 worktree → 启动 Agent → Agent 写代码/测试/提交/推送/创建 PR
scripts/orchestrator --label "status:ready" --limit 3 --max-parallel 3

# 审查并合并 Wave 1 的 PR
scripts/review-prs --auto-merge
```

```bash
# Wave 2 — 处理依赖 Wave 1 的任务
scripts/orchestrator --label "status:ready" --limit 2

# 最终审查
scripts/review-prs --auto-merge
```

**整个过程中你不需要手动创建分支、worktree、提交或 PR。**

### 5.3 可选：可视化模式（实时观看）

如果你想看每个 Agent 的实时输出：

```bash
# iTerm2 标签页 — 每个 Agent 一个标签页
scripts/launch-agents --label "status:ready" --mode tab

# tmux — SSH 友好，可分离
scripts/launch-agents --label "status:ready" --mode tmux

# 监控 Agent 状态 + 自动批准权限提示
scripts/monitor-agents --auto-approve
```

### 5.4 可选：手动流程（理解底层原理）

<details>
<summary>点击展开手动流程（日常不需要，仅供学习）</summary>

这是编排器背后的底层操作：

```bash
# 1. 手动创建 Issue
gh issue create --title "feat(api): add request counter middleware" --body "..."

# 2. 创建 worktree（自动安装依赖 + hooks）
scripts/create-worktree feat/request-counter

# 3. 进入 worktree 启动 Agent
cd .worktrees/feat/request-counter
claude "实现 Issue #N: 请求计数中间件。写测试。完成后用 scripts/committer 提交并 push。"

# 4. Agent 完成后推送并创建 PR
git push -u origin feat/request-counter
gh pr create --title "feat(api): add request counter middleware (#N)" --body "Closes #N"

# 5. 审查合并
scripts/review-prs --auto-merge

# 6. 清理
git worktree remove .worktrees/feat/request-counter
```

多个 Agent 就是重复上述步骤，每个在不同终端窗口运行。

</details>

---

## 6. PR 审查与合并

### 6.1 审查流程 (`/reviewpr`)

输出结构：
```
A) 推荐: READY FOR /landpr
B) 变更: 新增 GET /metrics 端点
C) 优点: 测试覆盖完整, 错误处理正确
D) 问题:
   1. [NIT] 可以用 const 替代 let (src/app.ts:15)
E) 测试: 3 个测试用例, 覆盖正常和错误路径
F) 后续: 无
```

### 6.2 合并流程 (`/landpr`)

```
1. 分配给自己
2. git checkout main && git pull
3. gh pr checkout <PR>
4. git rebase main
5. pnpm check && pnpm test  ← 质量门
6. scripts/committer "..."  ← 安全提交
7. gh pr merge --rebase
8. 验证 state = MERGED
```

---

## 7. 实战演练：添加监控系统

现在你来试一次。目标：给 API 添加请求监控（计数器 + 响应时间 + 错误率 + /metrics 聚合端点）。

### 准备

```bash
# 确保主分支干净
git checkout main && git pull

# 在项目目录中启动 Claude Code，然后分解任务
claude "/decompose 给 API 添加监控系统：请求计数、响应时间 P99、错误率统计、GET /metrics 聚合端点"
```

### 执行

`/decompose` 会自动创建 Issue 并打标签，然后你只需运行：

```bash
# Wave 1 — 并行处理无依赖的任务
scripts/orchestrator --label "status:ready" --max-parallel 3

# 审查合并
scripts/review-prs --auto-merge

# Wave 2 — 处理依赖前序任务的 Issue
scripts/orchestrator --label "status:ready"

# 最终审查
scripts/review-prs --auto-merge
```

### 验证

```bash
pnpm test           # 所有测试通过
pnpm test:coverage  # 覆盖率 > 70%
```

---

## 8. 进阶：自动化循环

Peter 的 627 次/天是因为 AI 在**自动循环**。你可以用 Ralph Wiggum 模式实现类似效果：

### 8.1 基本循环

在 `.claude/settings.json` 中配置 hooks，让 Claude 在退出时自动重启并继续工作：

```json
{
  "hooks": {
    "Stop": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "echo 'Agent completed task'"
      }]
    }]
  }
}
```

### 8.2 批量 Issue 处理

```bash
# 创建 5 个 Issues 并打标签
for i in $(seq 1 5); do
  ISSUE_URL=$(gh issue create --title "fix: issue $i" --body "...")
  ISSUE_NUM=$(basename "$ISSUE_URL")
  gh issue edit "$ISSUE_NUM" --add-label "status:ready"
done

# 用编排器批量并行处理（自动创建 worktree + 分支 + Agent）
scripts/orchestrator --label "status:ready" --limit 5 --max-parallel 5 --yes

# 批量审查 + 合并
scripts/review-prs --auto-merge
```

### 8.3 Peter 的完整模式

```
Peter 的循环 =
  30 个终端窗口
  × 每个运行独立 Claude Code session
  × 每个在独立 worktree
  × 每次 commit 过 12 道 pre-commit check
  × CI 自动验证
  × 失败 → AI 自动读错误 → 修复 → 重新提交
  × 成功 → 自动提交
  × 循环，直到任务完成
```

你不需要 30 个窗口。从 2-3 个开始，逐步增加。

关键不是数量，是**质量门的完善度**。没有测试的 627 次提交 = 627 次翻车。

---

## 快速参考

| 命令 | 用途 |
|------|------|
| `scripts/committer "msg" files...` | 多 Agent 安全提交 |
| `pnpm check` | 完整质量检查 |
| `pnpm test` | 运行测试 |
| `git worktree add -b branch path main` | 创建独立工作区 |
| `git worktree remove path` | 清理工作区 |
| `/reviewpr <PR>` | AI 审查 PR |
| `/landpr <PR>` | AI 合并 PR |
| `/decompose <feature>` | AI 分解任务（需在项目目录内运行 claude） |
| `/decompose-eval <结果>` | 评估拆解质量（12 维度 + 8 Veto 规则） |
| `/issue <number>` | AI 分析 Issue |
| `/triage <number>` | AI Issue 分类 |
