# 更新日志

所有重要变更都记录在此文件中。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

---

## v2.1.0 — 2026-03-01

**分支生命周期管理 — 安全优先**

参考 OpenClaw 分支安全哲学，实现 6 层防护的自动分支清理系统。

### 新增

- **`scripts/cleanup-branches`** — 安全分支清理脚本（默认 dry-run）
  - `--merged` — 清理已合并到 main 的分支
  - `--closed-prs` — 清理已关闭 PR 的分支
  - `--stale N` — 清理 N 天无活动的远程分支（默认 14）
  - `--orphaned-wt` — 清理孤儿 worktree
  - `--all` — 以上全部
  - `--execute` — 实际执行（不加则只预览）
  - `--include-manual` — 显式 opt-in 处理非 agent 分支
- **`scripts/test-cleanup-branches`** — 57 项对抗性测试套件（隔离沙箱运行）
  - 命名陷阱（`reagent-`、`agent999`、`the-agent-is-cool` 等）
  - 30 分支暴力压测 + 5 manual 分支存活验证
  - 幂等性、CLI 边界、孤儿 worktree 清理
- **`.github/workflows/cleanup-branches.yml`** — CI 定时清理
  - Job 1: PR 关闭时立即清理 agent 分支
  - Job 2: 每天 4AM UTC 清理已合并/过期远程分支
- **GitHub 设置** — `delete_branch_on_merge=true` 自动删除已合并 PR 的远程分支

### 修改

- **`scripts/launch-agents`** — 加固分支清理安全
  - 新增 `agent-`/`issue-` 前缀检查，非 agent 分支跳过
  - 新增未推送 commit 检查，有本地未同步工作时跳过
  - `git branch -D` 失败时回退到 `git update-ref -d`
- **`scripts/review-prs`** — 原子化合并操作
  - `gh pr merge --squash` → `gh pr merge --squash --delete-branch`
  - 合并后自动清理本地 worktree + 本地分支
  - `git fetch --prune` 同步远程状态
- **`scripts/orchestrator`** — 补充分支生命周期注释
- **`CLAUDE.md`** — 新增 Branch Lifecycle 文档段 + scripts 表格更新
- **`.github/workflows/ci.yml`** — 新增 `test-cleanup-branches` CI job

### 安全模型（6 层防护）

| 层 | 防护 | 实现 |
|----|------|------|
| 1 | 命名隔离 | 仅 `*/agent-*`、`*/issue-*` 前缀自动清理 |
| 2 | 未推送保护 | `git log origin/B..B` 检查 |
| 3 | Worktree 保护 | `git worktree list` 检查 |
| 4 | Open PR 保护 | `gh pr list` 检查 |
| 5 | Protected 分支 | main/master/develop 硬编码跳过 |
| 6 | 默认 dry-run | 必须 `--execute` 才实际删除 |

### 修复

- `((x++))` 在 bash 5.x + `set -e` 下 counter 从 0 增长时返回 exit code 1 导致脚本退出（macOS bash 3.2 无此问题）
- `gh pr list` 对非 GitHub 仓库返回非数字值导致 `[[ -gt ]]` 比较崩溃

---

## v2.0.0 — 2026-03-01

**`/decompose` V2 — 智能任务拆解系统**

经过 10 轮真实任务迭代测试（基于 SpringBrand/OpenStore 多租户 SaaS 项目），全面升级任务拆解能力。

### 新增

- **三种拆解模式**
  - Feature Mode（默认）— 文件级拆解，适合单个功能/Bug 修复
  - Sprint Mode — 史诗级拆解，适合版本规划/月度 Sprint
  - Cross-Cut Mode — 跨模块拆解，适合设计系统/中间件等横切关注点
- **`/decompose-eval` 命令** — 12 维度模式感知质量评估 + 8 条 Veto 规则
- **MODIFY Merge Contract** — 每个文件修改必须声明 PRESERVES/ADDS/MODIFIES，防止多 Agent 并行时破坏性覆盖
- **Shared File Registry** — 2+ 任务涉及同一文件时，自动建立 Owner/Writer/Reader 权限模型
- **强制测试配对** — 每个源码任务必须指定对应测试文件 + 测试范围
- **环境变量清单** — 逐任务追踪新增环境变量，确保 `.env.example` 不遗漏
- **环境约束检查** — 在 Wave 编排前发现部署目标不支持的能力（如 Vercel 上跑 Remotion）
- **安全制品（RLS）** — 多租户项目强制要求租户隔离策略
- **外部输入依赖** — 标记非代码阻塞项（API 密钥、设计稿等），与代码依赖分开管理
- **参考文件按需加载** — 4 份方法论文档在对应阶段 `cat` 加载，不占基础 context

### 改进

- `/decompose` 从 115 行升级到 490+ 行，覆盖 8 个执行阶段
- Quality Gate 从 10 项检查扩展到 15 项（6 BLOCK + 9 WARN）
- Veto 规则从 5 条增加到 8 条
- 评估维度从 10 个增加到 12 个（Sprint 模式：Architectural Coherence + Integration Coverage；Cross-Cut 模式：Contract Stability + Shared File Governance）

### 迭代测试覆盖的任务类型

| 轮次 | 任务 | 复杂度 |
|------|------|--------|
| 1 | 邮件收集弹窗 | 简单 |
| 2 | CI/CD 流水线 | 中等 |
| 3 | Stripe Connect 支付集成 | 中等 |
| 4 | 数字产品交付系统 | 中等 |
| 5 | AI 协创引擎 | 复杂 |
| 6 | Puck 落地页模板系统 | 复杂 |
| 7 | Remotion 视频生成 | 极复杂 |
| 8 | 多租户自定义域名（4 API） | 复杂 |
| 9 | V1.0 MVP 完整 Sprint | Sprint |
| 10 | Brand DNA 全链路（跨 8 系统） | 横切 |

---

## v1.0.0 — 2026-02-28

**初始版本**

- 7 个自动化脚本（orchestrator, launch-agents, review-prs, monitor-agents, create-worktree, committer, setup-hooks）
- Worker / Reviewer 双 Agent 定义
- 6 个 Claude Code 自定义命令（/decompose, /reviewpr, /landpr, /issue, /triage）
- GitHub Actions CI + 路径自动标签 + PR 大小标签
- Issue 模板（Bug Report / Feature Request）
- 标签驱动的完整生命周期（ready → in-progress → review → done）
- Pre-commit 质量门（oxlint + oxfmt + tsc）
- 完整中文教程（TUTORIAL.md）
