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
7. [实战演练：添加 Tag 功能](#7-实战演练添加-tag-功能)
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
├── AGENTS.md              ← AI 行为手册（CLAUDE.md 是它的符号链接）
├── CLAUDE.md → AGENTS.md  ← Claude Code 自动读取
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
│   ├── app.ts             ← Express 路由
│   ├── store.ts           ← 数据存储
│   ├── app.test.ts        ← API 测试
│   └── store.test.ts      ← 单元测试
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
scripts/committer "feat(api): add pagination" src/routes/todos.ts src/routes/todos.test.ts
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

### 4.1 从 Issue 开始

```bash
# 创建一个 Issue
gh issue create --title "feat(api): add health check endpoint" \
  --body "Add GET /health that returns { status: 'ok' }"
```

### 4.2 启动 Claude Code

```bash
claude
```

在 Claude Code 中：
```
> 读 issue #1，然后实现它。完成后用 scripts/committer 提交。
```

Claude 会：
1. 读取 AGENTS.md（自动，因为有 CLAUDE.md 符号链接）
2. 用 `gh issue view 1` 读 issue
3. 编写代码 + 测试
4. 运行 `pnpm test` 验证
5. 用 `scripts/committer "feat(api): add health check (#1)" src/app.ts src/app.test.ts` 提交

### 4.3 创建 PR

```bash
git push -u origin feat/health-check
gh pr create --title "feat: add health check endpoint" --body "Closes #1"
```

### 4.4 审查 PR

在另一个 Claude Code session 中：
```
> /reviewpr 1
```

Claude 会按 `.claude/prompts/reviewpr.md` 的 9 步流程审查 PR。

### 4.5 合并 PR

```
> /landpr 1
```

Claude 会按 `.claude/prompts/landpr.md` 的完整流程：rebase → test → merge。

---

## 5. 多 Agent 并行开发

这是核心。当你有一个大功能需要实现时：

### 5.1 第一步：分解任务

```
> /decompose "给 TODO API 添加标签系统：每个 todo 可以有多个标签，
> 支持按标签筛选，标签有颜色属性"
```

Claude 会输出类似：

| Wave | Agent | 分支 | 任务 | 文件 |
|------|-------|------|------|------|
| 1 | A | feat/tag-model | Tag 数据模型 | src/models/tag.ts |
| 1 | B | feat/tag-store | Tag 存储层 | src/stores/tag-store.ts |
| 1 | C | feat/todo-tags | Todo-Tag 关联 | src/store.ts |
| 2 | D | feat/tag-routes | Tag API 路由 | src/routes/tags.ts |
| 2 | E | feat/tag-filter | 按标签筛选 | src/routes/todos.ts |

### 5.2 第二步：创建 Issues

```bash
gh issue create --title "feat: Tag data model" --body "..."
gh issue create --title "feat: Tag store" --body "..."
gh issue create --title "feat: Todo-Tag association" --body "..."
```

### 5.3 第三步：创建 Worktrees

```bash
# Wave 1 — 三个独立任务，可以同时开工
git worktree add -b feat/tag-model .worktrees/agent-a main
git worktree add -b feat/tag-store .worktrees/agent-b main
git worktree add -b feat/todo-tags .worktrees/agent-c main
```

### 5.4 第四步：启动多个 Claude Code

**终端 1（Agent A）：**
```bash
cd .worktrees/agent-a
claude "实现 Issue #2: Tag 数据模型。包含 id, name, color 字段。写测试。完成后用 scripts/committer 提交并 push。"
```

**终端 2（Agent B）：**
```bash
cd .worktrees/agent-b
claude "实现 Issue #3: Tag 存储层。CRUD 操作。写测试。完成后用 scripts/committer 提交并 push。"
```

**终端 3（Agent C）：**
```bash
cd .worktrees/agent-c
claude "实现 Issue #4: 给 Todo 添加 tags 字段。更新 store。写测试。完成后用 scripts/committer 提交并 push。"
```

三个 Agent **同时工作**，互不干扰（因为各自在独立 worktree 中）。

### 5.5 第五步：创建 PRs

每个 Agent 完成后：
```bash
# Agent A 完成
cd .worktrees/agent-a
git push -u origin feat/tag-model
gh pr create --title "feat: Tag data model (#2)" --body "Closes #2"
```

### 5.6 第六步：审查 + 合并

```bash
# 在主目录审查
cd /path/to/project
claude "/reviewpr 5"   # 审查 Agent A 的 PR
claude "/landpr 5"     # 合并
claude "/reviewpr 6"   # 审查 Agent B 的 PR
claude "/landpr 6"     # 合并
```

### 5.7 第七步：清理 Worktrees

```bash
git worktree remove .worktrees/agent-a
git worktree remove .worktrees/agent-b
git worktree remove .worktrees/agent-c
```

### 5.8 第八步：启动 Wave 2

Wave 1 全部合并后，启动 Wave 2（依赖 Wave 1 的结果）：
```bash
git worktree add -b feat/tag-routes .worktrees/agent-d main
git worktree add -b feat/tag-filter .worktrees/agent-e main

# 在各自 worktree 中启动新的 Claude Code session
```

---

## 6. PR 审查与合并

### 6.1 审查流程 (`/reviewpr`)

输出结构：
```
A) 推荐: READY FOR /landpr
B) 变更: 新增 GET /health 端点
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

## 7. 实战演练：添加 Tag 功能

现在你来试一次。目标：给 TODO API 添加标签系统。

### 准备

```bash
# 确保主分支干净
git checkout main && git pull

# 分解任务
claude "/decompose 给 TODO API 添加标签系统"
```

### 执行

按 Claude 输出的分解方案：

1. 创建 Issues
2. 创建 Worktrees
3. 启动 2-3 个 Claude Code sessions（并行）
4. 等待完成
5. 审查每个 PR
6. 合并

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
# 创建 5 个 Issues
for i in $(seq 1 5); do
  gh issue create --title "fix: issue $i" --body "..."
done

# 启动 5 个并行 Agent
for i in $(seq 1 5); do
  git worktree add -b fix/issue-$i .worktrees/agent-$i main
  # 在新终端中启动
  echo "cd .worktrees/agent-$i && claude 'Fix issue #$i. Test. Commit. Push. Create PR.'"
done
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
| `/decompose <feature>` | AI 分解任务 |
| `/issue <number>` | AI 分析 Issue |
