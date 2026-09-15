// auto-team-vip 状态机端到端测试（mock 宿主，不联网）
// 运行：node tests/auto-team-vip.flow.test.mjs
//
// 做法：从 index.js 抽出「常量 + 模块状态 + 全部纯函数 + runFullFlow + requestRun」这一段
// （该段 0 处 _ctx 依赖），注入 mock 宿主后直接驱动状态机。
// 覆盖 15 个既有场景 + 4 个 2026-09-15 新增场景（F2 结果回报 401 / F14 手动模式零交流 / F15 默认关闭）。

import { fileURLToPath } from "node:url";
import { loadFragment, makeAssert } from "./_load-fragment.mjs";

const { eq, ok, report } = makeAssert();

// __t：把模块内部可变绑定暴露给测试（ESM 的 import 绑定只读，无法直接赋值）
const CONTROL = `
export const __t = {
  reset() {
    uiState = {
      lastMessage: "", lastError: null, periodId: "", periodName: "", startTime: "", endTime: "",
      periodActive: false, periodState: "unknown", myCode: "", myMemberCount: 0, myVipDesc: "",
      targetMembers: 3, joined: false, joinedCode: "", joinedMemberCount: 0, joinedVipDesc: "",
      poolDisabled: false,
    };
    lastRunAt = 0; lastSnapshotAt = 0; lastFullAt = 0; lastInactiveProbeAt = 0;
    errorSeq = 0; versionMismatchReported = false; deviceBoundToastShown = false;
    poolBackoff.step = 0; poolBackoff.nextAttemptAt = 0; pool429Until = 0;
    disabledPeriods = new Set(); runChain = null; PLUGIN_VERSION = "1.2.2";
    autoTeamRef = { value: true };   // 默认按"自动组队已开启"跑，手动模式由 setAutoTeam(false) 覆盖
  },
  get uiState() { return uiState; },
  get poolBackoff() { return poolBackoff; },
  get pool429Until() { return pool429Until; },
  get disabledPeriods() { return disabledPeriods; },
  get lastSnapshotAt() { return lastSnapshotAt; },
  setSleep(fn) { sleep = fn; },
  setAutoTeam(v) { autoTeamRef = v === null ? null : { value: Boolean(v) }; },
};
`;

const core = await loadFragment(fileURLToPath(new URL("../auto-team-vip/index.js", import.meta.url)), {
  from: "const TARGET_MEMBERS = 3;",
  to: "// ---------- Dialog ----------",
  exports: ["runFullFlow"],
  extra: CONTROL,
});
const { runFullFlow, __t } = core;

// 让重试休眠瞬间完成（只影响时序，不影响分支选择）
__t.setSleep(async () => {});

// 捕获 runFullFlow 内部吞掉的异常痕迹（console.warn），用于兜住 mock 缺件导致的静默失败
const warns = [];
const origWarn = console.warn;
console.warn = (...a) => { warns.push(a.map(String).join(" ")); };

// ================= 测试数据 =================
const P_ACTIVE = { data: { current_period_info: { id: "288", name: "第九期", status: 0, start_time: "2026-09-09", end_time: "2026-09-15", team_member_count: 3 } } };
const P_INACTIVE = { data: { current_period_info: { id: "288", name: "第九期", status: 1 } } };
const TI_NONE = { data: {} };
const TI_CREATED1 = { data: { my_create_team_list: [{ team_code: "MYC", member_list: [{ userid: "U1", nick_name: "我", role: 1, vip_desc: "7天" }] }] } };
const TI_JOINED = { data: {
  my_create_team_list: [{ team_code: "MYC", member_list: [{ userid: "U1", role: 1 }] }],
  my_join_team_list: [{ team_code: "C1", captain: "CAP", member_list: [{ userid: "CAP", role: 1 }, { userid: "U1", role: 2 }, { userid: "X", role: 2 }] }] } };
