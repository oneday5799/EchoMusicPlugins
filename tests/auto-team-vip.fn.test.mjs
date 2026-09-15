// auto-team-vip 纯函数单测（无宿主依赖）
// 运行：node tests/auto-team-vip.fn.test.mjs
//
// 覆盖：classifyJoinError / normalizePeriod / normalizeTeamInfo / parseJoinResponse
// 其中 parseJoinResponse 的用例包含 2026-09-15 的 F19 回归（乐观默认导致失败被判成功）。

import { fileURLToPath } from "node:url";
import { loadFragment, makeAssert } from "./_load-fragment.mjs";

const { eq, show, report } = makeAssert();

const core = await loadFragment(fileURLToPath(new URL("../auto-team-vip/index.js", import.meta.url)), {
  from: "const TARGET_MEMBERS = 3;",
  to: "// ---------- Dialog ----------",
  exports: ["classifyJoinError", "normalizePeriod", "normalizeTeamInfo", "parseJoinResponse"],
});
const { classifyJoinError, normalizePeriod, normalizeTeamInfo, parseJoinResponse } = core;

// ================= classifyJoinError =================
show("classifyJoinError —— 实测错误码");
eq("143001 队伍不存在→invalid", classifyJoinError({ error_code: 143001, error_msg: "队伍不存在", status: 0 }).kind, "invalid");
eq("143004 满员→full", classifyJoinError({ error_code: 143004, error_msg: "队伍已满员", status: 0 }).kind, "full");
eq("143010 已是成员→already_joined", classifyJoinError({ error_code: 143010, error_msg: "你已经是队伍成员~", status: 0 }).kind, "already_joined");
eq("143005 设备级→already_joined", classifyJoinError({ error_code: 143005, error_msg: "每台设备只能加入一个队伍~~", status: 0 }).kind, "already_joined");
eq("20006 历史码→full", classifyJoinError({ error_code: 20006, status: 0 }).kind, "full");
eq("未知码→transient", classifyJoinError({ error_code: 99999, error_msg: "未知错误", status: 0 }).kind, "transient");

show("classifyJoinError —— 无码仅文案（关键词兜底）");
eq("文案含满→full", classifyJoinError({ error_msg: "队伍已满" }).kind, "full");
eq("文案含不存在→invalid", classifyJoinError({ error_msg: "组队码错误" }).kind, "invalid");
eq("文案含已加入→already_joined", classifyJoinError({ error_msg: "你已加入该队伍" }).kind, "already_joined");
eq("文案含已解散→invalid", classifyJoinError({ error_msg: "队伍已解散" }).kind, "invalid");
eq("文案含无效→invalid", classifyJoinError({ error_msg: "无效的组队码" }).kind, "invalid");

show("classifyJoinError —— 边界");
eq("满+不存在并存→full 优先", classifyJoinError({ error_msg: "队伍不存在或已满" }).kind, "full");
eq("code 字段别名被识别", classifyJoinError({ code: 143001 }).kind, "invalid");
eq("空对象→transient", classifyJoinError({}).kind, "transient");
eq("null→transient", classifyJoinError(null).kind, "transient");
eq("undefined→transient", classifyJoinError(undefined).kind, "transient");
eq("errorCode 一并回传", classifyJoinError({ error_code: 143004 }).errorCode, 143004);
eq("errorMsg 一并回传", classifyJoinError({ error_msg: "队伍已满" }).errorMsg, "队伍已满");

// ================= normalizePeriod =================
show("normalizePeriod");
eq("status 0→active", normalizePeriod({ data: { current_period_info: { id: "288", name: "第九期", status: 0, start_time: "a", end_time: "b", team_member_count: 3 } } }).active, true);
eq("status 1→inactive", normalizePeriod({ data: { current_period_info: { id: "288", status: 1 } } }).active, false);
eq("status 缺失→inactive", normalizePeriod({ data: { current_period_info: { id: "288" } } }).active, false);
eq("periodId 取 id 并字符串化", normalizePeriod({ data: { current_period_info: { id: 288 } } }).periodId, "288");
eq("periodId 取 period_id", normalizePeriod({ period_id: "289" }).periodId, "289");
eq("无 id→空串", normalizePeriod({ data: {} }).periodId, "");
eq("totalMembers 兜底 3", normalizePeriod({ data: { current_period_info: { id: "1", team_member_count: 2 } } }).totalMembers, 3);
eq("totalMembers 4 保留", normalizePeriod({ data: { current_period_info: { id: "1", team_member_count: 4 } } }).totalMembers, 4);

