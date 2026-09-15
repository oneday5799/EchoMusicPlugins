// auto-team-vip v1.2.2 —— v2 快照/租约协议
// 架构设计：docs/auto-team-vip-redesign.md（§4 §7）
//
// 职责边界：
//   - 酷狗服务器：队伍真实构成的唯一权威（本插件是其唯一可靠观察者 + 组队操作执行器）。
//   - 码池服务器：存储快照、计算名额、以租约方式下发组队码。
//   - 本插件：①GUARD → ②MYINFO → ③SNAPSHOT → ④DECIDE → ⑤ASSIGN → ⑥JOIN_KUGOU → ⑦RESULT → ⑧VERIFY。
//
// 自动组队开关（默认关闭，需手动开启）：
//   - 开启：走完整 ①→⑧，与码池服务器交互（上报快照 / 申请组队码 / 回报结果）。
//   - 关闭：**与码池服务器零交流**，只读酷狗（期次 + 我的队伍信息），并保留手动加入队伍的能力
//     （组队码由用户自行输入，不来自码池）。此模式下不会自动建队、不上报快照、不申请组队码。

const TARGET_MEMBERS = 3; // 1 队长 + 2 队员（与 team-pool-worker/worker.js 的 TEAM_CAPACITY 保持一致）
const POOL_URL = "https://echo-team-pool.oneday.vip";
const POOL_RETRY_DELAY_MS = 500;      // 瞬时故障（网络/5xx）的一次补射间隔
const RETRY_MAX = 3;                  // 当轮 join 重试上限（含首次）
const RETRY_DELAY_MS = 2000;          // 重试间隔
const MIN_RUN_INTERVAL_MS = 10_000;   // 触发合并窗口
const HEARTBEAT_TICK_MS = 60_000;     // 心跳巡检周期
const SNAPSHOT_INTERVAL_MS = 5 * 60_000;    // 保活快照间隔
const FULLFLOW_INTERVAL_MS = 10 * 60_000;   // 等待新码的完整流程间隔
const INACTIVE_PROBE_INTERVAL_MS = 30 * 60_000; // 期次未开启时的低频探测（下一期自动开始）
const POOL_BACKOFF_STEPS_MS = [5, 15, 30].map((m) => m * 60_000); // 码池不可用退避
const POOL_RATE_LIMIT_BACKOFF_MS = 60_000; // 码池限速（429）短退避：令牌桶持续 1r/s，很快恢复，不适用指数退避
const REFRESH_THROTTLE_MS = 3000;
const AUTO_RUN_DELAY_MS = 3000;
const LOGIN_RUN_DELAY_MS = 2000;
// 2026-09-15（F9）：兜底色统一为中性灰——原值全为暗色（rgba(255,255,255,x)），
// 浅色主题下若宿主变量缺失会出现输入框/按钮"深底浅字"或背景不可见。
const INPUT_STYLE = "flex: 1; min-width: 0; height: 32px; padding: 0 8px; border-radius: 6px; border: 1px solid var(--border-subtle, rgba(127,127,127,0.2)); background: var(--control-muted-bg, rgba(127,127,127,0.08)); color: var(--color-text-main); font-size: 13px; outline: none;";
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
let lastInactiveProbeAt = 0;
let heartbeatTimer = null;
// 2026-09-15 补：此前 watch 句柄与两个启动 setTimeout 均未保存，停用/热重载后会打到已销毁的
// 上下文（虽被 runFullFlow 全捕获兜住不崩，但会发一次无效请求），且重复激活会叠加 interval。
let stopTokenWatch = null;
let startupTimers = [];
let versionMismatchReported = false;
// 143005「设备已绑队但本期查不到队伍」的 toast 只弹一次（每次插件激活重置）；
// 面板提示不受此标志影响，仍每轮照常设置并常驻。
let deviceBoundToastShown = false;

let dialogOpen = null;
let cssDispose = null;
let teleportDispose = null;
let moreMenuDispose = null;

