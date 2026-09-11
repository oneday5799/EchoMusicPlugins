# 项目长期记忆

## auto-team-vip（酷狗概念版自动组队领 VIP 插件）

- 仓库：`D:/Code/EchoMusicPlugins`（单 git 仓，包含插件 `auto-team-vip/`、码池 `team-pool-worker/`、`docs/`）。**所有改动只在 `vip` 分支，禁止动 `main`**。
- v2 重设计方案文档：`docs/auto-team-vip-redesign.md`（快照+租约+DO 每期一实例模型，2026-09-11 定稿）。插件目标版本 1.2.0，Worker MIN_CLIENT_VERSION=1.2.0，直接切换不做灰度。
- 活动规则关键事实（用户确认）：每队 1 队长+2 队员；每账号每期自动建队成队长，另可以队员身份加 1 支队；**酷狗不支持退队**（入队即期内终态）；队员奖励与加入顺序无关；`my_join_team_list` 至多 1 支。
- 部署：码池为 Cloudflare Worker + DO SQLite，自定义域 `echo-team-pool.oneday.vip`（已知 WAF 偶发 403，需配置跳过规则）。
- 插件运行环境：EchoMusic 客户端 IPC（`ctx.electron.api.request` 走酷狗接口，`ctx.net.request` 走码池），酷狗错误码 20028 需走 `kugouVerification` 验证码流程。
