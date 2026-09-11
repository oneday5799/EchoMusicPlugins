# auto-team-vip v2 架构设计方案

> 状态：已定稿（2026-09-11 三轮评审完毕——含二次复核补充 §11，可按「提交计划」在 `vip` 分支实施）
> 复核修订：token 永不重签、租约过期以时间戳判定、失败冷却改列存储、限速令牌桶、租约 TTL 120s、status 改 POST
> 二次复核补充：join 失败当轮立即重试（≤3 次）、失败即纠偏（full 置满员 / invalid 24h 冷却）、runFullFlow 全捕获、uid=酷狗 userid、alarm 清理覆盖全部表
> 三次复核修订（2026-09-12）：错误分类拆 transient（invalid 仅认显式证据）、join 增 exclude_codes 当轮避让、member_count 单调性审计补全、join 检查顺序快照优先
> 范围：`auto-team-vip/`（插件端）+ `team-pool-worker/`（码池服务器）
> 版本目标：插件 v1.2.0 / Worker API v2

---

## 1. 背景与目标

酷狗概念版「组队瓜分畅听 VIP」活动规则：

- 每支队伍 3 个名额：**1 队长 + 2 队员**，3 人成队后成员各自获得 VIP 奖励（队长 7 天；队员 5 天/3 天，**已确认与加入顺序无关**）。
- 每个账号**每期自动创建一支队伍并成为队长**（剩余 2 个队员名额），同时可以**以队员身份加入**另一支队伍（每账号最多 1 支已加入队伍）。
- **不支持退队**（已确认）：成员一旦入队即为本期**终态**——每次成功分配都是不可撤销的最终结果，"failed 重试"是唯一的纠错路径。这进一步强化了分配前置校验与失败短期回避的必要性（§5.2、§6.4）。
- 活动按周开期（日志观测：期次 288 为 2026-09-09 ~ 2026-09-15）。

现有 v1 实现存在名额计算失真、无租约回收、语义混乱、隐私泄露、可被伪造等问题（见 §2）。本方案重新设计插件端与码池服务器的职责边界、数据模型与协议。

**设计目标（按优先级）：**

1. **名额状态最终一致**：码池记录的名额必须收敛到酷狗服务器的真实组队状态，杜绝"有位却不下发 / 无位却下发"。
2. **分配必达与自愈**：任何一次分配要么转化为真实入队，要么在有限时间内自动回收名额，不存在永久泄漏。
3. **最大化成队率**：在供需结构约束（§5）下让尽可能多的队伍凑满。
4. **最小信息暴露**：客户端只能看到与自己相关的数据 + 匿名聚合统计。
5. **简单可运维**：单一 Cloudflare Worker + DO SQLite，无外部依赖，单文件可部署。

---

## 2. 现状问题清单（v1）

| # | 问题 | 位置 | 后果 |
|---|------|------|------|
| P1 | 插件上报的 `remaining`（来自酷狗实测人数）在 `register`/`syncCode` 中被**完全忽略**，服务端用自身不完整的 members 列表反推名额 | worker.js | 手动加入的成员不在列表中 → 名额高估 → 下发的码实际已满 → `join_invalid` |
| P2 | **无租约机制**：join 下发即扣减 `remaining`；`report joined` 是 noop，仅 failed 回滚；客户端崩溃/断网时名额永久丢失 | worker.js `join`/`reportResult` | 名额单向泄漏，池子逐渐"假满" |
| P3 | 同一语义（状态上报）被拆成 register/sync/report 三种混杂调用，`creator="unknown"` 魔法值贯穿两端 | index.js + worker.js | 状态互相覆盖，逻辑无法推理 |
| P4 | `/pool/stats` 返回**全量**队伍码与成员 uid；刷新时逐码 sync（N+1 请求） | worker.js `stats` | 隐私泄露；可被枚举滥用 |
| P5 | uid 纯客户端自报，无任何校验，可伪造任意 uid 污染他人队伍 | 全局 | 数据可信度无底线 |
| P6 | 插件端 `runLock` 只覆盖 `runOnceBase`，`runOncePool` 在锁外；启动 timer、登录 watcher、开关、刷新四个入口可并发触发重复 join | index.js `scheduleRun` | 同一用户重复领取/加入 |
| P7 | `period.active` 已解析但**从未检查**，活动结束/未开始仍会建队、走池子流程 | index.js `runOnceBase` | 无效请求与脏数据 |
| P8 | members 存 JSON 字符串、无分配记录表、无队伍生命周期状态 | DO schema | 无法审计、无法自动回收 |
| P9 | 版本口径不一：README 最低 1.0.6 / wrangler.toml 1.0.7 / manifest 1.1.1 | 文档 | 排障成本 |

