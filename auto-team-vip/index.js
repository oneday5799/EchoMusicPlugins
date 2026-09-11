// auto-team-vip v1.2.0 —— v2 快照/租约协议
// 架构设计：docs/auto-team-vip-redesign.md（§4 §7）
//
// 职责边界：
//   - 酷狗服务器：队伍真实构成的唯一权威（本插件是其唯一可靠观察者 + 组队操作执行器）。
//   - 码池服务器：存储快照、计算名额、以租约方式下发组队码。
//   - 本插件：①GUARD → ②MYINFO → ③SNAPSHOT → ④DECIDE → ⑤ASSIGN → ⑥JOIN_KUGOU → ⑦RESULT → ⑧VERIFY。

const TARGET_MEMBERS = 3; // 1 队长 + 2 队员
const POOL_URL = "https://echo-team-pool.oneday.vip";
const POOL_RETRY_DELAY_MS = 500;      // 瞬时故障（网络/5xx）的一次补射间隔
const RETRY_MAX = 3;                  // 当轮 join 重试上限（含首次）
const RETRY_DELAY_MS = 2000;          // 重试间隔
const MIN_RUN_INTERVAL_MS = 10_000;   // 触发合并窗口
const HEARTBEAT_TICK_MS = 60_000;     // 心跳巡检周期
const SNAPSHOT_INTERVAL_MS = 5 * 60_000;    // 保活快照间隔
const FULLFLOW_INTERVAL_MS = 10 * 60_000;   // 等待新码的完整流程间隔
const POOL_BACKOFF_STEPS_MS = [5, 15, 30].map((m) => m * 60_000); // 码池不可用退避
const REFRESH_THROTTLE_MS = 3000;
const AUTO_RUN_DELAY_MS = 3000;
const LOGIN_RUN_DELAY_MS = 2000;
const INPUT_STYLE = "flex: 1; min-width: 0; height: 32px; padding: 0 8px; border-radius: 6px; border: 1px solid var(--border-subtle, rgba(255,255,255,0.12)); background: var(--control-muted-bg, rgba(255,255,255,0.06)); color: var(--color-text-main); font-size: 13px; outline: none;";
let PLUGIN_VERSION = "0.0.0";