// 自动组队开关（F14/F15）：由 activate 注入同一个 ref 实例，runFullFlow 据此决定是否接触码池。
// 关闭时全程不与码池服务器通信（只读酷狗 + 手动加入）。
let autoTeamRef = null;
// 设置读取完成的 Promise：启动/登录触发需等它 resolve，否则会用默认值误判开关状态。
let settingsReady = null;

function autoTeamOn() {
  return autoTeamRef ? Boolean(autoTeamRef.value) : false;
}

// 码池侧状态：退避 + 401 停用（键 = 期次:账号，多账号设备互不连坐）
const poolBackoff = { step: 0, nextAttemptAt: 0 };
let pool429Until = 0; // 429 短退避截止（与网络故障的指数退避分离）
let disabledPeriods = new Set();

function poolDown() {
  poolBackoff.nextAttemptAt =
    Date.now() + POOL_BACKOFF_STEPS_MS[Math.min(poolBackoff.step, POOL_BACKOFF_STEPS_MS.length - 1)];
  poolBackoff.step += 1;
  dlog("[码池退避]", Math.round((poolBackoff.nextAttemptAt - Date.now()) / 1000) + "s");
}

function poolRateLimited() {
  pool429Until = Date.now() + POOL_RATE_LIMIT_BACKOFF_MS;
  dlog("[码池限速退避]", Math.round(POOL_RATE_LIMIT_BACKOFF_MS / 1000) + "s");
}

function poolUp() {
  poolBackoff.step = 0;
  poolBackoff.nextAttemptAt = 0;
  pool429Until = 0;
}

