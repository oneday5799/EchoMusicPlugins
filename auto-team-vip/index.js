const DEFAULT_CAPACITY = 2; // 3人组队：队长 + 2队员
const SYNC_THROTTLE_MS = 5000;
const MAX_SYNC_CODES = 5;
const INPUT_STYLE = "flex: 1; min-width: 0; height: 32px; padding: 0 8px; border-radius: 6px; border: 1px solid var(--border-subtle, rgba(255,255,255,0.12)); background: var(--control-muted-bg, rgba(255,255,255,0.06)); color: var(--color-text-main); font-size: 13px; outline: none;";
let PLUGIN_VERSION = "0.0.0";

const _DEBUG = false;
function dlog(...args) {
  if (_DEBUG) console.log("[auto-team-vip]", ...args);
}

let autoTimer = null;
let runLock = false;
let uiState = null;
let versionMismatchReported = false;

// --- top bar button ---
let topBtn = null;
let topBtnCheckLoop = null;
let topDialogEl = null;
let topDialogApp = null;

function pick(obj, keys, fallback) {
  if (!obj || typeof obj !== "object") return fallback;
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

function calcRemaining(memberCount) {
  return Math.min(DEFAULT_CAPACITY, Math.max(0, DEFAULT_CAPACITY - (memberCount - 1)));
}

function applyTeamInfoToState(myTeam) {
  if (!uiState || !myTeam.ok) return;
  uiState.myCode = myTeam.code;
  uiState.myMemberCount = myTeam.memberCount;
  uiState.myVipDesc = myTeam.vipDesc;
  uiState.joinedCode = myTeam.joinedCode;
  uiState.joinedMemberCount = myTeam.joinedMemberCount;
  uiState.joinedVipDesc = myTeam.joinedVipDesc;
  uiState.joined = Boolean(myTeam.joinedCode);
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

  let res;
  try {
    res = await c.electron.api.request(cfg);
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }

  const body = res?.body;
  const eventId = pick(body, ["ssaCode", "eventId"], "") || pick(res?.headers, ["ssa-code", "SSA-CODE"], "");
  const errorCode = Number(pick(body, ["error_code", "errcode"], 0));
  const failed = Number(pick(body, ["status"], 1)) === 0;
  if (eventId && (errorCode === 20028 || failed)) {
    try {
      const verified = await c.kugouVerification.request(eventId);
      if (verified?.ok) res = await c.electron.api.request(cfg);
    } catch (e) {
      console.warn("[auto-team-vip] verification failed:", e);
    }
  }

  return { ok: true, status: res?.status, body: res?.body };
}

function normalizePeriod(body) {
  const d = body?.data ?? body ?? {};
  const current = d?.current_period_info ?? d?.period_info ?? d;
  const total = Number(pick(current, ["team_member_count", "member_count", "team_num", "target_member", "limit", "need_count"], 3));
  const statusRaw = Number(pick(current, ["status"], -1));
  const isActive = statusRaw === 0;
  return {
    periodId: String(pick(current, ["id", "period_id", "periodId", "activity_id"], "")),
    periodName: String(pick(current, ["name"], "")),
    startTime: String(pick(current, ["start_time"], "")),
    endTime: String(pick(current, ["end_time"], "")),
    active: isActive,
    totalMembers: total >= 3 ? total : 3,
    raw: body,
  };
}

function normalizeTeam(body) {
  const d = body?.data ?? body ?? {};
  const createList = d?.my_create_team_list ?? [];
  const joinList = d?.my_join_team_list ?? [];
  const created = Array.isArray(createList) && createList.length > 0 ? createList[0] : null;
  const joined = Array.isArray(joinList) && joinList.length > 0 ? joinList[0] : null;
  const code = created ? pick(created, ["team_code", "code", "teamCode"], "") : "";
  const members = created && Array.isArray(created?.member_list) ? created.member_list.length : 0;
  const memberCount = created ? Number(pick(created, ["member_count", "count", "members_count", "current_count"], members)) : 0;
  const vipDesc = created ? pick(created, ["vip_desc"], "") : "";
  const joinedCode = joined ? pick(joined, ["team_code", "code", "teamCode"], "") : "";
  const joinedMembers = joined && Array.isArray(joined?.member_list) ? joined.member_list.length : 0;
  const joinedMemberCount = joined ? Number(pick(joined, ["member_count", "count", "members_count", "current_count"], joinedMembers)) : 0;
  const joinedVipDesc = joined ? pick(joined, ["vip_desc"], "") : "";
  return { code, memberCount, vipDesc, joinedCode, joinedMemberCount, joinedVipDesc, raw: d };
}

function classifyJoinError(body) {
  const d = body?.data ?? body ?? {};
  const code = Number(pick(d, ["error_code", "errcode", "code"], 0));
  const msg = String(pick(d, ["msg", "message", "error"], "")).toLowerCase();
  if (code !== 0) {
    if (msg.includes("已加入") || msg.includes("已经") || msg.includes("已参") || msg.includes("joined"))
      return "already_joined";
    if (msg.includes("满") || msg.includes("full") || code === 20006) return "full";
    return "invalid";
  }
  if (msg.includes("满") || msg.includes("full")) return "full";
  if (msg.includes("已加入") || msg.includes("joined")) return "already_joined";
  return "invalid";
}

function parseJoinResponse(r) {
  const bodyStatus = Number(pick(r.body, ["status"], 1));
  const errorCode = Number(pick(r.body, ["error_code", "errcode"], 0));
  const errorMsg = String(pick(r.body, ["error_msg", "msg", "message"], ""));
  const httpOk = r.ok && Number(r.status) < 400;
  const bizOk = bodyStatus === 1 && errorCode === 0;
  return { httpOk, bizOk, errorCode, errorMsg };
}

async function getUid(c) {
  let uid = await c.storage.get("uid");
  if (!uid) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    uid = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    await c.storage.set("uid", uid);
  }
  return uid;
}

