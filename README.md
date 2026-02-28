# Multi-Agent Factory

> 用 AI Agent 并行开发，像流水线一样交付代码。

基于 [OpenClaw](https://github.com/nicepkg/openclaw)（238K Stars）逆向工程，提取多 Agent 开发基础设施。Peter Steinberger 用 30 个并行 AI Agent 一天提交 627 次代码——这个项目让你从 2-3 个 Agent 开始，逐步掌握同样的模式。

## 功能亮点

- **自动化编排** — `scripts/orchestrator` 从 GitHub Issue 到 PR 全自动，人类只需打标签
- **可视化模式** — `scripts/launch-agents` 在 iTerm2/tmux 中实时观看每个 Agent 工作
- **安全并行** — Worktree 隔离 + Claims 锁 + 原子提交，30 个 Agent 互不干扰
- **质量门** — Pre-commit hooks + CI 自动拦截坏代码，Agent 写的代码和人一样过审
- **一键审查** — `scripts/review-prs` 批量审查 + 自动修复 + 自动合并

---

## 快速开始

### 环境要求


| 工具                     | 版本     | 用途           |
| ---------------------- | ------ | ------------ |
| Node.js                | 22+    | 运行时          |
| pnpm                   | 9+     | 包管理          |
| GitHub CLI (`gh`)      | 2+     | Issue/PR 操作  |
| Claude Code (`claude`) | latest | AI Agent 运行时 |


### 安装步骤

```bash
# 1. 克隆项目
git clone <repo> && cd multi-agent-factory

# 2. 安装依赖
pnpm install

# 3. 安装 git hooks（质量门）
scripts/setup-hooks

# 4. 验证环境
pnpm check && pnpm test

# 5. 验证 GitHub CLI
gh auth status
```

安装完成后，阅读 **[TUTORIAL.md](./docs/TUTORIAL.md)** 了解完整教程。

---

## 核心概念

```
人类提 Issue          Agent 领取任务        质量门自动验证        PR 审查合并
     │                     │                     │                  │
     ▼                     ▼                     ▼                  ▼
┌──────────┐    ┌───────────────────┐    ┌──────────────┐    ┌───────────┐
│ GitHub   │───▶│  Orchestrator     │───▶│  Pre-commit  │───▶│ review-prs│
│ Issues   │    │  (分配 + 调度)     │    │  hooks + CI  │    │ (AI 审查)  │
└──────────┘    └───────────────────┘    └──────────────┘    └───────────┘
                   │    │    │
                   ▼    ▼    ▼
               Agent A  B  C  ...
               (各自在独立 worktree 中)
```

**三大支柱：**

1. **AGENTS.md** — Agent 的"员工手册"，定义行为边界和安全规则
2. **scripts/committer** — 原子提交脚本，每个 Agent 只提交自己的文件
3. **质量门** — pre-commit hooks（lint + format + typecheck）+ CI（测试 + 覆盖率）

人类唯一的工作：**定义"什么是好的"**。剩下的，AI 自己闭环。

---

## 如何提需求

需求的质量直接决定 Agent 的输出质量。一个清晰的 Issue = Agent 一次通过；一个模糊的 Issue = Agent 反复试错甚至放弃。

### 小需求：直接创建 Issue

项目提供了两个 Issue 模板（Bug Report / Feature Request），创建时自动引导你填写 Agent 所需的关键信息。

**Bug Report 模板字段：**

- Summary — 一句话描述什么坏了
- Steps to reproduce — 最短复现路径
- Expected / Actual behavior — 对比预期和实际
- Suspected files — 帮 Agent 定位代码
- Estimated scope — Small / Medium / Large

**Feature Request 模板字段：**

- Summary — 要添加什么能力
- Problem to solve — 解决什么痛点
- Proposed solution — 具体的 API/行为描述
- Files to create / modify — 涉及的文件清单
- Acceptance criteria — 完成标准
- Parallelizable — 是否可拆分并行

#### 好 Issue vs 差 Issue

```
❌ 差 Issue:
   标题: 优化一下性能
   内容: 感觉有点慢

✅ 好 Issue:
   标题: fix(api): GET /todos response time > 500ms under 100 concurrent requests
   内容:
   ## Summary
   GET /todos 在 100 并发时响应超过 500ms，需要优化到 < 100ms。

   ## Steps to reproduce
   1. `pnpm dev`
   2. `ab -n 1000 -c 100 http://localhost:3000/todos`
   3. 观察 p99 > 500ms

   ## Suspected files
   - src/store.ts (getTodos 全表扫描)
   - src/routes/todos.ts (缺少缓存)

   ## Acceptance criteria
   - [ ] p99 < 100ms under 100 concurrent requests
   - [ ] 添加基准测试
   - [ ] `pnpm check && pnpm test` passes
```

#### Agent 友好度清单

写 Issue 时检查这 5 条，全部满足 = Agent 高概率一次通过：

1. **标题用 conventional commit 格式** — `feat(scope): ...` / `fix(scope): ...`
2. **描述包含 acceptance criteria** — Agent 用它判断任务是否完成
3. **标注涉及的文件路径** — Agent 用它定位代码，不用猜
4. **说明预期 scope** — Small (1-2 files) / Medium (3-5) / Large (5+, 应拆解)
5. **标明是否可并行** — 帮编排器决定调度策略

> Worker Agent 内部有 confidence check：Summary + Files + Acceptance criteria 缺一不可。
> 缺少这些字段 → confidence < 7 → Agent 跳过该 Issue。

### 大需求：先拆解再创建

当一个需求涉及 5+ 个文件或跨多个模块时，不要直接创建一个大 Issue，而是用 `/decompose` 拆解成多个可并行的小 Issue。

#### 什么时候该拆？

```
需求到达
  │
  ▼
涉及 > 3 个文件？ ──── 否 ───▶ 直接创建 1 个 Issue
  │
  是
  ▼
文件之间有依赖？ ──── 否 ───▶ 拆成 N 个并行 Issue（Wave 1）
  │
  是
  ▼
分成 Wave 编排：
  Wave 1: 基础层（无依赖的文件）
  Wave 2: 依赖层（需要 Wave 1 的文件）
```

#### 拆解原则

1. **独立性** — 每个子 Issue 可以由一个 Agent 独立完成
2. **文件不重叠** — 同一 Wave 内的 Issue 不能修改同一个文件
3. **Wave 依赖** — Wave 2 等 Wave 1 全部合并后再开始
4. **每个 Issue ≤ 4 个文件** — 超过就继续拆
5. **每个 Issue 必须包含测试** — 没有测试 = 不完整

#### /decompose 命令

在 Claude Code 中运行 `/decompose 添加用户认证系统`，Agent 会自动：

1. 分析功能涉及的文件
2. 按文件依赖关系分组
3. 编排 Wave 执行计划
4. 用 `gh issue create` 创建所有子 Issue 并打上 `status:ready` 标签

#### 完整实例：添加用户认证系统

原始需求："给 TODO API 添加 JWT 用户认证"

拆解结果：

**Wave 1 — 并行（3 个 Agent 同时工作）**


| Agent | Issue                                          | 文件                                              | 说明          |
| ----- | ---------------------------------------------- | ----------------------------------------------- | ----------- |
| A     | `feat(auth): add User model and store`         | `src/user.ts`, `src/user.test.ts`               | 用户数据层       |
| B     | `feat(auth): add JWT token utilities`          | `src/jwt.ts`, `src/jwt.test.ts`                 | Token 签发/验证 |
| C     | `feat(auth): add auth routes (register/login)` | `src/auth-routes.ts`, `src/auth-routes.test.ts` | 注册/登录接口     |


**Wave 2 — 串行（Wave 1 合并后）**


| Agent | Issue                                 | 文件                                       | 依赖                 |
| ----- | ------------------------------------- | ---------------------------------------- | ------------------ |
| D     | `feat(auth): add auth middleware`     | `src/middleware.ts`, MODIFY `src/app.ts` | 依赖 Wave 1 的 jwt.ts |
| E     | `feat(auth): protect existing routes` | MODIFY `src/routes/todos.ts`             | 依赖 middleware      |
| F     | `test(auth): add integration tests`   | `src/auth.integration.test.ts`           | 依赖以上全部             |


执行命令：

```bash
# Wave 1 — 3 个 Issue 并行
scripts/orchestrator --label "status:ready" --limit 3 --max-parallel 3 --yes

# 审查并合并 Wave 1 的 PR
scripts/review-prs --auto-merge

# Wave 2 — 依次处理
scripts/orchestrator --label "wave:2" --limit 3 --yes

# 最终审查
scripts/review-prs --auto-merge
```

---

## 使用方式

### 方式一：全自动（orchestrator）

完全无人值守。适合批量处理 5+ 个 Issue，或在 CI 环境中运行。

```bash
# 1. 给 Issue 打标签
gh issue edit 42 --add-label "status:ready"

# 2. 启动编排器
scripts/orchestrator --label "status:ready" --limit 5 --max-parallel 3

# 3. 审查生成的 PR
scripts/review-prs --auto-merge
```

关键参数：

```bash
scripts/orchestrator [owner/repo] --label <label>
  --limit N           # 最多处理 N 个 Issue（默认 5）
  --max-parallel N    # 最大并行 Agent 数（默认 3）
  --budget N.NN       # 每个 Agent 的预算上限（美元）
  --model <model>     # 使用的模型（sonnet / opus / haiku）
  --yes               # 跳过确认
  --dry-run           # 预览模式，不实际执行
  --watch             # 持续模式，定期重新扫描
  --interval N        # watch 模式的间隔秒数（默认 300）
```

6 阶段流程：Parse → Fetch → Confirm → Pre-check → Spawn → Report

### 方式二：可视化（launch-agents）

在终端中实时观看每个 Agent 工作。适合学习、调试、处理 2-4 个 Issue。

```bash
# iTerm2 标签页 — 每个 Agent 一个标签页
scripts/launch-agents --issues 2 3 4

# iTerm2 垂直分屏 — 并排观看
scripts/launch-agents --issues 2 3 4 --mode split

# 按标签筛选
scripts/launch-agents --label "status:ready" --mode tab

# tmux 模式 — SSH 友好，可分离
scripts/launch-agents --issues 2 3 --mode tmux

# 交互模式 — 你和每个 Agent 手动对话
scripts/launch-agents --issues 2 --interactive

# 预览模式
scripts/launch-agents --label "status:ready" --dry-run
```

### 方式三：手动（single agent）

单个 Agent 处理单个 Issue。适合简单任务或学习工作流。

```bash
# 1. 创建 worktree
scripts/create-worktree feat/issue-42 42

# 2. 进入 worktree 启动 Claude
cd .worktrees/feat/issue-42
claude "分析 Issue #42 并实现修复"

# 3. Agent 完成后推送
git push -u origin feat/issue-42
gh pr create --title "fix(api): handle missing ID" --body "Closes #42"
```

### Headless vs Visual 对比


|      | `scripts/orchestrator` | `scripts/launch-agents` |
| ---- | ---------------------- | ----------------------- |
| 执行方式 | 后台, `claude -p`        | 前台, 可见终端                |
| 监控   | 等待 + 汇总表               | 实时观看每个 Agent            |
| 交互   | 无（完全自主）                | 可选 (`--interactive`)    |
| 适用场景 | CI、批量处理、5+ Issue       | 学习、调试、2-4 个 Issue       |


### PR 审查与合并

```bash
# 审查所有开放 PR
scripts/review-prs

# 审查指定 PR
scripts/review-prs 5 7

# 审查 + 自动合并通过的 PR
scripts/review-prs --auto-merge

# 审查 + 自动修复需要改进的 PR
scripts/review-prs --auto-fix

# 完整流水线：审查 → 修复 → 合并
scripts/review-prs --auto-fix --auto-merge
```

### 实时监控（tmux）

```bash
# 持续监控 + 自动批准权限提示
scripts/monitor-agents --auto-approve

# 快速状态检查
scripts/monitor-agents --once

# 快速轮询，自定义 session
scripts/monitor-agents --interval 3 --session my-agents
```

状态检测：`WORKING` → `WAITING` → `DONE` → `ERROR`（auto-approve 自动响应权限提示）。

---

## 优化指南

### Issue 质量 = Agent 准确率

最有效的优化不是调参数，而是写好 Issue。参照上方的 [Agent 友好度清单](#agent-友好度清单)。

经验法则：

- Acceptance criteria 越具体，Agent 越不会跑偏
- 列出 suspected files，Agent 定位速度提升 3-5x
- Scope 标为 Large 的 Issue 应该先用 `/decompose` 拆解

### 并行度优化（Wave 策略）

```
高并行（理想）             低并行（避免）
┌───┬───┬───┬───┐         ┌───┐
│ A │ B │ C │ D │         │ A │
└─┬─┴─┬─┴─┬─┴─┬─┘         └─┬─┘
  │   │   │   │             │
  ▼   ▼   ▼   ▼           ┌─▼─┐
  全部并行，互不依赖         │ B │  ← 串行 = 慢
                           └─┬─┘
                             │
                           ┌─▼─┐
                           │ C │
                           └───┘
```

- **独立文件** → 同一 Wave 并行（最大 5 个 Agent）
- **共享文件** → 分到不同 Wave，串行执行
- **每个 Wave** 完成后用 `scripts/review-prs --auto-merge` 合并，再启动下一 Wave

### 成本控制


| 模型       | 适用场景           | 参考成本/任务 |
| -------- | -------------- | ------- |
| `sonnet` | 日常 fix/feature | $1-2    |
| `opus`   | 复杂架构变更         | $3-5    |
| `haiku`  | PR 审查、代码分析     | ~$0.30  |


Budget 参考值（`--budget` 参数）：


| 任务复杂度              | 预算建议  |
| ------------------ | ----- |
| 简单 fix（1 文件）       | $0.50 |
| 中等 feature（2-3 文件） | $1.50 |
| 复杂 feature（4+ 文件）  | $3.00 |


```bash
# 低成本批量处理
scripts/orchestrator --label bug --model sonnet --budget 1.00

# 复杂任务高预算
scripts/orchestrator --label "needs-arch" --model opus --budget 5.00
```

### 质量门配置

质量门在 pre-commit hooks 和 CI 中自动执行，无需手动运行：

1. **Lint** — `oxlint` 检查代码质量
2. **Format** — `oxfmt` 统一代码风格
3. **Type-check** — `tsc --noEmit` TypeScript 严格模式
4. **Tests** — `vitest` 70% 覆盖率门槛

手动验证：`pnpm check && pnpm test`

### Worktree 磁盘优化

每个 Agent 一个 worktree，30 个 Agent = 30 份 node_modules？不需要。

pnpm 使用 content-addressable store，相同的包只存一份。多个 worktree 共享同一个 store，实际磁盘增量很小。

```bash
# 每个 worktree 创建后安装依赖
cd .worktrees/agent-1
pnpm install    # 几乎瞬间完成（hardlink from store）
```

> `scripts/create-worktree` 已经自动处理了依赖安装和 hooks 设置。

---

## 项目结构

```
multi-agent-factory/
├── CLAUDE.md → docs/AGENTS.md ← Claude Code 自动读取
├── docs/
│   ├── AGENTS.md              ← Agent 行为手册（CLAUDE.md 的 symlink 目标）
│   └── TUTORIAL.md            ← 完整教程
├── README.md                  ← 本文件
│
├── scripts/
│   ├── orchestrator           ← 核心：6 阶段自动编排
│   ├── launch-agents          ← 可视化：iTerm2/tmux 多 Agent 启动
│   ├── review-prs             ← PR 审查 + 自动修复 + 自动合并
│   ├── monitor-agents         ← 实时监控 + 自动批准
│   ├── create-worktree        ← Worktree 初始化（依赖 + hooks）
│   ├── committer              ← 多 Agent 安全提交
│   ├── setup-hooks            ← 安装 git hooks
│   └── pre-commit/            ← Pre-commit 辅助脚本
│
├── .claude/
│   ├── prompts/
│   │   ├── reviewpr.md        ← /reviewpr — 9 步 PR 审查
│   │   ├── landpr.md          ← /landpr — 17 步 PR 合并
│   │   ├── decompose.md       ← /decompose — 任务拆解
│   │   ├── issue.md           ← /issue — Issue 分析
│   │   └── triage.md          ← /triage — Issue 分类
│   ├── agents/
│   │   ├── worker.md          ← Worker Agent 定义
│   │   └── reviewer.md        ← Reviewer Agent 定义
│   ├── claims.json            ← Issue 认领锁
│   └── results/               ← PR 审查结果缓存
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml             ← CI（智能跳过 docs-only）
│   │   ├── labeler.yml        ← 路径自动标签
│   │   ├── auto-label.yml     ← PR 大小自动标签
│   │   └── stale.yml          ← 过期 Issue 自动关闭
│   ├── ISSUE_TEMPLATE/        ← Bug / Feature 模板
│   └── pull_request_template.md
│
├── git-hooks/pre-commit       ← Lint + Format + Typecheck
├── src/                       ← Demo TODO API
├── public/                    ← 静态页面
├── vitest.config.ts           ← 测试配置（70% 覆盖率）
├── tsconfig.json              ← TypeScript 严格模式
└── package.json               ← Node 22+, pnpm 9+
```

---

## 脚本速查表


| 脚本                        | 用途          | 关键参数                                                                     |
| ------------------------- | ----------- | ------------------------------------------------------------------------ |
| `scripts/orchestrator`    | 全自动编排       | `--label`, `--limit`, `--max-parallel`, `--budget`, `--model`, `--watch` |
| `scripts/launch-agents`   | 可视化启动       | `--issues`, `--label`, `--mode (tab/split/tmux)`, `--interactive`        |
| `scripts/review-prs`      | PR 审查       | `[PR numbers]`, `--auto-merge`, `--auto-fix`                             |
| `scripts/monitor-agents`  | 实时监控        | `--auto-approve`, `--once`, `--interval`, `--session`                    |
| `scripts/create-worktree` | 创建 worktree | `<branch-name> <issue-number>`                                           |
| `scripts/committer`       | 安全提交        | `"<commit-msg>" <file1> [file2...]`                                      |
| `scripts/setup-hooks`     | 安装 hooks    | —                                                                        |



| Claude Code 命令     | 用途             |
| ------------------ | -------------- |
| `/reviewpr <PR#>`  | 审查指定 PR        |
| `/landpr <PR#>`    | 合并指定 PR        |
| `/decompose <描述>`  | 拆解大任务为并行 Issue |
| `/issue <Issue#>`  | 分析 Issue       |
| `/triage <Issue#>` | Issue 分类       |


---

## 标签生命周期

标签驱动整个自动化流程。编排器和 launch-agents 自动管理状态转换。

```
status:ready            Issue 等待 Agent 处理
    ↓                   (orchestrator / launch-agents 拾取)
status:in-progress      Agent 正在工作
    ↓                   (Agent 创建 PR)
status:review           PR 已创建，等待审查
    ↓                   (review-prs --auto-merge 合并)
status:done             Issue 已解决，PR 已合并
```


| 类别   | 标签                                                                   | 谁打的                 |
| ---- | -------------------------------------------------------------------- | ------------------- |
| 状态   | `status:ready`, `status:in-progress`, `status:review`, `status:done` | 人类 / 脚本             |
| 关闭原因 | `close:duplicate`, `close:not-planned`, `close:stale`                | 人类 / stale bot      |
| 领域   | `area:api`, `area:scripts`, `area:ci`, `area:agents`, `area:public`  | Labeler workflow    |
| 大小   | `size/XS`, `size/S`, `size/M`, `size/L`, `size/XL`                   | Auto-label workflow |
| 工具   | `no-stale`, `needs-decompose`                                        | 人类                  |


分支命名（自动从 Issue 标签 + 标题派生）：

- `feat/agent-{N}-{slug}` — enhancement / feature
- `fix/agent-{N}-{slug}` — bug
- `refactor/agent-{N}-{slug}` — refactor
- `docs/agent-{N}-{slug}` — docs

`agent-` 前缀区分 AI 创建的分支和人类创建的分支。

---

## 相关文档


| 文档                                                             | 内容                        |
| -------------------------------------------------------------- | ------------------------- |
| [TUTORIAL.md](./docs/TUTORIAL.md)                              | 完整教程：从 0 到多 Agent 并行开发    |
| [AGENTS.md](./docs/AGENTS.md)                                  | Agent 行为手册 + 多 Agent 安全规则 |
| [.claude/prompts/decompose.md](./.claude/prompts/decompose.md) | 任务拆解详细流程                  |
| [.claude/prompts/reviewpr.md](./.claude/prompts/reviewpr.md)   | PR 审查 9 步流程               |
| [.claude/prompts/landpr.md](./.claude/prompts/landpr.md)       | PR 合并 17 步流程              |


---

## License

MIT