const _DEBUG = false;
function dlog(...args) {
  if (_DEBUG) console.log("[auto-team-vip]", ...args);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- 状态 ----------

let uiState = null;
let runChain = null;
let lastRunAt = 0;
let lastSnapshotAt = 0;
let lastFullAt = 0;
let heartbeatTimer = null;
let versionMismatchReported = false;

let dialogOpen = null;
let cssDispose = null;
let teleportDispose = null;
let moreMenuDispose = null;

// 码池侧状态：退避 + 401 停用（按期次）
const poolBackoff = { step: 0, nextAttemptAt: 0 };
let disabledPeriods = new Set();

function poolDown() {
  poolBackoff.nextAttemptAt =
    Date.now() + POOL_BACKOFF_STEPS_MS[Math.min(poolBackoff.step, POOL_BACKOFF_STEPS_MS.length - 1)];
  poolBackoff.step += 1;
  dlog("[码池退避]", Math.round((poolBackoff.nextAttemptAt - Date.now()) / 1000) + "s");
}

function poolUp() {
  poolBackoff.step = 0;
  poolBackoff.nextAttemptAt = 0;
}

function poolAvailable() {
  return Date.now() >= poolBackoff.nextAttemptAt;
}

// ---------- 通用 ----------

function pick(obj, keys, fallback) {
  if (!obj || typeof obj !== "object") return fallback;
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

function setLastError(msg, code, detail) {
  if (!uiState) return;
  uiState.lastMessage = msg;
  uiState.lastError = code ? { code, message: msg, detail: detail || {} } : null;
}

function applyTeamInfoToState(info) {
  if (!uiState || !info?.ok) return;
  uiState.myCode = info.created?.code || "";
  uiState.myMemberCount = info.created?.memberCount || 0;
  uiState.myVipDesc = info.created?.vipDesc || "";
  uiState.joinedCode = info.joined?.code || "";
  uiState.joinedMemberCount = info.joined?.memberCount || 0;
  uiState.joinedVipDesc = info.joined?.vipDesc || "";
  uiState.joined = Boolean(info.joined?.code);
}

async function updateSettings(c, patch) {
  const prev = await c.storage.get("settings");
  const base = prev && typeof prev === "object" ? prev : {};
  await c.storage.set("settings", { ...base, ...patch });
}

async function copyToClipboard(c, text) {
  try {
    await navigator.clipboard.writeText(text);
    c.toast.success("组队码已复制");
  } catch {
    c.toast.warning("复制失败");
  }
}

async function copyErrorDetail(c) {
  const err = uiState?.lastError;
  if (!err) return;
  const lines = [
    "=== EchoMusic 自动组队错误详情 ===",
    "时间: " + new Date().toLocaleString(),
    "错误码: " + err.code,
    "描述: " + err.message,
  ];
  if (err.detail) {
    for (const [k, v] of Object.entries(err.detail)) {
      if (v !== undefined && v !== null && v !== "") {
        lines.push(k + ": " + (typeof v === "object" ? JSON.stringify(v) : v));
      }
    }
  }
  try {
    await navigator.clipboard.writeText(lines.join("\n"));
    c.toast.success("错误详情已复制");
  } catch {
    c.toast.warning("复制失败");
  }
}

// ---------- 酷狗侧（观察者 + 执行器） ----------

function readAuth(c) {
  const user = c.pinia?.state?.value?.user;
  const device = c.pinia?.state?.value?.device;
  const u = user?.info;
  const d = device?.info;
  if (!u?.token || !u?.userid) return null;
  return {
    token: u.token,
    userid: u.userid,
    t1: pick(u, ["t1"], ""),
    dfid: pick(d, ["dfid"], ""),
    mid: pick(d, ["mid"], ""),
    uuid: pick(d, ["uuid"], ""),
    guid: pick(d, ["guid"], ""),
    serverDev: pick(d, ["serverDev"], ""),
    mac: pick(d, ["mac"], ""),
  };
}

function buildAuthHeader(auth) {
  const parts = [];
  if (auth.token) parts.push(`token=${auth.token}`);
  if (auth.userid) parts.push(`userid=${auth.userid}`);
  if (auth.t1) parts.push(`t1=${auth.t1}`);
  if (auth.dfid) parts.push(`dfid=${auth.dfid}`);
  if (auth.mid) parts.push(`KUGOU_API_MID=${auth.mid}`);
  if (auth.uuid) parts.push(`uuid=${auth.uuid}`);
  if (auth.guid) parts.push(`KUGOU_API_GUID=${auth.guid}`);
  if (auth.serverDev) parts.push(`KUGOU_API_DEV=${auth.serverDev}`);
  if (auth.mac) parts.push(`KUGOU_API_MAC=${auth.mac}`);
  return parts.join(";");
}

async function teamRequest(c, method, url, params, data) {
  const auth = readAuth(c);
  if (!auth) return { ok: false, error: "not_logged_in" };
  const cfg = {
    method,
    url,
    params,
    headers: { Authorization: buildAuthHeader(auth) },
  };
  if (data !== undefined && data !== null) cfg.data = data;

  dlog("[酷狗请求]", method, url, "params:", params, "data:", data ?? "无");

  let res;
  try {
    res = await c.electron.api.request(cfg);
  } catch (e) {
    dlog("[酷狗异常]", method, url, String(e?.message || e));
    return { ok: false, error: String(e?.message || e) };
  }

  dlog("[酷狗响应]", method, url, "status:", res?.status);

  const body = res?.body;
  const eventId = pick(body, ["ssaCode", "eventId"], "") || pick(res?.headers, ["ssa-code", "SSA-CODE"], "");
  const errorCode = Number(pick(body, ["error_code", "errcode"], 0));
  const failed = Number(pick(body, ["status"], 1)) === 0;
  if (eventId && (errorCode === 20028 || failed)) {
    dlog("[酷狗验证]", method, url, "eventId:", eventId, "errorCode:", errorCode);
    try {
      const verified = await c.kugouVerification.request(eventId);
      dlog("[酷狗验证结果]", method, url, verified);
      if (verified?.ok) {
        dlog("[酷狗重试]", method, url);
        res = await c.electron.api.request(cfg);
        dlog("[酷狗重试响应]", method, url, "status:", res?.status);
      }
    } catch (e) {
      console.warn("[auto-team-vip] verification failed:", e);
    }
  }

  return { ok: true, status: res?.status, body: res?.body };
}

function normalizePeriod(body) {
  const d = body?.data ?? body ?? {};
  const current = d?.current_period_info ?? d?.period_info ?? d;
  const total = Number(pick(current, ["team_member_count", "member_count", "team_num", "target_member", "limit", "need_count"], TARGET_MEMBERS));
  const statusRaw = Number(pick(current, ["status"], -1));
  return {
    periodId: String(pick(current, ["id", "period_id", "periodId", "activity_id"], "")),
    periodName: String(pick(current, ["name"], "")),
    startTime: String(pick(current, ["start_time"], "")),
    endTime: String(pick(current, ["end_time"], "")),
    active: statusRaw === 0,
    totalMembers: total >= TARGET_MEMBERS ? total : TARGET_MEMBERS,
    raw: body,
  };
}

// 两维度真实状态：我创建的队伍（队长身份）+ 我加入的队伍（队员身份，至多 1 支）
function normalizeTeamInfo(body) {
  const d = body?.data ?? body ?? {};
  const toMembers = (list) => {
    if (!Array.isArray(list)) return [];
    const out = [];
    for (const m of list.slice(0, TARGET_MEMBERS)) {
      const userid = String(pick(m, ["userid", "user_id"], ""));
      if (!userid) continue;
      out.push({
        userid,
        nick: String(pick(m, ["nick_name", "nickname", "nick"], "")).slice(0, 48),
        role: Number(pick(m, ["role"], 2)) === 1 ? 1 : 2,
        reward: String(pick(m, ["vip_desc", "reward_desc"], "")).slice(0, 48),
      });
    }
    return out;
  };
  const toTeam = (t) => {
    if (!t) return null;
    const code = String(pick(t, ["team_code", "code", "teamCode"], ""));
    if (!code) return null;
    const listLen = Array.isArray(t.member_list) ? t.member_list.length : 0;
    const mc = listLen > 0 ? listLen : Number(pick(t, ["member_count", "count", "members_count", "current_count"], 1));
    return {
      code,
      memberCount: Math.min(TARGET_MEMBERS, Math.max(1, Math.round(Number(mc) || 1))),
      captain: String(pick(t, ["captain"], "") || ""),
      members: toMembers(t.member_list),
      vipDesc: String(pick(t, ["vip_desc"], "")),
    };
  };
  const createList = Array.isArray(d?.my_create_team_list) ? d.my_create_team_list : [];
  const joinList = Array.isArray(d?.my_join_team_list) ? d.my_join_team_list : [];
  return { created: toTeam(createList[0]), joined: toTeam(joinList[0]), raw: d };
}

// 错误分类（2026-09-12 修订）：仅显式证据才归类为队伍终态（full/already_joined/invalid），
// 其余一律 transient——客户端侧抖动不给队伍泼脏水；服务端仅对 full/invalid 纠偏/冷却。
function classifyJoinError(body) {
  const d = body?.data ?? body ?? {};
  const errorCode = Number(pick(d, ["error_code", "errcode", "code"], 0));
  const errorMsg = String(pick(d, ["msg", "message", "error"], ""));
  const msg = errorMsg.toLowerCase();

  let kind = "transient";
  if (errorCode === 20006 || msg.includes("满") || msg.includes("full")) kind = "full";
  else if (msg.includes("已加入") || msg.includes("已经") || msg.includes("已参") || msg.includes("joined"))
    kind = "already_joined";
  else if (msg.includes("不存在") || msg.includes("无效") || msg.includes("已解散") || msg.includes("组队码错误"))
    kind = "invalid"; // 码无效/队不存在：无快照可纠偏，服务端 24h 冷却（§11.2）
  return { kind, errorCode, errorMsg };
}

function parseJoinResponse(r) {
  const bodyStatus = Number(pick(r.body, ["status"], 1));
  const errorCode = Number(pick(r.body, ["error_code", "errcode"], 0));
  const errorMsg = String(pick(r.body, ["error_msg", "msg", "message"], ""));
  const httpOk = r.ok && Number(r.status) < 400;
  const bizOk = bodyStatus === 1 && errorCode === 0;
  return { httpOk, bizOk, errorCode, errorMsg };
}

async function getPeriodInfo(c) {
  const r = await teamRequest(c, "GET", "/team/period/info");
  if (!r.ok) return { ok: false, error: r.error || "请求失败" };
  const p = normalizePeriod(r.body);
  if (!p.periodId) return { ok: false, error: "未找到活动期次" };
  return { ok: true, ...p };
}

async function getMyTeamInfo(c, periodId) {
  const r = await teamRequest(c, "GET", "/team/my/info", { period_id: periodId });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, ...normalizeTeamInfo(r.body) };
}

async function createTeam(c, periodId) {
  return teamRequest(c, "POST", "/team/my", { period_id: periodId });
}

async function joinTeam(c, code) {
  return teamRequest(c, "POST", "/team/join", { team_code: code });
}

// ---------- 码池侧（快照 / 租约） ----------

async function getPoolTokens(c) {
  const tokens = await c.storage.get("poolTokens");
  return tokens && typeof tokens === "object" ? tokens : {};
}

async function setPoolToken(c, uid, token) {
  const all = await getPoolTokens(c);
  all[uid] = token;
  await c.storage.set("poolTokens", all);
}

async function isPoolDisabled(c, periodId) {
  if (disabledPeriods.has(periodId)) return true;
  const map = await c.storage.get("poolAuthDisabled");
  return Boolean(map && typeof map === "object" && map[periodId]);
}

async function disablePool(c, periodId) {
  disabledPeriods.add(periodId);
  try {
    const map = (await c.storage.get("poolAuthDisabled")) || {};
    map[periodId] = true;
    await c.storage.set("poolAuthDisabled", map);
  } catch {
    // 存储失败不影响本轮判定（内存 Set 已生效）
  }
}

async function poolRequestOnce(c, path, payload) {
  const base = POOL_URL.replace(/\/+$/, "");
  try {
    const res = await c.net.request({
      url: base + path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Plugin-Version": PLUGIN_VERSION,
      },
      body: payload,
      responseType: "json",
    });
    dlog("poolRequest:", path, res.status);
    if (res.status === 403 && (res.data?.error === "version_mismatch" || res.data?.error === "version_missing")) {
      const msg = res.data?.message || "插件版本过低，请更新";
      console.warn("[auto-team-vip] version mismatch:", msg);
      if (!versionMismatchReported && uiState) {
        versionMismatchReported = true;
        setLastError(msg, res.data?.error, { pluginVersion: PLUGIN_VERSION });
        c.toast.warning(msg);
      }
      return { ok: false, status: 403, data: res.data, error: msg, needUpdate: true };
    }
    return { ok: res.status >= 200 && res.status < 300, status: res.status, data: res.data };
  } catch (e) {
    console.warn("[auto-team-vip] poolRequest error:", e);
    const msg = String(e?.message || e);
    const hint = msg.includes("403") ? "（Cloudflare 安全挑战，请降低 Security Level 或使用 workers.dev 域名）" : "";
    return { ok: false, status: 0, data: null, error: msg + hint };
  }
}