const TI_JOINED_C9 = { data: {
  my_create_team_list: [{ team_code: "MYC", member_list: [{ userid: "U1", role: 1 }] }],
  my_join_team_list: [{ team_code: "C9", captain: "CAP", member_list: [{ userid: "CAP", role: 1 }, { userid: "U1", role: 2 }, { userid: "X", role: 2 }] }] } };
const J_OK = { status: 1, error_code: 0 };
const J_FULL = { status: 0, error_code: 143004, error_msg: "队伍已满员" };
const J_DEV = { status: 0, error_code: 143005, error_msg: "每台设备只能加入一个队伍~~" };
const P_SNAP_OK = { status: 200, data: { ok: true, pool: { open_teams: 1, waiting: 0 } } };

function sticky(arr, dflt) { let i = 0; return () => { const v = arr && arr.length ? arr[Math.min(i, arr.length - 1)] : dflt; i++; return v; }; }

function setup(cfg = {}) {
  const store = {};
  const kugou = [], pool = [], toasts = [];
  const myinfoOf = sticky(cfg.myinfo, TI_CREATED1);
  const joinOf = sticky(cfg.join, J_OK);
  let snapN = 0, joinN = 0, resN = 0;
  const c = {
    pinia: { state: { value: {
      user: { info: cfg.loggedIn === false ? null : { token: "TK", userid: "U1", t1: "t1" } },
      device: { info: { dfid: "DF", mid: "MD", uuid: "UU", guid: "GD", serverDev: "SD", mac: "MC" } },
    } } },
    storage: { get: async (k) => store[k], set: async (k, v) => { store[k] = v; } },
    toast: { success: (m) => toasts.push("success:" + m), warning: (m) => toasts.push("warning:" + m), info: (m) => toasts.push("info:" + m) },
    kugouVerification: { request: async () => ({ ok: false }) },
    electron: { api: { request: async (req) => {
      kugou.push({ method: req.method, url: req.url, params: req.params });
      if (req.url === "/team/period/info") return { status: 200, body: cfg.period || P_ACTIVE };
      if (req.url === "/team/my/info") return { status: 200, body: myinfoOf() };
      if (req.url === "/team/my") return { status: 200, body: cfg.create || J_OK };
      if (req.url === "/team/join") return { status: 200, body: joinOf() };
      return { status: 200, body: {} };
    } } },
    net: { request: async (req) => {
      const path = new URL(req.url).pathname;
      pool.push({ path, payload: req.body });
      if (path === "/v2/snapshot") { snapN++; return typeof cfg.snap === "function" ? cfg.snap(snapN) : (cfg.snap || P_SNAP_OK); }
      if (path === "/v2/join") { joinN++; return typeof cfg.poolJoin === "function" ? cfg.poolJoin(joinN, req.body) : (cfg.poolJoin || { status: 200, data: { ok: true, lease_id: "L1", code: "C1" } }); }
      if (path === "/v2/join/result") { resN++; return typeof cfg.result === "function" ? cfg.result(resN, req.body) : (cfg.result || { status: 200, data: { ok: true } }); }
      return { status: 404, data: {} };
    } } };
  return { c, store, kugou, pool, toasts, n: () => ({ snapN, joinN, resN }) };
}
const paths = (h) => h.pool.map((p) => p.path);
const payloads = (h, p) => h.pool.filter((x) => x.path === p).map((x) => x.payload);

const run = (h, opts) => runFullFlow(h.c, "test", Object.assign({ force: true }, opts));
const reset = () => { __t.reset(); warns.length = 0; };
const ui = () => __t.uiState;

// ================= T1 未登录 =================
console.log("\n== T1 未登录 ==");
{ const h = setup({ loggedIn: false }); reset(); await run(h);
  eq("T1 错误码", ui().lastError.code, "not_logged_in");
  eq("T1 未发起酷狗请求", h.kugou.length, 0);
  eq("T1 未发起码池请求", h.pool.length, 0); }

