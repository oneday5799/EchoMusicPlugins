# 自动组队领VIP

自动参加概念版官方活动「组队瓜分酷狗概念版畅听VIP」并组队，插件入口在软件顶部⭐️。

- 插件名：自动组队领VIP
- 版本：1.2.2（v2 快照/租约协议）
- 作者：Oneday5799
- 依赖：EchoMusic `>=2.3.2-beta.2`（需已内置组队接口）
- 架构设计文档：[`docs/auto-team-vip-redesign.md`](../docs/auto-team-vip-redesign.md)

## 自动组队开关（默认关闭）

**插件默认不开启自动组队，需在面板里手动打开。**

| 开关 | 与码池服务器的通信 | 行为 |
|------|--------------------|------|
| **关闭**（默认） | **零交流**（不上报快照、不申请组队码、不回报结果） | 只读酷狗：展示本期期次、我创建的队伍、我加入的队伍；提供**手动加入**（组队码由用户自行输入）。不会自动建队 |
| **开启** | 完整 v2 协议 | 走完整 ①→⑧ 流程（见下），自动建队 + 自动申请组队码 + 自动入队 |

## 工作原理（v2）

三方职责划分：

- **酷狗服务器**：队伍真实构成的唯一权威。码池对"队伍里有几个人"的判断全部来自插件上报的观测值。
- **插件端**：酷狗状态的观察者 + 组队操作执行器，把观测结果以**快照**上报码池。
- **码池服务器**（Cloudflare Worker + Durable Object，[`team-pool-worker/`](../team-pool-worker/)）：存储快照、计算可用名额、以**租约**方式下发组队码并跟踪结果。

### 自动组队流程

开启「自动组队」后，单 Runner 状态机串行执行：

1. **GUARD**：读取登录态，获取本期活动信息；期次非进行中直接终止
2. **MYINFO**：读取自己创建的/加入的队伍；无创建队伍则自动创建
3. **SNAPSHOT**：两维度真实状态（我创建的队 + 我加入的队，含人数、队长与成员名单/昵称/奖励）整体上报码池
4. **DECIDE**：已加入队伍 → 本期完成，进入心跳模式（酷狗不支持退队，入队即终态）
5. **ASSIGN**：向码池申请分配，获得租约（lease_id + 组队码，120s 有效）
6. **JOIN_KUGOU**：用组队码加入酷狗队伍（含验证码处理）
7. **RESULT**：向码池回报 success/failed；failed 后当轮立即重试（最多 3 次）
8. **VERIFY**：复查酷狗队伍状态并再次快照，把成队后的真实人数同步给码池

### 关键机制

- **名额计算在服务端**：`可用名额 = 2 - (快照人数 - 1) - 在途租约数`，插件不再上报"剩余名额"
- **租约自愈**：领码后崩溃/断网 → 120s 自动回收；成功但快照缺失 → 10min 后释放；任何路径无永久泄漏
- **匹配策略**：快满优先（尽快产出完整队伍）+ FIFO；full/invalid 失败直接纠偏队伍状态或冷却；transient（客户端侧抖动）不冷却，仅当轮流程内避让
- **心跳**：面板打开或自动开关开启时，每 5min 保活快照（关闭自动组队时该步退化为"仅查询酷狗"）；本期未完成时每 10min 完整流程等新码；期次未开启时每 30min 低频探测，下一期自动开始；获取期次信息失败按常规间隔自动重试
  - 心跳里的"本期完成"判定为 `已加入 && 我创建队伍人数 >= 目标人数`，只影响快照间隔（5min/10min）的选择；因 DECIDE 步骤已提前返回，不会导致重复入队
- **身份防伪**：首次快照由服务端签发 token（按酷狗 userid 绑定），永不重签；伪造 uid 得到 401
- **多设备**：token 与设备绑定（首次快照时签发）。同一账号在多台设备同时使用时，仅最先上报快照的一台可使用码池功能，其余收到 401 提示（防劫持设计取舍，下期先到先得）
- **隐私**：客户端只能看到自己的队伍与租约 + 匿名聚合统计（v1 的全量队伍码端点已删除）；成员名单/昵称/奖励仅随快照存储于码池，站长经 `X-Admin-Token` 调用 `/v2/health`（聚合）与 `/v2/admin/data`（全量明细，含成员观测名单与每人 `vip_desc` 奖励）查看