async function getSettings(c) {
  const saved = await c.storage.get("settings");
  return {
    poolUrl: pick(saved, ["poolUrl"], ""),
    ...(saved && typeof saved === "object" ? saved : {}),
  };
}

async function poolRequest(c, path, payload, method = "POST") {
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await poolRequestOnce(c, path, payload, method);
    if (r.status === 403) return r;
    if ((r.status === 0 || (r.status >= 500 && r.status < 600)) && attempt === 0) {
      await new Promise(res => setTimeout(res, 500));
      continue;
    }
    return r;
  }
}

async function poolRequestOnce(c, path, payload, method = "POST") {
  const settings = await getSettings(c);
  const base = String(settings.poolUrl || "").replace(/\/+$/, "");
  if (!base) {
    console.warn("[auto-team-vip] poolRequest: no poolUrl configured");
    return { ok: false, error: "no_pool" };
  }
  dlog("poolRequest:", method, base + path);
  try {
    const res = await c.net.request({
      url: base + path,
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Plugin-Version": PLUGIN_VERSION,
      },
      body: method === "GET" ? undefined : payload,
      responseType: "json",
    });
    dlog("poolRequest response:", res.status);
    if (res.status === 403 && (res.data?.error === "version_mismatch" || res.data?.error === "version_missing")) {
      const msg = res.data?.message || "插件版本过低，请更新";
      console.warn("[auto-team-vip] version mismatch:", msg);
      if (!versionMismatchReported && uiState) {
        versionMismatchReported = true;
        uiState.lastMessage = msg;
        c.toast.warning(msg);
      }
      return { ok: false, status: res.status, data: res.data, error: msg, needUpdate: true };
    }
    return { ok: res.status >= 200 && res.status < 300, status: res.status, data: res.data };
  } catch (e) {
    console.warn("[auto-team-vip] poolRequest error:", e);
    const msg = String(e?.message || e);
    const hint = msg.includes("403") ? "（Cloudflare 安全挑战，请降低 Security Level 或使用 workers.dev 域名）" : "";
    return { ok: false, status: 0, data: null, error: msg + hint };
  }
}

async function poolRegister(c, periodId, code, creator, members, remaining) {
  return poolRequest(c, "/pool/register", { period_id: periodId, code, creator, members, remaining });
}