> 注：v1.1.2（2026-09-11）已在插件端加入「join 失败带 skip 参数领新码重试一次」作为补救，Worker `join()` 相应增加 skip 过滤。它缓解了 P1/P2 的表象（领到坏码后换一个），但没有改变根因——名额计算仍然不真实、无租约回收、语义仍混乱。v2 的快照+租约模型将其整体取代。

---

## 3. 角色与职责划分

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────┐
│  酷狗服务器   │ ◄────── │     插件端        │ ──────► │  码池服务器    │
│ (最终真相源)  │  组队操作 │  观察者 + 执行器   │ 快照/申请 │  匹配引擎      │
└─────────────┘         └──────────────────┘ ◄────── │  + 租约管理    │
                            ▲ 观测/my/info             └──────────────┘
                            │                          下发组队码
```

- **酷狗服务器**：队伍真实成员构成的**唯一权威**。码池永远不自行认定"谁在哪个队"。
- **插件端**：酷狗状态的**唯一可靠观察者**（登录态 IPC 可读 `my/info`）+ 组队操作执行器。负责把观测结果以**快照**上报。
- **码池服务器**：只做两件事——(a) 存储快照并计算每个队的**可用名额**；(b) 以**租约**方式下发组队码并跟踪结果。

**核心原则：码池对"队伍里有几个人"的任何判断，都来自插件上报的酷狗观测值；码池自己记录的成员信息仅用于在途（租约）占位。**

---

## 4. 总体流程（v2）

```
插件启动/登录/开关/定时
  │
  ▼
① GUARD      读登录态；GET /team/period/info；period.status ≠ 0（非进行中）→ 终止本轮
  │
  ▼
② MYINFO     GET /team/my/info；无自己创建的队伍 → POST /team/my 创建 → 重查
  │
  ▼
③ SNAPSHOT   POST /v2/snapshot  上报：我创建的队 {code, member_count, captain, members[]}
  │                                + 我加入的队 {code, member_count, captain, members[]}（可为空）
  ▼
④ DECIDE     已有 joined 队伍 → 本轮结束（进入心跳模式）
  │ 未加入
  ▼
⑤ ASSIGN     POST /v2/join → 服务端快满优先选队，创建租约 → {lease_id, code} 或 {code:null}
  │
  ▼
⑥ JOIN_KUGOU POST /team/join {team_code}（含验证码处理，沿用 v1 的 kugouVerification 逻辑）
  │
  ▼
⑦ RESULT     POST /v2/join/result → success（等快照确认）/ failed（立即释放名额）
  │
  ▼