// ================= T2 期次未开启 =================
console.log("== T2 期次未开启 ==");
{ const h = setup({ period: P_INACTIVE, myinfo: [TI_NONE] }); reset(); await run(h);
  eq("T2 错误码", ui().lastError.code, "period_inactive");
  eq("T2 未建队", h.kugou.filter((x) => x.url === "/team/my").length, 0);
  eq("T2 未请求码池", h.pool.length, 0);
  eq("T2 periodState", ui().periodState, "inactive"); }

// ================= T3 正常成功路径 =================
console.log("== T3 正常成功路径 ==");
{ const h = setup({ myinfo: [TI_NONE, TI_CREATED1, TI_JOINED] }); reset(); await run(h);
  eq("T3 建队 1 次", h.kugou.filter((x) => x.url === "/team/my").length, 1);
  eq("T3 码池请求序列", paths(h), ["/v2/snapshot", "/v2/join", "/v2/join/result", "/v2/snapshot"]);
  eq("T3 结果回报 success", payloads(h, "/v2/join/result")[0].result, "success");
  eq("T3 uiState.joined", ui().joined, true);
  eq("T3 joinedCode", ui().joinedCode, "C1");
  eq("T3 myCode", ui().myCode, "MYC");
  eq("T3 无错误残留", ui().lastError, null);
  eq("T3 期次已入库", h.store.lastPeriodId, "288");
  eq("T3 无内部异常痕迹", warns.length, 0); }

// ================= T4 池空 =================
console.log("== T4 池空 ==");
{ const h = setup({ myinfo: [TI_CREATED1], poolJoin: { status: 200, data: { ok: true, code: null, reason: "pool_empty" } } });
  reset(); await run(h);
  eq("T4 错误码", ui().lastError.code, "pool_empty");
  eq("T4 码池请求", paths(h), ["/v2/snapshot", "/v2/join"]); }

// ================= T5 失败重试 3 次 + exclude_codes 累计 =================
console.log("== T5 失败重试 3 次 + exclude_codes 累计 ==");
{ const h = setup({ myinfo: [TI_CREATED1], join: [J_FULL],
    poolJoin: (n) => ({ status: 200, data: { ok: true, lease_id: "L" + n, code: "C" + n } }) });
  reset(); await run(h);
  const joins = payloads(h, "/v2/join");
  eq("T5 尝试 3 次", joins.length, 3);
  eq("T5 第1次 exclude_codes", joins[0].exclude_codes, []);
  eq("T5 第2次 exclude_codes", joins[1].exclude_codes, ["C1"]);
  eq("T5 第3次 exclude_codes", joins[2].exclude_codes, ["C1", "C2"]);
  eq("T5 结果回报序列", payloads(h, "/v2/join/result").map((p) => p.result), ["failed", "failed", "failed"]);
  eq("T5 error_kind 上报", payloads(h, "/v2/join/result")[0].error_kind, "full");
  eq("T5 错误码", ui().lastError.code, "join_exhausted");
  eq("T5 attempts 长度", ui().lastError.detail.attempts.length, 3);
  eq("T5 attempts 类别", ui().lastError.detail.attempts[0].类别, "full"); }

// ================= T6 服务端判定 already_joined =================
console.log("== T6 服务端判定 already_joined ==");
{ const h = setup({ myinfo: [TI_CREATED1, TI_JOINED_C9], poolJoin: { status: 200, data: { ok: true, code: "C9", reason: "already_joined" } } });
  reset(); await run(h);
  eq("T6 未调用酷狗 join", h.kugou.filter((x) => x.url === "/team/join").length, 0);
  eq("T6 码池请求", paths(h), ["/v2/snapshot", "/v2/join", "/v2/snapshot"]);
  eq("T6 joinedCode（服务端码与酷狗观测一致）", ui().joinedCode, "C9");
  eq("T6 无错误", ui().lastError, null); }