async function poolRequest(c, path, payload) {
  const r = await poolRequestOnce(c, path, payload);
  if (!r.ok && (r.status === 0 || r.status >= 500)) {
    await sleep(POOL_RETRY_DELAY_MS);
    return poolRequestOnce(c, path, payload);
  }
  return r;
}

async function poolJoin(c, periodId, uid, excludeCodes = []) {
  const tokens = await getPoolTokens(c);
  return poolRequest(c, "/v2/join", {
    period_id: periodId,
    uid,
    token: tokens[uid] || "",
    // 本轮流程内已失败的队不再命中（服务端仅对本次选队生效，不落库）
    exclude_codes: Array.isArray(excludeCodes) ? excludeCodes.slice(0, 3).map(String) : [],
  });
}

async function poolResult(c, periodId, uid, leaseId, result, errorKind) {
  const tokens = await getPoolTokens(c);
  return poolRequest(c, "/v2/join/result", {
    period_id: periodId,
    uid,
    token: tokens[uid] || "",
    lease_id: leaseId,
    result,
    error_kind: errorKind || "",
  });
}

// 上报快照；返回 "ok" | "disabled" | "down"
async function doSnapshot(c, periodId, uid, teamInfo) {
  if (await isPoolDisabled(c, periodId)) {
    if (uiState) uiState.poolDisabled = true;
    return "disabled";
  }
  if (!poolAvailable()) return "down";

  const tokens = await getPoolTokens(c);
  const payload = {
    period_id: periodId,
    uid,
    token: tokens[uid] || "",
    created: teamInfo.created
      ? {
          code: teamInfo.created.code,
          member_count: teamInfo.created.memberCount,
          captain: teamInfo.created.captain || uid,
          members: teamInfo.created.members,
        }
      : null,
    joined: teamInfo.joined
      ? {
          code: teamInfo.joined.code,
          member_count: teamInfo.joined.memberCount,
          captain: teamInfo.joined.captain || "",
          members: teamInfo.joined.members,
        }
      : null,
  };

  const r = await poolRequest(c, "/v2/snapshot", payload);
  if (r.ok) {
    poolUp();
    // 服务端签发/轮换的 token 及时入库（新期次自动重签）
    if (r.data?.token) await setPoolToken(c, uid, r.data.token);
    if (r.data?.pool && uiState) {
      uiState.poolOpen = Number(r.data.pool.open_teams ?? 0);
      uiState.poolWaiting = Number(r.data.pool.waiting ?? 0);
      uiState.poolDisabled = false;
    }
    return "ok";
  }
  if (r.status === 401) {
    await disablePool(c, periodId);
    if (uiState) uiState.poolDisabled = true;
    setLastError("身份校验失败，本期码池功能停用（下期自动恢复）", "pool_unauthorized", { periodId, uid });
    return "disabled";
  }
  if (r.needUpdate) return "disabled";
  poolDown();
  return "down";
}