// ================= normalizeTeamInfo =================
show("normalizeTeamInfo");
const ti = normalizeTeamInfo({
  data: {
    my_create_team_list: [{ team_code: "AAA", member_list: [
      { userid: "1", nick_name: "甲", role: 1, vip_desc: "7天" },
      { userid: "2", nick_name: "乙", role: 2, vip_desc: "5天" }] }],
    my_join_team_list: [{ team_code: "BBB", member_list: [
      { userid: "9", nick_name: "丙", role: 1 }, { userid: "1", role: 2 }, { userid: "3", role: 2 }] }],
  },
});
eq("created.code", ti.created.code, "AAA");
eq("created.memberCount=member_list.length", ti.created.memberCount, 2);
eq("created.members 长度", ti.created.members.length, 2);
eq("role=1 判定为队长", ti.created.members[0].role, 1);
eq("reward 取 vip_desc", ti.created.members[0].reward, "7天");
eq("joined.code", ti.joined.code, "BBB");
eq("joined.memberCount 封顶 3", ti.joined.memberCount, 3);
eq("无 create 列表→created null", normalizeTeamInfo({ data: {} }).created, null);
eq("无 member_list→回退 member_count", normalizeTeamInfo({ data: { my_create_team_list: [{ team_code: "C", member_count: 2 }] } }).created.memberCount, 2);
eq("member_list 空数组→回退字段", normalizeTeamInfo({ data: { my_create_team_list: [{ team_code: "C", member_list: [], member_count: 2 }] } }).created.memberCount, 2);
eq("member_count=0→下界 1", normalizeTeamInfo({ data: { my_create_team_list: [{ team_code: "C", member_list: [], member_count: 0 }] } }).created.memberCount, 1);
eq("member_count=9→上界 3", normalizeTeamInfo({ data: { my_create_team_list: [{ team_code: "C", member_list: [], member_count: 9 }] } }).created.memberCount, 3);
eq("member 缺 userid 被剔除", normalizeTeamInfo({ data: { my_create_team_list: [{ team_code: "C", member_list: [{ nick_name: "x" }, { userid: "1" }] }] } }).created.members.length, 1);
eq("members 上限 3", normalizeTeamInfo({ data: { my_create_team_list: [{ team_code: "C", member_list: [{ userid: "1" }, { userid: "2" }, { userid: "3" }, { userid: "4" }] }] } }).created.members.length, 3);
eq("memberCount 与 members 同步封顶", normalizeTeamInfo({ data: { my_create_team_list: [{ team_code: "C", member_list: [{ userid: "1" }, { userid: "2" }, { userid: "3" }, { userid: "4" }] }] } }).created.memberCount, 3);
eq("无 team_code 的队被丢弃", normalizeTeamInfo({ data: { my_create_team_list: [{ member_list: [{ userid: "1" }] }] } }).created, null);
eq("member 非数组→空 members", normalizeTeamInfo({ data: { my_create_team_list: [{ team_code: "C", member_list: "x" }] } }).created.members, []);
eq("nick 超长截断 48", normalizeTeamInfo({ data: { my_create_team_list: [{ team_code: "C", member_list: [{ userid: "1", nick_name: "字".repeat(80) }] }] } }).created.members[0].nick.length, 48);

// ================= parseJoinResponse =================
show("parseJoinResponse —— 正常形态");
eq("HTTP200+status1+code0→成功", parseJoinResponse({ ok: true, status: 200, body: { status: 1, error_code: 0 } }), { httpOk: true, bizOk: true, errorCode: 0, errorMsg: "" });
eq("HTTP502+status0+143001→失败", parseJoinResponse({ ok: true, status: 502, body: { status: 0, error_code: 143001, error_msg: "队伍不存在" } }), { httpOk: false, bizOk: false, errorCode: 143001, errorMsg: "队伍不存在" });
eq("HTTP200 但 status0→bizOk false", parseJoinResponse({ ok: true, status: 200, body: { status: 0, error_code: 0 } }).bizOk, false);
eq("网络层失败 ok:false→httpOk false", parseJoinResponse({ ok: false, error: "timeout" }).httpOk, false);
eq("HTTP404→httpOk false", parseJoinResponse({ ok: true, status: 404, body: { status: 1, error_code: 0 } }).httpOk, false);

show("parseJoinResponse —— F19 回归：乐观默认导致失败被判成功");
eq("body 为 null→bizOk false", parseJoinResponse({ ok: true, status: 200, body: null }).bizOk, false);
eq("body 为空对象→bizOk false", parseJoinResponse({ ok: true, status: 200, body: {} }).bizOk, false);
eq("body 为空串→bizOk false", parseJoinResponse({ ok: true, status: 200, body: "" }).bizOk, false);
eq("body 缺 status 但有 error_code=0→bizOk false", parseJoinResponse({ ok: true, status: 200, body: { error_code: 0 } }).bizOk, false);
eq("body 用 code 别名报错且无 status→bizOk false", parseJoinResponse({ ok: true, status: 200, body: { code: 143001 } }).bizOk, false);
eq("body 为 undefined→bizOk false", parseJoinResponse({ ok: true, status: 200 }).bizOk, false);
eq("status 为字符串 \"1\"→bizOk true（容忍字符串化）", parseJoinResponse({ ok: true, status: 200, body: { status: "1", error_code: 0 } }).bizOk, true);
eq("status1 且省略 error_code→bizOk true（容忍省略）", parseJoinResponse({ ok: true, status: 200, body: { status: 1 } }).bizOk, true);
eq("status1 但 error_code 非 0→bizOk false", parseJoinResponse({ ok: true, status: 200, body: { status: 1, error_code: 143010 } }).bizOk, false);
eq("status1 且 code 别名非 0→bizOk false", parseJoinResponse({ ok: true, status: 200, body: { status: 1, code: 143004 } }).bizOk, false);
eq("errorCode 取 code 别名", parseJoinResponse({ ok: true, status: 200, body: { status: 0, code: 143001 } }).errorCode, 143001);

report();
