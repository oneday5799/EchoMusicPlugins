# 项目长期记忆

## auto-team-vip（酷狗概念版自动组队领 VIP 插件）

- 仓库：`D:/Code/EchoMusicPlugins`（单 git 仓，包含插件 `auto-team-vip/`、码池 `team-pool-worker/`、`docs/`）。**开发改动只在 `vip` 分支**，main 只接收合并（2026-09-12 v1.2.0 已合并进 main 并推送）。远端 SHA 以 `gh api` 为准（本地 tracking ref 不可信）；本地 `.git/refs` 曾三次被并发进程清空，用 node 手写 ref 文件（SHA+`\n`）重建。
- v2 重设计方案文档：`docs/auto-team-vip-redesign.md`（快照+租约+DO 每期一实例模型，2026-09-11 定稿）。插件目标版本 1.2.0，Worker MIN_CLIENT_VERSION=1.2.0，直接切换不做灰度。
- 活动规则关键事实（用户确认）：每队 1 队长+2 队员；每账号每期自动建队成队长，另可以队员身份加 1 支队；**酷狗不支持退队**（入队即期内终态）；队员奖励与加入顺序无关；`my_join_team_list` 至多 1 支。
- 部署：码池为 Cloudflare Worker + DO SQLite，自定义域 `echo-team-pool.oneday.vip`。**v2 已部署**（/v2/admin/data 带 token 可用；鉴权掩码设计：无 token 一律 404「路径不存在」）。**WAF 阻止规则** `http.host eq echo-team-pool.oneday.vip and not has_key(http.request.headers,"x-plugin-version")` 会拦掉 CORS 预检——OPTIONS 按规范不带自定义头，修复 = 表达式追加 `and http.request.method ne "OPTIONS"`（2026-09-12 确认；admin.html 的 Failed to fetch 即此因，PowerShell 不走预检且手动带 header 故正常）。
- 插件运行环境：EchoMusic 客户端 IPC（`ctx.electron.api.request` 走酷狗接口，`ctx.net.request` 走码池），酷狗错误码 20028 需走 `kugouVerification` 验证码流程。
- admin.html 看板为独立本地文件（Worker 不内嵌），已按用户要求隐私化：页面不得出现预设 API 地址/期次等环境信息（如 echo-team-pool.oneday.vip），API 地址/期次 ID/Token 三项一律手填、仅存浏览器 localStorage，有「清除本机配置」按钮——后续修改不要把预设值加回去。

## 本机环境坑（2026-09-12 确认）

- **磁盘对 git 进程写入的文件有丢失/回滚现象**（node/Read 工具写入正常）：曾致 `.git/refs` 整目录消失、pack 丢一个、工作区 docs 6 文件消失。git 报 `not a git repository` 但 `.git/HEAD+config` 可读 = refs 层损坏。修复：读 `.git/logs/refs/heads/*` reflog 找回 ref 值 → 隔离损坏 pack/packed-refs → `git fetch origin` 全量重建对象库 → node 手写 ref 文件（SHA+`\n`）。详见 2026-09-12 日志。凌晨已完成一轮修复（reset --hard 后工作区完整恢复），但 **04:12 又复发**（间歇性，非已停止）——环境不稳期间：gh api 完成一切提交/合并，node 写 refs，禁用本地 commit/merge/checkout 写操作。
- **git 直连 GitHub 的 TLS 故障**：schannel 报 CRYPT_E_NO_REVOCATION_CHECK（全局 .gitconfig 已配 schannelcheckrevoke=false 仍复现）、openssl 后端报 unable to get local issuer certificate；解法：显式 `-c http.sslBackend=schannel -c http.schannelCheckRevoke=false`，已固化进本仓库 .git/config（2026-09-12）。**推送凭据**：`gh auth setup-git` 已写入全局 gh helper（本 gh 版本的 helper 需带完整 exe 路径；勿在仓库本地设 `credential.helper=""`，会清掉全局 helper 链导致 could not read Username）；全局 http.lowspeedlimit=0/lowspeedtime=999999 会令连接挂死不超时，仓库本地已用 1000/45 覆盖。
- 判断推送真伪只用 `git ls-remote`（WorkBuddy worktree `C:/Users/Oneday/WorkBuddy/Worktrees/auto-team-vip/origin-vip-03a16790` 会持续重置 tracking ref，`git status` 的 ahead/behind 是假象）。
- bash 的 `/d/` 映射间歇失效，git 一律用 `git -C "D:/..."`；coreutils（ls/wc/head/dirname）缺失，用 node -e 替代；批量编辑后必须 `git diff` 核对（Edit 回吞坑）；node -e 外层用 bash 双引号时内容里禁止反引号（会被当命令替换吞掉）。
- **遗留待办**：①找出后台并发操作 `D:\Code\EchoMusicPlugins` 的程序（.git/opencode 残留为线索，04:12 复发说明它还在运行）；②检查 D 盘健康（chkdsk/SMART）与杀软/同步盘干预。