// ---------- 单 Runner 状态机（§7.1） ----------

// ①→⑧ 完整流程；snapshotOnly 时仅执行 ①②③（心跳保活）。
// 必须内部捕获全部异常、永不向链上抛出——否则 runChain 变 rejected 后所有触发点静默失效。
async function runFullFlow(c, reason, opts = {}) {
  const snapshotOnly = Boolean(opts.snapshotOnly);
  if (!opts.force && Date.now() - lastRunAt < MIN_RUN_INTERVAL_MS) return;
  lastRunAt = Date.now();
  if (!snapshotOnly) lastFullAt = lastRunAt;
  try {
    const auth = readAuth(c);
    if (!auth) {
      setLastError("未登录 EchoMusic，请先登录", "not_logged_in");
      return;
    }
    const uid = String(auth.userid);

    // ① GUARD：期次信息；非进行中直接终止（不建队、不请求码池）
    const period = await getPeriodInfo(c);
    if (!period.ok) {
      setLastError(period.error || "获取活动信息失败", "no_period", { endpoint: "/team/period/info" });
      return;
    }
    const periodId = String(period.periodId);
    const lastPeriodId = await c.storage.get("lastPeriodId");
    if (lastPeriodId && lastPeriodId !== periodId) {
      // 期次切换：清空本地缓存的码与 joined 状态（token 为账号级，由新期次 DO 重签覆盖）
      dlog("[期次切换]", lastPeriodId, "->", periodId);
      if (uiState) {
        uiState.myCode = "";
        uiState.myMemberCount = 0;
        uiState.joinedCode = "";
        uiState.joinedMemberCount = 0;
        uiState.joined = false;
      }
    }
    await c.storage.set("lastPeriodId", periodId);
    if (uiState) {
      uiState.periodId = periodId;
      uiState.periodName = period.periodName;
      uiState.startTime = period.startTime;
      uiState.endTime = period.endTime;
      uiState.periodActive = period.active;
      uiState.targetMembers = period.totalMembers;
    }
    if (!period.active) {
      setLastError("本期活动未开启", "period_inactive");
      return;
    }

    // ② MYINFO：无自己创建的队伍 → 创建 → 重查
    let myInfo = await getMyTeamInfo(c, periodId);
    if (myInfo.ok && !myInfo.created) {
      await createTeam(c, periodId);
      myInfo = await getMyTeamInfo(c, periodId);
    }
    if (!myInfo.ok) {
      setLastError("获取队伍信息失败", "myinfo_failed");
      return;
    }
    applyTeamInfoToState(myInfo);

    // ③ SNAPSHOT：两维度真实状态整体上报
    const snap = await doSnapshot(c, periodId, uid, myInfo);
    lastSnapshotAt = Date.now();
    if (snapshotOnly || snap !== "ok") return;

    // ④ DECIDE：入队即终态（酷狗不支持退队），本轮结束进入心跳模式
    if (myInfo.joined) return;

    // ⑤→⑦ ASSIGN / JOIN_KUGOU / RESULT（当轮重试 ≤ RETRY_MAX）
    const excludedCodes = new Set(); // 本轮流程内失败过的队（network 除外），重试时请求服务端避开
    for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
      const joinRes = await poolJoin(c, periodId, uid, [...excludedCodes]);
      if (!joinRes.ok) {
        if (joinRes.status === 401) {
          await disablePool(c, periodId);
          if (uiState) uiState.poolDisabled = true;
          setLastError("身份校验失败，本期码池功能停用（下期自动恢复）", "pool_unauthorized", { periodId, uid });
        } else if (!joinRes.needUpdate) {
          poolDown();
          setLastError("码池暂时不可用，稍后自动重试", "pool_down", { periodId, uid, error: joinRes.error });
        }
        return;
      }
      const d = joinRes.data || {};
      if (d.reason === "already_joined") {
        // 服务端判定已在队中：校正本地状态 + 立即快照，不执行酷狗 join
        if (d.code && uiState) {
          uiState.joinedCode = String(d.code);
          uiState.joined = true;
        }
        const verify = await getMyTeamInfo(c, periodId);
        if (verify.ok) applyTeamInfoToState(verify);
        await doSnapshot(c, periodId, uid, verify.ok ? verify : myInfo);
        return;
      }
      if (d.reason === "pool_empty" || !d.code) {
        setLastError("暂无可加入的队伍，可手动组队或耐心等待", "pool_empty", { periodId, uid });
        return;
      }

      const leaseId = String(d.lease_id || "");
      const code = String(d.code);
      const joinKugou = await joinTeam(c, code);
      if (!joinKugou.ok) {
        // 酷狗请求本身失败（网络/未登录）：与队伍状态无关，不参与服务端纠偏
        await poolResult(c, periodId, uid, leaseId, "failed", "network");
        if (attempt < RETRY_MAX) await sleep(RETRY_DELAY_MS);
        continue;
      }
      const parsed = parseJoinResponse(joinKugou);
      if (parsed.httpOk && parsed.bizOk) {
        await poolResult(c, periodId, uid, leaseId, "success", "");
        // ⑧ VERIFY + SNAPSHOT：把成队后的真实人数报给码池
        const verify = await getMyTeamInfo(c, periodId);
        if (verify.ok) applyTeamInfoToState(verify);
        await doSnapshot(c, periodId, uid, verify.ok ? verify : myInfo);
        return;
      }
      const { kind, errorCode, errorMsg } = classifyJoinError(joinKugou.body);
      await poolResult(c, periodId, uid, leaseId, "failed", kind);
      if (kind === "already_joined") {
        // 已在队中（如上轮租约迟到成功）：立即快照纠偏，不重试
        const verify = await getMyTeamInfo(c, periodId);
        if (verify.ok) applyTeamInfoToState(verify);
        await doSnapshot(c, periodId, uid, verify.ok ? verify : myInfo);
        return;
      }
      excludedCodes.add(code); // transient/full/invalid：重试换队（full/invalid 另有服务端纠偏/冷却）
      dlog("[重试]", code, kind, attempt);
      if (attempt < RETRY_MAX) await sleep(RETRY_DELAY_MS);
    }
    setLastError("加入队伍未成功，稍后自动重试", "join_exhausted", { periodId, uid });
  } catch (e) {
    console.warn("[auto-team-vip] runFullFlow error:", e?.message || e);
  }
}