### 手动组队

**关闭自动组队时**仍可完整使用以下手动能力（此模式下不会自动建队，也不接触码池）：

- **我创建的队伍**：显示自己的队伍码，可复制分享；他人（无论是否插件用户）加入后，下次快照自动反映人数
- **我加入的队伍**：输入对方队伍码手动加入；开启自动组队时成功后会自动快照、该码进入码池，关闭时只刷新本地展示

## 码池部署

见 [`team-pool-worker/`](../team-pool-worker/)。

### 上线 checklist（按序执行）

1. `wrangler secret put ADMIN_TOKEN` 配置管理端点门禁密钥
2. `wrangler deploy` 部署 Worker（v2 直接切换：部署后 v1 端点 404、v1.1.x 客户端码池功能 403）
3. 验证 `POST /v2/health`（携带 `X-Admin-Token` 与 `X-Plugin-Version` 头）返回聚合计数
4. 确认**没有**跳过规则会误伤插件流量（见下"跳过规则与限流的顺序"）
5. 配置限流规则（**建议执行，非功能必需**；见下"限流规则配置"）——兜住"任意合法 `period_id` 批量创建 DO"的放大风险
6. 插件 1.2.2 发版（与步骤 2 紧凑衔接，避免长时间功能空窗）
7. 浏览器打开 [`admin.html`](../team-pool-worker/admin.html) 看板核对数据面

### 限流规则配置（步骤 5 展开）

**为什么建议做**：`period_id` 是 Durable Object 的路由键，任意合法格式的串（`a1`/`a2`…）都会实例化一个**全新 DO**；
而 `rate_limit` 是 **DO 内部表**，换 `period_id` 即重置，桶形同虚设。插件开源且 `POOL_URL` 硬编码在 `index.js`，
端点公开可知。**不做也能正常跑**，但建议用一条免费规则兜住。

**免费版硬约束**（官方文档：`waf/rate-limiting-rules` 的 Availability 表）：

| 项 | 免费版 |
|----|--------|
| 规则数 | 1 条 |
| 表达式可用字段 | **仅 Path、Verified Bot**（不能加 hostname 条件） |
| 计数维度 | **仅 IP** |
| **计数周期** | **固定 10 秒**（不可改） |
| **缓解时长** | **固定 10 秒**（不可改） |

> 注意：免费版**配不出"60 次/分钟"**——周期锁死 10 秒，必须换算成"每 10 秒 N 次"。
> 升级到 Pro 后周期可选到 1 分钟，届时可直接写 60 次/分钟。

**配置步骤**：控制台选中 `oneday.vip` → **Security rules** → **Create rule** → **Rate limiting rules**

| 字段 | 值 |
|------|-----|
| Rule name | `v2-pool-rate-limit` |
| Field / Operator / Value | `Path` → `starts with` → `/v2/` |
| With the same characteristics | `IP` |
| When rate exceeds | Requests = **30**，Period = **10 seconds** |
| Then take action | **Block**（⚠️ 不要选 Managed Challenge / JS Challenge） |
| Response type / code / body | `Custom JSON` / `429` / `{"ok":false,"error":"rate_limited","message":"请求过于频繁，请稍后再试"}` |
| Duration | **10 seconds** |

**阈值取 30 的理由**：Worker 自身令牌桶是"突发 5 + 每秒 1"（按 uid），单账号任意 10 秒内最多被接受 **15 次**；
插件单设备最坏突发（完整流程 ×3 次重试，含 2s 间隔，叠加 5xx 补射）约 14 次。取 30 ≈ 2 倍余量，
同时把滥用压到 180 次/分钟/IP。用户多为单设备单 IP 时可收紧到 20。

**动作必须选 Block（返回 429），不能选 Challenge**：插件是桌面客户端（Electron），**解不了验证码**；
Challenge 会返回 HTML 挑战页，插件拿不到 JSON 会退化成"一直失败"。而插件对 429 有专门处理
（`poolRateLimited()` + 60 秒退避），所以 Block→429 是唯一正确选择。