⑧ VERIFY     GET /team/my/info 复查 → SNAPSHOT（把成队后的真实人数报给码池）
```

服务端每个期次一个 Durable Object 实例（沿用 `getByName(periodId)` 的天然隔离），DO 内嵌 SQLite 存储快照、租约与用户凭证。

---

## 5. 核心模型：名额与真相源

### 5.1 供需结构（匹配策略的数学依据）

每个用户：**供给** 2 个队员名额（自己创建的队伍），**需求** 1 个名额（加入别人的队伍）。

封闭池内：总供给 `2N`，总需求 `N` ⇒ **无论怎么分，至多约 50% 的队伍能凑满**（剩余队伍由池外成员填补：手动分享、非插件用户加入）。

推论：分配必须**集中火力**——把 join 持续发给同一支队伍直到满员，再开下一支。"雨露均沾"式平摊会让所有队伍都停在 2/3，无人获得奖励。这决定了 §6.4 的选队排序。

### 5.2 名额计算（唯一公式）

对任意队伍 `t`（容量 3，含队长）：

```
队员名额 = 2
已占用   = (t.member_count - 1)              ← 快照观测，权威值（member_count 含队长）
在途占用 = 未过期的 pending/success 租约数    ← expires_at > now（过期判定见 §6.3）
可用名额 = max(0, 2 - 已占用 - 在途占用)
```

- `member_count`：插件从 `/team/my/info` 的 `member_list.length` 观测，**每次快照覆盖更新**。
- **单调性校验**（依托"不支持退队"）：同一队伍本期 `member_count` 只增不减；快照中出现减少值属观测异常——照实覆盖（酷狗仍是真相源）但记 `events`（kind=error）供排查伪造/故障。
- 租约 `success` 后仍计占用，直到下一次快照确认人数已含该成员（租约转 `confirmed`，不再单独计）——防止确认窗口期超发。
- `success` 租约超过 10 分钟无快照确认 → 释放占用（`expired`）。若实际人数已满，后续快照会再次压低可用名额；若未满，名额及时回池。**任何路径都不会永久泄漏。**

### 5.3 队伍生命周期

```
open ──(member_count ≥ 3)──► full          （快照驱动；不支持退队 ⇒ 本期内不可逆）
open/full ──(6 小时无快照)──► stale        （选队时排除；新快照立即复活）
```

full 状态在期内**不会回退**（无退队接口），full 队伍的保活快照仅用于 staleness 与统计，不再参与匹配计算。

> 调优备注：失败即纠偏（§6.4）落地后，stale 阈值可评估从 6h 收紧至 1~2h 以增加池子供给（最坏一次无效分配且可自愈）；首版维持 6h，上线观察后再调。

不再引入 expired/sealed 状态：新期次天然是新 DO 实例，旧 DO 由每日 alarm 清理，无需显式封存。

---

## 6. 码池服务器设计（Worker + DO）

### 6.1 API v2（全部 JSON；鉴权头 `X-Plugin-Version` 保留）

统一响应：`{ ok: true, ... }` 或 `{ ok: false, error: "<code>", message }`。

#### `POST /v2/snapshot` —— 状态上报（替代 v1 的 register/sync）

```jsonc
// 请求
{
  "period_id": "288",
  "uid": "589524259",
  "token": "…",                          // 首次可为空，服务端签发（§6.6）
  "created": { "code": "ABC123", "member_count": 2, "captain": "589524259",
               "members": [ { "userid": "589524259", "nick": "一天", "role": 1, "reward": "获得7天VIP" } ] }, // 可为 null
  "joined":  { "code": "XYZ789", "member_count": 3, "captain": "357328413", "members": [ /* 同上 */ ] }  // 可为 null
}
// 响应
{ "ok": true, "token": "…", "pool": { "open_teams": 12, "waiting": 5 } }
```

`waiting`：最近 30 分钟活跃且 `users.last_joined_code` 为空的用户数（待分配人数，见 §6.2）。

服务端处理：
1. 校验/签发 token（已存在 uid **永不重签**，见 §6.6）；更新 `users.last_seen_at`。
2. Upsert `created` 队（captain_uid = uid）与 `joined` 队（captain 取上报值，外部码 captain 可为空串）→ 更新 `member_count`、`members_json`（成员观测名单，快照携带时覆盖、缺省保留旧值）、`snapshot_at`、status。`joined` 至多 1 支（已确认 `my_join_team_list` 上限为 1）；若异常上报多支，取第一支并记 events。
3. 更新 `users.last_joined_code`（joined 非空 → 该 code；否则清空）。
4. 若该 uid 存在 `pending`/`success`/`expired` 租约且 `joined.code` 与其 code 相符 → 统一转 `confirmed`（"迟到成功"仅作账目修正与审计一致性；名额真值由 `member_count` 保证，见 §5.2）。
5. 返回轻量聚合统计（供 UI 展示）。

#### `POST /v2/join` —— 申请分配

```jsonc
// 请求（exclude_codes 可选：本轮流程内已失败的队码，至多 3 个，仅本次选队生效、不落库）
{ "period_id": "288", "uid": "…", "token": "…", "exclude_codes": ["ABC123"] }
// 响应 A：分配成功
{ "ok": true, "lease_id": "uuid", "code": "ABC123", "expires_in": 120 }
// 响应 B：池空 / 已在队中
{ "ok": true, "code": null, "reason": "pool_empty" | "already_joined" }
```

服务端逻辑：
1. 幂等：该 uid 已有**未过期**的 `pending` 或 `success` 租约 → 原样返回该租约（防止重复分配）；`pending` 已过 `expires_at` 视同 `expired`，正常重新分配——**过期判定以时间戳为准，不依赖 alarm 是否已执行**（见 §6.3）。
2. 若 `users.last_joined_code` 非空（最近快照已加入）→ 返回 `already_joined` + 该队码。
3. 选队（§6.4）→ 命中则创建租约（TTL 120s，预留酷狗验证码交互时间）并返回。

#### `POST /v2/join/result` —— 租约结果回报

```jsonc
{ "period_id": "288", "uid": "…", "token": "…", "lease_id": "uuid",
  "result": "success" | "failed", "error_kind": "full|invalid|already_joined|network|…" }