// 全流程互斥：任何触发点（启动/登录/开关/刷新/心跳）都汇入同一个串行链
function requestRun(c, reason, opts = {}) {
  if (!runChain) runChain = Promise.resolve();
  runChain = runChain
    .then(() => runFullFlow(c, reason, opts))
    .catch((e) => console.warn("[auto-team-vip] run chain error:", e?.message || e));
  return runChain;
}

// ---------- Dialog ----------

const DIALOG_CSS = `
.atv-dialog-mask {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.35);
  display: flex; align-items: center; justify-content: center;
  animation: atv-fade-in 0.15s ease;
}
.atv-dialog {
  background: var(--color-bg-elevated, #1e1e2e);
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.45);
  width: 400px; max-width: calc(100vw - 48px);
  max-height: calc(100vh - 80px);
  overflow: auto;
  padding: 20px;
  animation: atv-scale-in 0.18s cubic-bezier(0.34,1.56,0.64,1);
  position: relative;
}
.atv-dialog-header {
  display: flex; align-items: center;
  padding-right: 36px;
  margin-bottom: 14px;
}
.atv-dialog-title {
  font-size: 15px; font-weight: 700;
  color: var(--color-text-main);
}
.atv-refresh-btn {
  cursor: pointer; font-size: 13px; margin-left: 8px;
  padding: 2px 8px; border-radius: 4px;
  background: rgba(255,255,255,0.1);
  user-select: none; opacity: 0.6;
  transition: opacity 0.15s, background 0.15s;
}
.atv-refresh-btn:hover { opacity: 1; background: rgba(255,255,255,0.18); }
.atv-refresh-btn:active { opacity: 0.8; }
.atv-dialog-close {
  position: absolute; top: 16px; right: 16px;
  width: 32px; height: 32px; min-width: 0; padding: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: transparent; border: none;
  color: var(--color-text-main); opacity: 0.5;
  cursor: pointer; z-index: 10;
  transition: all 0.15s; font-size: 16px; line-height: 1; user-select: none;
}
.atv-dialog-close:hover {
  opacity: 1;
  background: var(--control-hover-bg, rgba(0,0,0,0.06));
}
@keyframes atv-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes atv-scale-in { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
`;

