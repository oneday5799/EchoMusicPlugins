// auto-team-vip 激活层测试（mock _ctx，不联网）
// 运行：node tests/auto-team-vip.activate.test.mjs
//
// 前面的 flow 测试直接驱动 runFullFlow，覆盖不到 activate 里的东西：
//   - F15「自动组队」默认值（读 storage 的判定口径）
//   - F14 启动 / 登录触发是否受开关门控
//   - F17 打开面板时补一次刷新
//   - F8/F16 定时器与 watcher 句柄在停用/卸载时是否释放
//
// 直接 import 真实模块（index.js 无 import 依赖，可作为 ESM 载入）；
// 用可控的 setTimeout/setInterval 替身捕获定时器，手动触发。

import { makeAssert } from "./_load-fragment.mjs";

const { eq, ok, show, report } = makeAssert();

const realSetTimeout = globalThis.setTimeout;
const realClearTimeout = globalThis.clearTimeout;
const realSetInterval = globalThis.setInterval;
const realClearInterval = globalThis.clearInterval;

// ---------- 定时器替身 ----------
let mode = "capture"; // capture：记录不执行（activate 期间）；auto：立即放行（sleep 等）
const timers = [];
globalThis.setTimeout = (fn, ms) => {
  if (mode === "capture") {
    const t = { fn, ms, kind: "timeout", cleared: false };
    timers.push(t);
    return t;
  }
  return realSetTimeout(fn, 0);
};
globalThis.clearTimeout = (t) => { if (t && typeof t === "object") t.cleared = true; };
globalThis.setInterval = (fn, ms) => {
  const t = { fn, ms, kind: "interval", cleared: false };
  timers.push(t);
  return t;
};
globalThis.clearInterval = (t) => { if (t && typeof t === "object") t.cleared = true; };

const flush = () => new Promise((r) => realSetTimeout(r, 0));
const fire = async (t) => { if (!t.cleared) t.fn(); await flush(); };
const timeouts = () => timers.filter((t) => t.kind === "timeout" && !t.cleared);
const intervals = () => timers.filter((t) => t.kind === "interval" && !t.cleared);

// ---------- mock _ctx ----------
const P_ACTIVE = { data: { current_period_info: { id: "288", name: "第九期", status: 0, team_member_count: 3 } } };
const TI_CREATED1 = { data: { my_create_team_list: [{ team_code: "MYC", member_list: [{ userid: "U1", role: 1 }] }] } };

function makeCtx({ settings, myinfo = TI_CREATED1, net } = {}) {
  const store = settings === undefined ? {} : { settings };
  const calls = { pool: [], kugou: [], toasts: [], titlebar: [], disposers: [], watchStopped: false, titlebarDisposed: false };
  let watchCb = null;
  const ctx = {
    manifest: { version: "1.2.2" },
    vue: {
      reactive: (o) => o,
      ref: (v) => ({ value: v }),
      defineComponent: (o) => o,
      defineAsyncComponent: (x) => x,
      watch: (getter, cb) => { watchCb = cb; return () => { calls.watchStopped = true; }; },
    },
    ui: {
      titlebar: { register: (o) => { calls.titlebar.push(o); return () => { calls.titlebarDisposed = true; }; } },
      teleport: () => () => {},
      components: { Button: {}, Switch: {} },
    },
    css: { inject: () => () => {} },
    dispose: (cb) => calls.disposers.push(cb),
    toast: {
      success: (m) => calls.toasts.push("success:" + m),
      warning: (m) => calls.toasts.push("warning:" + m),
      info: (m) => calls.toasts.push("info:" + m),
    },
    storage: { get: async (k) => store[k], set: async (k, v) => { store[k] = v; } },
    net: {
      request: async (req) => {
        calls.pool.push(new URL(req.url).pathname);
        return net ? net(req) : { status: 200, data: { ok: true, token: "TK", pool: {} } };
      },
    },
    electron: {
      api: {
        request: async (req) => {
          calls.kugou.push(req.url);
          if (req.url === "/team/period/info") return { status: 200, body: P_ACTIVE };
          if (req.url === "/team/my/info") return { status: 200, body: myinfo };
          return { status: 200, body: { status: 1, error_code: 0 } };
        },
      },
    },
    kugouVerification: { request: async () => ({ ok: false }) },
    pinia: { state: { value: { user: { info: { token: "TK", userid: "U1" } }, device: { info: {} } } } },
  };
  return { ctx, store, calls, triggerLogin: (t) => watchCb && watchCb(t) };
}