### 跳过规则与限流的顺序（步骤 4 展开）

若为了让桌面客户端不被质询而配置了放行 `/v2/*` 的**跳过（Skip）规则**，务必注意：

Cloudflare 的 Skip 动作可以跳过整个 `http_ratelimit` 阶段。**一旦勾选，限流规则会完全失效。**

- ✅ Skip 里只勾 **"All remaining custom rules"**（当前规则集内的剩余规则）和 **"All managed rules"**
- ❌ **绝对不要勾 "All rate limiting rules"**（它对应跳过整个 `http_ratelimit` 阶段）
- ⚠️ **不要指望靠"调整顺序"来规避**：自定义规则阶段（`http_request_firewall_custom`）**先于**
  限流阶段（`http_ratelimit`）执行，两个阶段不可互换顺序。唯一的开关就是 Skip 的**选项**，别勾错。

### 验证限流是否生效（零副作用）

Worker 在调用 `getByName()` **之前**就校验 `period_id`，所以**不带 `period_id`** 的请求会返回 400
而**不会创建任何 DO**——可放心打点验证：

```bash
# 并发打 100 次，统计各状态码数量
# 注：Windows 自带 curl 用 -o NUL；Linux/macOS 请换成 -o /dev/null
seq 1 100 | xargs -P 20 -I{} curl -s -o NUL -w "%{http_code}\n" -X POST \
  https://echo-team-pool.oneday.vip/v2/status \
  -H "Content-Type: application/json" \
  -H "X-Plugin-Version: 1.2.2" \
  -d '{}' | sort | uniq -c
```

期望输出形如：约 30 个 `400` + 70 个 `429`（并发下具体数字会有浮动，关键是**两者都出现**）。

> 两个坑，都已踩过：
> 1. **必须并发**。串行 `for` 循环里每次 `curl` 要几百毫秒，30 次可能超过 10 秒导致计数窗口中途重置，
>    永远攒不满阈值、测不出 429。
> 2. **`-o /dev/null` 在 Windows 自带 curl 下会写入失败**（退出码 23，`%{http_code}` 仍会打印但别依赖退出码）。
>    Windows 用 `-o NUL`，Linux/macOS 用 `-o /dev/null`。

若第 5 个左右就大面积 429，说明出口 IP 是共享的（公司/校园网/NAT），换网络再测或适当调大阈值。
之后可在控制台 **Security Events** 查看限流命中记录。

**上线后建议盯两个数**：Workers 请求数（免费版 10 万/天，UTC 00:00 重置）、Durable Objects 存储用量（免费版账户总额 5 GB）。

### 其他说明

- 部署后得到 Worker 地址（自定义域 `echo-team-pool.oneday.vip` 或 `*.workers.dev` 兜底）。
- 插件端码池地址为内置常量，修改需同步 `index.js` 的 `POOL_URL`。
- 查看码池数据：`wrangler secret put ADMIN_TOKEN` 配置密钥后，浏览器打开 [`team-pool-worker/admin.html`](../team-pool-worker/admin.html)（填 API 地址 / 期次 ID / 密钥），或命令行调用 `/v2/admin/data`（详见设计文档 §6.8）。

## 版本校验

插件请求携带 `X-Plugin-Version` 头，Worker 校验：

- 缺失版本头 → 403 `version_missing`
- 低于最低版本 → 403 `version_mismatch`，提示更新

**最低兼容版本：1.2.0**（v1 端点已全部下线，旧版插件无法使用码池功能，请更新）。

升级 Worker 时只需修改 `team-pool-worker/wrangler.toml` 的 `MIN_CLIENT_VERSION`——**以该值为准**，
本文件的"最低兼容版本"仅为说明性文字，无需与之逐字同步。
（`worker.js` 内置兜底 `env.MIN_CLIENT_VERSION || "1.2.0"`，仅在变量缺失时生效；正常部署请以 `wrangler.toml` 为准。）

## 免责声明

- 本插件面向酷狗「测试接口」，自动组队可能存在账号风控风险，请在遵守平台规则、法律法规的前提下使用。
- 组队各接口的真实返回字段名可能随官方调整，若解析异常请以开发者工具看到的原始 JSON 为准反馈校准。
