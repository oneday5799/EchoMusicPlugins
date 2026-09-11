// echo-team-pool v2 —— 快照 / 租约 / 匹配模型
// 架构设计：docs/auto-team-vip-redesign.md（§6）
//
// 职责边界：
//   - 酷狗服务器是队伍构成的唯一权威；码池对"队伍里有几个人"的判断全部来自插件上报的快照观测值。
//   - 码池只做两件事：(a) 存储快照并计算每个队的可用名额；(b) 以租约方式下发组队码并跟踪结果。
//   - 每期活动一个 Durable Object 实例（getByName(periodId)），DO 内嵌 SQLite 存储全部状态。

const SCHEMA_VERSION = "3";
const TEAM_CAPACITY = 3;                    // 1 队长 + 2 队员
const MEMBER_SLOTS = TEAM_CAPACITY - 1;     // 队员名额
const LEASE_TTL_MS = 120_000;               // pending 租约有效期（预留酷狗验证码交互）
const SUCCESS_CONFIRM_MS = 600_000;         // success 等待快照确认窗口
const FRESH_CUTOFF_MS = 6 * 3_600_000;      // 超过该时长无快照 → stale（查询时推导，不落库）
const COOLDOWN_SUSPECT_FULL_MS = 600_000;   // 可疑 full（非最后名额）冷却
const COOLDOWN_INVALID_MS = 24 * 3_600_000; // invalid 冷却（码无效无快照可纠偏）
const RATE_BURST = 5;                       // 令牌桶：突发
const RATE_REFILL_PER_SEC = 1;              // 令牌桶：持续
const WAITING_ACTIVE_MS = 30 * 60_000;      // waiting 统计的活跃窗口
const CLEANUP_INTERVAL_MS = 24 * 3_600_000; // 每日清理
const DATA_RETENTION_MS = 30 * 24 * 3_600_000;
const EVENTS_KEEP = 500;                    // 审计环形日志容量
const MAX_BODY_SIZE = 4096;

// ---------- utils ----------

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function err(code, message, status = 400) {
  return json({ ok: false, error: code, message }, status);
}

function parseVersion(v) {
  const p = String(v).split(".").map(Number);
  return [p[0] || 0, p[1] || 0, p[2] || 0];
}

function versionGte(a, b) {
  const [a1, a2, a3] = parseVersion(a);
  const [b1, b2, b3] = parseVersion(b);
  if (a1 !== b1) return a1 > b1;
  if (a2 !== b2) return a2 > b2;
  return a3 >= b3;
}

function clampMemberCount(n) {
  const num = Math.round(Number(n));
  if (!Number.isFinite(num)) return 1;
  return Math.min(TEAM_CAPACITY, Math.max(1, num));
}

function cleanStr(v, maxLen) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

// 成员观测名单净化：至多 3 人，字段白名单（userid 必填；nick/reward 截断；role 1 队长 / 2 队员）
function sanitizeMembers(list) {
  if (!Array.isArray(list)) return null;
  const out = [];
  for (const m of list.slice(0, TEAM_CAPACITY)) {
    if (!m || typeof m !== "object") continue;
    const userid = cleanStr(m.userid ?? m.u, 32);
    if (!userid) continue;
    out.push({
      userid,
      nick: cleanStr(m.nick ?? m.nickname, 48),
      role: Number(m.role) === 1 ? 1 : 2,
      reward: cleanStr(m.reward ?? m.vip_desc, 48),
    });
  }
  return out.length > 0 ? out : null;
}

// ---------- Durable Object ----------

import { DurableObject } from "cloudflare:workers";