async function poolJoin(c, periodId, uid) {
  return poolRequest(c, "/pool/join", { period_id: periodId, uid });
}

async function poolReport(c, periodId, code, status) {
  return poolRequest(c, "/pool/report", { period_id: periodId, code, status });
}

async function poolSync(c, periodId, code, members, remaining) {
  return poolRequest(c, "/pool/sync", { period_id: periodId, code, members, remaining });
}

async function poolStats(c, periodId) {
  return poolRequest(c, "/pool/stats", { period_id: periodId });
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
  return { ok: true, ...normalizeTeam(r.body) };
}

async function createTeam(c, periodId) {
  return teamRequest(c, "POST", "/team/my", { period_id: periodId });
}

async function joinTeam(c, code) {
  return teamRequest(c, "POST", "/team/join", { team_code: code });
}

async function runOnceBase(c, opts = {}) {
  if (runLock) return { ok: false, error: "locked" };
  runLock = true;
  const notify = (msg) => {
    if (opts.silent) return;
    if (uiState) uiState.lastMessage = msg;
  };
  try {
    const auth = readAuth(c);
    if (!auth) {
      notify("未登录 EchoMusic，请先登录");
      return { ok: false, error: "not_logged_in" };
    }

    const settings = await getSettings(c);
    const uid = await getUid(c);

    const period = await getPeriodInfo(c);
    if (!period.ok) {
      notify(period.error || "获取活动信息失败");
      return { ok: false, error: "no_period" };
    }
    if (uiState) {
      uiState.periodId = String(period.periodId);
      uiState.periodName = period.periodName;
      uiState.startTime = period.startTime;
      uiState.endTime = period.endTime;
      uiState.periodActive = period.active;
    }

    const periodId = period.periodId;

    let myTeam = await getMyTeamInfo(c, periodId);
    if (!myTeam.ok || !myTeam.code) {
      const createRes = await createTeam(c, periodId);
      if (!createRes.ok) {
        console.warn("[auto-team-vip] createTeam failed:", createRes.error);
      }
      myTeam = await getMyTeamInfo(c, periodId);
    }

    let myCode = "";
    let myMemberCount = 0;
    let joinedCode = "";
    let joinedMemberCount = 0;
    if (myTeam.ok) {
      myCode = myTeam.code;
      myMemberCount = myTeam.memberCount;
      joinedCode = myTeam.joinedCode;
      joinedMemberCount = myTeam.joinedMemberCount;
    }
    if (uiState) {
      uiState.myCode = myCode;
      uiState.myMemberCount = myMemberCount;
      uiState.myVipDesc = myTeam.ok ? myTeam.vipDesc : "";
      uiState.targetMembers = period.totalMembers;
      uiState.joinedCode = joinedCode;
      uiState.joinedMemberCount = joinedMemberCount;
      uiState.joinedVipDesc = myTeam.ok ? myTeam.joinedVipDesc : "";
      uiState.joined = Boolean(joinedCode);
    }

    if (myCode && myMemberCount >= period.totalMembers) {
      notify("本期组队已完成，期待下一次组队");
    }

    return {
      ok: true,
      myCode,
      periodId,
      uid,
      totalMembers: period.totalMembers,
      poolUrl: settings.poolUrl,
    };
  } finally {
    runLock = false;
  }
}