// ================= T7 143005 设备级终态 =================
console.log("== T7 143005 设备级终态 ==");
{ const h = setup({ myinfo: [TI_CREATED1, TI_CREATED1], join: [J_DEV] });
  reset(); await run(h);
  eq("T7 错误码", ui().lastError.code, "device_already_bound");
  eq("T7 未重试（只 join 1 次）", payloads(h, "/v2/join").length, 1);
  eq("T7 上报 error_kind", payloads(h, "/v2/join/result")[0].error_kind, "already_joined");
  eq("T7 toast 恰好 1 次", h.toasts.filter((t) => t.startsWith("warning")).length, 1); }

// ================= T8 快照 401 =================
console.log("== T8 快照 401 ==");
{ const h = setup({ myinfo: [TI_CREATED1], snap: { status: 401, data: { ok: false, error: "unauthorized" } } });
  reset(); await run(h);
  eq("T8 错误码", ui().lastError.code, "pool_unauthorized");
  eq("T8 poolDisabled", ui().poolDisabled, true);
  eq("T8 已落库禁用键", h.store.poolAuthDisabled["288:U1"], true);
  eq("T8 未继续分配", paths(h), ["/v2/snapshot"]); }

// ================= T9 版本门禁 403 =================
console.log("== T9 版本门禁 403 ==");
{ const h = setup({ myinfo: [TI_CREATED1], snap: { status: 403, data: { ok: false, error: "version_mismatch", message: "插件版本过低，请更新" } } });
  reset(); await run(h);
  eq("T9 错误码", ui().lastError.code, "version_mismatch");
  eq("T9 有 warning toast", h.toasts.filter((t) => t.startsWith("warning")).length, 1);
  eq("T9 未继续分配", paths(h), ["/v2/snapshot"]); }

// ================= T10 粘性提示：失败后成功应清除 =================
console.log("== T10 粘性提示清除 ==");
{ const hA = setup({ myinfo: [TI_CREATED1], join: [J_FULL],
    poolJoin: (n) => ({ status: 200, data: { ok: true, lease_id: "L" + n, code: "C" + n } }) });
  reset(); await run(hA);
  const errAfterFail = ui().lastError && ui().lastError.code;
  const hB = setup({ myinfo: [TI_CREATED1, TI_JOINED] });
  await run(hB);
  eq("T10 失败后错误存在", errAfterFail, "join_exhausted");
  eq("T10 成功后错误被清除", ui().lastError, null);
  eq("T10 成功后提示清空", ui().lastMessage, "");
  eq("T10 成功加入", ui().joined, true); }

// ================= T11 同轮建队失败 + 加入成功（errorSeq 设计意图）=================
console.log("== T11 同轮建队失败 + 加入成功 ==");
{ const h = setup({ myinfo: [TI_NONE, TI_CREATED1, TI_JOINED],
    create: { status: 200, body: { status: 0, error_code: 143001, error_msg: "队伍不存在" } } });
  reset(); await run(h);
  eq("T11 加入成功", ui().joined, true);
  eq("T11 建队失败提示被保留（不被误清）", ui().lastError && ui().lastError.code, "create_team_failed"); }

// ================= T12 MIN_RUN_INTERVAL 合并窗口 =================
console.log("== T12 合并窗口 ==");
{ const h = setup({ myinfo: [TI_CREATED1] }); reset();
  await runFullFlow(h.c, "a", {});            // 非 force，首次运行
  const n1 = h.pool.length;
  await runFullFlow(h.c, "b", {});            // 10s 内再次非 force → 应跳过
  eq("T12 首次已运行", n1 > 0, true);
  eq("T12 第二次被合并窗口跳过", h.pool.length, n1);
  await runFullFlow(h.c, "c", { force: true }); // force 应绕过
  eq("T12 force 可绕过合并窗口", h.pool.length > n1, true); }