function poolAvailable() {
  return Date.now() >= poolBackoff.nextAttemptAt && Date.now() >= pool429Until;
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

// 错误序号：每次 setLastError 自增，供 runFullFlow 判断"本轮是否产生过新错误"，
// 从而只在"本轮干净跑完"时才清除历史提示（避免把本轮刚产生的 create_team_failed 等误清）。
let errorSeq = 0;

function setLastError(msg, code, detail) {
  if (!uiState) return;
  errorSeq += 1;
  uiState.lastMessage = msg;
  uiState.lastError = code ? { code, message: msg, detail: detail || {} } : null;
}

// 清除历史错误提示（2026-09-15 修复粘性提示缺陷）。
// 原缺陷：lastMessage/lastError 只写不清，一旦出错过，橙色提示行会一直挂到插件停用/重启，
// 即使后续已成功入队也会误导用户以为仍在故障。
// 调用原则：只在**本轮流程的终态且状态已确认健康**时清除，不在流程中途清除
// （中途清除会在重试期间反复消失/重现，形成闪烁）。
function clearLastError() {
  if (!uiState) return;
  uiState.lastMessage = "";
  uiState.lastError = null;
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
      if (v === undefined || v === null || v === "") continue;
      if (Array.isArray(v)) {
        // 数组（如 join_exhausted 的 attempts）逐行展开，便于用户直接复制反馈
        lines.push(k + ":");
        v.forEach((item, i) =>
          lines.push("  #" + (i + 1) + " " + (typeof item === "object" ? JSON.stringify(item) : String(item)))
        );
      } else {
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

// 酷狗 join 业务终态错误码（2026-09-12 实测）：这些失败与验证码无关，
// 即使响应带 eventId 也不触发 kugouVerification（弹验证码 + 重试注定失败的 join 纯属浪费）。
// 20028 仍显式触发；未知新失败码保持原行为（failed 即触发），白名单式豁免不影响正途。
// 2026-09-15 补 143005（"每台设备只能加入一个队伍~~"，实测 HTTP 502 + 顶层 error_code）：
// 设备级终态，换任何队伍码都不可能成功，弹验证码同样纯属浪费。
const BIZ_JOIN_CODES = new Set([143001, 143004, 143010, 143005, 20006]);

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
  // 2026-09-15（F12）：取值键与 classifyJoinError / parseJoinResponse 对齐，补 "code"
  const errorCode = Number(pick(body, ["error_code", "errcode", "code"], 0));
  const failed = Number(pick(body, ["status"], 1)) === 0;
  // 验证码触发条件（2026-09-12 第六轮复核修订）：20028 显式要求；其他失败仅当非已知
  // 业务终态错误码时触发（143001/143004/143010/20006 属终态，弹验证码 + 重试注定失败）
  if (eventId && (errorCode === 20028 || (failed && !BIZ_JOIN_CODES.has(errorCode)))) {
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
// 酷狗 join 错误分类。错误响应结构（2026-09-12 实测，HTTP 502，错误字段在顶层、data 为空串）：
//   {"error_msg":"队伍不存在","data":"","status":0,"error_code":143001}
// 实测数值码：143004=满员、143010=已是成员、143001=队伍不存在；成功：HTTP 200 + status:1 + error_code:0
// 2026-09-15 实测补充：143005=「每台设备只能加入一个队伍~~」（同为 HTTP 502 + 顶层 error_code）。
//   该码是**设备级**终态（约束在设备维度而非队伍维度），换任何队伍码重试都不可能成功，
//   故归入 already_joined：走「停止重试 + 取真实队伍信息 + 快照纠偏」路径，与服务端语义一致
//   （worker 仅对 full/invalid 纠偏，already_joined 只记事件，不会给队伍泼脏水）。
// 分类原则：数值码证据最硬优先；文案关键词兜底（防酷狗改码/新错误）；默认 transient 不惩罚队伍（非对称代价）
function classifyJoinError(body) {
  const errorCode = Number(pick(body, ["error_code", "errcode", "code"], 0));
  const errorMsg = String(pick(body, ["error_msg", "msg", "message"], ""));
  const msg = errorMsg.toLowerCase();

  let kind = "transient";
  if (errorCode === 143004 || errorCode === 20006 || msg.includes("满") || msg.includes("full"))
    kind = "full"; // 20006 为 v1 观测历史码，实测未复现，保留兼容
  else if (
    errorCode === 143010 ||
    errorCode === 143005 ||
    msg.includes("已加入") ||
    msg.includes("是队伍成员") ||
    msg.includes("已参") ||
    msg.includes("只能加入") ||
    msg.includes("joined")
  )
    // 143010 实测文案"你已经是队伍成员~"；143005 为设备级"每台设备只能加入一个队伍~~"
    // 不用"已经"泛匹配（满员文案也含"已经"）；"只能加入"仅命中设备级约束文案，不误伤满员/无效码
    kind = "already_joined";
  else if (errorCode === 143001 || msg.includes("不存在") || msg.includes("无效") || msg.includes("已解散") || msg.includes("组队码错误"))
    kind = "invalid"; // 码无效/队不存在：无快照可纠偏，服务端 24h 冷却（§11.2）
  return { kind, errorCode, errorMsg };
}

// 判定酷狗 join / create 响应是否成功。
// 2026-09-15 修复（F19）：原实现 `status` 缺省为 1、`error_code` 缺省为 0，而 pick() 对非对象
// body 直接返回兜底值 → `null` / `{}` / `""` / `{code:143001}` 全被判为"入队成功"（实测 4/4 命中），
// 会把真实的入队失败静默吞掉。
// 现要求**显式** `status === 1`；错误码仅在字段确实存在时才要求为 0（既 fail-closed，
// 又容忍某些端点省略 error_code 的成功响应）。
function parseJoinResponse(r) {
  const body = r?.body;
  const isObj = Boolean(body) && typeof body === "object";
  const bodyStatus = Number(pick(body, ["status"], NaN)); // 缺省不再是"成功"
  const hasErrCode = isObj &&
    (body.error_code !== undefined || body.errcode !== undefined || body.code !== undefined);
  const errorCode = Number(pick(body, ["error_code", "errcode", "code"], 0));
  const errorMsg = String(pick(body, ["error_msg", "msg", "message"], ""));
  const httpOk = Boolean(r?.ok) && Number(r?.status) < 400;
  const bizOk = bodyStatus === 1 && (!hasErrCode || errorCode === 0);
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

async function isPoolDisabled(c, periodId, uid) {
  const key = periodId + ":" + uid;
  if (disabledPeriods.has(key)) return true;
  const map = await c.storage.get("poolAuthDisabled");
  return Boolean(map && typeof map === "object" && map[key]);
}

async function disablePool(c, periodId, uid) {
  const key = periodId + ":" + uid;
  disabledPeriods.add(key);
  try {
    const map = (await c.storage.get("poolAuthDisabled")) || {};
    map[key] = true;
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

// 回报租约结果，并语义化处理码池侧失败。
// 2026-09-15 修复：此前三处调用均丢弃返回值，导致 401 不落 poolAuthDisabled（要多绕一轮才停用）、
// 403 版本门禁的"请更新插件"提示被吞、5xx 完全无人感知（并放大 F1：回报丢失 → 幂等返回同一坏队）。
// 返回 "abort" 表示本轮应终止；"ok" 表示可继续。
async function reportLeaseResult(c, periodId, uid, leaseId, result, errorKind) {
  const r = await poolResult(c, periodId, uid, leaseId, result, errorKind);
  if (r.ok) return "ok";
  if (r.status === 401) {
    await disablePool(c, periodId, uid);
    if (uiState) uiState.poolDisabled = true;
    setLastError("身份校验失败，本期码池功能停用（下期自动恢复）", "pool_unauthorized",
      { periodId, uid, stage: "result" });
    return "abort";
  }
  if (r.needUpdate) return "abort"; // 版本门禁：poolRequestOnce 已提示过
  if (r.status === 429) {
    poolRateLimited();
    setLastError("码池请求过于频繁，稍后自动重试", "pool_rate_limited",
      { periodId, uid, stage: "result" });
    return "abort";
  }
  // 5xx / 网络：租约由服务端 120s TTL 回收，不阻断当轮重试。
  // 不设 lastMessage——入队成功路径下若提示"码池不可用"会误导用户（实际已入队成功）。
  poolDown();
  console.warn("[auto-team-vip] 结果回报失败:", result, r.status, r.error);
  return "ok";
}

// 上报快照；返回 "ok" | "disabled" | "down"
async function doSnapshot(c, periodId, uid, teamInfo) {
  if (await isPoolDisabled(c, periodId, uid)) {
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
    if (uiState) uiState.poolDisabled = false;
    return "ok";
  }
  if (r.status === 401) {
    await disablePool(c, periodId, uid);
    if (uiState) uiState.poolDisabled = true;
    setLastError("身份校验失败，本期码池功能停用（下期自动恢复）", "pool_unauthorized", { periodId, uid });
    return "disabled";
  }
  if (r.status === 429) {
    poolRateLimited();
    setLastError("码池请求过于频繁，稍后自动重试", "pool_rate_limited", { periodId, uid });
    return "down";
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
  // 本轮错误序号基线：本轮未产生任何新错误（errorSeq 未变）＝状态健康，才清除历史提示
  const seq0 = errorSeq;
  const clearIfNoNewError = () => {
    if (errorSeq === seq0) clearLastError();
  };
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
      if (uiState) uiState.periodState = "error"; // GUARD 失败：心跳按常规间隔自愈重试
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
      // 2026-09-15（F7）：poolAuthDisabled 是「期次:账号」的 401 停用表，跨期只会累积、从不清理。
      // 挂在已有的期次切换分支上顺手裁剪，只保留当前期次的记录。
      try {
        const map = (await c.storage.get("poolAuthDisabled")) || {};
        const pruned = {};
        for (const k of Object.keys(map)) if (k.startsWith(periodId + ":")) pruned[k] = map[k];
        await c.storage.set("poolAuthDisabled", pruned);
        disabledPeriods = new Set(Object.keys(pruned));
      } catch {
        // 裁剪失败不影响本轮
      }
    }
    await c.storage.set("lastPeriodId", periodId);
    if (uiState) {
      uiState.periodId = periodId;
      uiState.periodName = period.periodName;
      uiState.startTime = period.startTime;
      uiState.endTime = period.endTime;
      uiState.periodActive = period.active;
      uiState.periodState = period.active ? "active" : "inactive"; // 驱动心跳：保活/等待循环 vs 30min 低频探测
      uiState.targetMembers = period.totalMembers;
    }
    if (!period.active) {
      setLastError("本期活动未开启", "period_inactive");
      return;
    }

    // 自动组队开关（F14/F15）：关闭时**与码池服务器零交流**，走只读酷狗的手动模式
    const autoOn = autoTeamOn();

    // ② MYINFO：查询我的队伍（两个维度）。手动模式下到此为止。
    let myInfo = await getMyTeamInfo(c, periodId);
    if (!myInfo.ok) {
      setLastError("获取队伍信息失败", "myinfo_failed");
      return;
    }

    if (!autoOn) {
      // 手动模式（2026-09-15，F14）：只读酷狗，**不自动建队、不上报快照、不申请组队码**。
      // 面板仍展示"我创建的队伍 / 我加入的队伍"，手动加入走 UI 里用户自行输入的组队码。
      // 记录刷新时间，避免心跳把面板刷新压成每 60s 一次（按 SNAPSHOT_INTERVAL_MS 节流）。
      lastSnapshotAt = Date.now();
      applyTeamInfoToState(myInfo);
      clearIfNoNewError(); // 本轮查询成功＝状态可见，清掉上一模式遗留的提示
      return;
    }

    // 自动模式：无自己创建的队伍 → 创建 → 重查
    if (!myInfo.created) {
      const createdRes = await createTeam(c, periodId);
      const createdParsed = createdRes?.ok ? parseJoinResponse(createdRes) : null;
      if (!createdParsed?.httpOk || !createdParsed?.bizOk) {
        // 建队失败不阻断分配流程（仍可以队员身份加入他人队伍），但给出可见提示
        const detail = createdParsed?.errorMsg || String(createdRes?.error || "请求失败");
        setLastError(`自动创建队伍失败（${detail}），仍可加入其他队伍`, "create_team_failed", { periodId, detail });
        dlog("[建队失败]", detail);
      }
      myInfo = await getMyTeamInfo(c, periodId);
      if (!myInfo.ok) {
        setLastError("获取队伍信息失败", "myinfo_failed");
        return;
      }
    }
    applyTeamInfoToState(myInfo);

    // ③ SNAPSHOT：两维度真实状态整体上报
    const snap = await doSnapshot(c, periodId, uid, myInfo);
    lastSnapshotAt = Date.now();
    if (snapshotOnly || snap !== "ok") {
      // 快照成功＝鉴权/期次/队伍信息均正常；此路径无后续重试，清掉历史错误不会闪烁
      if (snap === "ok") clearIfNoNewError();
      return;
    }

    // ④ DECIDE：入队即终态（酷狗不支持退队），本轮结束进入心跳模式
    if (myInfo.joined) {
      clearIfNoNewError(); // 已确认在队中＝问题已解决
      return;
    }

    // ⑤→⑦ ASSIGN / JOIN_KUGOU / RESULT（当轮重试 ≤ RETRY_MAX）
    const excludedCodes = new Set(); // 本轮流程内失败过的队（network 除外），重试时请求服务端避开
    const attempts = []; // 本轮各次尝试的失败摘要（含酷狗原始错误码/文案/HTTP 状态），全部失败后随 join_exhausted 进复制详情，供用户反馈
    for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
      const joinRes = await poolJoin(c, periodId, uid, [...excludedCodes]);
      if (!joinRes.ok) {
        if (joinRes.status === 401) {
          await disablePool(c, periodId, uid);
          if (uiState) uiState.poolDisabled = true;
          setLastError("身份校验失败，本期码池功能停用（下期自动恢复）", "pool_unauthorized", { periodId, uid });
        } else if (joinRes.status === 429) {
          poolRateLimited();
          setLastError("码池请求过于频繁，稍后自动重试", "pool_rate_limited", { periodId, uid });
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
        clearIfNoNewError(); // 服务端判定已在队中＝问题已解决
        return;
      }
      if (d.reason === "pool_empty" || !d.code) {
        setLastError("暂无可加入的队伍，可手动组队或耐心等待", "pool_empty", { periodId, uid });
        return;
      }

      // 防御守卫（第七轮复核）：分配响应必须同时携带 lease_id 与 code——
      // 协议异常（缺 lease_id）时不向酷狗发起无租约的 join、不回报空 lease_id 的 result
      if (!d.lease_id || !d.code) {
        setLastError("码池响应异常，稍后自动重试", "pool_bad_response", { periodId, uid });
        return;
      }

      const leaseId = String(d.lease_id || "");
      const code = String(d.code);
      const joinKugou = await joinTeam(c, code);
      if (!joinKugou.ok) {
        // 酷狗请求本身失败（网络/未登录）：与队伍状态无关，不参与服务端纠偏
        attempts.push({ 尝试: attempt, 队伍码: code, 类别: "network", 说明: joinKugou.error || "请求失败" });
        // F2：回报失败必须被感知（401/403/429 直接终止本轮；5xx 走退避但继续重试）
        if (await reportLeaseResult(c, periodId, uid, leaseId, "failed", "network") === "abort") return;
        if (attempt < RETRY_MAX) await sleep(RETRY_DELAY_MS);
        continue;
      }
      const parsed = parseJoinResponse(joinKugou);
      if (parsed.httpOk && parsed.bizOk) {
        await reportLeaseResult(c, periodId, uid, leaseId, "success", "");
        // ⑧ VERIFY + SNAPSHOT：把成队后的真实人数报给码池
        const verify = await getMyTeamInfo(c, periodId);
        if (verify.ok) applyTeamInfoToState(verify);
        await doSnapshot(c, periodId, uid, verify.ok ? verify : myInfo);
        clearIfNoNewError(); // 入队成功＝问题已解决
        return;
      }
      const { kind, errorCode, errorMsg } = classifyJoinError(joinKugou.body);
      attempts.push({
        尝试: attempt, 队伍码: code, 类别: kind, HTTP状态: joinKugou.status,
        酷狗错误码: errorCode || undefined, 酷狗信息: errorMsg || undefined,
      });
      // F2：同上。此处回报成功（租约已正常释放），"abort" 只可能来自 401/403/429
      if (await reportLeaseResult(c, periodId, uid, leaseId, "failed", kind) === "abort") return;
      if (kind === "already_joined") {
        // 已在队中（如上轮租约迟到成功）：立即快照纠偏，不重试
        const verify = await getMyTeamInfo(c, periodId);
        if (verify.ok) applyTeamInfoToState(verify);
        await doSnapshot(c, periodId, uid, verify.ok ? verify : myInfo);
        // 143005 是**设备级**约束（设备已绑队）。若本期查不到任何队伍，说明设备绑定的队伍
        // 不在本账号/本期可见范围内 → 本地无法自愈（换任何队码都只会再报 143005），
        // 必须明确告知用户，否则会退化成"一直不成功却毫无提示"的无声失败。
        // 仅在**确认查不到队伍**（verify.ok 且无 joined）时提示；查询本身失败属瞬时故障，不误报。
        if (errorCode === 143005 && verify.ok && !verify.joined) {
          const msg = "无法加入其他队伍，请到概念版APP手动加入或查看原因";
          setLastError(msg, "device_already_bound", { periodId, uid, code, errorCode });
          // toast 每次激活只弹一次；面板提示常驻，无需每轮重复打扰
          if (!deviceBoundToastShown) {
            deviceBoundToastShown = true;
            c.toast.warning(msg);
          }
          return;
        }
        clearIfNoNewError(); // 已在队中＝问题已解决
        return;
      }
      excludedCodes.add(code); // transient/full/invalid：重试换队（full/invalid 另有服务端纠偏/冷却）
      dlog("[重试]", code, kind, attempt);
      if (attempt < RETRY_MAX) await sleep(RETRY_DELAY_MS);
    }
    setLastError("加入队伍未成功，稍后自动重试", "join_exhausted", { periodId, uid, attempts });
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

// 统一的运行时释放（_ctx.dispose 与 deactivate 都调用，幂等）。
// 2026-09-15：此前两处清理各写一遍且都不完整——watch 句柄与启动 setTimeout 从未释放，
// heartbeatTimer 未先 clear 就覆盖。此处收敛为唯一出口。
function releaseRuntime() {
  if (moreMenuDispose) { moreMenuDispose(); moreMenuDispose = null; }
  if (teleportDispose) { teleportDispose(); teleportDispose = null; }
  if (cssDispose) { cssDispose(); cssDispose = null; }
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
  if (stopTokenWatch) { stopTokenWatch(); stopTokenWatch = null; }
  for (const t of startupTimers) clearTimeout(t);
  startupTimers = [];
  if (dialogOpen) dialogOpen.value = false;
  uiState = null;
  dialogOpen = null;
  autoTeamRef = null;
  settingsReady = null;
  runChain = null;
  // 计时器基线一并归零，避免热重载后沿用上一轮的 10s 合并窗口 / 快照间隔
  lastRunAt = 0;
  lastSnapshotAt = 0;
  lastFullAt = 0;
  lastInactiveProbeAt = 0;
  versionMismatchReported = false;
  deviceBoundToastShown = false;
  disabledPeriods = new Set();
  poolBackoff.step = 0;
  poolBackoff.nextAttemptAt = 0;
  pool429Until = 0;
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
  --atv-warn: #b45309;
  --atv-warn-bg: rgba(180,83,9,0.12);
  background: var(--color-bg-elevated, #ffffff);
  color: var(--color-text-main, #1f2329);
  border: 1px solid var(--border-subtle, rgba(127,127,127,0.18));
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
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
  background: var(--control-muted-bg, rgba(127,127,127,0.16));
  user-select: none; opacity: 0.6;
  transition: opacity 0.15s, background 0.15s;
}
.atv-refresh-btn:hover { opacity: 1; background: var(--control-hover-bg, rgba(127,127,127,0.24)); }
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
@media (prefers-color-scheme: dark) {
  .atv-dialog { --atv-warn: #f0b93c; --atv-warn-bg: rgba(255,185,60,0.15); }
}
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
  deviceBoundToastShown = false; // 每次激活重置：本次激活内该 toast 只弹一次

  uiState = _ctx.vue.reactive({
    lastMessage: "",
    lastError: null,
    periodId: "",
    periodName: "",
    startTime: "",
    endTime: "",
    periodActive: false,
    periodState: "unknown", // unknown | error | active | inactive：驱动心跳自愈与期次探测
    myCode: "",
    myMemberCount: 0,
    myVipDesc: "",
    targetMembers: TARGET_MEMBERS,
    joined: false,
    joinedCode: "",
    joinedMemberCount: 0,
    joinedVipDesc: "",
    poolDisabled: false,
  });

  dialogOpen = _ctx.vue.ref(false);
  const refreshing = _ctx.vue.ref(false);
  // 2026-09-15（F15）：默认**关闭**，需用户手动开启。
  const autoTeam = _ctx.vue.ref(false);
  autoTeamRef = autoTeam; // 注入给 runFullFlow 作为门控源（F14）
  let lastRefreshTime = 0;

  // 2026-09-15（F15）：仅**显式** autoEnabled === true 才开启。
  // 原写法 `pick(..., false) !== false` 对 0 / "false" 等值会误判为"开启"，语义也读不出默认值。
  // settingsReady 供启动/登录触发 await，避免用默认值误判开关状态。
  settingsReady = _ctx.storage
    .get("settings")
    .then((saved) => {
      if (saved && typeof saved === "object") {
        autoTeam.value = pick(saved, ["autoEnabled"], false) === true;
      }
    })
    .catch(() => {});
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
          // 2026-09-15（F14）：关闭后**与码池服务器零交流**——不再补发快照（原行为），
          // 只重新查询一次酷狗侧状态刷新面板。
          _ctx.toast.info("已关闭自动组队，不再与码池服务器通信");
          requestRun(_ctx, "toggle_off", { force: true });
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
        // 手动加入：组队码由用户输入，**不经码池**（关闭自动组队时这是唯一可用的组队手段）
        const r = await joinTeam(_ctx, code);
        const { httpOk, bizOk, errorMsg } = parseJoinResponse(r);
        if (httpOk && bizOk) {
          _ctx.toast.success("已提交加入");
          manualCode.value = "";
          clearLastError(); // 手动入队成功＝问题已解决
          // 手动加入成功后刷新一次：开启自动组队时该码顺带入池；关闭时只刷新酷狗侧展示
          requestRun(_ctx, "manual_join", { snapshotOnly: true, force: true });
        } else {
          const msg = errorMsg || "加入失败，请检查组队码";
          setLastError(msg, "manual_join_failed", { code, errorMsg });
          _ctx.toast.warning(msg);
        }
      };

      // 渲染期调用：仅在码池鉴权异常时显示提示行；开放队伍/等待人数不再对外展示。
      // 关闭自动组队时不接触码池，其鉴权状态与本模式无关，不展示（避免遗留的 poolDisabled 误导）。
      const poolLineText = () => {
        if (!autoTeam.value) return "";
        if (uiState?.poolDisabled) return "状态异常，请联系插件作者处理，或等待下期组队";
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
              ? h("div", { style: "font-size: 12px; color: var(--color-warning, var(--atv-warn)); margin-bottom: 10px; display: flex; gap: 6px; align-items: center;" }, [
                  h("span", { style: "flex: 1; word-break: break-all;" }, uiState.lastMessage),
                  uiState?.lastError
                    ? h("span", {
                        style: "font-size: 11px; padding: 2px 6px; border-radius: 4px; background: var(--atv-warn-bg); color: var(--color-warning, var(--atv-warn)); cursor: pointer; flex-shrink: 0; white-space: nowrap;",
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
            autoTeam.value
              ? null
              : h("span", { style: "font-size: 12px; opacity: 0.5;" }, "（已关闭，仅查询状态，不联网码池）"),
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
      onClick: () => {
        openDialog();
        // 2026-09-15（F17）：面板数据可能已滞后（心跳 60s 巡检 + 轻量刷新 5min 间隔），
        // 打开时补一次。不带 force：受 10s 合并窗口约束，反复开合不会放大请求。
        // 关闭自动组队时，这一轮只查酷狗、不接触码池。
        requestRun(_ctx, "panel_open", { snapshotOnly: true });
      },
    });
  }

  // 登录触发延迟 2s（方案 §7.2）：等 pinia 的设备信息就绪，保证鉴权头完整。
  // 句柄入 startupTimers 以便停用/热重载时释放（F16）。
  stopTokenWatch = _ctx.vue.watch(
    () => _ctx.pinia?.state?.value?.user?.info?.token,
    (token) => {
      if (!token) return;
      startupTimers.push(setTimeout(() => {
        // 等设置读取完成，避免用默认值误判"自动组队"开关（F14/F15）
        settingsReady.then(() => requestRun(_ctx, "login"));
      }, LOGIN_RUN_DELAY_MS));
    },
  );

  // 启动触发（等 pinia 状态就绪 + 设置读取完成）。
  // 2026-09-15（F14）：受"自动组队"开关门控——关闭时该轮只查询酷狗、不与码池通信。
  startupTimers.push(setTimeout(() => {
    settingsReady.then(() => requestRun(_ctx, "startup"));
  }, AUTO_RUN_DELAY_MS));

  // 心跳：面板打开或自动开关开启时保活；本期未完成时定期触发完整流程等新码。
  // 以 periodState 取代 periodActive 硬门控：error/unknown 照常按常规间隔重试（自愈）、
  // active 走保活/等待循环、inactive 仅每 30min 低频探测（下一期自动开始）。
  // 关闭自动组队时（autoOn=false）只会走下面的轻量刷新分支，即仅查询酷狗。
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; } // 重复激活不叠加
  heartbeatTimer = setInterval(() => {
    if (!uiState || !dialogOpen) return;
    const panelOpen = Boolean(dialogOpen.value);
    const autoOn = autoTeam.value;
    if (!panelOpen && !autoOn) return;
    const now = Date.now();
    if (uiState.periodState === "inactive") {
      if (now - lastInactiveProbeAt >= INACTIVE_PROBE_INTERVAL_MS) {
        lastInactiveProbeAt = now;
        requestRun(_ctx, "period_probe", { force: true });
      }
      return;
    }
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

  _ctx.dispose(() => releaseRuntime());
}

export async function deactivate() {
  releaseRuntime();
}