// 注意：Windows 下必须传 file:// URL，不能传 fileURLToPath 得到的 "D:\..." 路径
const plugin = await import(new URL("../auto-team-vip/index.js", import.meta.url).href);

async function boot(opts) {
  timers.length = 0;
  mode = "capture";
  const h = makeCtx(opts);
  await plugin.activate(h.ctx);
  await flush();          // 让 settingsReady 落定
  mode = "auto";          // 之后的 setTimeout（sleep 等）直接放行
  return h;
}

const kugouCount = (h, url) => h.calls.kugou.filter((u) => u === url).length;

// 触发登录 watcher 并捕获它创建的延迟定时器。
// 必须临时切回 capture：boot() 结束后 mode 已是 auto（为让 runFullFlow 里的 sleep 放行），
// 而登录定时器是在 watcher 回调里创建的、不属于 runFullFlow。
async function captureLogin(h, token = "TK") {
  mode = "capture";
  h.triggerLogin(token);
  await flush();
  mode = "auto";
  return timeouts().find((t) => t.ms === 2000);
}

// ================= A1 F15：默认关闭 → 启动触发不与码池通信 =================
show("A1 F15 默认关闭（storage 无 settings）");
{
  const h = await boot({});
  eq("A1 捕获到 1 个启动定时器", timeouts().length, 1);
  eq("A1 启动延迟 3s", timeouts()[0].ms, 3000);
  await fire(timeouts()[0]);
  eq("A1 码池请求为 0", h.calls.pool.length, 0);
  eq("A1 仍查询期次", kugouCount(h, "/team/period/info"), 1);
  eq("A1 仍查询我的队伍", kugouCount(h, "/team/my/info"), 1);
  eq("A1 未自动建队", kugouCount(h, "/team/my"), 0);
  plugin.deactivate();
}

// ================= A2 F15：显式 true → 恢复完整流程 =================
// 注意：mock 的 /v2/join 不返回 code（等价 pool_empty），且 myinfo 里没有"已加入"的队伍，
// 所以流程会走到 ASSIGN 才停 → 期望序列是 snapshot + join 两个请求。
const AUTO_ON_POOL = ["/v2/snapshot", "/v2/join"];
show("A2 F15 显式 autoEnabled:true");
{
  const h = await boot({ settings: { autoEnabled: true } });
  await fire(timeouts()[0]);
  eq("A2 已接触码池（自动模式生效）", h.calls.pool, AUTO_ON_POOL);
  plugin.deactivate();
}

// ================= A3 F15：显式 false / 0 / "false" 一律关闭（旧写法会误判 0）=================
show("A3 F15 非 true 值一律视为关闭");
for (const [label, settings] of [
  ["autoEnabled:false", { autoEnabled: false }],
  ["autoEnabled:0（旧写法 !== false 会误判为开启）", { autoEnabled: 0 }],
  ['autoEnabled:"false"', { autoEnabled: "false" }],
  ["settings 为非对象", "garbage"],
  ["settings 为 null", null],
]) {
  const h = await boot({ settings });
  await fire(timeouts()[0]);
  eq(`A3 ${label} → 码池请求 0`, h.calls.pool.length, 0);
  plugin.deactivate();
}

