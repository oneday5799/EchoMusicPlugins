// team-pool-worker 纯函数单测（无 Cloudflare 依赖）
// 运行：node tests/team-pool-worker.fn.test.mjs
//
// 覆盖：versionGte / clampMemberCount / cleanStr / sanitizeMembers
//      + 令牌桶限速的时序模拟（逐字复刻 worker.js 的 _checkRate 算法）

import { fileURLToPath } from "node:url";
import { loadFragment, makeAssert } from "./_load-fragment.mjs";

const { eq, show, report } = makeAssert();

const core = await loadFragment(fileURLToPath(new URL("../team-pool-worker/worker.js", import.meta.url)), {
  from: 'const SCHEMA_VERSION = "3";',
  to: "// ---------- Durable Object ----------",
  exports: ["versionGte", "clampMemberCount", "cleanStr", "sanitizeMembers"],
});
const { versionGte, clampMemberCount, cleanStr, sanitizeMembers } = core;

// ================= versionGte =================
show("versionGte —— 版本门禁比较");
eq("1.2.1 >= 1.2.0", versionGte("1.2.1", "1.2.0"), true);
eq("1.2.0 >= 1.2.0", versionGte("1.2.0", "1.2.0"), true);
eq("1.1.9 >= 1.2.0", versionGte("1.1.9", "1.2.0"), false);
eq("1.10.0 >= 1.9.0（数值而非字典序）", versionGte("1.10.0", "1.9.0"), true);
eq("2.0.0 >= 10.0.0（数值而非字典序）", versionGte("2.0.0", "10.0.0"), false);
eq("1.2 >= 1.2.0（缺段补 0）", versionGte("1.2", "1.2.0"), true);
eq("1.2.0-beta.2 >= 1.2.0（NaN||0 吃掉预发布段）", versionGte("1.2.0-beta.2", "1.2.0"), true);
eq("1.2.0-beta.2 >= 1.2.1", versionGte("1.2.0-beta.2", "1.2.1"), false);
eq("空串 >= 1.2.0", versionGte("", "1.2.0"), false);
eq("非数字 >= 1.2.0", versionGte("abc", "1.2.0"), false);
eq("999.0.0 >= 1.2.0（admin.html 固定高版本）", versionGte("999.0.0", "1.2.0"), true);
eq("2.0.0 >= 1.9.0", versionGte("2.0.0", "1.9.0"), true);
eq("1.2.2 >= 1.2.0（本次发版）", versionGte("1.2.2", "1.2.0"), true);

// ================= clampMemberCount / cleanStr / sanitizeMembers =================
show("clampMemberCount —— 人数钳制 [1,3]");
eq("undefined → 1", clampMemberCount(undefined), 1);
eq("null → 1", clampMemberCount(null), 1);
eq("NaN → 1", clampMemberCount(NaN), 1);
eq("0 → 1", clampMemberCount(0), 1);
eq("-5 → 1", clampMemberCount(-5), 1);
eq("9 → 3", clampMemberCount(9), 3);
eq('"2.6" → 3', clampMemberCount("2.6"), 3);
eq('"2.4" → 2', clampMemberCount("2.4"), 2);

show("cleanStr —— 清洗与截断");
eq("null → 空串", cleanStr(null, 10), "");
eq("空白 → 空串", cleanStr("   ", 10), "");
eq("首尾去空格", cleanStr("  ab  ", 10), "ab");
eq("超长截断", cleanStr("abcdef", 3), "abc");
eq("数字转字符串", cleanStr(123, 5), "123");
eq("中文按字符截断", cleanStr("字".repeat(80), 48).length, 48);

show("sanitizeMembers —— 成员名单净化");
eq("非数组 → null", sanitizeMembers("x"), null);
eq("空数组 → null", sanitizeMembers([]), null);
eq("无 userid → null", sanitizeMembers([{ nick: "a" }]), null);
eq("正常一条", sanitizeMembers([{ userid: "1", nick: "甲", role: 1, reward: "7天" }]),
  [{ userid: "1", nick: "甲", role: 1, reward: "7天" }]);
eq("别名 u/nickname/vip_desc", sanitizeMembers([{ u: "2", nickname: "乙", role: 2, vip_desc: "5天" }]),
  [{ userid: "2", nick: "乙", role: 2, reward: "5天" }]);