async function runOncePool(c, baseResult) {
  if (!baseResult?.ok) return baseResult;
  const { periodId, uid, poolUrl } = baseResult;
  const myCode = baseResult.myCode;

  let myTeam = await getMyTeamInfo(c, periodId);
  let joined = myTeam.ok ? Boolean(myTeam.joinedCode) : false;

  if (myCode) {
    const mc = myTeam.ok && myTeam.code === myCode ? myTeam.memberCount : 1;
    const remaining = calcRemaining(mc);
    await poolRegister(c, periodId, myCode, uid, [], remaining);
  }

  if (myTeam.ok && myTeam.joinedCode) {
    const remaining = calcRemaining(myTeam.joinedMemberCount);
    await poolRegister(c, periodId, myTeam.joinedCode, "unknown", [uid], remaining);
  }

  if (!joined) {
    if (poolUrl) {
      const pickRes = await poolJoin(c, periodId, uid);
      if (pickRes.ok && pickRes.data?.code) {
        const code = pickRes.data.code;
        const r = await joinTeam(c, code);
        const { httpOk, bizOk } = parseJoinResponse(r);
        if (httpOk && bizOk) {
          joined = true;
          myTeam = await getMyTeamInfo(c, periodId);
          if (myTeam.ok && myTeam.joinedCode) {
            const remaining = calcRemaining(myTeam.joinedMemberCount);
            await poolRegister(c, periodId, myTeam.joinedCode, "unknown", [uid], remaining);
          }
        } else {
          const kind = classifyJoinError(r.body);
          if (kind === "full" || kind === "invalid") {
            await poolReport(c, periodId, code, "failed");
          } else if (kind === "already_joined") {
            joined = true;
            myTeam = await getMyTeamInfo(c, periodId);
          }
          if (uiState) uiState.lastMessage = "加入队伍未成功（" + kind + "）";
        }
      } else {
        if (uiState) uiState.lastMessage = "暂无可加入的队伍，可手动组队或耐心等待";
      }
    }
  }

  if (myTeam.ok && uiState) {
    applyTeamInfoToState(myTeam);
  }

  await c.storage.set("lastPeriod", { periodId, myCode, joined, updatedAt: Date.now() });
  return { ok: true, myCode, joined };
}

async function runOnce(c, opts = {}) {
  const base = await runOnceBase(c, opts);
  if (base.ok) {
    return runOncePool(c, base);
  }
  return base;
}

async function scheduleRun(c, delay = 800) {
  if (autoTimer) clearTimeout(autoTimer);
  autoTimer = setTimeout(async () => {
    autoTimer = null;
    void runOnce(c, {});
  }, delay);
}

function clearAuto() {
  if (autoTimer) {
    clearTimeout(autoTimer);
    autoTimer = null;
  }
}

// --- Top bar button ---

