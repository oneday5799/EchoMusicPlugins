# 项目长期记忆

## auto-team-vip（酷狗概念版自动组队领 VIP 插件）

- 仓库：`D:/Code/EchoMusicPlugins`（单 git 仓，包含插件 `auto-team-vip/`、码池 `team-pool-worker/`、`docs/`）。**开发改动只在 `vip` 分支**，main 只接收合并（2026-09-12 v1.2.0 已合并进 main 并推送，远端 main=88e11aa、vip=9716cbc）。
- v2 重设计方案文档：`docs/auto-team-vip-redesign.md`（快照+租约+DO 每期一实例模型，2026-09-11 定稿）。插件目标版本 1.2.0，Worker MIN_CLIENT_VERSION=1.2.0，直接切换不做灰度。
- 活动规则关键事实（用户确认）：每队 1 队长+2 队员；每账号每期自动建队成队长，另可以队员身份加 1 支队；**酷狗不支持退队**（入队即期内终态）；队员奖励与加入顺序无关；`my_join_team_list` 至多 1 支。
- 部署：码池为 Cloudflare Worker + DO SQLite，自定义域 `echo-team-pool.oneday.vip`（已知 WAF 偶发 403，需配置跳过规则）。
- 插件运行环境：EchoMusic 客户端 IPC（`ctx.electron.api.request` 走酷狗接口，`ctx.net.request` 走码池），酷狗错误码 20028 需走 `kugouVerification` 验证码流程。

## 本机环境坑（2026-09-12 确认）

- **磁盘对 git 进程写入的文件有丢失/回滚现象**（node/Read 工具写入正常）：曾致 `.git/refs` 整目录消失、pack 丢一个、工作区 docs 6 文件消失。git 报 `not a git repository` 但 `.git/HEAD+config` 可读 = refs 层损坏。修复：读 `.git/logs/refs/heads/*` reflog 找回 ref 值 → 隔离损坏 pack/packed-refs → `git fetch origin` 全量重建对象库 → node 手写 ref 文件（SHA+`\n`）。详见 2026-09-12 日志。
- 判断推送真伪只用 `git ls-remote`（WorkBuddy worktree `C:/Users/Oneday/WorkBuddy/Worktrees/auto-team-vip/origin-vip-03a16790` 会持续重置 tracking ref，`git status` 的 ahead/behind 是假象）。
- bash 的 `/d/` 映射间歇失效，git 一律用 `git -C "D:/..."`；coreutils（ls/wc/head）缺失，用 node -e 替代；批量编辑后必须 `git diff` 核对（Edit 回吞坑）。
- **建议用户检查 D 盘健康（chkdsk/SMART）与杀软/同步盘对 D:\Code 的实时干预**。
