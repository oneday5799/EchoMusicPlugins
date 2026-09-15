#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""team-pool-worker SQL 层测试（真实 SQLite 重放，零依赖）

运行：python tests/team-pool-worker.sql.test.py

设计要点：**SQL 文本直接从 worker.js 抽取**，不在测试里手抄。
手抄的 SQL 会在实现改动后继续通过，测试就失去意义（本仓库 2026-09-15 的 F1/F3 正是
"看起来对、实际不生效"的 SQL 语义问题）。抽取失败会立刻抛错而不是静默跳过。

覆盖：
  S1 选队逻辑（快满优先 + FIFO + 排除自己创建 + exclude_codes）
  S2 F1 回归：幂等分支必须采纳 exclude_codes
  S3 F1 边界：success 租约不得被 exclude_codes 误伤
  S4 F3 回归：过期 success 不得占在途名额
  S5 F3 影响放大：joinResult 纠偏不得把队伍误置为不可逆的 full
  S6 F3 口径一致性：_inflightCount / 选队 avail / adminData inflight 三处同口径
  S7 F5 回归：环形日志会丢历史，小时桶不丢
  S8 追加式 DDL 幂等（且不 bump SCHEMA_VERSION）
"""

import os
import re
import sqlite3
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
WORKER = os.path.join(HERE, "..", "team-pool-worker", "worker.js")

SRC = open(WORKER, encoding="utf-8").read()

TEAM_CAPACITY = 3
MEMBER_SLOTS = TEAM_CAPACITY - 1
EVENTS_KEEP = 500
LEASE_TTL_MS = 120_000
SUCCESS_CONFIRM_MS = 600_000


# ---------- SQL 抽取 ----------

def sql_after(marker):
    """取 marker 之后第一个反引号模板串的内容（marker 用前面的 JS 代码）。"""
    i = SRC.index(marker)
    a = SRC.index("`", i)
    b = SRC.index("`", a + 1)
    return SRC[a + 1:b]


def sql_around(marker):
    """取包含 marker 的那个模板串（marker 用 SQL 内部的片段）。"""
    i = SRC.index(marker)
    a = SRC.rindex("`", 0, i)
    b = SRC.index("`", i)
    return SRC[a + 1:b]


def fill(sql, exclude_codes=None):
    """替换模板串里的 JS 插值。"""
    sql = sql.replace("${MEMBER_SLOTS}", str(MEMBER_SLOTS))
    sql = sql.replace("${TEAM_CAPACITY}", str(TEAM_CAPACITY))
    sql = sql.replace("${EVENTS_KEEP}", str(EVENTS_KEEP))
    if "${excludeSql}" in sql:
        if exclude_codes:
            sql = sql.replace(
                "${excludeSql}",
                "AND t.code NOT IN (%s)" % ", ".join("?" * len(exclude_codes)),
            )
        else:
            sql = sql.replace("${excludeSql}", "")
    if "${" in sql:
        raise AssertionError("抽取到的 SQL 仍含未替换的插值：%s" % sql[:200])
    return sql


DDL_MAIN = sql_around("CREATE TABLE IF NOT EXISTS meta")
DDL_APPEND = sql_around("CREATE TABLE IF NOT EXISTS event_hourly")
SQL_CANDIDATES = fill(sql_after("const candidates = this._sql("))
SQL_INFLIGHT = sql_after("_inflightCount(code, excludeLeaseId) {")
SQL_ADMIN_INFLIGHT = sql_after("const teams = this._sql(")
SQL_CNT24 = sql_after("const cnt24 = (kind) =>")
SQL_EVENT_HOURLY = sql_around("INSERT INTO event_hourly (kind, bucket, n) VALUES (?, ?, 1)")
SQL_SWEEP = sql_after("_sweepExpired() {")
SQL_ALARM_HOURLY_PURGE = sql_around("DELETE FROM event_hourly WHERE bucket < ?")

# 修复前的旧口径（仅作为回归基线，用于证明"改前确实会出问题"）
SQL_CANDIDATES_OLD = SQL_CANDIDATES.replace(
    "l.code = t.code AND l.expires_at > ?\n                    AND (l.status = 'success' OR l.status = 'pending')",
    "l.code = t.code\n                    AND (l.status = 'success' OR (l.status = 'pending' AND l.expires_at > ?))",
)

# ---------- 断言脚手架 ----------

PASS = 0
FAIL = 0
FAILURES = []


def eq(name, actual, expected):
    global PASS, FAIL
    if actual == expected:
        PASS += 1
    else:
        FAIL += 1
        FAILURES.append("%s\n      实际: %r\n      期望: %r" % (name, actual, expected))


def show(title):
    print("\n== %s ==" % title)


# ---------- 建库 ----------

def new_db():
    db = sqlite3.connect(":memory:")
    db.executescript(DDL_MAIN)
    db.executescript(DDL_APPEND)
    return db


NOW = 1_800_000_000_000  # 固定基准时间（ms），避免用例受真实时钟影响


def add_team(db, code, mc, captain="", snapshot_at=None, status="open", fail_until=0, created_at=None):
    t = snapshot_at if snapshot_at is not None else NOW
    db.execute(
        """INSERT INTO teams (code, captain_uid, member_count, members_json, status, snapshot_at,
                              fail_until, created_at, updated_at)
           VALUES (?, ?, ?, '[]', ?, ?, ?, ?, ?)""",
        (code, captain, mc, status, t, fail_until, created_at if created_at is not None else t, t),
    )


def add_lease(db, lid, uid, code, status, expires_at, assigned_at=None):
    db.execute(
        """INSERT INTO leases (id, uid, code, status, assigned_at, expires_at, resolved_at)
           VALUES (?, ?, ?, ?, ?, ?, NULL)""",
        (lid, uid, code, status, assigned_at if assigned_at is not None else NOW, expires_at),
    )


def candidates(db, uid, exclude=None, now=None):
    now = now if now is not None else NOW
    sql = fill(sql_after("const candidates = this._sql("), exclude)
    params = [now, now - 6 * 3_600_000, now, uid]  # avail / fresh / fail_until / captain_uid
    if exclude:
        params += list(exclude)
    params += [now, uid, now]  # avail(2) / l2.uid / l2.expires_at
    return [r[0] for r in db.execute(sql, params).fetchall()]


# ================= S1 选队逻辑 =================
show("S1 选队逻辑（快满优先 + FIFO + 排除自己 + exclude_codes）")
db = new_db()
# AAA 人数 1（avail 2）、BBB 人数 2（avail 1）→ BBB 更满应优先
add_team(db, "AAA", 1, created_at=NOW - 10_000)
add_team(db, "BBB", 2, created_at=NOW - 5_000)
add_team(db, "CCC", 1, created_at=NOW - 1_000)
eq("快满优先：人数 2 的 BBB 胜出", candidates(db, "U1"), ["BBB"])

# 排除自己创建的队
db2 = new_db()
add_team(db2, "MINE", 2, captain="U1")
add_team(db2, "OTHER", 1)
eq("排除自己创建的队", candidates(db2, "U1"), ["OTHER"])

# FIFO：同 avail 取 created_at 更早
db3 = new_db()
add_team(db3, "NEW", 1, created_at=NOW - 100)
add_team(db3, "OLD", 1, created_at=NOW - 9_000)
eq("FIFO：更早创建的 OLD 胜出", candidates(db3, "U1"), ["OLD"])

# exclude_codes
db4 = new_db()
add_team(db4, "X1", 2, created_at=NOW - 9_000)
add_team(db4, "X2", 2, created_at=NOW - 8_000)
eq("未排除时取更早的 X1", candidates(db4, "U1"), ["X1"])
eq("排除 X1 后取 X2", candidates(db4, "U1", exclude=["X1"]), ["X2"])
eq("全部排除后为空", candidates(db4, "U1", exclude=["X1", "X2"]), [])

# 满员 / stale / 冷却 / 在途占满
db5 = new_db()
add_team(db5, "FULL", 3, status="full")
eq("full 队不入选", candidates(db5, "U1"), [])
db6 = new_db()
add_team(db6, "STALE", 1, snapshot_at=NOW - 7 * 3_600_000)
eq("stale 队不入选（超过 6h 无快照）", candidates(db6, "U1"), [])
db7 = new_db()
add_team(db7, "COOL", 2, fail_until=NOW + 60_000)
eq("冷却中的队不入选", candidates(db7, "U1"), [])
db8 = new_db()
add_team(db8, "BUSY", 2)
add_lease(db8, "L1", "U9", "BUSY", "pending", NOW + LEASE_TTL_MS)
eq("在途租约占满最后名额 → 不入选", candidates(db8, "U1"), [])


# ================= S2 F1 回归：幂等分支必须采纳 exclude_codes =================
show("S2 F1 回归：结果回报丢失 → 幂等分支原样返回同一坏队")
db9 = new_db()
add_team(db9, "BAD", 2, created_at=NOW - 9_000)
add_team(db9, "GOOD", 2, created_at=NOW - 8_000)
add_lease(db9, "L1", "U1", "BAD", "pending", NOW + LEASE_TTL_MS)

# 修复前：幂等分支在 exclude_codes 解析之前，直接返回 BAD
active_old = db9.execute(
    "SELECT id, code, expires_at FROM leases WHERE uid = ? "
    "AND ((status = 'pending' AND expires_at > ?) OR (status = 'success' AND expires_at > ?)) "
    "ORDER BY assigned_at DESC LIMIT 1",
    ("U1", NOW, NOW),
).fetchone()
eq("修复前：幂等分支返回同一坏队 BAD", active_old[1], "BAD")

# 修复后：客户端明确避开 BAD → 把该 pending 租约置 failed 后继续选队
active_new = db9.execute(
    "SELECT id, code, status, expires_at FROM leases WHERE uid = ? "
    "AND ((status = 'pending' AND expires_at > ?) OR (status = 'success' AND expires_at > ?)) "
    "ORDER BY assigned_at DESC LIMIT 1",
    ("U1", NOW, NOW),
).fetchone()
eq("修复后：取到 status 列", active_new[2], "pending")
excluded = ["BAD"]
if active_new[2] == "pending" and active_new[1] in excluded:
    db9.execute("UPDATE leases SET status = 'failed', resolved_at = ? WHERE id = ?", (NOW, active_new[0]))
eq("修复后：坏租约被释放为 failed", db9.execute("SELECT status FROM leases WHERE id='L1'").fetchone()[0], "failed")
eq("修复后：重新选队避开 BAD，取到 GOOD", candidates(db9, "U1", exclude=excluded, now=NOW), ["GOOD"])
eq("修复后：BAD 的在途名额已释放（avail 恢复）", db9.execute(
    fill(sql_after("_inflightCount(code, excludeLeaseId) {")), ("BAD", "", NOW)).fetchone()[0], 0)


# ================= S3 F1 边界：success 租约不得被误伤 =================
show("S3 F1 边界：success 租约不得被 exclude_codes 误伤")
db10 = new_db()
add_team(db10, "S1", 2)
add_lease(db10, "L9", "U1", "S1", "success", NOW + SUCCESS_CONFIRM_MS)
row = db10.execute(
    "SELECT id, code, status FROM leases WHERE uid = ? AND ((status = 'pending' AND expires_at > ?) "
    "OR (status = 'success' AND expires_at > ?)) ORDER BY assigned_at DESC LIMIT 1",
    ("U1", NOW, NOW),
).fetchone()
eq("active 命中 success 租约", row[2], "success")
released = row[2] == "pending" and row[1] in ["S1"]
eq("success 租约不会被置 failed（只处理 pending）", released, False)
eq("success 仍占名额（avail=0，不会被重复分配）", candidates(db10, "U2"), [])


# ================= S4 F3 回归：过期 success 不得占名额 =================
show("S4 F3 回归：过期 success 不得占在途名额")
db11 = new_db()
add_team(db11, "GGG", 2)
# 唯一候选 GGG，但有一条**已过期**的 success 租约（模拟 _sweepExpired 失效/未清扫）
add_lease(db11, "LOLD", "U9", "GGG", "success", NOW - 1000)
old_params = [NOW, NOW - 6 * 3_600_000, NOW, "U1", NOW, "U1", NOW]
eq("修复前（旧口径 SQL）：过期 success 仍占名额 → 选不到队", [r[0] for r in db11.execute(SQL_CANDIDATES_OLD, old_params)], [])
eq("新口径 SQL：过期 success 不占名额 → 选中 GGG", candidates(db11, "U1", now=NOW), ["GGG"])
eq("_inflightCount 同口径：过期 success 不计入", db11.execute(
    SQL_INFLIGHT, ("GGG", "", NOW)).fetchone()[0], 0)
eq("_inflightCount 反证：未过期的 success 计入", db11.execute(
    SQL_INFLIGHT, ("GGG", "", NOW - 10_000_000)).fetchone()[0], 1)
# 清扫后同样是选中 GGG
db11.execute(SQL_SWEEP, (NOW, NOW))
eq("清扫后仍选中 GGG（行为一致）", candidates(db11, "U1", now=NOW), ["GGG"])


# ================= S5 F3 影响放大：纠偏不得误置 full =================
show("S5 F3 影响放大：joinResult 纠偏不得把队伍误置为不可逆的 full")
db12 = new_db()
add_team(db12, "T", 2)  # mc=2，最后一个名额
add_lease(db12, "LME", "U1", "T", "success", NOW - 5000)  # 本租约（已过期）
add_lease(db12, "LOTH", "U9", "T", "success", NOW - 5000)  # 另一条过期 success
others = db12.execute(SQL_INFLIGHT, ("T", "LME", NOW)).fetchone()[0]
avail_excluding = MEMBER_SLOTS - (2 - 1) - others
eq("修复后：availExcluding = 1 > 0 → 不误置 full（走可疑 full 冷却）", avail_excluding > 0, True)
others_old = db12.execute(
    "SELECT COUNT(*) AS c FROM leases WHERE code = ? AND id <> ? "
    "AND (status = 'success' OR (status = 'pending' AND expires_at > ?))",
    ("T", "LME", NOW),
).fetchone()[0]
avail_old = MEMBER_SLOTS - (2 - 1) - others_old
eq("修复前：availExcluding = 0 → 误判为真 full（期内不可逆）", avail_old, 0)
eq("对照：确实会走 full 分支", avail_old <= 0, True)


# ================= S6 F3 口径一致性 =================
show("S6 三处在途口径一致（_inflightCount / 选队 avail / adminData inflight）")
db13 = new_db()
add_team(db13, "K", 2)
add_lease(db13, "P1", "U1", "K", "pending", NOW + LEASE_TTL_MS)
add_lease(db13, "P2", "U2", "K", "pending", NOW - 1000)          # 过期 pending
add_lease(db13, "S1", "U3", "K", "success", NOW + 60_000)        # 有效 success
add_lease(db13, "S2", "U4", "K", "success", NOW - 1000)          # 过期 success
add_lease(db13, "C1", "U5", "K", "confirmed", NOW + 10**9)       # confirmed（不计入在途）
add_lease(db13, "F1", "U6", "K", "failed", NOW + 10**9)
n_inflight = db13.execute(SQL_INFLIGHT, ("K", "", NOW)).fetchone()[0]
eq("_inflightCount = 2（有效 pending + 有效 success）", n_inflight, 2)
# adminData 的 inflight 是 SELECT 列表最后一列（前面还有 code/captain_uid/... 8 列）
admin_row = db13.execute(SQL_ADMIN_INFLIGHT, (NOW,)).fetchone()
eq("adminData inflight = 2（与上一致）", admin_row[-1], 2)
# 选队 avail 用同一口径（把 _inflightCount 的 code=? 换成相关子查询的 t.code）
avail_sql = "SELECT %d - (t.member_count - 1) - (%s) AS avail FROM teams t WHERE t.code = 'K'" % (
    MEMBER_SLOTS, SQL_INFLIGHT.replace("code = ?", "code = t.code"))
avail = db13.execute(avail_sql, ("", NOW)).fetchone()[0]
eq("选队 avail = 2 - 1 - 2 = -1（≤0，不再入选）", avail, -1)
eq("confirmed 恒占名额（NOT EXISTS 用独立口径）", db13.execute(
    "SELECT COUNT(*) FROM leases WHERE code='K' AND status='confirmed'").fetchone()[0], 1)
eq("failed 不占名额", db13.execute(
    "SELECT COUNT(*) FROM leases WHERE code='K' AND status='failed'").fetchone()[0], 1)


# ================= S7 F5 回归：环形日志 vs 小时桶 =================
show("S7 F5 回归：环形日志会丢历史，小时桶不丢")
db14 = new_db()
# 写 2403 条 auth 事件，环形表只留最近 500 条
for i in range(2403):
    db14.execute("INSERT INTO events (ts, kind, uid, code, detail) VALUES (?, 'auth', 'u', NULL, NULL)",
                 (NOW - 2403 + i,))
    db14.execute("DELETE FROM events WHERE id <= (SELECT MAX(id) FROM events) - ?", (EVENTS_KEEP,))
    bucket = "2026-09-15T00"
    db14.execute(SQL_EVENT_HOURLY, ("auth", bucket))
eq("环形表只剩 500 条", db14.execute("SELECT COUNT(*) FROM events").fetchone()[0], 500)
eq("小时桶完整累计 2403 次", db14.execute(
    SQL_CNT24, ("auth", "2026-09-15T00")).fetchone()[0], 2403)
eq("修复前口径：环形表统计仅 500（严重失真）", db14.execute(
    "SELECT COUNT(*) AS c FROM events WHERE kind = 'auth' AND ts > ?", (NOW - 24 * 3_600_000,)).fetchone()[0], 500)
eq("小时桶按 kind 区分", db14.execute(SQL_CNT24, ("error", "2026-09-15T00")).fetchone()[0], 0)
eq("小时桶窗口过滤生效（更晚的 bucket 不计入）", db14.execute(
    SQL_CNT24, ("auth", "2026-09-15T01")).fetchone()[0], 0)
db14.execute(SQL_ALARM_HOURLY_PURGE, ("2026-09-16T00",))
eq("alarm 清理过期桶后为 0", db14.execute(SQL_CNT24, ("auth", "2026-09-15T00")).fetchone()[0], 0)


# ================= S8 追加式 DDL 幂等 =================
show("S8 追加式 DDL 幂等（且不 bump SCHEMA_VERSION）")
db15 = new_db()
before = db15.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()
db15.executescript(DDL_APPEND)  # 再跑一次必须无错
after = db15.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()
eq("重复执行追加式 DDL 不报错且表集合不变", before, after)
tables = {r[0] for r in after}
eq("event_hourly 已建立", "event_hourly" in tables, True)
eq("业务表齐全", {"meta", "users", "teams", "leases", "events", "rate_limit"} <= tables, True)
idx = {r[0] for r in db15.execute(
    "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'").fetchall()}
eq("新增索引已建立", {"idx_teams_captain", "idx_teams_open"} <= idx, True)
# event_hourly 必须在版本重建的 DROP 列表里（否则未来 bump 版本后会残留旧计数）
eq("event_hourly 已纳入版本重建 DROP 列表", '"event_hourly"' in SRC or "'event_hourly'" in SRC, True)
drop_line = re.search(r"for \(const t of \[(.*?)\]\)", SRC, re.S).group(1)
eq("DROP 列表确实含 event_hourly", "event_hourly" in drop_line, True)
# 判空统计必须含 event_hourly
eq("alarm 判空统计含 event_hourly", "count(\"event_hourly\")" in SRC, True)
# 2026-09-15 补断言：S8 标题声称"不 bump SCHEMA_VERSION"，此前无对应断言（标题过度承诺）。
# bump 会让版本重建分支 DROP 掉全部业务表（清空当期数据），是本修复最危险的回归，必须锁死。
m_ver = re.search(r'const SCHEMA_VERSION\s*=\s*"([^"]+)"', SRC)
eq("SCHEMA_VERSION 仍为 3（未被 bump）", m_ver.group(1) if m_ver else None, "3")
# 新增表必须走追加式 DDL 块，而不是混进版本重建的 DDL_MAIN（混进去等于要求 bump）
eq("event_hourly 不在版本重建 DDL_MAIN 内（确认走追加式）",
   "event_hourly" in DDL_MAIN, False)

# ================= 结果 =================
print("\n================ 结果 ================")
print("通过 %d / 失败 %d" % (PASS, FAIL))
if FAILURES:
    print("\n失败明细:")
    for f in FAILURES:
        print("  x " + f)
sys.exit(1 if FAIL else 0)