```

- `success` → 租约 `pending → success`（保持占用，等快照确认，见 §5.2）。
- `failed` → 租约 `→ failed`，名额**立即释放**；并按 `error_kind` 将失败视为酷狗观测值纠偏队伍状态（§6.4 失败即纠偏）。
- 重复回报幂等忽略。

#### `POST /v2/status` —— 自查 + 聚合

请求体 `{ "period_id": "…", "uid": "…", "token": "…" }`。**token 一律走请求体，不进 URL**——查询串会落入网关/代理访问日志，属凭证泄露面。

```jsonc
{
  "ok": true,
  "my_team":     { "code": "ABC123", "member_count": 2, "status": "open" },  // 我创建的（可为 null）
  "joined_team": { "code": "XYZ789", "member_count": 3 },                    // 我加入的（可为 null）
  "active_lease": { "lease_id": "…", "code": "…", "status": "pending", "expires_in": 42 },
  "pool": { "open_teams": 12, "full_teams": 30, "waiting": 5 }
}
```

**隐私**：只返回请求者自己的队伍与租约 + 匿名聚合数；不再提供全量 codes（v1 `stats` 端点随 v2 删除）。

#### 删除的 v1 端点

`/pool/register`、`/pool/join`、`/pool/report`、`/pool/sync`、`/pool/stats` 全部下线（直接切换策略，见 §9）。

### 6.2 DO 存储模型（SQLite）

```sql
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);  -- schema_version 等

