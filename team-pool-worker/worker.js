var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// util.js
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
__name(json, "json");
function err(code, message, status = 400) {
  return json({ ok: false, error: code, message }, status);
}
__name(err, "err");
function parseVersion(v) {
  const p = String(v).split(".").map(Number);
  return [p[0] || 0, p[1] || 0, p[2] || 0];
}
__name(parseVersion, "parseVersion");
function versionGte(a, b) {
  const [a1, a2, a3] = parseVersion(a);
  const [b1, b2, b3] = parseVersion(b);
  if (a1 !== b1) return a1 > b1;
  if (a2 !== b2) return a2 > b2;
  return a3 >= b3;
}
__name(versionGte, "versionGte");

// period-pool.js
import { DurableObject } from "cloudflare:workers";
var PeriodPool = class extends DurableObject {
  static {
    __name(this, "PeriodPool");
  }
  constructor(ctx, env) {
    super(ctx, env);
    this._ready = ctx.blockConcurrencyWhile(async () => this._init());
  }
  async _init() {
    const tables = this.ctx.storage.sql.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='codes'"
    ).toArray();
    if (tables.length > 0) {
      const cols = this.ctx.storage.sql.exec("PRAGMA table_info(codes)").toArray();
      const hasUid = cols.some(c => c.name === 'uid');
      if (hasUid) {
        this.ctx.storage.sql.exec("DROP TABLE IF EXISTS codes");
      }
    }
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS codes (
        code TEXT NOT NULL,
        creator TEXT NOT NULL DEFAULT 'unknown',
        members TEXT NOT NULL DEFAULT '[]',
        remaining INTEGER NOT NULL DEFAULT 2,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (code)
      );
      CREATE TABLE IF NOT EXISTS rate_limit (
        uid TEXT PRIMARY KEY,
        last_ts INTEGER NOT NULL
      );
    `);
    const existing = await this.ctx.storage.getAlarm();
    if (existing === null) {
      await this.ctx.storage.setAlarm(Date.now() + 24 * 60 * 60 * 1e3);
    }
  }
  async register(code, creator, members, remaining) {
    await this._ready;
    try {
      const existing = this.ctx.storage.sql.exec(
        `SELECT code, members FROM codes WHERE code = ?`, code
      ).toArray();
      const now = Date.now();
      if (existing.length > 0) {
        const existingMembers = JSON.parse(existing[0].members ?? "[]");
        const merged = [...new Set([...existingMembers, ...members])];
        this.ctx.storage.sql.exec(
          `UPDATE codes SET members = ?, updated_at = ? WHERE code = ?`,
          JSON.stringify(merged), now, code
        );
      } else {
        this.ctx.storage.sql.exec(
          `INSERT INTO codes (code, creator, members, remaining, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          code, creator, JSON.stringify(members), remaining, now, now
        );
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "internal", message: String(e?.message) };
    }
  }
  async join(uid) {
    await this._ready;
    if (!this._checkRate(uid)) return { ok: false, error: "rate_limited" };
    try {
      const cur = this.ctx.storage.sql.exec(
        `SELECT code FROM codes
         WHERE remaining > 0
           AND creator <> ?
           AND NOT EXISTS (SELECT 1 FROM json_each(members) WHERE value = ?)
         ORDER BY created_at ASC LIMIT 1`,
        uid, uid
      ).toArray();
      if (cur.length === 0) return { ok: true, code: null };
      const code = cur[0].code;
      const result = this.ctx.storage.sql.exec(
        `UPDATE codes SET remaining = remaining - 1, updated_at = ?
         WHERE code = ? AND remaining > 0`,
        Date.now(), code
      );
      if (result.meta?.changes === 0) return { ok: true, code: null };
      return { ok: true, code };
    } catch (e) {
      return { ok: false, error: "internal", message: String(e?.message) };
    }
  }
  async reportResult(code, status) {
    await this._ready;
    if (!this._checkRate(code)) return { ok: false, error: "rate_limited" };
    try {
      if (status === "joined") {
        // noop: remaining already decremented on dispatch
      } else if (status === "failed") {
        this.ctx.storage.sql.exec(
          `UPDATE codes SET remaining = remaining + 1, updated_at = ? WHERE code = ?`,
          Date.now(), code
        );
      } else {
        return { ok: false, error: "unknown_status" };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "internal", message: String(e?.message) };
    }
  }
  async syncCode(code, members, remaining) {
    await this._ready;
    try {
      const rows = this.ctx.storage.sql.exec(
        `SELECT members FROM codes WHERE code = ?`, code
      ).toArray();
      if (rows.length === 0) return { ok: false, error: "code_not_found" };
      const existingMembers = JSON.parse(rows[0].members ?? "[]");
      const merged = [...new Set([...existingMembers, ...members])];
      this.ctx.storage.sql.exec(
        `UPDATE codes SET members = ?, remaining = ?, updated_at = ? WHERE code = ?`,
        JSON.stringify(merged), remaining, Date.now(), code
      );
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "internal", message: String(e?.message) };
    }
  }
  async stats() {
    await this._ready;
    try {
      const rows = this.ctx.storage.sql.exec(
        `SELECT code, creator, members, remaining, created_at, updated_at FROM codes`
      ).toArray();
      return { ok: true, count: rows.length, codes: rows };
    } catch (e) {
      return { ok: false, error: "internal", message: String(e?.message) };
    }
  }
  _checkRate(uid) {
    const now = Date.now();
    const cur = this.ctx.storage.sql.exec(
      `SELECT last_ts FROM rate_limit WHERE uid = ?`,
      uid
    ).toArray();
    if (cur.length > 0 && now - Number(cur[0].last_ts) < 1e3) return false;
    this.ctx.storage.sql.exec(
      `INSERT INTO rate_limit (uid, last_ts) VALUES (?, ?)
       ON CONFLICT(uid) DO UPDATE SET last_ts = excluded.last_ts`,
      uid,
      now
    );
    return true;
  }
  async alarm() {
    try {
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1e3;
      this.ctx.storage.sql.exec(`DELETE FROM codes WHERE updated_at < ?`, cutoff);
      this.ctx.storage.sql.exec(`DELETE FROM rate_limit WHERE last_ts < ?`, Date.now() - 6e4);
      const codesCount = Number(this.ctx.storage.sql.exec(`SELECT COUNT(*) as c FROM codes`).toArray()[0]?.c ?? 0);
      const rateCount = Number(this.ctx.storage.sql.exec(`SELECT COUNT(*) as c FROM rate_limit`).toArray()[0]?.c ?? 0);
      if (codesCount === 0 && rateCount === 0) {
        await this.ctx.storage.deleteAll();
        return;
      }
      await this.ctx.storage.setAlarm(Date.now() + 24 * 60 * 60 * 1e3);
    } catch (e) {
      console.error("alarm failed", e);
      try {
        await this.ctx.storage.setAlarm(Date.now() + 60 * 60 * 1e3);
      } catch {
      }
    }
  }
};