function openDialog() {
  if (!dialogOpen || dialogOpen.value) return;
  versionMismatchReported = false;
  dialogOpen.value = true;
}

function closeDialog() {
  if (dialogOpen) dialogOpen.value = false;
}

// --- activate / deactivate ---

export async function activate(_ctx) {
  PLUGIN_VERSION = _ctx.manifest.version || "0.0.0";

  uiState = _ctx.vue.reactive({
    lastMessage: "",
    lastError: null,
    periodId: "",
    periodName: "",
    startTime: "",
    endTime: "",
    periodActive: false,
    myCode: "",
    myMemberCount: 0,
    myVipDesc: "",
    targetMembers: TARGET_MEMBERS,
    joined: false,
    joinedCode: "",
    joinedMemberCount: 0,
    joinedVipDesc: "",
    poolOpen: -1,
    poolWaiting: -1,
    poolDisabled: false,
  });

  dialogOpen = _ctx.vue.ref(false);
  const refreshing = _ctx.vue.ref(false);
  const autoTeam = _ctx.vue.ref(false);
  let lastRefreshTime = 0;

  _ctx.storage.get("settings").then((saved) => {
    if (saved && typeof saved === "object") {
      autoTeam.value = pick(saved, ["autoEnabled"], false) !== false;
    }
  });
  _ctx.storage.get("poolAuthDisabled").then((map) => {
    if (map && typeof map === "object") disabledPeriods = new Set(Object.keys(map));
  });

  const { h, ref, defineComponent, defineAsyncComponent } = _ctx.vue;
  const Button = defineAsyncComponent(_ctx.ui.components.Button);

  const onRefresh = async () => {
    if (refreshing.value) return;
    const now = Date.now();
    if (now - lastRefreshTime < REFRESH_THROTTLE_MS) {
      _ctx.toast.info("刷新过于频繁，请稍后再试");
      return;
    }
    lastRefreshTime = now;
    refreshing.value = true;
    try {
      await requestRun(_ctx, "manual", { force: true });
      _ctx.toast.success("已刷新");
    } catch {
      _ctx.toast.warning("刷新失败");
    } finally {
      refreshing.value = false;
    }
  };

  const StatusContent = defineComponent({
    setup() {
      const Switch = defineAsyncComponent(_ctx.ui.components.Switch);
      const manualCode = ref("");

      const toggleAuto = async (val) => {
        autoTeam.value = Boolean(val);
        await updateSettings(_ctx, { autoEnabled: autoTeam.value });
        if (autoTeam.value) {
          _ctx.toast.info("已开启自动组队，正在执行~~~");
          requestRun(_ctx, "toggle_on", { force: true });
        } else {
          _ctx.toast.info("已关闭自动组队");
          // 关闭后快照照发一次，保持码池状态同步（不再参与分配）
          requestRun(_ctx, "toggle_off", { snapshotOnly: true, force: true });
        }
      };

      const copyCode = async () => {
        if (!uiState?.myCode) {
          _ctx.toast.warning("暂无组队码，请先运行互助");
          return;
        }
        await copyToClipboard(_ctx, uiState.myCode);
      };

      const joinManual = async () => {
        if (uiState?.joinedCode) {
          await copyToClipboard(_ctx, uiState.joinedCode);
          return;
        }
        const code = String(manualCode.value || "").trim();
        if (!code) return;
        const r = await joinTeam(_ctx, code);
        const { httpOk, bizOk, errorMsg } = parseJoinResponse(r);
        if (httpOk && bizOk) {
          _ctx.toast.success("已提交加入");
          manualCode.value = "";
          // 手动加入成功 → 触发一次快照，该码自动入池
          requestRun(_ctx, "manual_join", { snapshotOnly: true, force: true });
        } else {
          const msg = errorMsg || "加入失败，请检查组队码";
          setLastError(msg, "manual_join_failed", { code, errorMsg });
          _ctx.toast.warning(msg);
        }
      };

      // 渲染期调用：读取响应式 uiState，刷新后聚合数随渲染更新
      const poolLineText = () => {
        if (uiState?.poolDisabled) return "码池：本期已停用（下期自动恢复）";
        if (uiState?.poolOpen >= 0) {
          return `码池：开放队伍 ${uiState.poolOpen} · 等待 ${Math.max(0, uiState.poolWaiting)} 人`;
        }
        return "";
      };

      return () =>
        h("div", { style: "display: grid; gap: 14px;" }, [
          h("div", {}, [
            h("div", { style: "font-size: 13px; opacity: 0.7; margin-bottom: 6px;" },
              "活动期次：" + (uiState?.periodName || "—") + (uiState?.periodActive ? "" : "（本期未开启）")),
            uiState?.startTime && uiState?.endTime
              ? h("div", { style: "font-size: 12px; opacity: 0.5; margin-bottom: 10px;" },
                  "本期活动时间：" + uiState.startTime + " ~ " + uiState.endTime)
              : null,
            h("div", { style: "font-size: 13px; margin-bottom: 6px;" }, [
              "我创建的队伍：" + (uiState?.myCode || "未创建") +
                (uiState?.myCode ? `（${uiState?.myMemberCount}/${uiState?.targetMembers} 人）` : "") +
                (uiState?.myCode && uiState?.myVipDesc ? `  ${uiState.myVipDesc}` : ""),
            ]),
            h("div", { style: "font-size: 13px; opacity: 0.7; margin-bottom: 6px;" }, [
              "我加入的队伍：" + (uiState?.joinedCode
                ? `${uiState.joinedCode}（${uiState.joinedMemberCount}/${uiState.targetMembers} 人）` +
                  (uiState?.joinedVipDesc ? `  ${uiState.joinedVipDesc}` : "")
                : "无"),
            ]),
            poolLineText()
              ? h("div", { style: "font-size: 12px; opacity: 0.6; margin-bottom: 10px;" }, poolLineText())
              : null,
            uiState?.lastMessage
              ? h("div", { style: "font-size: 12px; color: #f0b93c; margin-bottom: 10px; display: flex; gap: 6px; align-items: center;" }, [
                  h("span", { style: "flex: 1; word-break: break-all;" }, uiState.lastMessage),
                  uiState?.lastError
                    ? h("span", {
                        style: "font-size: 11px; padding: 2px 6px; border-radius: 4px; background: rgba(255,185,60,0.15); color: #f0b93c; cursor: pointer; flex-shrink: 0; white-space: nowrap;",
                        onClick: () => copyErrorDetail(_ctx),
                      }, "复制")
                    : null,
                ])
              : null,
          ]),
          h("div", { style: "display: flex; gap: 12px; align-items: center; margin-bottom: 4px;" }, [
            h("span", { style: "font-size: 13px; font-weight: 600;" }, "自动组队"),
            h(Switch, {
              modelValue: autoTeam.value,
              "onUpdate:modelValue": toggleAuto,
            }),
          ]),
          h("div", { style: "display: flex; gap: 8px; align-items: center;" }, [
            h("span", { style: "font-size: 13px; opacity: 0.7; flex-shrink: 0;" }, "我加入的队伍："),
            h("input", {
              value: uiState?.joinedCode || manualCode.value,
              readonly: Boolean(uiState?.joinedCode),
              placeholder: uiState?.joinedCode ? "" : "输入对方组队码",
              onInput: (e) => { manualCode.value = e.target.value; },
              style: INPUT_STYLE,
            }),
            h(Button, { size: "xs", variant: "outline", onClick: joinManual, style: "white-space: nowrap; flex-shrink: 0;" }, { default: () => uiState?.joinedCode ? "复制" : "加入" }),
          ]),
          h("div", { style: "display: flex; gap: 8px; align-items: center;" }, [
            h("span", { style: "font-size: 13px; opacity: 0.7; flex-shrink: 0;" }, "我创建的队伍："),
            h("input", {
              value: uiState?.myCode || "",
              readonly: true,
              style: INPUT_STYLE,
            }),
            h(Button, { size: "xs", variant: "outline", onClick: copyCode, style: "white-space: nowrap; flex-shrink: 0;" }, { default: () => "复制" }),
          ]),
        ]);
    },
  });

  const DialogRoot = defineComponent({
    setup() {
      return () =>
        dialogOpen.value
          ? h("div", { class: "atv-dialog-mask", onClick: (e) => { if (e.target === e.currentTarget) closeDialog(); } }, [
              h("div", { class: "atv-dialog" }, [
                h("div", { class: "atv-dialog-header" }, [
                  h("span", { class: "atv-dialog-title" }, "自动组队领VIP"),
                  h("span", {
                    class: "atv-refresh-btn",
                    onClick: onRefresh,
                    title: "刷新组队状态",
                  }, "刷新"),
                  h("div", { class: "atv-dialog-close", onClick: closeDialog, style: "font-size: 18px; line-height: 1; user-select: none;" }, "✕"),
                ]),
                h(StatusContent),
              ]),
            ])
          : null;
    },
  });

  cssDispose = _ctx.css.inject(DIALOG_CSS, { id: "atv-dialog-style" });
  teleportDispose = _ctx.ui.teleport(DialogRoot, { id: "auto-team-vip-dialog" });

  if (_ctx.ui?.titlebar?.register) {
    moreMenuDispose = _ctx.ui.titlebar.register({
      id: "auto-team-vip",
      title: "自动组队",
      icon: "tabler:star",
      tooltip: "自动组队",
      defaultPlacement: "toolbar",
      order: 100,
      onClick: () => openDialog(),
    });
  }

  _ctx.vue.watch(
    () => _ctx.pinia?.state?.value?.user?.info?.token,
    (token) => {
      if (token) requestRun(_ctx, "login");
    },
  );

  // 登录后延迟启动完整流程（等 pinia 状态就绪）
  setTimeout(() => requestRun(_ctx, "startup"), AUTO_RUN_DELAY_MS);

  // 心跳：面板打开或自动开关开启时保活；本期未完成时定期触发完整流程等新码
  heartbeatTimer = setInterval(() => {
    if (!uiState || !dialogOpen) return;
    const panelOpen = Boolean(dialogOpen.value);
    const autoOn = autoTeam.value;
    if (!panelOpen && !autoOn) return;
    if (!uiState.periodActive) return;
    const now = Date.now();
    const completed = uiState.joined && uiState.myMemberCount >= uiState.targetMembers;
    if (autoOn && !completed && now - lastFullAt >= FULLFLOW_INTERVAL_MS) {
      lastFullAt = now;
      lastSnapshotAt = now;
      requestRun(_ctx, "heartbeat_full");
    } else if (now - lastSnapshotAt >= SNAPSHOT_INTERVAL_MS) {
      lastSnapshotAt = now;
      requestRun(_ctx, "heartbeat_snapshot", { snapshotOnly: true });
    }
  }, HEARTBEAT_TICK_MS);

  _ctx.dispose(() => {
    if (moreMenuDispose) { moreMenuDispose(); moreMenuDispose = null; }
    if (teleportDispose) { teleportDispose(); teleportDispose = null; }
    if (cssDispose) { cssDispose(); cssDispose = null; }
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    uiState = null;
    dialogOpen = null;
    runChain = null;
  });
}

export async function deactivate() {
  if (moreMenuDispose) { moreMenuDispose(); moreMenuDispose = null; }
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
  closeDialog();
  cssDispose?.(); cssDispose = null;
  teleportDispose?.(); teleportDispose = null;
  uiState = null;
  dialogOpen = null;
  runChain = null;
}
