"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { fetchWeeklyRetentionStats, fetchWeeklyReferralStats, fetchEmployees, fetchDeals, fetchAllLearningProgress } from "@/lib/supabase/db";
import type { Employee, Deal } from "@/types";

/* ─── Design Tokens ─── */
const T = {
  bg: "var(--background)", surface: "var(--sidebar)", card: "var(--card)", border: "var(--border)",
  teal: "#00D4FF", green: "#10B981", red: "#EF4444", amber: "#F59E0B",
  purple: "#8B5CF6", pink: "#EC4899", text: "var(--foreground)", mid: "var(--muted-foreground)", dim: "#475569",
};

const LS_KEY = "cc:weekly";
const LS_HISTORY = "cc:weekly_history";
const GOAL_90DAY = 70000;
const WEEKLY_TARGET = 17500;

/* ─── Types ─── */
interface Member { name: string; calls: string; demos: string; closed: string; avgVal: string; rate: string; status: string; }
interface WeeklyRev { w: string; rev: string; tgt: number; }
interface Task { task: string; owner: string; deadline: string; timeEstimate?: number; timeSpent?: number; completed?: boolean; }
interface WeeklyData {
  weekLabel: string;
  revenue: string; closed: string; closeRate: string; renewRate: string;
  members: Member[];
  weeklyRev: WeeklyRev[];
  srcNew: string; srcUps: string; srcRef: string; srcRen: string;
  retention: { renewed: string; expiring: string; contacted: string; upsell: string; renewRate: string; };
  referral: { active: string; newRefs: string; converted: string; rewards: string; convRate: string; };
  decisions: { worst: string; best: string; mainDecision: string; };
  tasks: Task[];
}

function emptyData(): WeeklyData {
  return {
    weekLabel: `أسبوع ${new Date().toLocaleDateString("ar-SA", { day: "numeric", month: "long" })}`,
    revenue: "", closed: "", closeRate: "", renewRate: "",
    members: [
      { name: "أ", calls: "", demos: "", closed: "", avgVal: "", rate: "", status: "🟡" },
      { name: "ب", calls: "", demos: "", closed: "", avgVal: "", rate: "", status: "🟡" },
      { name: "ج", calls: "", demos: "", closed: "", avgVal: "", rate: "", status: "🟡" },
      { name: "د", calls: "", demos: "", closed: "", avgVal: "", rate: "", status: "🟡" },
      { name: "هـ", calls: "", demos: "", closed: "", avgVal: "", rate: "", status: "🟡" },
    ],
    weeklyRev: [
      { w: "أسبوع 1", rev: "", tgt: 17500 },
      { w: "أسبوع 2", rev: "", tgt: 17500 },
      { w: "أسبوع 3", rev: "", tgt: 17500 },
      { w: "أسبوع 4", rev: "", tgt: 17500 },
    ],
    srcNew: "", srcUps: "", srcRef: "", srcRen: "",
    retention: { renewed: "", expiring: "", contacted: "", upsell: "", renewRate: "" },
    referral: { active: "", newRefs: "", converted: "", rewards: "", convRate: "" },
    decisions: { worst: "", best: "", mainDecision: "" },
    tasks: [
      { task: "", owner: "", deadline: "" },
      { task: "", owner: "", deadline: "" },
      { task: "", owner: "", deadline: "" },
    ],
  };
}