// worker.js
var MIN_CLIENT_VERSION = "1.0.3";
var MAX_BODY_SIZE = 4096;
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (path === "/") return json({ name: "echo-team-pool", ok: true });
    const v = request.headers.get("X-Plugin-Version") || "";
    if (!v) return err("version_missing", "\u7F3A\u5C11\u63D2\u4EF6\u7248\u672C\u4FE1\u606F\uFF0C\u8BF7\u66F4\u65B0\u63D2\u4EF6\u540E\u91CD\u8BD5", 403);
    if (!versionGte(v, MIN_CLIENT_VERSION)) {
      return err("version_mismatch", `\u63D2\u4EF6\u7248\u672C\u8FC7\u4F4E\uFF08${v}\uFF09\uFF0C\u8BF7\u66F4\u65B0\u81F3 ${MIN_CLIENT_VERSION} \u6216\u66F4\u9AD8\u7248\u672C`, 403);
    }
    const cl = Number(request.headers.get("content-length") || 0);
    if (cl > MAX_BODY_SIZE) return err("payload_too_large", "\u8BF7\u6C42\u4F53\u8D85\u8FC7 4KB", 413);
    let body = {};
    if (request.method === "POST" && cl > 0) {
      try {
        const text = await request.text();
        if (text.length > MAX_BODY_SIZE) return err("payload_too_large", "\u8BF7\u6C42\u4F53\u8D85\u8FC7 4KB", 413);
        body = text ? JSON.parse(text) : {};
      } catch {
        return err("bad_request", "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON", 400);
      }
    }
    const periodId = String(body.period_id || url.searchParams.get("period_id") || "");
    if (!periodId) return err("missing_period_id", "\u7F3A\u5C11 period_id", 400);
    let result;
    try {
      const stub = env.PERIOD_POOL.getByName(periodId);
      switch (path) {
        case "/pool/register":
          result = await stub.register(body.code, body.creator ?? "unknown", body.members ?? [], Number(body.remaining ?? 2));
          break;
        case "/pool/join":
          result = await stub.join(body.uid);
          break;
        case "/pool/report":
          result = await stub.reportResult(body.code, body.status);
          break;
        case "/pool/sync":
          result = await stub.syncCode(body.code, body.members ?? [], Number(body.remaining ?? 2));
          break;
        case "/pool/stats":
          result = await stub.stats();
          break;
        default:
          return err("not_found", "\u8DEF\u5F84\u4E0D\u5B58\u5728", 404);
      }
    } catch (e) {
      return err("internal_error", String(e?.message ?? e), 500);
    }
    return json(result);
  }
};
export {
  PeriodPool,
  worker_default as default
};
//# sourceMappingURL=worker.js.map