// ================= T13 snapshotOnly 只跑 ①②③ =================
console.log("== T13 snapshotOnly ==");
{ const h = setup({ myinfo: [TI_CREATED1] }); reset();
  await run(h, { snapshotOnly: true });
  eq("T13 仅 1 个码池请求", paths(h), ["/v2/snapshot"]);
  eq("T13 未发起分配", payloads(h, "/v2/join").length, 0); }

// ================= T14 期次切换清本地缓存 =================
console.log("== T14 期次切换 ==");
{ let joinedAtSnapshot = null;
  const h = setup({ myinfo: [TI_CREATED1], snap: (n) => { if (n === 1) joinedAtSnapshot = ui().joined; return P_SNAP_OK; } });
  reset();
  h.store.lastPeriodId = "287";
  ui().joined = true; ui().joinedCode = "OLDJ"; ui().myCode = "OLD";
  const joinedBefore = ui().joined;
  await run(h);
  eq("T14 切换前本地已 joined", joinedBefore, true);
  eq("T14 快照时 joined 已被清空", joinedAtSnapshot, false);
  eq("T14 期次已更新", h.store.lastPeriodId, "288"); }

// ================= T15 F1 客户端侧意图：结果回报投递失败时仍正确累计 exclude_codes =================
console.log("== T15 结果回报丢失 → 客户端 exclude_codes 累计（服务端修复见 sql 测试）==");
{ const h = setup({ myinfo: [TI_CREATED1], join: [J_FULL],
    poolJoin: () => ({ status: 200, data: { ok: true, lease_id: "L1", code: "C1" } }),  // 模拟服务端幂等分支原样返回同一码
    result: { status: 500, data: { ok: false, error: "internal_error" } } });             // 结果回报 5xx
  reset(); await run(h);
  const joins = payloads(h, "/v2/join");
  eq("T15 尝试 3 次", joins.length, 3);
  eq("T15 客户端每次请求的避开码（意图正确）", joins.map((p) => p.exclude_codes), [[], ["C1"], ["C1"]]);
  eq("T15 但服务端未采纳 → 实际反复加入同一队码", h.kugou.filter((x) => x.url === "/team/join").map((x) => x.params.team_code), ["C1", "C1", "C1"]);
  eq("T15 结果回报请求数（3 次回报 × 每次 5xx 补射 1 次 = 6）", h.pool.filter((p) => p.path === "/v2/join/result").length, 6);
  eq("T15 最终错误码", ui().lastError.code, "join_exhausted");
  eq("T15 未就回报失败打扰用户（5xx 静默是刻意设计：入队可能已成功）", h.toasts.filter((t) => t.includes("回报") || t.includes("结果")).length, 0);
  // 3 次回报 × 每次 1 条 warn（注意：poolRequest 内部对 5xx 的补射不会各自再 warn）
  eq("T15 但留下了可观测痕迹（console.warn 有 3 条）", warns.filter((w) => w.includes("结果回报失败")).length, 3);
  console.log("  → 客户端 exclude_codes 正确（[]→[C1]→[C1]），但服务端幂等分支原样返回同一码 → 重试全落在同一坏队（F1）");
  console.log("  → 服务端侧修复已由 tests/team-pool-worker.sql.test.py 覆盖"); }

// ================= T16 F2：结果回报 401 → 落库停用 + 立即终止 =================
console.log("== T16 F2 结果回报 401（修复前会静默、并多绕一轮）==");
{ const h = setup({ myinfo: [TI_CREATED1], join: [J_FULL],
    poolJoin: (n) => ({ status: 200, data: { ok: true, lease_id: "L" + n, code: "C" + n } }),
    result: { status: 401, data: { ok: false, error: "unauthorized" } } });
  reset(); await run(h);
  eq("T16 只尝试 1 次（401 立即终止，不再重试）", payloads(h, "/v2/join").length, 1);
  eq("T16 错误码为池鉴权失败（而非 join_exhausted）", ui().lastError.code, "pool_unauthorized");
  eq("T16 poolDisabled 已置位", ui().poolDisabled, true);
  eq("T16 已落库禁用键（修复前 401 不落库，要多绕一轮才停用）", h.store.poolAuthDisabled["288:U1"], true); }