export class PeriodPool extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this._ready = ctx.blockConcurrencyWhile(async () => this._init());
  }

  async _init() {
    const sql = this.ctx.storage.sql;
    // schema 版本检测：版本不符时全部业务表丢弃重建——每期数据独立，无需保留
    let schemaVersion = "";
    const tables = sql
      .exec(`SELECT name FROM sqlite_master WHERE type='table' AND name IN ('meta','codes')`)
      .toArray();
    const names = new Set(tables.map((r) => String(r.name)));
    if (names.has("meta")) {
      const rows = sql.exec(`SELECT value FROM meta WHERE key = 'schema_version'`).toArray();
      if (rows.length > 0) schemaVersion = String(rows[0].value ?? "");
    }
    if (schemaVersion !== SCHEMA_VERSION) {
      for (const t of ["codes", "rate_limit", "users", "teams", "leases", "events", "meta"]) {
        sql.exec(`DROP TABLE IF EXISTS ${t}`);
      }
      sql.exec(`
        CREATE TABLE IF NOT EXISTS meta (
          key   TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS users (
          uid              TEXT PRIMARY KEY,
          token            TEXT NOT NULL,
          last_joined_code TEXT NOT NULL DEFAULT '',
          created_at       INTEGER NOT NULL,
          last_seen_at     INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS teams (
          code         TEXT PRIMARY KEY,
          captain_uid  TEXT NOT NULL DEFAULT '',
          member_count INTEGER NOT NULL DEFAULT 1,
          members_json TEXT NOT NULL DEFAULT '[]', -- 成员观测名单 [{userid,nick,role,reward}]，仅站长端点可见
          status       TEXT NOT NULL DEFAULT 'open',
          snapshot_at  INTEGER NOT NULL,
          fail_until   INTEGER NOT NULL DEFAULT 0,
          created_at   INTEGER NOT NULL,
          updated_at   INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS leases (
          id          TEXT PRIMARY KEY,
          uid         TEXT NOT NULL,
          code        TEXT NOT NULL,
          status      TEXT NOT NULL,
          assigned_at INTEGER NOT NULL,
          expires_at  INTEGER NOT NULL,
          resolved_at INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_leases_code ON leases(code, status);
        CREATE INDEX IF NOT EXISTS idx_leases_uid  ON leases(uid, status);
        CREATE TABLE IF NOT EXISTS events (
          id     INTEGER PRIMARY KEY AUTOINCREMENT,
          ts     INTEGER NOT NULL,
          kind   TEXT NOT NULL,
          uid    TEXT,
          code   TEXT,
          detail TEXT
        );
        CREATE TABLE IF NOT EXISTS rate_limit (
          uid        TEXT PRIMARY KEY,
          tokens     REAL NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
      sql.exec(
        `INSERT INTO meta (key, value) VALUES ('schema_version', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        SCHEMA_VERSION
      );
    }
    if ((await this.ctx.storage.getAlarm()) === null) {
      await this.ctx.storage.setAlarm(Date.now() + CLEANUP_INTERVAL_MS);
    }
  }

  // ---------- 基础设施 ----------

  _sql(query, ...params) {
    return this.ctx.storage.sql.exec(query, ...params).toArray();
  }

  _exec(query, ...params) {
    return this.ctx.storage.sql.exec(query, ...params);
  }

  _event(kind, uid, code, detail) {
    try {
      this._exec(
        `INSERT INTO events (ts, kind, uid, code, detail) VALUES (?, ?, ?, ?, ?)`,
        Date.now(), kind, uid || null, code || null,
        detail ? String(detail).slice(0, 500) : null
      );
      this._exec(`DELETE FROM events WHERE id <= (SELECT MAX(id) FROM events) - ?`, EVENTS_KEEP);
    } catch {
      // 审计失败不影响主流程
    }
  }

  _newToken() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  // 身份校验：uid 已存在则 token 必须精确匹配（永不重签，防劫持）；
  // 仅 snapshot（issue=true）允许为不存在的 uid 签发新 token（新用户 / 新期次空表）。
  _auth(uid, token, { issue = false } = {}) {
    const rows = this._sql(`SELECT token FROM users WHERE uid = ?`, uid);
    if (rows.length === 0) {
      if (!issue) {
        return { ok: false, status: 401, error: "unauthorized", message: "身份不存在或已过期，请先上报状态" };
      }
      const fresh = this._newToken();
      const now = Date.now();
      this._exec(
        `INSERT INTO users (uid, token, last_joined_code, created_at, last_seen_at) VALUES (?, ?, '', ?, ?)`,
        uid, fresh, now, now
      );
      return { ok: true, token: fresh };
    }
    const stored = String(rows[0].token ?? "");
    if (!token || token !== stored) {
      this._event("auth", uid, null, "token_mismatch");
      return { ok: false, status: 401, error: "unauthorized", message: "身份校验失败，本期码池功能停用（下期自动恢复）" };
    }
    return { ok: true, token: stored };
  }

  // 令牌桶限速：突发 RATE_BURST、持续 RATE_REFILL_PER_SEC，应用到全部 v2 客户端端点
  _checkRate(uid) {
    const now = Date.now();
    const rows = this._sql(`SELECT tokens, updated_at FROM rate_limit WHERE uid = ?`, uid);
    let tokens = rows.length > 0 ? Number(rows[0].tokens) : RATE_BURST;
    const last = rows.length > 0 ? Number(rows[0].updated_at) : now;
    tokens = Math.min(RATE_BURST, tokens + ((now - last) / 1000) * RATE_REFILL_PER_SEC);
    if (tokens < 1) {
      this._exec(
        `INSERT INTO rate_limit (uid, tokens, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(uid) DO UPDATE SET tokens = excluded.tokens, updated_at = excluded.updated_at`,
        uid, tokens, now
      );
      // 限速事件每 uid 每分钟至多记一条，防止刷掉审计环形日志
      const recent = this._sql(
        `SELECT 1 FROM events WHERE kind = 'rate' AND uid = ? AND ts > ? LIMIT 1`,
        uid, now - 60_000
      );
      if (recent.length === 0) this._event("rate", uid, null, "rate_limited");
      return false;
    }
    tokens -= 1;
    this._exec(
      `INSERT INTO rate_limit (uid, tokens, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(uid) DO UPDATE SET tokens = excluded.tokens, updated_at = excluded.updated_at`,
      uid, tokens, now
    );
    return true;
  }

  // 过期回收：以时间戳判定（不依赖 alarm 是否已执行），所有入口先做懒清扫
  _sweepExpired() {
    const now = Date.now();
    try {
      const cursor = this._exec(
        `UPDATE leases SET status = 'expired', resolved_at = ?
         WHERE status IN ('pending', 'success') AND expires_at <= ?`,
        now, now
      );
      const n = Number(cursor?.rowsWritten ?? 0);
      if (n > 0) this._event("expire", null, null, "expired_leases=" + n);
    } catch {
      // 清扫失败不影响主流程（查询侧仍以时间戳兜底）
    }
  }

  // 某队当前在途占用（未过期 pending/success 租约数），可排除指定租约
  _inflightCount(code, excludeLeaseId) {
    const rows = this._sql(
      `SELECT COUNT(*) AS c FROM leases
       WHERE code = ? AND id <> ?
         AND (status = 'success' OR (status = 'pending' AND expires_at > ?))`,
      code, excludeLeaseId || "", Date.now()
    );
    return Number(rows[0]?.c ?? 0);
  }

  _poolStats() {
    const now = Date.now();
    const open = this._sql(
      `SELECT COUNT(*) AS c FROM teams WHERE status = 'open' AND snapshot_at > ? AND fail_until < ?`,
      now - FRESH_CUTOFF_MS, now
    );
    const full = this._sql(`SELECT COUNT(*) AS c FROM teams WHERE status = 'full'`);
    const waiting = this._sql(
      `SELECT COUNT(*) AS c FROM users WHERE last_joined_code = '' AND last_seen_at > ?`,
      now - WAITING_ACTIVE_MS
    );
    return {
      open_teams: Number(open[0]?.c ?? 0),
      full_teams: Number(full[0]?.c ?? 0),
      waiting: Number(waiting[0]?.c ?? 0),
    };
  }

  // 快照 upsert 队伍：member_count 以酷狗观测值为权威，覆盖更新；
  // 新快照代表更新的观测，清除失败冷却（"新快照立即复活"）。
  // members（成员名单观测值）仅在快照携带时覆盖，缺省保留旧值（部分响应可能不带 member_list）。
  _upsertTeam({ code, captain, memberCount, members, source }, now) {
    const mc = clampMemberCount(memberCount);
    const status = mc >= TEAM_CAPACITY ? "full" : "open";
    const roster = sanitizeMembers(members);
    const rows = this._sql(
      `SELECT captain_uid, member_count, status FROM teams WHERE code = ?`, code
    );
    if (rows.length === 0) {
      this._exec(
        `INSERT INTO teams (code, captain_uid, member_count, members_json, status, snapshot_at, fail_until, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        code, captain || "", mc, JSON.stringify(roster || []), status, now, now, now
      );
      return;
    }
    const prevMc = Number(rows[0].member_count);
    const prevStatus = String(rows[0].status ?? "");
    if (prevStatus === "full" && mc < prevMc) {
      // 单调性异常：照实覆盖（酷狗仍是真相源），记 events 供排查伪造/故障
      this._event("error", source, code, `member_count_decrease ${prevMc}->${mc}`);
    }
    const newCaptain = captain || String(rows[0].captain_uid ?? "");
    if (roster) {
      this._exec(
        `UPDATE teams SET captain_uid = ?, member_count = ?, members_json = ?, status = ?, snapshot_at = ?, fail_until = 0, updated_at = ?
         WHERE code = ?`,
        newCaptain, mc, JSON.stringify(roster), status, now, now, code
      );
    } else {
      this._exec(
        `UPDATE teams SET captain_uid = ?, member_count = ?, status = ?, snapshot_at = ?, fail_until = 0, updated_at = ?
         WHERE code = ?`,
        newCaptain, mc, status, now, now, code
      );
    }
  }

  // ---------- v2 API ----------

  // POST /v2/snapshot —— 状态上报（替代 v1 register/sync）
  async snapshot(body) {
    await this._ready;
    const uid = cleanStr(body?.uid, 64);
    if (!uid) return { ok: false, status: 400, error: "missing_uid", message: "缺少 uid" };
    if (!this._checkRate(uid)) {
      return { ok: false, status: 429, error: "rate_limited", message: "请求过于频繁，请稍后再试" };
    }
    const token = cleanStr(body?.token, 128);
    const auth = this._auth(uid, token, { issue: true });
    if (!auth.ok) return auth;

    const now = Date.now();
    this._exec(`UPDATE users SET last_seen_at = ? WHERE uid = ?`, now, uid);

    const created = body?.created && body.created.code ? body.created : null;
    const joined = body?.joined && body.joined.code ? body.joined : null;

    if (created) {
      this._upsertTeam(
        {
          code: cleanStr(created.code, 64),
          captain: uid,
          memberCount: created.member_count,
          members: created.members,
          source: uid,
        },
        now
      );
    }

    if (joined) {
      const code = cleanStr(joined.code, 64);
      this._upsertTeam(
        {
          code,
          captain: cleanStr(joined.captain, 64),
          memberCount: joined.member_count,
          members: joined.members,
          source: uid,
        },
        now
      );
      this._exec(`UPDATE users SET last_joined_code = ? WHERE uid = ?`, code, uid);
      // 迟到成功确认：pending/success/expired 租约与快照 joined 相符 → confirmed（账目修正）
      const cursor = this._exec(
        `UPDATE leases SET status = 'confirmed', resolved_at = ?
         WHERE uid = ? AND code = ? AND status IN ('pending', 'success', 'expired')`,
        now, uid, code
      );
      if (Number(cursor?.rowsWritten ?? 0) > 0) {
        this._event("snapshot", uid, code, "lease_confirmed_late");
      }
    } else {
      this._exec(`UPDATE users SET last_joined_code = '' WHERE uid = ?`, uid);
    }

    this._event(
      "snapshot", uid,
      created?.code ? cleanStr(created.code, 64) : null,
      `created_mc=${created ? clampMemberCount(created.member_count) : 0};joined_mc=${joined ? clampMemberCount(joined.member_count) : 0}`
    );
    return { ok: true, token: auth.token, pool: this._poolStats() };
  }

  // POST /v2/join —— 申请分配（幂等；快满优先 + FIFO）
  async join(body) {
    await this._ready;
    const uid = cleanStr(body?.uid, 64);
    if (!uid) return { ok: false, status: 400, error: "missing_uid", message: "缺少 uid" };
    if (!this._checkRate(uid)) {
      return { ok: false, status: 429, error: "rate_limited", message: "请求过于频繁，请稍后再试" };
    }
    const auth = this._auth(uid, cleanStr(body?.token, 128));
    if (!auth.ok) return auth;

    const now = Date.now();
    this._sweepExpired();

    // 幂等：已有未过期 pending/success 租约 → 原样返回（防止重复分配）
    const active = this._sql(
      `SELECT id, code, expires_at FROM leases
       WHERE uid = ? AND ((status = 'pending' AND expires_at > ?) OR (status = 'success' AND expires_at > ?))
       ORDER BY assigned_at DESC LIMIT 1`,
      uid, now, now
    );
    if (active.length > 0) {
      const l = active[0];
      return {
        ok: true,
        lease_id: String(l.id),
        code: String(l.code),
        expires_in: Math.max(1, Math.round((Number(l.expires_at) - now) / 1000)),
      };
    }

    // 最近快照已加入 → already_joined（附该队码，供客户端校正本地状态）
    const userRows = this._sql(`SELECT last_joined_code FROM users WHERE uid = ?`, uid);
    const lastJoined = userRows.length > 0 ? String(userRows[0].last_joined_code ?? "") : "";
    if (lastJoined) {
      return { ok: true, code: lastJoined, reason: "already_joined" };
    }

    // 选队：快满优先（可用名额少者优先）+ FIFO；排除自己创建的队、stale、冷却中的队
    const fresh = now - FRESH_CUTOFF_MS;
    const candidates = this._sql(
      `SELECT t.code,
              (${MEMBER_SLOTS} - (t.member_count - 1) - (SELECT COUNT(*) FROM leases l
                  WHERE l.code = t.code
                    AND (l.status = 'success' OR (l.status = 'pending' AND l.expires_at > ?)))) AS avail
       FROM teams t
       WHERE t.status = 'open'
         AND t.snapshot_at > ?
         AND t.fail_until < ?
         AND t.captain_uid <> ?
         AND (${MEMBER_SLOTS} - (t.member_count - 1) - (SELECT COUNT(*) FROM leases l
                  WHERE l.code = t.code
                    AND (l.status = 'success' OR (l.status = 'pending' AND l.expires_at > ?)))) > 0
         AND NOT EXISTS (SELECT 1 FROM leases l2
                  WHERE l2.uid = ? AND l2.code = t.code
                    AND (l2.status IN ('success', 'confirmed')
                         OR (l2.status = 'pending' AND l2.expires_at > ?)))
       ORDER BY avail ASC, t.created_at ASC
       LIMIT 1`,
      now, fresh, now, uid, now, uid, now
    );
    if (candidates.length === 0) {
      return { ok: true, code: null, reason: "pool_empty" };
    }

    const code = String(candidates[0].code);
    const leaseId = crypto.randomUUID();
    this._exec(
      `INSERT INTO leases (id, uid, code, status, assigned_at, expires_at) VALUES (?, ?, ?, 'pending', ?, ?)`,
      leaseId, uid, code, now, now + LEASE_TTL_MS
    );
    this._event("assign", uid, code, leaseId);
    return { ok: true, lease_id: leaseId, code, expires_in: Math.round(LEASE_TTL_MS / 1000) };
  }

  // POST /v2/join/result —— 租约结果回报（幂等）
  async joinResult(body) {
    await this._ready;
    const uid = cleanStr(body?.uid, 64);
    if (!uid) return { ok: false, status: 400, error: "missing_uid", message: "缺少 uid" };
    if (!this._checkRate(uid)) {
      return { ok: false, status: 429, error: "rate_limited", message: "请求过于频繁，请稍后再试" };
    }
    const auth = this._auth(uid, cleanStr(body?.token, 128));
    if (!auth.ok) return auth;

    const leaseId = cleanStr(body?.lease_id, 64);
    const result = String(body?.result ?? "");
    if (!leaseId || !result) {
      return { ok: false, status: 400, error: "bad_request", message: "缺少 lease_id 或 result" };
    }

    const now = Date.now();
    this._sweepExpired();

    const rows = this._sql(`SELECT id, code, status FROM leases WHERE id = ? AND uid = ?`, leaseId, uid);
    if (rows.length === 0) {
      return { ok: false, error: "lease_not_found", message: "租约不存在" };
    }
    const lease = rows[0];
    if (String(lease.status) !== "pending") {
      return { ok: true }; // 重复回报幂等忽略
    }
    const code = String(lease.code);

    if (result === "success") {
      // 保持占用，等快照确认（§5.2）
      this._exec(
        `UPDATE leases SET status = 'success', expires_at = ?, resolved_at = NULL WHERE id = ?`,
        now + SUCCESS_CONFIRM_MS, leaseId
      );
      this._event("result", uid, code, "success");
      return { ok: true };
    }

    if (result === "failed") {
      this._exec(`UPDATE leases SET status = 'failed', resolved_at = ? WHERE id = ?`, now, leaseId);
      // 失败即纠偏（§6.4）：join 失败本身即酷狗的直接观测
      const kind = cleanStr(body?.error_kind, 32);
      if (kind === "full" || kind === "invalid") {
        const teamRows = this._sql(`SELECT member_count FROM teams WHERE code = ?`, code);
        if (teamRows.length > 0) {
          const mc = Number(teamRows[0].member_count);
          const others = this._inflightCount(code, leaseId);
          const availExcluding = MEMBER_SLOTS - (mc - 1) - others;
          if (kind === "full" && availExcluding <= 0) {
            // 本租约占用的是最后一个名额却报 full → 采信为真：期内终态
            this._exec(
              `UPDATE teams SET member_count = ?, status = 'full', updated_at = ? WHERE code = ?`,
              TEAM_CAPACITY, now, code
            );
            this._event("correct", uid, code, `full_observed mc=${mc}->${TEAM_CAPACITY}`);
          } else {
            // 可疑 full / invalid → 冷却（invalid 无快照可纠偏，冷却更长）
            const until = now + (kind === "invalid" ? COOLDOWN_INVALID_MS : COOLDOWN_SUSPECT_FULL_MS);
            this._exec(`UPDATE teams SET fail_until = ? WHERE code = ?`, until, code);
            this._event("result", uid, code, `failed_${kind}_cooldown`);
          }
        }
      } else {
        this._event("result", uid, code, "failed_" + (kind || "unknown"));
      }
      return { ok: true };
    }

    return { ok: false, status: 400, error: "unknown_result", message: "未知 result: " + result };
  }

  // POST /v2/status —— 自查 + 聚合（只返回请求者自己的数据）
  async status(body) {
    await this._ready;
    const uid = cleanStr(body?.uid, 64);
    if (!uid) return { ok: false, status: 400, error: "missing_uid", message: "缺少 uid" };
    if (!this._checkRate(uid)) {
      return { ok: false, status: 429, error: "rate_limited", message: "请求过于频繁，请稍后再试" };
    }
    const auth = this._auth(uid, cleanStr(body?.token, 128));
    if (!auth.ok) return auth;

    const now = Date.now();
    this._sweepExpired();

    const createdRows = this._sql(
      `SELECT code, member_count, status, snapshot_at FROM teams WHERE captain_uid = ? ORDER BY created_at DESC LIMIT 1`,
      uid
    );
    let myTeam = null;
    if (createdRows.length > 0) {
      const r = createdRows[0];
      const st = String(r.status) === "full"
        ? "full"
        : (Number(r.snapshot_at) > now - FRESH_CUTOFF_MS ? "open" : "stale");
      myTeam = { code: String(r.code), member_count: Number(r.member_count), status: st };
    }

    const userRows = this._sql(`SELECT last_joined_code FROM users WHERE uid = ?`, uid);
    const lastJoined = userRows.length > 0 ? String(userRows[0].last_joined_code ?? "") : "";
    let joinedTeam = null;
    if (lastJoined) {
      const r = this._sql(`SELECT member_count FROM teams WHERE code = ?`, lastJoined);
      if (r.length > 0) {
        joinedTeam = { code: lastJoined, member_count: Number(r[0].member_count) };
      }
    }

    const leaseRows = this._sql(
      `SELECT id, code, status, expires_at FROM leases
       WHERE uid = ? AND status IN ('pending', 'success') AND expires_at > ?
       ORDER BY assigned_at DESC LIMIT 1`,
      uid, now
    );
    const activeLease = leaseRows.length > 0
      ? {
          lease_id: String(leaseRows[0].id),
          code: String(leaseRows[0].code),
          status: String(leaseRows[0].status),
          expires_in: Math.max(0, Math.round((Number(leaseRows[0].expires_at) - now) / 1000)),
        }
      : null;

    return { ok: true, my_team: myTeam, joined_team: joinedTeam, active_lease: activeLease, pool: this._poolStats() };
  }

  // POST /v2/health —— 运维观测（可选）：仅聚合，不含 uid/code 明细
  async health() {
    await this._ready;
    const now = Date.now();
    this._sweepExpired();
    const fresh = now - FRESH_CUTOFF_MS;
    const one = (q, ...p) => Number(this._sql(q, ...p)[0]?.c ?? 0);
    const leaseBy = (st) => one(`SELECT COUNT(*) AS c FROM leases WHERE status = ?`, st);
    const day = now - 24 * 3_600_000;
    return {
      ok: true,
      teams: {
        open: one(`SELECT COUNT(*) AS c FROM teams WHERE status = 'open' AND snapshot_at > ? AND fail_until < ?`, fresh, now),
        full: one(`SELECT COUNT(*) AS c FROM teams WHERE status = 'full'`),
        stale: one(`SELECT COUNT(*) AS c FROM teams WHERE status = 'open' AND snapshot_at <= ?`, fresh),
        cooldown: one(`SELECT COUNT(*) AS c FROM teams WHERE fail_until >= ?`, now),
      },
      leases: {
        pending: leaseBy("pending"),
        success: leaseBy("success"),
        confirmed: leaseBy("confirmed"),
        failed: leaseBy("failed"),
        expired: leaseBy("expired"),
      },
      users: {
        total: one(`SELECT COUNT(*) AS c FROM users`),
        waiting: one(`SELECT COUNT(*) AS c FROM users WHERE last_joined_code = '' AND last_seen_at > ?`, now - WAITING_ACTIVE_MS),
      },
      events_24h: {
        auth_fail: one(`SELECT COUNT(*) AS c FROM events WHERE kind = 'auth' AND ts > ?`, day),
        rate_limited: one(`SELECT COUNT(*) AS c FROM events WHERE kind = 'rate' AND ts > ?`, day),
        expired_leases: one(`SELECT COUNT(*) AS c FROM events WHERE kind = 'expire' AND ts > ?`, day),
        anomalies: one(`SELECT COUNT(*) AS c FROM events WHERE kind = 'error' AND ts > ?`, day),
      },
    };
  }

  // POST /v2/admin/data —— 站长全量观测（可选）：X-Admin-Token 门禁，只读明细。
  // 队伍明细含成员观测名单（userid/昵称/角色/奖励 vip_desc），仅此端点可见；users 不含 token。
  async adminData() {
    await this._ready;
    const now = Date.now();
    this._sweepExpired();
    const fresh = now - FRESH_CUTOFF_MS;
    const iso = (t) => (Number(t) > 0 ? new Date(Number(t)).toISOString() : null);

    const teamsTotal = Number(this._sql(`SELECT COUNT(*) AS c FROM teams`)[0]?.c ?? 0);
    const teams = this._sql(
      `SELECT t.code, t.captain_uid, t.member_count, t.members_json, t.status, t.snapshot_at, t.fail_until, t.created_at,
              (SELECT COUNT(*) FROM leases l
                WHERE l.code = t.code
                  AND (l.status = 'success' OR (l.status = 'pending' AND l.expires_at > ?))) AS inflight
       FROM teams t ORDER BY t.created_at DESC LIMIT 1000`,
      now
    ).map((r) => {
      let members = [];
      try {
        members = JSON.parse(String(r.members_json ?? "[]"));
      } catch {
        members = [];
      }
      return {
        code: String(r.code),
        captain_uid: String(r.captain_uid ?? ""),
        member_count: Number(r.member_count),
        members,
        status: String(r.status) === "full" ? "full" : (Number(r.snapshot_at) > fresh ? "open" : "stale"),
        snapshot_at_iso: iso(r.snapshot_at),
        fail_until_iso: Number(r.fail_until) > now ? iso(r.fail_until) : null,
        created_at_iso: iso(r.created_at),
        inflight: Number(r.inflight ?? 0),
      };
    });

    const usersTotal = Number(this._sql(`SELECT COUNT(*) AS c FROM users`)[0]?.c ?? 0);
    const users = this._sql(
      `SELECT uid, last_joined_code, created_at, last_seen_at FROM users ORDER BY last_seen_at DESC LIMIT 500`
    ).map((r) => ({
      uid: String(r.uid),
      last_joined_code: String(r.last_joined_code ?? "") || null,
      created_at_iso: iso(r.created_at),
      last_seen_at_iso: iso(r.last_seen_at),
    }));

    const leasesTotal = Number(this._sql(`SELECT COUNT(*) AS c FROM leases`)[0]?.c ?? 0);
    const leases = this._sql(
      `SELECT id, uid, code, status, assigned_at, expires_at, resolved_at FROM leases ORDER BY assigned_at DESC LIMIT 200`
    ).map((r) => ({
      id: String(r.id),
      uid: String(r.uid),
      code: String(r.code),
      status: String(r.status),
      assigned_at_iso: iso(r.assigned_at),
      expires_at_iso: iso(r.expires_at),
      resolved_at_iso: iso(r.resolved_at),
    }));

    const events = this._sql(
      `SELECT ts, kind, uid, code, detail FROM events ORDER BY id DESC LIMIT 100`
    ).map((r) => ({
      ts_iso: iso(r.ts),
      kind: String(r.kind),
      uid: r.uid ? String(r.uid) : null,
      code: r.code ? String(r.code) : null,
      detail: r.detail ? String(r.detail) : null,
    }));

    const summary = await this.health();
    delete summary.ok;

    return {
      ok: true,
      now_iso: new Date(now).toISOString(),
      totals: { teams: teamsTotal, users: usersTotal, leases: leasesTotal, events_shown: events.length },
      teams,
      users,
      leases,
      events,
      summary,
    };
  }

  // ---------- alarm：过期回收 + 每日清理 ----------

  async alarm() {
    try {
      this._sweepExpired();
      const cutoff = Date.now() - DATA_RETENTION_MS;
      this._exec(`DELETE FROM teams WHERE snapshot_at < ?`, cutoff);
      this._exec(`DELETE FROM users WHERE last_seen_at < ?`, cutoff);
      this._exec(`DELETE FROM leases WHERE assigned_at < ?`, cutoff);
      this._exec(`DELETE FROM events WHERE ts < ?`, cutoff);
      this._exec(`DELETE FROM rate_limit WHERE updated_at < ?`, Date.now() - 3_600_000);
      // 判空 deleteAll 以全部业务表为准（meta 不计，随 deleteAll 一并清除，下次访问重新初始化）
      const count = (t) => Number(this._sql(`SELECT COUNT(*) AS c FROM ${t}`)[0]?.c ?? 0);
      const total =
        count("users") + count("teams") + count("leases") + count("events") + count("rate_limit");
      if (total === 0) {
        await this.ctx.storage.deleteAll();
        return;
      }
      await this._scheduleNextAlarm();
    } catch (e) {
      console.error("alarm failed", e);
      try {
        await this.ctx.storage.setAlarm(Date.now() + 3_600_000);
      } catch {
        // ignore
      }
    }
  }

  async _scheduleNextAlarm() {
    const rows = this._sql(
      `SELECT MIN(expires_at) AS next FROM leases WHERE status IN ('pending', 'success')`
    );
    const nextLease = rows.length > 0 ? Number(rows[0].next ?? 0) : 0;
    const daily = Date.now() + CLEANUP_INTERVAL_MS;
    const next = nextLease > Date.now() ? Math.min(nextLease, daily) : daily;
    await this.ctx.storage.setAlarm(next);
  }
}

// ---------- Worker 入口 ----------

// 仅两个管理端点开放 CORS：供本地看板（admin.html）与运维面板跨域调用。
// 端点本身仍受 X-Admin-Token 门禁；不涉及 Cookie 凭证，ACAO=* 不引入额外风险。
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token, X-Plugin-Version",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (path === "/") return json({ name: "echo-team-pool", api: 2, ok: true });

    const isAdminPath = path === "/v2/health" || path === "/v2/admin/data";
    if (isAdminPath && request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== "POST") return err("method_not_allowed", "仅支持 POST", 405);

    // 版本门禁（保留 v1 机制）
    const minVersion = env.MIN_CLIENT_VERSION || "1.2.0";
    const v = request.headers.get("X-Plugin-Version") || "";
    if (!v) return err("version_missing", "缺少插件版本信息，请更新插件后重试", 403);
    if (!versionGte(v, minVersion)) {
      return err("version_mismatch", `插件版本过低（${v}），请更新至 ${minVersion} 或更高版本`, 403);
    }

    const cl = Number(request.headers.get("content-length") || 0);
    if (cl > MAX_BODY_SIZE) return err("payload_too_large", "请求体超过 4KB", 413);
    let body = {};
    if (cl > 0) {
      try {
        const text = await request.text();
        if (text.length > MAX_BODY_SIZE) return err("payload_too_large", "请求体超过 4KB", 413);
        body = text ? JSON.parse(text) : {};
      } catch {
        return err("bad_request", "请求体不是合法 JSON", 400);
      }
    }

    const periodId = String(body.period_id || url.searchParams.get("period_id") || "");
    if (!periodId) return err("missing_period_id", "缺少 period_id", 400);

    let result;
    try {
      const stub = env.PERIOD_POOL.getByName(periodId);
      switch (path) {
        case "/v2/snapshot":
          result = await stub.snapshot(body);
          break;
        case "/v2/join":
          result = await stub.join(body);
          break;
        case "/v2/join/result":
          result = await stub.joinResult(body);
          break;
        case "/v2/status":
          result = await stub.status(body);
          break;
        case "/v2/health": {
          // 管理端点：需 Admin Token；未配置或校验失败一律 404（不暴露端点存在性）。
          // 注意版本门禁在前——管理请求也需携带 X-Plugin-Version 头。
          const admin = String(env.ADMIN_TOKEN || "");
          if (!admin || request.headers.get("X-Admin-Token") !== admin) {
            return err("not_found", "路径不存在", 404);
          }
          result = await stub.health(body);
          break;
        }
        case "/v2/admin/data": {
          // 站长全量明细：同 health 的门禁策略（X-Admin-Token，失败 404），只读。
          const adminData = String(env.ADMIN_TOKEN || "");
          if (!adminData || request.headers.get("X-Admin-Token") !== adminData) {
            return err("not_found", "路径不存在", 404);
          }
          result = await stub.adminData(body);
          break;
        }
        default:
          // v1 端点（/pool/*）随 v2 全部下线
          return err("not_found", "路径不存在", 404);
      }
    } catch (e) {
      return err("internal_error", String(e?.message ?? e), 500);
    }

    const status = result && result.ok === false && result.status ? result.status : 200;
    if (result && result.status !== undefined) delete result.status;
    const response = json(result, status);
    if (isAdminPath) for (const [k, v] of Object.entries(CORS_HEADERS)) response.headers.set(k, v);
    return response;
  },
};