// ================= A4 F14：登录触发同样受门控 =================
// 只触发登录、不触发启动定时器 —— 否则 10s 合并窗口会把紧随其后的这一次吞掉，
// 那样"码池请求 0"就无法区分"被门控"还是"被合并窗口跳过"。
show("A4 F14 登录触发受门控");
{
  const h = await boot({});                       // 默认关闭
  const loginTimer = await captureLogin(h);
  ok("A4 捕获到登录定时器（延迟 2s）", Boolean(loginTimer));
  await fire(loginTimer);
  eq("A4 登录触发确实执行了（查询了酷狗）", kugouCount(h, "/team/my/info"), 1);
  eq("A4 但关闭状态下不接触码池", h.calls.pool.length, 0);
  eq("A4 未自动建队", kugouCount(h, "/team/my"), 0);
  plugin.deactivate();
}
{
  const h = await boot({ settings: { autoEnabled: true } });
  const loginTimer = await captureLogin(h);
  await fire(loginTimer);
  eq("A4 开启状态下登录触发会接触码池", h.calls.pool, AUTO_ON_POOL);
  plugin.deactivate();
}

// ================= A5 F17：打开面板补一次刷新 =================
// 同样不触发启动定时器，避免 10s 合并窗口干扰判定。
show("A5 F17 打开面板触发刷新");
{
  const h = await boot({});                        // 默认关闭
  eq("A5 已注册标题栏入口", h.calls.titlebar.length, 1);
  eq("A5 打开面板前没有任何酷狗请求", h.calls.kugou.length, 0);
  h.calls.titlebar[0].onClick();                   // 打开面板
  await flush();
  eq("A5 打开面板后补了一次酷狗查询", h.calls.kugou.length, 2); // period/info + my/info
  eq("A5 关闭状态下仍不接触码池", h.calls.pool.length, 0);
  plugin.deactivate();
}

// ================= A6 F8/F16：停用释放定时器与 watcher =================
show("A6 F8/F16 停用释放资源");
{
  const h = await boot({});
  eq("A6 心跳 interval 已建立", intervals().length, 1);
  eq("A6 心跳周期 60s", intervals()[0].ms, 60000);
  const startupTimer = timeouts()[0];
  const loginTimer = await captureLogin(h);
  ok("A6 登录定时器已捕获", Boolean(loginTimer));
  plugin.deactivate();
  eq("A6 心跳 interval 已清除", intervals().length, 0);
  eq("A6 启动定时器已清除", startupTimer.cleared, true);
  eq("A6 登录定时器已清除（F16：修复前从不 clearTimeout）", loginTimer.cleared, true);
  eq("A6 watcher 已停止（F8：修复前句柄未保存）", h.calls.watchStopped, true);
  eq("A6 标题栏入口已注销", h.calls.titlebarDisposed, true);
}

// ================= A7 F8：_ctx.dispose 走同一条释放路径 =================
show("A7 F8 dispose 释放资源");
{
  const h = await boot({});
  eq("A7 注册了 dispose 回调", h.calls.disposers.length, 1);
  h.calls.disposers[0]();
  eq("A7 dispose 后心跳 interval 已清除", intervals().length, 0);
  eq("A7 dispose 后 watcher 已停止", h.calls.watchStopped, true);
  plugin.deactivate(); // 幂等：重复释放不应抛错
  eq("A7 重复释放幂等（未抛错）", true, true);
}

// ================= A8 重新激活会重新读取设置 =================
show("A8 重新激活重新读取设置");
{
  const h = await boot({ settings: { autoEnabled: true } });
  await fire(timeouts()[0]);
  const afterOn = h.calls.pool.length;
  eq("A8 开启时接触了码池", afterOn, AUTO_ON_POOL.length);

  plugin.deactivate();        // 模拟插件停用
  timers.length = 0;          // deactivate 已把上一轮定时器全部标记清除，这里清掉记录便于取值
  h.store.settings = { autoEnabled: false };

  mode = "capture";
  await plugin.activate(h.ctx);
  await flush();
  mode = "auto";
  await fire(timeouts()[0]);
  eq("A8 重新激活读到新设置后不再新增码池请求", h.calls.pool.length, afterOn);
  eq("A8 但仍在查询酷狗", kugouCount(h, "/team/my/info") > 0, true);
  plugin.deactivate();
}

globalThis.setTimeout = realSetTimeout;
globalThis.clearTimeout = realClearTimeout;
globalThis.setInterval = realSetInterval;
globalThis.clearInterval = realClearInterval;

report();