/* ─── Shared Styles ─── */
const cardStyle: React.CSSProperties = {
  background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20,
};
const inputBase: React.CSSProperties = {
  background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`,
  color: T.text, fontSize: 18, fontFamily: "monospace", outline: "none", width: "100%",
  padding: "6px 0", textAlign: "right" as const, direction: "rtl" as const,
};
const textareaBase: React.CSSProperties = {
  ...inputBase, fontSize: 14, fontFamily: "inherit", minHeight: 80, resize: "vertical" as const,
};

function pctColor(pct: number) { return pct >= 100 ? T.green : pct >= 70 ? T.teal : pct < 40 ? T.red : T.amber; }
function statusEmoji(pct: number) { return pct >= 100 ? "🟢" : pct >= 70 ? "🟡" : "🔴"; }

function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const c = color || pctColor(pct);
  return (
    <div style={{ height: 6, borderRadius: 3, background: T.border, width: "100%", marginTop: 6 }}>
      <div style={{ height: "100%", borderRadius: 3, background: c, width: `${pct}%`, transition: "width 0.3s" }} />
    </div>
  );
}

type RetentionStats = { renewed: number; expiring: number; contacted: number; upsell: number; renewRate: number };
type ReferralStats = { active: number; newRefs: number; converted: number; rewards: number; convRate: number };

export default function WeeklyMeetingView() {
  const [data, setData] = useState<WeeklyData>(emptyData);
  const [tab, setTab] = useState(0);
  const [saved, setSaved] = useState(true);
  const [retentionStats, setRetentionStats] = useState<RetentionStats | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [academyMap, setAcademyMap] = useState<Record<string, string[]>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = useRef(false);

  // Auto-save with debounce
  const schedSave = useCallback((d: WeeklyData) => {
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch { /* ignore */ }
      setSaved(true);
    }, 700);
  }, []);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as WeeklyData;
        setData(parsed);
      }
    } catch { /* ignore */ }
    loaded.current = true;
  }, []);

  // Load real stats from DB + employees & deals
  useEffect(() => {
    async function loadStats() {
      setLoadingStats(true);
      try {
        const [ret, ref, emps, deals, lp] = await Promise.all([
          fetchWeeklyRetentionStats(),
          fetchWeeklyReferralStats(),
          fetchEmployees(),
          fetchDeals(),
          fetchAllLearningProgress(),
        ]);
        setRetentionStats(ret);
        setReferralStats(ref);
        const aMap: Record<string, string[]> = {};
        lp.forEach((p) => { aMap[p.user_id] = p.completed_lessons; });
        setAcademyMap(aMap);

        // Auto-populate members from DB employees & deals
        if (emps.length > 0) {
          // Get current week start (Saturday)
          const now = new Date();
          const dayOfWeek = now.getDay();
          const diffToSat = (dayOfWeek + 1) % 7; // days since Saturday
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - diffToSat);
          weekStart.setHours(0, 0, 0, 0);

          setData(prev => {
            // Check if members were already customized (not default letters)
            const defaultNames = ["أ", "ب", "ج", "د", "هـ"];
            const isDefault = prev.members.length <= 5 && prev.members.every(m => defaultNames.includes(m.name) || m.name === "");

            if (!isDefault) return prev; // Don't overwrite user-customized data

            const members: Member[] = emps.map(emp => {
              const empDeals = deals.filter((d: Deal) => d.assigned_rep_name?.trim() === emp.name.trim());
              const weekDeals = empDeals.filter((d: Deal) => {
                const created = new Date(d.created_at);
                return created >= weekStart;
              });
              const closedDeals = weekDeals.filter((d: Deal) => d.stage === "مكتملة");
              const totalClosed = closedDeals.length;
              const totalDeals = weekDeals.length;
              const avgVal = totalClosed > 0 ? Math.round(closedDeals.reduce((s: number, d: Deal) => s + (d.deal_value || 0), 0) / totalClosed) : 0;
              const closeRate = totalDeals > 0 ? Math.round((totalClosed / totalDeals) * 100) : 0;

              // Determine status based on close rate
              const status = closeRate >= 35 ? "🟢" : closeRate >= 15 ? "🟡" : "🔴";

              return {
                name: emp.name,
                calls: "",
                demos: totalDeals > 0 ? String(totalDeals) : "",
                closed: totalClosed > 0 ? String(totalClosed) : "",
                avgVal: avgVal > 0 ? String(avgVal) : "",
                rate: closeRate > 0 ? `${closeRate}%` : "",
                status,
              };
            });

            const next = { ...prev, members };
            schedSave(next);
            return next;
          });
        }
      } catch { /* ignore */ }
      setLoadingStats(false);
    }
    loadStats();
  }, [schedSave]);

  function update(partial: Partial<WeeklyData>) {
    setData(prev => {
      const next = { ...prev, ...partial };
      schedSave(next);
      return next;
    });
  }

  function updateMember(idx: number, field: keyof Member, val: string) {
    setData(prev => {
      const members = prev.members.map((m, i) => i === idx ? { ...m, [field]: val } : m);
      const next = { ...prev, members };
      schedSave(next);
      return next;
    });
  }

  function updateWeeklyRev(idx: number, val: string) {
    setData(prev => {
      const weeklyRev = prev.weeklyRev.map((w, i) => i === idx ? { ...w, rev: val } : w);
      const next = { ...prev, weeklyRev };
      schedSave(next);
      return next;
    });
  }

  function updateTask(idx: number, field: keyof Task, val: string | number | boolean) {
    setData(prev => {
      const tasks = prev.tasks.map((t, i) => i === idx ? { ...t, [field]: val } : t);
      const next = { ...prev, tasks };
      schedSave(next);
      return next;
    });
  }

  function addTask() {
    setData(prev => {
      const next = { ...prev, tasks: [...prev.tasks, { task: "", owner: "", deadline: "" }] };
      schedSave(next);
      return next;
    });
  }

  function removeTask(idx: number) {
    setData(prev => {
      const next = { ...prev, tasks: prev.tasks.filter((_, i) => i !== idx) };
      schedSave(next);
      return next;
    });
  }

  function archiveWeek() {
    try {
      const raw = localStorage.getItem(LS_HISTORY);
      const history: WeeklyData[] = raw ? JSON.parse(raw) : [];
      history.unshift(data);
      if (history.length > 12) history.length = 12;
      localStorage.setItem(LS_HISTORY, JSON.stringify(history));
    } catch { /* ignore */ }
    const fresh = emptyData();
    setData(fresh);
    try { localStorage.setItem(LS_KEY, JSON.stringify(fresh)); } catch { /* ignore */ }
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.weekLabel.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tabs = ["📊 أرقام الأسبوع", "👥 أداء الفريق", "💰 تتبع الإيراد", "🔄 الاحتفاظ والإحالة", "🎯 قرارات ومهام"];

  // Computed
  const rev = parseFloat(data.revenue) || 0;
  const totalWeeklyRev = data.weeklyRev.reduce((s, w) => s + (parseFloat(w.rev) || 0), 0);
  const progressPct = GOAL_90DAY > 0 ? Math.round((totalWeeklyRev / GOAL_90DAY) * 100) : 0;
  const progressColor = progressPct >= 100 ? T.green : progressPct >= 70 ? T.teal : T.amber;

  return (
    <div style={{ direction: "rtl", color: T.text, fontFamily: "inherit" }}>
      {/* ─── Header ─── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <input
          value={data.weekLabel}
          onChange={e => update({ weekLabel: e.target.value })}
          style={{ ...inputBase, fontSize: 20, fontWeight: 700, fontFamily: "inherit", flex: "1 1 200px", minWidth: 200 }}
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: saved ? T.green : T.amber }}>
            {saved ? "✓ محفوظ" : "⟳ جاري الحفظ..."}
          </span>
          <button onClick={archiveWeek} style={btnStyle}>📁 أسبوع جديد</button>
          <button onClick={exportJSON} style={btnStyle}>⬇ تصدير</button>
        </div>
      </div>

      {/* ─── 90-Day Progress ─── */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>هدف 90 يوم: {GOAL_90DAY.toLocaleString()} ريال</span>
          <span style={{ fontSize: 13, color: progressColor, fontWeight: 700 }}>{progressPct}%</span>
        </div>
        <div style={{ height: 10, borderRadius: 5, background: T.border }}>
          <div style={{ height: "100%", borderRadius: 5, background: progressColor, width: `${Math.min(progressPct, 100)}%`, transition: "width 0.3s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: T.mid }}>
          <span>المحقق: {totalWeeklyRev.toLocaleString()} ريال</span>
          <span>المتبقي: {Math.max(GOAL_90DAY - totalWeeklyRev, 0).toLocaleString()} ريال</span>
          <span>الهدف الأسبوعي: {WEEKLY_TARGET.toLocaleString()} ريال</span>
        </div>
      </div>

      {/* ─── Tab Switcher ─── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap", background: T.surface, borderRadius: 12, padding: 4 }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: "8px 14px", borderRadius: 10, border: "none", cursor: "pointer",
            background: tab === i ? T.teal : "transparent",
            color: tab === i ? T.bg : T.mid,
            fontWeight: tab === i ? 700 : 400, fontSize: 12, fontFamily: "inherit",
            transition: "all 0.2s", whiteSpace: "nowrap",
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}
      {tab === 0 && <Tab1Numbers data={data} update={update} />}
      {tab === 1 && <Tab2Team data={data} updateMember={updateMember} academyMap={academyMap} />}
      {tab === 2 && <Tab3Revenue data={data} update={update} updateWeeklyRev={updateWeeklyRev} />}
      {tab === 3 && <Tab4Retention data={data} update={update} retentionStats={retentionStats} referralStats={referralStats} loadingStats={loadingStats} />}
      {tab === 4 && <Tab5Decisions data={data} update={update} updateTask={updateTask} addTask={addTask} removeTask={removeTask} />}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "8px 16px", borderRadius: 10, border: `1px solid ${T.border}`, cursor: "pointer",
  background: T.surface, color: T.text, fontSize: 12, fontFamily: "inherit", fontWeight: 600,
};

/* ═══════════════════════════════════════════════════════════════
   TAB 1 — أرقام الأسبوع
   ═══════════════════════════════════════════════════════════════ */
function Tab1Numbers({ data, update }: { data: WeeklyData; update: (p: Partial<WeeklyData>) => void }) {
  const cards = [
    { label: "💰 الإيراد الفعلي", key: "revenue" as const, target: 17500, unit: "ريال", color: T.teal },
    { label: "📦 صفقات مغلقة", key: "closed" as const, target: 15, unit: "", color: T.green },
    { label: "📈 نسبة الإغلاق %", key: "closeRate" as const, target: 35, unit: "%", color: T.purple },
    { label: "🔄 نسبة التجديد %", key: "renewRate" as const, target: 75, unit: "%", color: T.amber },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
      {cards.map(c => {
        const val = parseFloat(data[c.key]) || 0;
        const pct = c.target > 0 ? Math.round((val / c.target) * 100) : 0;
        return (
          <div key={c.key} style={{ ...cardStyle, borderTop: `2px solid ${c.color}` }}>
            <p style={{ fontSize: 13, color: T.mid, marginBottom: 8 }}>{c.label}</p>
            <input
              type="number"
              value={data[c.key]}
              onChange={e => update({ [c.key]: e.target.value })}
              placeholder="0"
              style={{ ...inputBase, fontSize: 28, fontWeight: 700, color: c.color }}
              onFocus={e => { e.target.style.borderBottomColor = T.teal; }}
              onBlur={e => { e.target.style.borderBottomColor = T.border; }}
            />
            <ProgressBar value={val} max={c.target} color={c.color} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11 }}>
              <span style={{ color: T.mid }}>الهدف: {c.target.toLocaleString()} {c.unit}</span>
              <span style={{ color: pctColor(pct) }}>{statusEmoji(pct)} {pct}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 2 — أداء الفريق
   ═══════════════════════════════════════════════════════════════ */
function Tab2Team({ data, updateMember, academyMap }: { data: WeeklyData; updateMember: (i: number, f: keyof Member, v: string) => void; academyMap: Record<string, string[]> }) {
  const TOTAL = 7; // Total academy lessons
  const cols = [
    { label: "الموظف", field: "name" as const },
    { label: "المكالمات", field: "calls" as const },
    { label: "العروض", field: "demos" as const },
    { label: "مغلق", field: "closed" as const },
    { label: "متوسط القيمة", field: "avgVal" as const },
    { label: "نسبة الإغلاق", field: "rate" as const },
    { label: "الحالة", field: "status" as const },
  ];
  const targets = { calls: "75", demos: "40", closed: "15", avgVal: "700+", rate: "35%+" };
  const statuses = ["🟢", "🟡", "🔴"];

  // Map member names to academy progress (best-effort match by user_id keys)
  const academyEntries = Object.entries(academyMap);

  function getAcademyPct(memberName: string): { pct: number; stage: string; color: string } {
    // Try to find matching entry - for now use any available data by index
    // In real usage, members would be linked by user_id
    const entry = academyEntries.find(([, lessons]) => lessons.length > 0);
    const lessons = entry ? entry[1] : [];
    const completed = lessons.length;
    const pct = Math.round((completed / TOTAL) * 100);

    let stage = "لم يبدأ";
    if (completed === TOTAL) stage = "مكتمل";
    else if (completed >= 5) stage = "كبّر الصفقة";
    else if (completed >= 2) stage = "تعلّم تبيع";
    else if (completed >= 1) stage = "اعرف منتجك";

    const color = pct === 100 ? T.green : pct > 0 ? T.amber : T.red;
    return { pct, stage, color };
  }

  return (
    <div style={{ ...cardStyle, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c.field} style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600, color: T.mid, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>
                {c.label}
              </th>
            ))}
            <th style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600, color: T.mid, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>
              🎓 تقدم الأكاديمية
            </th>
          </tr>
        </thead>
        <tbody>
          {data.members.map((m, i) => {
            const academy = getAcademyPct(m.name);
            return (
              <tr key={i} style={{ transition: "background 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.surface; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                {cols.map(c => (
                  <td key={c.field} style={{ padding: "8px", borderBottom: `1px solid ${T.border}20` }}>
                    {c.field === "status" ? (
                      <select
                        value={m.status}
                        onChange={e => updateMember(i, "status", e.target.value)}
                        style={{ background: "transparent", border: "none", fontSize: 18, cursor: "pointer", color: T.text }}
                      >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input
                        value={m[c.field]}
                        onChange={e => updateMember(i, c.field, e.target.value)}
                        type={c.field === "name" ? "text" : "text"}
                        style={{
                          ...inputBase, fontSize: 14,
                          fontFamily: c.field === "name" ? "inherit" : "monospace",
                          color: c.field === "name" ? T.text : T.teal,
                        }}
                        onFocus={e => { e.target.style.borderBottomColor = T.teal; }}
                        onBlur={e => { e.target.style.borderBottomColor = T.border; }}
                      />
                    )}
                  </td>
                ))}
                <td style={{ padding: "8px", borderBottom: `1px solid ${T.border}20`, minWidth: 120 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: academy.color, fontFamily: "monospace" }}>{academy.pct}%</span>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: T.border, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, background: academy.color, width: `${academy.pct}%`, transition: "width 0.3s" }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: T.mid, marginTop: 3 }}>{academy.stage}</div>
                </td>
              </tr>
            );
          })}
          {/* Target row */}
          <tr style={{ background: `${T.teal}10` }}>
            <td style={{ padding: "10px 8px", fontWeight: 700, fontSize: 12, color: T.teal }}>الهدف الكلي</td>
            {(["calls", "demos", "closed", "avgVal", "rate"] as const).map(f => (
              <td key={f} style={{ padding: "10px 8px", fontSize: 12, fontWeight: 600, color: T.mid, fontFamily: "monospace" }}>
                {targets[f]}
              </td>
            ))}
            <td />
            <td style={{ padding: "10px 8px", fontSize: 12, fontWeight: 600, color: T.green }}>100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 3 — تتبع الإيراد
   ═══════════════════════════════════════════════════════════════ */
function Tab3Revenue({ data, update, updateWeeklyRev }: {
  data: WeeklyData;
  update: (p: Partial<WeeklyData>) => void;
  updateWeeklyRev: (i: number, v: string) => void;
}) {
  const sources = [
    { label: "عملاء جدد", key: "srcNew" as const, target: 30000, color: T.teal },
    { label: "Upsell", key: "srcUps" as const, target: 10000, color: T.purple },
    { label: "إحالات", key: "srcRef" as const, target: 5000, color: T.green },
    { label: "تجديدات", key: "srcRen" as const, target: 25000, color: T.amber },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Weekly revenue tracker */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>تتبع الإيراد الأسبوعي</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {data.weeklyRev.map((w, i) => {
            const val = parseFloat(w.rev) || 0;
            const pct = w.tgt > 0 ? Math.round((val / w.tgt) * 100) : 0;
            return (
              <div key={i} style={{ ...cardStyle, borderTop: `2px solid ${pctColor(pct)}` }}>
                <p style={{ fontSize: 12, color: T.mid, marginBottom: 6 }}>{w.w}</p>
                <input
                  type="number"
                  value={w.rev}
                  onChange={e => updateWeeklyRev(i, e.target.value)}
                  placeholder="0"
                  style={{ ...inputBase, fontSize: 22, fontWeight: 700, color: T.teal }}
                  onFocus={e => { e.target.style.borderBottomColor = T.teal; }}
                  onBlur={e => { e.target.style.borderBottomColor = T.border; }}
                />
                <ProgressBar value={val} max={w.tgt} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: T.mid }}>
                  <span>الهدف: {w.tgt.toLocaleString()}</span>
                  <span>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue sources */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>مصادر الإيراد</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {sources.map(s => {
            const val = parseFloat(data[s.key]) || 0;
            const pct = s.target > 0 ? Math.round((val / s.target) * 100) : 0;
            return (
              <div key={s.key} style={{ ...cardStyle, borderTop: `2px solid ${s.color}` }}>
                <p style={{ fontSize: 12, color: T.mid, marginBottom: 6 }}>{s.label}</p>
                <input
                  type="number"
                  value={data[s.key]}
                  onChange={e => update({ [s.key]: e.target.value })}
                  placeholder="0"
                  style={{ ...inputBase, fontSize: 22, fontWeight: 700, color: s.color }}
                  onFocus={e => { e.target.style.borderBottomColor = T.teal; }}
                  onBlur={e => { e.target.style.borderBottomColor = T.border; }}
                />
                <ProgressBar value={val} max={s.target} color={s.color} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: T.mid }}>
                  <span>الهدف: {s.target.toLocaleString()} ريال</span>
                  <span>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 4 — الاحتفاظ والإحالة
   ═══════════════════════════════════════════════════════════════ */
function Tab4Retention({ data, update, retentionStats, referralStats, loadingStats }: {
  data: WeeklyData;
  update: (p: Partial<WeeklyData>) => void;
  retentionStats: RetentionStats | null;
  referralStats: ReferralStats | null;
  loadingStats: boolean;
}) {
  const retRows: { label: string; field: keyof RetentionStats; target?: number; unit?: string; color: string }[] = [
    { label: "تجديدات هذا الأسبوع", field: "renewed", color: T.teal },
    { label: "اشتراكات تنتهي قريباً", field: "expiring", color: T.amber },
    { label: "تم التواصل معهم", field: "contacted", color: T.green },
    { label: "Upsell مكتمل", field: "upsell", target: 5, color: T.purple },
    { label: "نسبة التجديد %", field: "renewRate", target: 75, unit: "%", color: T.teal },
  ];
  const refRows: { label: string; field: keyof ReferralStats; target?: number; unit?: string; color: string }[] = [
    { label: "محيلين نشطين", field: "active", target: 30, color: T.purple },
    { label: "إحالات جديدة", field: "newRefs", target: 15, color: T.teal },
    { label: "تحولت لعملاء", field: "converted", target: 5, color: T.green },
    { label: "مكافآت صُرفت", field: "rewards", unit: "ر.س", color: T.amber },
    { label: "نسبة التحويل %", field: "convRate", target: 33, unit: "%", color: T.purple },
  ];

  const dbBadge: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 10, padding: "2px 8px", borderRadius: 6,
    background: `${T.teal}15`, color: T.teal, fontWeight: 600,
  };

  const loadingDot = loadingStats ? "⟳" : "✓";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
      {/* Retention */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.teal }}>🔄 الاحتفاظ بالعملاء</h3>
          <span style={dbBadge}>{loadingDot} من قاعدة البيانات</span>
        </div>
        {retRows.map(r => {
          const dbVal = retentionStats ? retentionStats[r.field] : null;
          const displayVal = dbVal !== null ? (r.unit === "%" ? `${dbVal}%` : String(dbVal)) : "—";
          const pct = r.target && dbVal !== null ? Math.min(Math.round((dbVal / r.target) * 100), 100) : null;
          return (
            <div key={r.field} style={{ padding: "12px 0", borderBottom: `1px solid ${T.border}20` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: T.mid, flex: 1 }}>
                  {r.label}
                  {r.target ? <span style={{ fontSize: 10, color: T.dim }}> / هدف: {r.target}{r.unit || ""}</span> : null}
                </span>
                <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: r.color, minWidth: 60, textAlign: "left" as const }}>
                  {loadingStats ? "..." : displayVal}
                </span>
              </div>
              {pct !== null && !loadingStats && (
                <div style={{ height: 4, borderRadius: 2, background: T.border, marginTop: 6, width: "100%" }}>
                  <div style={{ height: "100%", borderRadius: 2, background: r.color, width: `${pct}%`, transition: "width 0.3s" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Referral */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.purple }}>🎁 برنامج الإحالة</h3>
          <span style={{ ...dbBadge, background: `${T.purple}15`, color: T.purple }}>{loadingDot} من قاعدة البيانات</span>
        </div>
        {refRows.map(r => {
          const dbVal = referralStats ? referralStats[r.field] : null;
          const displayVal = dbVal !== null ? (r.unit === "%" ? `${dbVal}%` : r.unit === "ر.س" ? `${dbVal.toLocaleString()} ر.س` : String(dbVal)) : "—";
          const pct = r.target && dbVal !== null ? Math.min(Math.round((dbVal / r.target) * 100), 100) : null;
          return (
            <div key={r.field} style={{ padding: "12px 0", borderBottom: `1px solid ${T.border}20` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: T.mid, flex: 1 }}>
                  {r.label}
                  {r.target ? <span style={{ fontSize: 10, color: T.dim }}> / هدف: {r.target}{r.unit || ""}</span> : null}
                </span>
                <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: r.color, minWidth: 60, textAlign: "left" as const }}>
                  {loadingStats ? "..." : displayVal}
                </span>
              </div>
              {pct !== null && !loadingStats && (
                <div style={{ height: 4, borderRadius: 2, background: T.border, marginTop: 6, width: "100%" }}>
                  <div style={{ height: "100%", borderRadius: 2, background: r.color, width: `${pct}%`, transition: "width 0.3s" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 5 — قرارات ومهام
   ═══════════════════════════════════════════════════════════════ */
const TIMER_PRESETS_W = [15, 25, 30, 45, 60, 90];
const EARLY_MSGS = [
  "🏆 ماشاء الله! أنجزت قبل الوقت",
  "⚡ سرعة خارقة! أداء ممتاز",
  "🔥 أنت آلة إنجاز! استمر",
  "💪 كفو! أثبتّ إنك تقدر",
  "🎯 دقيق وسريع. هذا هو التميز",
];

const HOURLY_TIPS_W: Record<number, string> = {
  7: "🌅 صباح الإنجاز! ابدأ بأصعب مهمة",
  8: "🎯 الساعة الذهبية — ركّز بدون مقاطعات",
  9: "🧠 التركيز العميق يبدأ الآن",
  10: "⚡ ذروة الإنتاجية. استثمر كل دقيقة",
  11: "🔥 أنجز المهام المعقدة قبل التعب",
  12: "☕ وقت الاستراحة! جدد طاقتك",
  13: "🌿 ابدأ بمهمة خفيفة بعد الغداء",
  14: "📋 اعمل على المهام المتوسطة",
  15: "📊 راجع إنجازاتك. كل مهمة = خطوة للأمام",
  16: "🏁 أنهِ المهام المعلقة وجهّز لبكرة",
  17: "📝 رتّب مهام بكرة. التخطيط = إنتاجية",
  18: "🌙 أحسنت! استرح واشحن طاقتك",
};

function Tab5Decisions({ data, update, updateTask, addTask, removeTask }: {
  data: WeeklyData;
  update: (p: Partial<WeeklyData>) => void;
  updateTask: (i: number, f: keyof Task, v: string | number | boolean) => void;
  addTask: () => void;
  removeTask: (i: number) => void;
}) {
  const [activeTimer, setActiveTimer] = useState<{ idx: number; remaining: number; total: number; paused: boolean } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pickerIdx, setPickerIdx] = useState<number | null>(null);
  const [customMin, setCustomMin] = useState(25);
  const [earlyMsg, setEarlyMsg] = useState<string | null>(null);

  const hourlyTip = useMemo(() => {
    const h = new Date().getHours();
    return HOURLY_TIPS_W[h] || (h < 7 ? "🌙 وقت مبكر! جهّز خطتك" : "⭐ أحسنت! غداً يوم جديد");
  }, []);

  // Timer tick
  useEffect(() => {
    if (activeTimer && !activeTimer.paused && activeTimer.remaining > 0) {
      timerRef.current = setInterval(() => {
        setActiveTimer(prev => {
          if (!prev || prev.paused) return prev;
          if (prev.remaining <= 1) { clearInterval(timerRef.current!); return { ...prev, remaining: 0 }; }
          return { ...prev, remaining: prev.remaining - 1 };
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [activeTimer?.idx, activeTimer?.paused, activeTimer?.remaining === 0 ? 0 : 1]);

  const startTimer = (idx: number, minutes: number) => {
    setPickerIdx(null);
    setActiveTimer({ idx, remaining: minutes * 60, total: minutes * 60, paused: false });
    updateTask(idx, "timeEstimate", minutes);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveTimer(null);
  };

  const completeTimer = (idx: number) => {
    if (!activeTimer || activeTimer.idx !== idx) return;
    const spent = Math.max(1, Math.round((activeTimer.total - activeTimer.remaining) / 60));
    const isEarly = activeTimer.remaining > 0;
    updateTask(idx, "timeSpent", spent);
    updateTask(idx, "completed", true);
    if (isEarly) {
      setEarlyMsg(EARLY_MSGS[Math.floor(Math.random() * EARLY_MSGS.length)]);
      setTimeout(() => setEarlyMsg(null), 4000);
    }
    stopTimer();
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Timer stats
  const timerStats = useMemo(() => {
    const timed = data.tasks.filter(t => t.timeEstimate && t.timeSpent && t.completed);
    if (timed.length === 0) return null;
    const early = timed.filter(t => t.timeSpent! <= t.timeEstimate!).length;
    return { total: timed.length, earlyRate: Math.round((early / timed.length) * 100) };
  }, [data.tasks]);

  const decisions = [
    { label: "📉 وش الرقم الأسوأ؟", field: "worst" as const, borderColor: T.red },
    { label: "📈 وش الرقم الأفضل؟", field: "best" as const, borderColor: T.green },
    { label: "⚡ القرار الواحد الأهم", field: "mainDecision" as const, borderColor: T.amber },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Decision cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
        {decisions.map(d => (
          <div key={d.field} style={{ ...cardStyle, borderRight: `3px solid ${d.borderColor}` }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: T.text }}>{d.label}</p>
            <textarea
              value={data.decisions[d.field]}
              onChange={e => update({ decisions: { ...data.decisions, [d.field]: e.target.value } })}
              placeholder="اكتب هنا..."
              style={textareaBase}
              onFocus={e => { e.target.style.borderBottomColor = T.teal; }}
              onBlur={e => { e.target.style.borderBottomColor = T.border; }}
            />
          </div>
        ))}
      </div>

      {/* Hourly tip + timer stats */}
      <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 14, padding: "14px 20px" }}>
        <span style={{ fontSize: 22 }}>{hourlyTip.split(" ")[0]}</span>
        <p style={{ flex: 1, fontSize: 13, color: T.mid }}>{hourlyTip.slice(hourlyTip.indexOf(" ") + 1)}</p>
        {timerStats && (
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <div style={{ textAlign: "center", padding: "4px 12px", borderRadius: 8, background: `${T.green}15`, border: `1px solid ${T.green}30` }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.green }}>{timerStats.earlyRate}%</span>
              <p style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>إنجاز مبكر</p>
            </div>
            <div style={{ textAlign: "center", padding: "4px 12px", borderRadius: 8, background: `${T.border}40` }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{timerStats.total}</span>
              <p style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>مهام بتوقيت</p>
            </div>
          </div>
        )}
      </div>

      {/* Early completion celebration */}
      {earlyMsg && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 100,
          background: `linear-gradient(135deg, ${T.green}E6, ${T.teal}E6)`,
          color: "#fff", padding: "16px 28px", borderRadius: 16, textAlign: "center",
          boxShadow: `0 8px 32px ${T.green}40`, animation: "bounce 0.6s ease",
        }}>
          <p style={{ fontSize: 16, fontWeight: 700 }}>{earlyMsg}</p>
          <p style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>وقتك ثمين وأنت أثبتّ ذلك!</p>
        </div>
      )}

      {/* Tasks table */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text }}>المهام</h3>
          <button onClick={addTask} style={{ ...btnStyle, fontSize: 12, padding: "6px 14px" }}>+ إضافة مهمة</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["#", "المهمة", "المسؤول", "الديدلاين", "⏱ مؤقت", "×"].map(h => (
                <th key={h} style={{ padding: "10px 8px", textAlign: h === "×" ? "center" : "right", fontWeight: 600, color: T.mid, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.tasks.map((t, i) => {
              const isTimerActive = activeTimer?.idx === i;
              const isCompleted = t.completed;

              return (
                <tr key={i}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.surface; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  style={{ opacity: isCompleted ? 0.5 : 1 }}
                >
                  <td style={{ padding: "8px", color: T.dim, fontSize: 12, borderBottom: `1px solid ${T.border}20` }}>
                    {isCompleted ? "✅" : i + 1}
                  </td>
                  <td style={{ padding: "8px", borderBottom: `1px solid ${T.border}20` }}>
                    <input value={t.task} onChange={e => updateTask(i, "task", e.target.value)}
                      style={{ ...inputBase, fontSize: 13, fontFamily: "inherit", textDecoration: isCompleted ? "line-through" : "none" }}
                      placeholder="المهمة..."
                      onFocus={e => { e.target.style.borderBottomColor = T.teal; }}
                      onBlur={e => { e.target.style.borderBottomColor = T.border; }} />
                  </td>
                  <td style={{ padding: "8px", borderBottom: `1px solid ${T.border}20` }}>
                    <input value={t.owner} onChange={e => updateTask(i, "owner", e.target.value)}
                      style={{ ...inputBase, fontSize: 13, fontFamily: "inherit", width: 100 }}
                      placeholder="المسؤول"
                      onFocus={e => { e.target.style.borderBottomColor = T.teal; }}
                      onBlur={e => { e.target.style.borderBottomColor = T.border; }} />
                  </td>
                  <td style={{ padding: "8px", borderBottom: `1px solid ${T.border}20` }}>
                    <input type="date" value={t.deadline} onChange={e => updateTask(i, "deadline", e.target.value)}
                      style={{ ...inputBase, fontSize: 12, fontFamily: "monospace", width: 130, direction: "ltr" as const, textAlign: "right" as const }}
                      onFocus={e => { e.target.style.borderBottomColor = T.teal; }}
                      onBlur={e => { e.target.style.borderBottomColor = T.border; }} />
                  </td>
                  {/* Timer column */}
                  <td style={{ padding: "8px", borderBottom: `1px solid ${T.border}20`, minWidth: 180 }}>
                    {isCompleted && t.timeEstimate && t.timeSpent ? (
                      <span style={{
                        fontSize: 11, padding: "3px 10px", borderRadius: 20,
                        background: t.timeSpent <= t.timeEstimate ? `${T.green}15` : `${T.amber}15`,
                        color: t.timeSpent <= t.timeEstimate ? T.green : T.amber,
                      }}>
                        {t.timeSpent <= t.timeEstimate ? "⚡" : "⏰"} {t.timeSpent} من {t.timeEstimate} د
                      </span>
                    ) : isTimerActive && activeTimer ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {/* Progress bar */}
                        <div style={{ flex: 1, height: 4, borderRadius: 4, background: `${T.border}60`, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: 4, transition: "width 1s linear",
                            width: `${((activeTimer.total - activeTimer.remaining) / activeTimer.total) * 100}%`,
                            background: activeTimer.remaining === 0 ? T.red : activeTimer.remaining <= 60 ? T.amber : T.teal,
                          }} />
                        </div>
                        <span style={{
                          fontFamily: "monospace", fontSize: 14, fontWeight: 700, minWidth: 50,
                          color: activeTimer.remaining === 0 ? T.red : activeTimer.remaining <= 60 ? T.amber : T.text,
                        }}>
                          {fmt(activeTimer.remaining)}
                        </span>
                        <button onClick={() => setActiveTimer(p => p ? { ...p, paused: !p.paused } : null)}
                          style={{ background: `${T.border}60`, border: "none", borderRadius: 6, color: T.text, cursor: "pointer", padding: "3px 8px", fontSize: 12 }}>
                          {activeTimer.paused ? "▶" : "⏸"}
                        </button>
                        <button onClick={() => stopTimer()}
                          style={{ background: `${T.border}60`, border: "none", borderRadius: 6, color: T.dim, cursor: "pointer", padding: "3px 8px", fontSize: 12 }}>
                          ↺
                        </button>
                        <button onClick={() => completeTimer(i)}
                          style={{ background: `${T.green}20`, border: "none", borderRadius: 6, color: T.green, cursor: "pointer", padding: "3px 8px", fontSize: 11, fontWeight: 600 }}>
                          أنجزت ✓
                        </button>
                      </div>
                    ) : pickerIdx === i ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {TIMER_PRESETS_W.map(m => (
                            <button key={m} onClick={() => startTimer(i, m)}
                              style={{ background: `${T.teal}15`, border: `1px solid ${T.teal}30`, borderRadius: 6, color: T.teal, cursor: "pointer", padding: "3px 8px", fontSize: 11, fontWeight: 500 }}>
                              {m} د
                            </button>
                          ))}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <input type="number" value={customMin} onChange={e => setCustomMin(Math.max(1, Number(e.target.value) || 1))}
                            style={{ ...inputBase, width: 50, fontSize: 11, textAlign: "center" as const, direction: "ltr" as const }} min={1} />
                          <span style={{ fontSize: 10, color: T.dim }}>د</span>
                          <button onClick={() => startTimer(i, customMin)}
                            style={{ background: T.teal, border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                            ▶ ابدأ
                          </button>
                          <button onClick={() => setPickerIdx(null)}
                            style={{ background: "transparent", border: "none", color: T.dim, cursor: "pointer", fontSize: 14 }}>
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => !activeTimer && setPickerIdx(i)}
                        disabled={!!activeTimer}
                        style={{
                          background: `${T.teal}12`, border: `1px solid ${T.teal}25`, borderRadius: 8,
                          color: activeTimer ? T.dim : T.teal, cursor: activeTimer ? "default" : "pointer",
                          padding: "4px 12px", fontSize: 11, fontWeight: 500,
                          opacity: activeTimer ? 0.4 : 1,
                        }}>
                        ⏱ ابدأ بمؤقت
                        {t.timeEstimate && <span style={{ marginRight: 6, color: T.dim }}>{t.timeEstimate} د</span>}
                      </button>
                    )}
                  </td>
                  <td style={{ padding: "8px", textAlign: "center", borderBottom: `1px solid ${T.border}20` }}>
                    <button onClick={() => removeTask(i)} style={{
                      background: `${T.red}20`, border: "none", borderRadius: 6, color: T.red,
                      cursor: "pointer", padding: "4px 10px", fontSize: 14, fontWeight: 700,
                    }}>×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
