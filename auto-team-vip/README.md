# 自动组队领VIP

自动参加酷狗概念版官方活动「组队瓜分酷狗概念版畅听VIP」并自动组队（3 人成团：队长 + 2 队员）。

- 插件名：自动组队领VIP
- 版本：1.0.2
- 作者：Oneday5799
- 依赖：EchoMusic `>=2.3.0`（需已内置 `server/module/team_*.js` 组队接口）

## 工作原理

1. 从 EchoMusic 内部登录态读取酷狗 `token/userid/dfid/mid/uuid`（`ctx.pinia.state.value.user/device`）。
2. 通过 EchoMusic 内置 IPC（`ctx.electron.api.request`）调用组队接口：
   - `GET /team/period/info`：获取本期活动信息（`period_id`、名称、时间）
   - `GET /team/my/info`：读取自己创建的队伍（`my_create_team_list`）和加入的队伍（`my_join_team_list`）
   - `POST /team/my`：创建自己的队伍（如尚未创建）
   - `POST /team/join`：用 `team_code` 加入他人队伍
3. 组队码通过**远程码池**（Cloudflare Worker + Durable Object）在插件用户之间自动交换：上传自己的码、领取可加入的码、上报结果。

## 队伍维度

同一期活动中，每个用户可以同时存在于**两个独立维度**：

- **我创建的队伍**（队长身份）：`my_create_team_list` → `team_code` + 成员数
- **我加入的队伍**（队员身份）：`my_join_team_list` → `team_code` + 成员数

两个维度互不影响，最多可同时在两个不同队伍中。

## 自动组队流程

开启「自动组队」开关后，插件执行以下流程：

1. **获取活动信息**：调用 `GET /team/period/info` 获取当前期次
2. **获取/创建队伍**：调用 `GET /team/my/info`，如无队伍则自动创建
3. **注册码池**：将自己创建的队伍码（type=created）和加入的队伍码（type=joined）上传到 Worker
4. **分配加入**：调用 `POST /pool/join` 获取一个可加入的队伍码
5. **加入队伍**：调用 `POST /team/join` 加入获取到的队伍
6. **上报结果**：加入成功上报 `joined`，失败上报 `invalid`

关闭开关后，插件仅执行步骤 1-2（获取活动信息和创建队伍），不参与码池分配。

## 手动组队

无论自动组队是否开启，都可以手动操作：

- **我创建的队伍**：显示自己的队伍码，可点击「复制」分享给他人
- **我加入的队伍**：输入对方队伍码，点击「加入」手动加入；已加入后显示队伍码，可点击「复制」

手动加入成功后：
- 若自动组队已开启：自动将加入的队伍码注册到码池（含队员计数）
- 若自动组队关闭：仅复制队伍码，不参与码池

## 码池部署

见 [`cloudflare/team-pool-worker/`](../cloudflare/team-pool-worker/)。

- 部署后得到 Worker 地址（如 `https://echo-team-pool.xxxx.workers.dev`）。
- 在插件设置中填入该地址即可。

## 版本校验

插件请求时会带 `X-Plugin-Version` 头。Worker 会校验：
- 缺失版本头 → 返回 403 `version_missing`
- 低于最低版本 → 返回 403 `version_mismatch`，提示更新

**最低兼容版本：1.0.1**

升级 Worker 时只需修改 `worker.js` 顶部的 `MIN_CLIENT_VERSION` 常量（同步修改客户端 `manifest.json` 的 `version`）。

## 限速

Worker 对每个 uid 限速 **1 req/second**（仅 join/result 接口），防止恶意请求。

## 防御性修复

服务端 `register` 接口具备防御性逻辑：当用户注册 `type=joined` 时，若其 uid 不在 `joined[]` 数组中，会自动添加。这确保手动加入的队伍码能被其他用户正确识别为"有空间"。

## 免责声明

- 本插件面向酷狗「测试接口」，自动组队可能存在账号风控风险，请在遵守平台规则、法律法规的前提下使用。
- 组队各接口的真实返回字段名可能随官方调整，若解析异常请以开发者工具看到的原始 JSON 为准反馈校准。