// ================= T17 F14：关闭自动组队 → 与码池零交流 =================
console.log("== T17 F14 手动模式（关闭自动组队）==");
{ const h = setup({ myinfo: [TI_CREATED1] }); reset();
  __t.setAutoTeam(false);
  await run(h);
  eq("T17 码池请求为 0", h.pool.length, 0);
  eq("T17 仍查询了期次", h.kugou.filter((x) => x.url === "/team/period/info").length, 1);
  eq("T17 仍查询了我的队伍", h.kugou.filter((x) => x.url === "/team/my/info").length, 1);
  eq("T17 未自动建队", h.kugou.filter((x) => x.url === "/team/my").length, 0);
  eq("T17 未调用酷狗 join", h.kugou.filter((x) => x.url === "/team/join").length, 0);
  eq("T17 面板仍拿到我的队伍信息", ui().myCode, "MYC");
  eq("T17 无错误残留", ui().lastError, null);
  eq("T17 已记录刷新时间（心跳不会被压成 60s 一次）", __t.lastSnapshotAt > 0, true); }

// ================= T18 F14：手动模式下已入队 → 仍零交流且状态正确 =================
console.log("== T18 F14 手动模式 + 已在队中 ==");
{ // 手动模式只发起一次 my/info 查询（不建队、不重查），故 fixture 只给一条
  const h = setup({ myinfo: [TI_JOINED] }); reset();
  __t.setAutoTeam(false);
  await run(h);
  eq("T18 码池请求为 0", h.pool.length, 0);
  eq("T18 my/info 只查 1 次", h.kugou.filter((x) => x.url === "/team/my/info").length, 1);
  eq("T18 已入队状态可见", ui().joined, true);
  eq("T18 joinedCode 可见", ui().joinedCode, "C1");
  eq("T18 无错误", ui().lastError, null); }

// ================= T19 F15：开关未初始化（settingsReady 未完成）→ 视为关闭 =================
console.log("== T19 F15 开关未初始化时视为关闭 ==");
{ const h = setup({ myinfo: [TI_CREATED1] }); reset();
  __t.setAutoTeam(null);   // autoTeamRef 为 null（等价于 activate 尚未完成设置读取）
  await run(h);
  eq("T19 码池请求为 0（默认关闭，宁可少做不可越权）", h.pool.length, 0);
  eq("T19 仍查询酷狗", h.kugou.filter((x) => x.url === "/team/my/info").length, 1); }

// ================= T20 F14：手动模式切换回自动 → 恢复完整流程 =================
console.log("== T20 手动 → 自动 切换 ==");
{ const h = setup({ myinfo: [TI_CREATED1, TI_JOINED] }); reset();
  __t.setAutoTeam(false);
  await run(h);
  const poolInManual = h.pool.length;
  __t.setAutoTeam(true);
  await run(h);
  eq("T20 手动模式零交流", poolInManual, 0);
  eq("T20 切回自动后恢复码池通信", h.pool.length > 0, true);
  eq("T20 序列（已入队 → 仅快照）", paths(h), ["/v2/snapshot"]); }

// ================= T21 F7：期次切换裁剪 poolAuthDisabled =================
console.log("== T21 F7 期次切换裁剪 poolAuthDisabled ==");
{ const h = setup({ myinfo: [TI_CREATED1] }); reset();
  h.store.lastPeriodId = "287";
  h.store.poolAuthDisabled = { "286:U1": true, "287:U1": true, "288:U1": true };
  await run(h);
  eq("T21 只保留当前期次", Object.keys(h.store.poolAuthDisabled), ["288:U1"]);
  eq("T21 内存 Set 同步", [...__t.disabledPeriods], ["288:U1"]); }

console.warn = origWarn;
report();