const TOP_BTN_CSS = `
.atv-top-btn {
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
  background: transparent; border: none;
  color: var(--color-text-main); opacity: 0.6;
  cursor: pointer; flex-shrink: 0;
  margin-left: 2px;
}
.atv-top-btn:hover {
  opacity: 1;
  background-color: var(--control-hover-bg);
}
.atv-top-btn svg { width: 17px; height: 17px; }

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

function startTopButton(c) {
  if (topBtnCheckLoop) return;

  if (!document.getElementById("atv-top-btn-style")) {
    const s = document.createElement("style");
    s.id = "atv-top-btn-style";
    s.textContent = TOP_BTN_CSS;
    document.head.appendChild(s);
  }

  topBtnCheckLoop = setInterval(() => {
    const nav = document.querySelector(".titlebar-nav");
    if (!nav) return;
    const searchBox = nav.querySelector(".tb-search");
    if (!searchBox) return;
    if (document.getElementById("atv-top-btn")) return;

    const btn = document.createElement("button");
    btn.id = "atv-top-btn";
    btn.className = "atv-top-btn nav-btn";
    btn.title = "自动组队";
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    btn.addEventListener("click", () => openDialog(c));
    searchBox.parentNode.insertBefore(btn, searchBox.nextSibling);
    topBtn = btn;
    clearInterval(topBtnCheckLoop);
    topBtnCheckLoop = null;
  }, 800);
}

function stopTopButton() {
  if (topBtnCheckLoop) {
    clearInterval(topBtnCheckLoop);
    topBtnCheckLoop = null;
  }
  if (topBtn) {
    topBtn.remove();
    topBtn = null;
  }
  const s = document.getElementById("atv-top-btn-style");
  if (s) s.remove();
  closeDialog();
}

// --- Dialog ---

function openDialog(c) {
  if (topDialogEl) return;
  versionMismatchReported = false;

  const { createApp, h, ref, reactive, onMounted, defineComponent, defineAsyncComponent } = c.vue;
  const Button = defineAsyncComponent(c.ui.components.Button);

  const refreshing = c.vue.ref(false);
  const lastSyncTime = {};

  const poolSyncThrottled = async (periodId, code, members, remaining) => {
    const now = Date.now();
    if (lastSyncTime[code] && now - lastSyncTime[code] < SYNC_THROTTLE_MS) return;
    lastSyncTime[code] = now;
    return poolSync(c, periodId, code, members, remaining);
  };

  const onRefresh = async () => {
    if (refreshing.value) return;
    refreshing.value = true;
    try {
      const periodId = uiState?.periodId;
      if (periodId) {
        const uid = await getUid(c);
        const teamInfo = await getMyTeamInfo(c, periodId);
        const statsRes = await poolStats(c, periodId);
        if (statsRes.ok && statsRes.data?.codes) {
          const myCodes = statsRes.data.codes.filter(
            codeObj => codeObj.creator === uid || (codeObj.members || []).includes(uid)
          ).slice(0, MAX_SYNC_CODES);
          if (teamInfo.ok) {
            for (const codeObj of myCodes) {
              const members = [];
              if (teamInfo.joinedCode === codeObj.code) members.push(uid);
              else if (teamInfo.code === codeObj.code) members.push(uid);
              const kugouMemberCount = teamInfo.joinedCode === codeObj.code
                ? teamInfo.joinedMemberCount
                : (teamInfo.code === codeObj.code ? teamInfo.memberCount : 0);
              const remaining = calcRemaining(kugouMemberCount);
              await poolSyncThrottled(periodId, codeObj.code, members, remaining);
            }
          }
        }
        if (teamInfo.ok && uiState) {
          applyTeamInfoToState(teamInfo);
        }
        if (!teamInfo.ok || !teamInfo.joinedCode) {
          await runOnce(c, {});
        }
      }
      c.toast.success("已刷新");
    } catch (e) {
      c.toast.warning("刷新失败");
    } finally {
      refreshing.value = false;
    }
  };

  const StatusContent = defineComponent({
    setup() {
      const Switch = defineAsyncComponent(c.ui.components.Switch);
      const manualCode = ref("");
      const autoTeam = ref(false);
      const poolUrlDraft = ref("");

      c.storage.get("settings").then((saved) => {
        if (saved && typeof saved === "object") {
          autoTeam.value = pick(saved, ["autoEnabled"], false) !== false;
          poolUrlDraft.value = String(pick(saved, ["poolUrl"], ""));
        }
      });

      const savePoolUrl = async () => {
        const url = String(poolUrlDraft.value || "").trim().replace(/\/+$/, "");
        if (url && !/^https?:\/\//.test(url)) {
          c.toast.warning("地址必须以 http:// 或 https:// 开头");
          return;
        }
        await updateSettings(c, { poolUrl: url });
        c.toast.success("码池地址已保存");
      };

      const toggleAuto = async (val) => {
        console.log("[auto-team-vip] toggleAuto called with:", val);
        autoTeam.value = Boolean(val);
        await updateSettings(c, { autoEnabled: autoTeam.value });
        if (autoTeam.value) {
          if (!settings.poolUrl) {
            c.toast.warning("自动组队需填写码池地址~~~");
            return;
          }
          c.toast.info("已开启自动组队，正在执行~~~");
          await runOnce(c, {});
        } else {
          c.toast.info("已关闭自动组队");
        }
      };

      const copyCode = async () => {
        if (!uiState?.myCode) {
          c.toast.warning("暂无组队码，请先运行互助");
          return;
        }
        await copyToClipboard(c, uiState.myCode);
      };

      const joinManual = async () => {
        if (uiState?.joinedCode) {
          await copyToClipboard(c, uiState.joinedCode);
          return;
        }
        const code = String(manualCode.value || "").trim();
        if (!code) return;
        const r = await joinTeam(c, code);
        const { httpOk, bizOk, errorMsg } = parseJoinResponse(r);
        if (httpOk && bizOk) {
          c.toast.success("已提交加入");
          manualCode.value = "";
          const periodId = uiState?.periodId;
          if (periodId) {
            const teamInfo = await getMyTeamInfo(c, periodId);
            if (teamInfo.ok && uiState) {
              applyTeamInfoToState(teamInfo);
              const uid = await getUid(c);
              if (autoTeam.value && teamInfo.joinedCode) {
                const remaining = calcRemaining(teamInfo.joinedMemberCount);
                await poolRegister(c, periodId, teamInfo.joinedCode, "unknown", [uid], remaining);
              } else if (!autoTeam.value && teamInfo.code) {
                const mc = teamInfo.memberCount || 1;
                const remaining = calcRemaining(mc);
                await poolRegister(c, periodId, teamInfo.code, uid, [], remaining);
              }
            }
          }
        } else {
          const msg = errorMsg || "加入失败，请检查组队码";
          c.toast.warning(msg);
        }
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
            h("div", { style: "font-size: 13px; opacity: 0.7; margin-bottom: 10px;" }, [
              "我加入的队伍：" + (uiState?.joinedCode
                ? `${uiState.joinedCode}（${uiState.joinedMemberCount}/${uiState.targetMembers} 人）` +
                  (uiState?.joinedVipDesc ? `  ${uiState.joinedVipDesc}` : "")
                : "无"),
            ]),
            uiState?.lastMessage
              ? h("div", { style: "font-size: 12px; color: #f0b93c; margin-bottom: 10px;" }, uiState.lastMessage)
              : null,
          ]),
          h("div", { style: "display: flex; gap: 12px; align-items: center; margin-bottom: 4px;" }, [
            h("span", { style: "font-size: 13px; font-weight: 600;" }, "自动组队"),
            h(Switch, {
              modelValue: autoTeam.value,
              "onUpdate:modelValue": toggleAuto,
            }),
          ]),
          autoTeam.value ? h("div", { style: "display: flex; gap: 8px; align-items: center;" }, [
            h("span", { style: "font-size: 13px; opacity: 0.7; flex-shrink: 0;" }, "填写码池地址："),
            h("input", {
              value: poolUrlDraft.value,
              placeholder: "码池地址请加echomusic群获取",
              onInput: (e) => { poolUrlDraft.value = e.target.value; },
              style: INPUT_STYLE,
            }),
            h(Button, { size: "xs", variant: "outline", onClick: savePoolUrl, style: "white-space: nowrap; flex-shrink: 0;" }, { default: () => "保存" }),
          ]) : null,
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
        h("div", { class: "atv-dialog-mask", onClick: (e) => { if (e.target === e.currentTarget) closeDialog(); } }, [
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
        ]);
    },
  });

  const container = document.createElement("div");
  container.id = "atv-dialog-root";
  document.body.appendChild(container);
  topDialogEl = container;

  const app = createApp(DialogRoot);
  app.use(c.pinia);
  app.use(c.router);
  app.component("Icon", c.vue.Icon ?? (() => null));
  app.config.globalProperties.$echo = c.app.config.globalProperties.$echo;
  app.mount(container);
  topDialogApp = app;
}

function closeDialog() {
  if (topDialogApp) {
    try { topDialogApp.unmount(); } catch {}
    topDialogApp = null;
  }
  if (topDialogEl) {
    topDialogEl.remove();
    topDialogEl = null;
  }
}

// --- activate / deactivate ---

export async function activate(_ctx) {
  PLUGIN_VERSION = _ctx.manifest.version || "0.0.0";

  uiState = _ctx.vue.reactive({
    lastMessage: "",
    periodId: "",
    periodName: "",
    startTime: "",
    endTime: "",
    periodActive: false,
    myCode: "",
    myMemberCount: 0,
    myVipDesc: "",
    targetMembers: 3,
    joined: false,
    joinedCode: "",
    joinedMemberCount: 0,
    joinedVipDesc: "",
  });

  startTopButton(_ctx);

  _ctx.vue.watch(
    () => _ctx.pinia?.state?.value?.user?.info?.token,
    (token) => {
      if (token) scheduleRun(_ctx, 2000);
    },
  );

  scheduleRun(_ctx, 3000);

  _ctx.dispose(() => {
    clearAuto();
    stopTopButton();
    uiState = null;
  });
}

export async function deactivate() {
  clearAuto();
  stopTopButton();
  uiState = null;
}