eq("role 非 1 一律 2", sanitizeMembers([{ userid: "1", role: 7 }])[0].role, 2);
eq("上限 3 人", sanitizeMembers([{ userid: "1" }, { userid: "2" }, { userid: "3" }, { userid: "4" }]).length, 3);
eq("非对象项被跳过", sanitizeMembers([null, "x", { userid: "1" }]).length, 1);
eq("userid 超 32 截断", sanitizeMembers([{ userid: "9".repeat(50) }])[0].userid.length, 32);
eq("nick 超 48 截断", sanitizeMembers([{ userid: "1", nick: "字".repeat(80) }])[0].nick.length, 48);

// ================= 令牌桶时序模拟 =================
// 逐字复刻 worker.js 的 _checkRate：突发 RATE_BURST=5、持续 RATE_REFILL_PER_SEC=1。
// 目的：确认插件端单轮流程的正常/重试路径不会触发 429（时间轴一律用**毫秒**，
// 首次版本误用秒导致结论反转）。
show("令牌桶 —— 突发 5 / 持续 1 req/s");
const BURST = 5, REFILL = 1, LATENCY = 150; // 每次请求往返按 150ms 估
function runFlow(requests, opts = {}) {
  const { retry5xx = false, retryDelay = 500, gapBetweenAttempts = 0, startAt = 0 } = opts;
  let tokens = BURST, last = 0, t = startAt, n = 0, hits = 0;
  const marks = [];
  const send = () => {
    tokens = Math.min(BURST, tokens + ((t - last) / 1000) * REFILL);
    last = t; n++;
    if (tokens < 1) { hits++; marks.push(`t=${(t / 1000).toFixed(2)}s 第${n}个 → 429`); }
    else tokens -= 1;
    t += LATENCY;
  };
  for (let i = 0; i < requests.length; i++) {
    if (i > 0 && gapBetweenAttempts) t += gapBetweenAttempts;
    send(); // 首次
    if (retry5xx) { t += retryDelay; send(); } // 5xx/网络失败补射一次
  }
  return { n, hits, marks };
}
function scenario(label, requests, opts) {
  const r = runFlow(requests, opts);
  console.log(`  ${label}\n     请求 ${r.n} 个，429 ${r.hits} 次${r.marks.length ? "：" + r.marks.join("；") : ""}`);
  return r.hits;
}

const SNAP = "snapshot", JOIN = "join", RES = "result";
const successFlow = [SNAP, JOIN, RES, SNAP];                 // ③快照 ⑤分配 ⑦回报 ⑧复核快照
const retryFlow = [SNAP, JOIN, RES, JOIN, RES, JOIN, RES];  // 失败重试 3 次
const emptyFlow = [SNAP, JOIN];                              // 池空

const h1 = scenario("① 成功路径（4 请求）", successFlow);
const h2 = scenario("② 失败重试 3 次（7 请求，重试间隔 2s）", retryFlow, { gapBetweenAttempts: 2000 });
const h3 = scenario("③ 失败重试 3 次 + 每次 5xx 补射（13 请求）", retryFlow, { gapBetweenAttempts: 2000, retry5xx: true });
const h4 = scenario("④ 池空（2 请求）", emptyFlow);
const h5 = scenario("⑤ 码池整体降级：全部请求各补射一次（8 请求）", successFlow, { retry5xx: true });
const h6 = scenario("⑥ 两次强制完整流程零间隔叠加（14 请求）", [...retryFlow, ...retryFlow]);

eq("① 成功路径 429 = 0", h1, 0);
eq("② 失败重试 3 次 429 = 0", h2, 0);
eq("③ 失败重试 3 次 + 5xx 补射 429 = 0", h3, 0);
eq("④ 池空 429 = 0", h4, 0);
eq("⑤ 全量 5xx 补射 429 = 0", h5, 0);
eq("⑥ 零间隔连续强制流程 429 = 8（已知边界，非缺陷）", h6, 8);
console.log("\n  结论：单轮流程的正常/重试/补射路径都在突发额度内；仅\"两次强制流程零间隔叠加\"会触发 429，属预期。");

report();