CREATE TABLE IF NOT EXISTS users (
  uid              TEXT PRIMARY KEY,
  token            TEXT NOT NULL,
  last_joined_code TEXT NOT NULL DEFAULT '',  -- 最近快照的 joined 码（''=待分配；用于 already_joined 判定与 waiting 统计）
  created_at       INTEGER NOT NULL,
  last_seen_at     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  code         TEXT PRIMARY KEY,
  captain_uid  TEXT NOT NULL DEFAULT '',
  member_count INTEGER NOT NULL DEFAULT 1,   -- 酷狗快照观测值（含队长），权威
  status       TEXT NOT NULL DEFAULT 'open', -- open | full | stale
  snapshot_at  INTEGER NOT NULL,             -- 最近快照时间（staleness 判定）
  fail_until   INTEGER NOT NULL DEFAULT 0,   -- full/invalid 失败冷却截止（此前不参与匹配）
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS leases (
  id          TEXT PRIMARY KEY,              -- crypto.randomUUID()
  uid         TEXT NOT NULL,
  code        TEXT NOT NULL,
  status      TEXT NOT NULL,                 -- pending | success | confirmed | failed | expired
  assigned_at INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,              -- pending: 120s（预留验证码交互）；success 等确认: 10min
  resolved_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_leases_code ON leases(code, status);
CREATE INDEX IF NOT EXISTS idx_leases_uid  ON leases(uid, status);

CREATE TABLE IF NOT EXISTS events (          -- 环形审计日志（保留最近 500 条）
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  ts     INTEGER NOT NULL,
  kind   TEXT NOT NULL,                      -- snapshot | assign | result | expire | error
  uid    TEXT,
  code   TEXT,
  detail TEXT
);
```

对比 v1：members JSON 列恢复并升级为**成员观测名单**（`{userid, nick, role, reward}`，来自 `member_list` 的 userid/nick_name/role/vip_desc，服务端净化截断）——普通客户端不可见，仅 `/v2/admin/data`（X-Admin-Token）对站长展示；`rate_limit` 表保留（结构不变）。

### 6.3 租约状态机

```
            assign              result=success            快照确认
  (无) ────────────► pending ────────────► success ────────────► confirmed
                        │  ▲                    │
          result=failed │  │ TTL 120s 到期       │ TTL 10min 无快照确认
                        ▼  │                    ▼
                      failed ◄──────────── expired        （failed/expired 释放名额）
```

- `pending` / `success` 占用名额；`confirmed` / `failed` / `expired` 不占用。
- **过期判定以 `expires_at` 与当前时间比较为准**：alarm 只是"到期后执行回收"的执行者；所有查询（幂等检查、名额计算）必须同时校验时间戳，不能只看 status 字段——否则 alarm 延迟期间会把已过期租约误判为在途（少算名额、幂等返回死租约）。
- 回收由 **DO alarm 驱动**：alarm 时间 = min(最近的 pending/success `expires_at`, 每日清理点)。alarm 触发时执行过期回收 + 每日清理（users/teams/leases/events **全部表**的 30 天旧数据、rate_limit 过期行；判空 `deleteAll` 同样以全部表为准，v1 逻辑只认 codes/rate_limit，重写时勿遗漏），并按需设置下一次 alarm。

### 6.4 匹配算法（快满优先 + FIFO）

```sql
SELECT t.code
FROM teams t
WHERE t.status = 'open'
  AND t.snapshot_at > :fresh_cutoff          -- 6h 内有快照，排除 stale
  AND t.fail_until < :now                    -- full/invalid 失败冷却中的队暂避
  AND t.code NOT IN (SELECT code FROM teams WHERE captain_uid = :uid)   -- 不分自己的队
  AND NOT EXISTS (SELECT 1 FROM leases l
                  WHERE l.uid = :uid
                    AND (l.status IN ('success', 'confirmed')
                         OR (l.status = 'pending' AND l.expires_at > :now)))    -- 未过期在途
  AND (2 - (t.member_count - 1)
         - (SELECT COUNT(*) FROM leases l
            WHERE l.code = t.code
              AND (l.status = 'success'
                   OR (l.status = 'pending' AND l.expires_at > :now)))) > 0    -- 在途只计未过期
ORDER BY
  (2 - (t.member_count - 1) - (SELECT COUNT(*) ... )) ASC,   -- 可用名额少者优先（快满优先）
  t.created_at ASC                                            -- 同名额按创建时间 FIFO
LIMIT 1;
```

- **快满优先**：剩余 1 个名额的队伍绝对优先，尽快产出一支完整队伍（§5.1）。
- **FIFO**：同等剩余名额时先到先得，行为可预期。
- **失败码短期回避**：组队不可逆（不支持退队），`error_kind` 为 `full`/`invalid` 说明该队实测状态与快照不符——置 `teams.fail_until = now + 10min`，冷却期不参与匹配，待下一次快照纠偏后自动恢复（取代 v1.1.2 的 skip 参数补丁）。用列存储而非查询 events 环形日志，避免日志裁剪导致冷却提前失效。
- **transient 不冷却**（2026-09-12 三次修订）：`error_kind=transient`（验证码残留、酷狗限频等客户端侧抖动/未知错误）不代表队伍状态——不纠偏、不冷却、仅记审计；客户端在本轮流程内通过 `exclude_codes` 避开刚失败的队（network 类除外，网络抖动重试同队合理），下一轮完整流程重新一视同仁。`invalid` 仅在客户端给出显式证据（不存在/无效/已解散/组队码错误）时上报，维持 24h 冷却（§11.2）。
- DO 单线程串行执行，选队 + 插入租约天然原子，无竞态超发。

### 6.5 限速与防滥用

- 每 uid **令牌桶限速：突发 5、持续 1 req/s**（沿用 v1 的 rate_limit 表增加桶字段，应用到全部 v2 端点）。单次完整流程含 snapshot→join→result→snapshot 共 4 个请求，固定 1 req/s 会把流程内请求挤成 429，必须允许突发。
- join 的幂等租约返回天然防止"反复领取"放大。
- 请求体 4KB 上限、版本门禁（§9）沿用 v1 机制。

### 6.6 身份防伪（Token 方案，最简强度）

选择理由：HMAC/密钥对需要密钥生命周期管理、时钟同步与规范化序列化，失败模式多；Token 方案只需一张 `users` 表，能挡住"随手伪造 uid"这一最常见攻击面（开源客户端注定防不住决心攻击者，配合限速与审计已够用）。

- 首次 `snapshot` 无 token 且该 uid 不存在 → 服务端生成 32 字节随机 hex 存 `users` 表并随响应返回；插件持久化到 storage（按 uid 分键，支持多账号切换）。
- 之后所有请求校验 `uid + token` 绑定，不匹配 → `401 unauthorized`。**401 永不重签**：若允许"清空 token 重新注册"，任何知道目标 uid 的人都能一键劫持既有身份（覆盖其快照人数、占用其租约），防伪将完全失效。uid 不存在（新用户 / 新期次的空 users 表）才签发。
- `events` 表记录异常（401 频次、分配失败分布），为将来升级签名方案留观测数据。

### 6.7 部署与迁移

- **Schema 迁移**：`_init()` 读取 `meta.schema_version`；v2 首次部署检测到 v1 表结构（存在 `codes` 表）时 `DROP` 重建——每期活动数据独立，无需保留。`compatibility_date`、DO 绑定、自定义域名路由不变。
- **WAF 403 问题**（v1 已知）：为 `echo-team-pool.oneday.vip` 配置 WAF 跳过规则（匹配路径 `/v2/*` 或 `X-Plugin-Version` 头）；同时在 wrangler.toml 启用 `workers_dev` 域名作为兜底，插件端 403 时提示切换。
- `MIN_CLIENT_VERSION` 提至 `1.2.0`（与新插件版本同步），README 版本口径一并修正。
- **部署节奏**：Worker 先部署即令所有 v1.1.x 客户端码池功能 403（提示更新）——Worker 部署与插件发版应紧凑衔接，避免长时间功能空窗。

### 6.8 运维观测（可选）

- `POST /v2/health`：请求头 `X-Admin-Token` 与 Worker secret 比对，请求体 `{ "period_id": "…" }`。返回该期 DO 的聚合指标——开放/满员/过期/冷却队伍数、租约各状态数、用户数、24h 异常事件计数。仅聚合、不含 uid/code 明细。供运维监控与容量观察，非客户端功能依赖。
- `POST /v2/admin/data`：同门禁（`X-Admin-Token`，校验失败返回 404 不暴露端点存在性），站长只读全量明细——当前期全部队伍（code、队长 uid、人数、open/full/stale 状态、最近快照/冷却截止时间、在途租约数）、用户列表（uid、最近加入码、活跃时间；**不含 token**）、最近 200 条租约、最近 100 条审计事件、聚合 summary。
- 成员名单/昵称/奖励（`members_json`，含每人 `vip_desc`）自 v2.1 起随快照存储，**仅站长端点 `/v2/admin/data` 可见**，普通客户端的 `/v2/status` 仍只返回自身数据；请求需携带 `X-Plugin-Version` 头（版本门禁在前）。
- 查看方式：(a) **本地看板** `team-pool-worker/admin.html`——浏览器直接打开，填入 API 地址 / 期次 ID / Admin Token 即可查看全量数据与成员明细，支持 30s 自动刷新；两个管理端点已开放 CORS 与 OPTIONS 预检（仍受 Token 门禁）；(b) **命令行**：`curl -X POST <worker>/v2/admin/data -H "X-Admin-Token: <密钥>" -H "X-Plugin-Version: 1.2.0" -H "Content-Type: application/json" -d '{"period_id":"<期次>"}'`。

---

## 7. 插件端设计（auto-team-vip v1.2.0）

### 7.1 单 Runner 状态机（修复 v1 并发竞态）

```js
// 全流程互斥：任何触发点（启动/登录/开关/刷新/心跳）都汇入同一个队列
let runChain = Promise.resolve();        // 串行链：新请求排队而非并发
let lastRunAt = 0;
const MIN_INTERVAL = 10_000;             // 触发合并窗口

async function requestRun(reason) {
  runChain = runChain.then(() => runFullFlow(reason));
  return runChain;
}

async function runFullFlow(reason) {
  if (Date.now() - lastRunAt < MIN_INTERVAL) return;   // 10s 内重复触发直接合并，防止队列堆积
  lastRunAt = Date.now();
  try { /* §4 ①→⑧ */ } finally { /* 状态复位 */ }
}
```

`runFullFlow` 按 §4 的 ①→⑧ 顺序执行，`try/finally` 保证状态复位；`runOnceBase`/`runOncePool` 的拆分删除（单函数内聚）。

### 7.2 触发时机与心跳

| 触发 | 时机 | 行为 |
|------|------|------|
| 启动 | activate + 3s | 完整流程 |
| 登录 | token watcher + 2s | 完整流程 |
| 开关切换 | 用户操作 | 开→完整流程；关→仅停止心跳（快照照发一次以同步状态） |
| 手动刷新 | 面板按钮（3s 节流） | 完整流程 |
| **心跳** | 面板打开或自动开关开启时，每 5 min | 仅 SNAPSHOT（保活快照 + 拉聚合统计）；本期未完成时每 10 min 触发完整流程（等待池子出新码） |

- **期次切换**：本地存 `lastPeriodId`，发现变化即清空本地缓存的码与 joined 状态（token 为账号级，不清）。
- **期次未激活**（`period.status ≠ 0`）：UI 显示"本期未开启"，**不建队、不请求码池**（修复 P7）。

### 7.3 快照上报（替代 v1 register/sync）

每次流程把两维度真实状态整体上报：

```js
const snapshot = {
  period_id: periodId,
  uid, token,
  created: myTeam ? { code: myTeam.code, member_count: myTeam.memberCount, captain: uid,
                      members: myTeam.members } : null,
  joined:  joinedTeam ? { code: joinedTeam.code, member_count: joinedTeam.memberCount,
                          captain: joinedTeam.captain ?? "", members: joinedTeam.members } : null,
};
```

- `member_count` 一律取 `member_list.length`（酷狗权威），不再用 `calcRemaining` 本地推断后上报"剩余名额"——名额计算移到服务端（§5.2）。
- 响应携带的 `pool` 聚合与 `token`（首次）入库/入 UI。

### 7.4 分配与执行

- `POST /v2/join`：
  - `code: null, reason: "pool_empty"` → 提示"暂无可加入的队伍"，进入等待心跳循环。
  - `reason: "already_joined"` → 用返回的 code 校正本地状态，不执行酷狗 join。
  - 拿到 `lease_id + code` → `POST /team/join`（沿用 v1 的验证码处理与错误分类）→ `POST /v2/join/result`（success/failed + error_kind）→ VERIFY 复查 → 再次 SNAPSHOT。
  - 失败重试（≤3 次）携带 `exclude_codes` 避开本轮已失败的队；错误分类默认 `transient`（客户端侧抖动，不冷却），`invalid` 仅认显式证据（§6.4）。
  - join 错误响应结构（2026-09-12 实测）：业务失败走 HTTP 502，错误字段在顶层、`data` 为空串，如 `{"error_msg":"队伍不存在","data":"","status":0,"error_code":143001}`；成功为 HTTP 200 + `status:1` + `error_code:0`（`data` 亦为空串，队伍详情需再查 `my/info`）。
  - 酷狗 join 数值错误码（实测）：`143004`=队伍已满员、`143010`=你已经是队伍成员、`143001`=队伍不存在；`classifyJoinError` 数值码优先判定，文案关键词兜底（"满/full"、"已加入/是队伍成员/已参/joined"、"不存在/无效/已解散/组队码错误"），默认 `transient`。
- **降级与退避**：码池不可达/5xx 时指数退避（5/15/30 分钟），期间酷狗侧建队照常进行；恢复后由心跳自动补报快照。
- **401 处理**：提示"身份校验失败，本期码池功能停用（下期自动恢复）"并停止请求码池；**不得清除 token 重试**——服务端对已存在 uid 永不重签（防劫持，§6.6）。token 仅在用户主动清除插件数据/重装时丢失，属可接受的小概率事件。
- **手动流程**：手动输入码加入成功 → 触发一次 SNAPSHOT，该码自动入池（外部码有位即可被分配，用户已拍板）；复制自己的码分享给他人 → 对方（无论是否插件用户）加入后，下次快照自动反映人数。
- **入队即终态**：酷狗不支持退队，`joined` 非空后插件不再发起任何 `/v2/join`（服务端亦会以 `already_joined` 拦截兜底），仅保留心跳快照；本期内的 UI 状态固定为"已加入 <code>"。

### 7.5 UI 调整

- 新增一行池子聚合状态：`码池：开放队伍 12 · 等待 5 人`（来自 snapshot/status 响应）。
- 保留：期次信息、我创建的/我加入的队伍、错误详情复制、版本过低提示（403 version_mismatch 逻辑不变）。
- 移除：基于 `creator === uid` 从全量 stats 过滤"我的码"的刷新逻辑（隐私与 N+1 问题一并消失）。

---

## 8. 关键场景与对策

| 场景 | v1 表现 | v2 对策 |
|------|---------|---------|
| 客户端领码后崩溃/断网 | 名额永久丢失 | 租约 TTL 120s，alarm 自动回收 |
| 领码后验证码交互耗时较长 | —（无租约概念） | TTL 120s 预留交互；仍超时则过期回收并重新分配（自愈） |
| 领码成功但后续快照缺失 | —（无该概念） | success 租约 10min 后释放，快照最终纠偏，无永久泄漏 |
| 手动加入的朋友占位未上报 | 名额高估 → 下发已满的码（P1 根因） | `member_count` 快照权威，占位即反映 |
| 两个插件用户同时申请同一名额 | 无租约，靠扣减竞态 | DO 单线程 + 原子选队插入租约 |
| 同一用户重复触发流程 | runOncePool 在锁外可重复 join | 单 runner 串行链 + 10s 触发合并 + join 幂等租约 |
| 活动期次结束 | 照常建队/请求 | `period.status ≠ 0` 直接终止；新期次新 DO 天然隔离 |
| 伪造他人 uid | 可任意污染 | token 绑定 + 401 + 限速 + events 审计 |
| 探测全量队伍/成员 | `/pool/stats` 全量返回 | 端点删除，仅返回自身数据 + 聚合数 |
| 码池不可用 | 重试 1 次后失败 | 指数退避，酷狗侧流程不受影响 |
| token 丢失（重装/清数据）或伪造 uid 命中既有身份 | v1 可任意伪造污染 | 401 永不重签：提示本期码池停用、下期新 DO 自动恢复；既有身份不可被劫持 |
| 旧版本插件继续请求 | 语义不一致风险 | `MIN_CLIENT_VERSION=1.2.0`，403 + 更新提示 |

---

## 9. 版本与兼容（直接切换）

- Worker 部署 v2 后：v1 端点返回 `404 not_found`；`MIN_CLIENT_VERSION = 1.2.0`，旧版插件所有请求收到 `403 version_mismatch` + 更新提示（现有机制，无代码改动）。
- 插件 `manifest.json` version → `1.2.0`；README 的版本说明、工作原理、码池描述全部重写对齐（P9）。
- 无数据迁移负担：期次数据本就按期隔离，v2 首次部署时清空 v1 表。

---

## 10. 提交计划（全部在 `vip` 分支）

| 序 | 提交 | 内容 |
|----|------|------|
| 1 | `docs(auto-team-vip): v2 架构设计方案` | 本文档 |
| 2 | `feat(team-pool-worker): v2 快照/租约/匹配模型` | worker.js 重写（DO schema、§6 API、alarm 回收）、wrangler.toml（MIN_CLIENT_VERSION=1.2.0、workers_dev 兜底） |
| 3 | `feat(auto-team-vip): v2 状态机与快照协议` | index.js 重写（§7）、manifest 1.2.0、README 重写 |

实施顺序：Worker 先行部署（旧版客户端只读 403，无兼容负担）→ 插件发版。

---

## 11. 已确认事实与决策记录（2026-09-11 定稿）

**活动规则事实（用户确认）：**

1. **酷狗不支持退队**——成员一旦入队即为本期终态。落地：§5.3 full 状态期内不可逆；§5.2 member_count 单调性校验；§6.4 失败码短期回避；§7.4 入队即终态。原设想的"死队换绑"（v2.x 退出重匹配）**不可行，永久排除**。
2. **队员 5/3 天奖励与加入顺序无关**——匹配策略无需考虑个体奖励激励；快满优先 + FIFO 仅由成队率最大化决定（§5.1）。"空队优先"选项永久排除。
3. **`my_join_team_list` 至多 1 支**——快照的 `joined` 采用单对象（非数组）是正确设计，无需预留扩展；服务端对超量上报取第一支并记 events（§6.1）。

**协议与策略决策（同日拍板）：** 快满优先 + FIFO ｜ 外部码入池 ｜ 服务端签发 Token ｜ v2 直接切换（旧版 403 提示更新）。

**二次复核补充（2026-09-11，用户确认采纳）：**

1. **join 失败当轮立即重试**（≤3 次、间隔 2s；`already_joined` 除外，改为立即快照纠偏）——补回 v1.1.2 的即时换码 UX，服务端纠偏/冷却保证不重复领到同一坏队（§7.4）。
2. **失败即纠偏**：full（本租约为最后名额时）置 `member_count=3/status=full`、非最后名额时 10min 冷却、invalid 24h 冷却（§6.4）。
3. **实现级约束**：`runFullFlow` 内部全捕获；uid=酷狗 userid（弃用随机 uid）；member_count 取 `member_list.length` 并以字段兜底；alarm 清理与判空覆盖全部表；teams.status 的 stale 不落库（查询推导）；already_joined 响应带 code；Worker 部署与插件发版紧凑衔接。
4. **stale 阈值**首版维持 6h，上线观察后再评估收紧至 1~2h。

**三次复核修订（2026-09-12）：**

1. **错误分类拆 transient**：客户端 `classifyJoinError` 默认 `transient`（客户端侧抖动/未知错误），`invalid` 仅认显式证据（不存在/无效/已解散/组队码错误），关键词表随日志观察校准；服务端对 `transient` 不纠偏不冷却、仅记审计。随行新增 `POST /v2/join` 可选 `exclude_codes`（≤3 个、仅本次选队生效不落库），客户端本轮流程内失败（network 除外）即避让，防当轮重试重复命中同一坏队。
2. **member_count 单调性审计补全**：快照观测值较上次减少即记 events（不再限定 prev 状态为 full），对齐 §5.2。
3. **join 检查顺序对调**：`last_joined_code`（快照观测）优先于活跃租约幂等检查，消除 120s 租约残留窗口内旧租约覆盖"已加入"事实的极端场景。

**实现加固（2026-09-12 审查终检）：**

1. alarm 空池 deleteAll 后立即 `_init()` 重建表结构与 alarm——同内存实例的构造器不会重跑，防残留实例因缺表 500。
2. 租约分配/转 success 后调用 `_scheduleNextAlarm()`，与 §6.3「alarm 时间 = min(最近租约到期, 每日清理点)」完全一致（此前仅在 alarm 内调度，靠请求路径懒清扫兜底）。
3. 插件端心跳以 `periodState`（unknown/error/active/inactive）取代 periodActive 硬门控：GUARD 失败按常规间隔自动重试自愈；期次未开启每 30min 低频探测，下一期自动开始。
4. 建队失败显式提示（不阻断分配流程，仍可以队员身份加入他人队伍）；README 注明同账号多设备仅最先上报快照的一台可用码池（防劫持设计取舍）。

无遗留开放问题，可按 §10 提交计划实施。
