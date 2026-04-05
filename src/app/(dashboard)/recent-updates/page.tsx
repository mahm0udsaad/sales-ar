"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { fetchRecentUpdates, fetchActivityLogs, type RecentUpdateItem } from "@/lib/supabase/db";
import type { ActivityLog } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorBadge } from "@/components/ui/color-badge";
import { Button } from "@/components/ui/button";
import { useTopbarControls } from "@/components/layout/topbar-context";
import {
  Clock,
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  Headphones,
  RefreshCw,
  Code,
  Handshake,
  ListTodo,
  Heart,
  Banknote,
  Target,
  Gift,
  Megaphone,
  AlertCircle,
  ScrollText,
  Activity,
  Users,
  User,
} from "lucide-react";

const SECTION_ICONS: Record<string, typeof TrendingUp> = {
  sales: TrendingUp,
  support: Headphones,
  renewals: RefreshCw,
  development: Code,
  partnerships: Handshake,
  tasks: ListTodo,
  satisfaction: Heart,
  finance: Banknote,
  targeting: Target,
  gifts: Gift,
  marketers: Megaphone,
  team: Users,
};

const COLOR_BG: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20",
  orange: "bg-orange-500/15 text-orange-400 ring-orange-500/20",
  sky: "bg-sky-500/15 text-sky-400 ring-sky-500/20",
  indigo: "bg-indigo-500/15 text-indigo-400 ring-indigo-500/20",
  teal: "bg-teal-500/15 text-teal-400 ring-teal-500/20",
  rose: "bg-rose-500/15 text-rose-400 ring-rose-500/20",
  lime: "bg-lime-500/15 text-lime-400 ring-lime-500/20",
  fuchsia: "bg-fuchsia-500/15 text-fuchsia-400 ring-fuchsia-500/20",
  amber: "bg-amber-500/15 text-amber-400 ring-amber-500/20",
  pink: "bg-pink-500/15 text-pink-400 ring-pink-500/20",
  blue: "bg-blue-500/15 text-blue-400 ring-blue-500/20",
  cyan: "bg-cyan-500/15 text-cyan-400 ring-cyan-500/20",
};

const SECTION_COLORS: Record<string, string> = {
  sales: "emerald",
  support: "orange",
  renewals: "sky",
  development: "indigo",
  partnerships: "teal",
  tasks: "indigo",
  satisfaction: "rose",
  finance: "lime",
  targeting: "fuchsia",
  gifts: "amber",
  marketers: "pink",
  team: "blue",
};

type FilterMode = "all" | "today" | "week";
type TabMode = "updates" | "log";

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return d >= startOfWeek;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;

  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 1) return "أمس";
  if (diffDays < 7) return `منذ ${diffDays} أيام`;

  return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
}

function formatFullTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ar-SA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateGroup(dateStr: string): string {
  if (isToday(dateStr)) return "اليوم";

  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return "أمس";
  }

  return d.toLocaleDateString("ar-SA", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

const ACTION_CONFIG = {
  create: { label: "إضافة", icon: Plus, bg: "bg-emerald-500/10 text-emerald-400", dot: "bg-emerald-400" },
  update: { label: "تحديث", icon: Pencil, bg: "bg-amber-500/10 text-amber-400", dot: "bg-amber-400" },
  delete: { label: "حذف", icon: Trash2, bg: "bg-red-500/10 text-red-400", dot: "bg-red-400" },
};

export default function RecentUpdatesPage() {
  const [activeTab, setActiveTab] = useState<TabMode>("updates");
  const [items, setItems] = useState<RecentUpdateItem[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [logSectionFilter, setLogSectionFilter] = useState<string>("all");
  const { activeOrgId: orgId } = useAuth();
  const { setControls } = useTopbarControls();

  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (silent) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const [updatesData, logsData] = await Promise.allSettled([
          fetchRecentUpdates(),
          fetchActivityLogs({ limit: 200 }),
        ]);

        if (updatesData.status === "fulfilled") setItems(updatesData.value);
        if (logsData.status === "fulfilled") setLogs(logsData.value);

        setLastUpdatedAt(new Date().toISOString());
      } catch {
        setError("تعذر تحميل البيانات");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [orgId]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setControls({
      onRefresh: () => loadData({ silent: true }),
      isRefreshing,
      lastUpdatedAt,
    });
    return () => setControls({});
  }, [isRefreshing, lastUpdatedAt, loadData, setControls]);

  // ── Updates Tab Data ──
  const filteredItems = useMemo(() => {
    let result = items;
    if (filter === "today") result = result.filter((i) => isToday(i.timestamp));
    else if (filter === "week") result = result.filter((i) => isThisWeek(i.timestamp));
    if (sectionFilter !== "all") result = result.filter((i) => i.section === sectionFilter);
    return result;
  }, [items, filter, sectionFilter]);

  const grouped = useMemo(() => {
    const groups: { date: string; items: RecentUpdateItem[] }[] = [];
    const map = new Map<string, RecentUpdateItem[]>();
    for (const item of filteredItems) {
      const key = formatDateGroup(item.timestamp);
      if (!map.has(key)) {
        map.set(key, []);
        groups.push({ date: key, items: map.get(key)! });
      }
      map.get(key)!.push(item);
    }
    return groups;
  }, [filteredItems]);

  const sectionCounts = useMemo(() => {
    const counts: Record<string, { total: number; today: number }> = {};
    for (const item of items) {
      if (!counts[item.section]) counts[item.section] = { total: 0, today: 0 };
      counts[item.section].total++;
      if (isToday(item.timestamp)) counts[item.section].today++;
    }
    return counts;
  }, [items]);

  const uniqueSections = useMemo(() => {
    const seen = new Set<string>();
    return items.filter((i) => {
      if (seen.has(i.section)) return false;
      seen.add(i.section);
      return true;
    });
  }, [items]);

  // ── Activity Log Tab Data ──
  const filteredLogs = useMemo(() => {
    let result = logs;
    if (filter === "today") result = result.filter((l) => isToday(l.created_at));
    else if (filter === "week") result = result.filter((l) => isThisWeek(l.created_at));
    if (logSectionFilter !== "all") result = result.filter((l) => l.section === logSectionFilter);
    return result;
  }, [logs, filter, logSectionFilter]);

  const logGroups = useMemo(() => {
    const groups: { date: string; items: ActivityLog[] }[] = [];
    const map = new Map<string, ActivityLog[]>();
    for (const log of filteredLogs) {
      const key = formatDateGroup(log.created_at);
      if (!map.has(key)) {
        map.set(key, []);
        groups.push({ date: key, items: map.get(key)! });
      }
      map.get(key)!.push(log);
    }
    return groups;
  }, [filteredLogs]);

  const logUniqueSections = useMemo(() => {
    const seen = new Set<string>();
    return logs.filter((l) => {
      if (seen.has(l.section)) return false;
      seen.add(l.section);
      return true;
    });
  }, [logs]);

  const logActionCounts = useMemo(() => {
    const counts = { create: 0, update: 0, delete: 0 };
    for (const l of filteredLogs) {
      counts[l.action]++;
    }
    return counts;
  }, [filteredLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-surface rounded-[14px] p-5">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="rounded-full border border-cyan/15 bg-cyan-dim px-3 py-1 text-[11px] font-semibold text-cyan">
            Activity Feed
          </span>
          <span className="rounded-full border border-border bg-white/[0.04] px-3 py-1 text-[11px] text-muted-foreground">
            تتبع جميع التحديثات في مكان واحد
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">
          التحديثات الأخيرة
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          جميع التغييرات والإضافات التي تمت في كل قسم خلال الأسبوع
        </p>
      </div>

      {/* Main Tabs: Updates / Activity Log */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("updates")}
          className={`flex items-center gap-2 rounded-[14px] px-5 py-3 text-sm font-bold transition-all ${
            activeTab === "updates"
              ? "bg-cyan/10 text-cyan border border-cyan/20"
              : "glass-surface text-muted-foreground hover:text-foreground border border-transparent"
          }`}
        >
          <Activity className="w-4 h-4" />
          التحديثات
          {items.length > 0 && (
            <span className="text-[10px] bg-white/[0.06] rounded-full px-2 py-0.5">{items.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("log")}
          className={`flex items-center gap-2 rounded-[14px] px-5 py-3 text-sm font-bold transition-all ${
            activeTab === "log"
              ? "bg-cyan/10 text-cyan border border-cyan/20"
              : "glass-surface text-muted-foreground hover:text-foreground border border-transparent"
          }`}
        >
          <ScrollText className="w-4 h-4" />
          سجل التتبع
          {logs.length > 0 && (
            <span className="text-[10px] bg-white/[0.06] rounded-full px-2 py-0.5">{logs.length}</span>
          )}
        </button>
      </div>

      {/* Time Filter Tabs */}
      <div className="flex flex-wrap gap-3">
        {(
          [
            { key: "all", label: "الكل", icon: CalendarDays },
            { key: "today", label: "اليوم", icon: Clock },
            { key: "week", label: "هذا الأسبوع", icon: CalendarDays },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 rounded-[12px] px-4 py-2.5 text-sm font-semibold transition-all ${
                filter === tab.key
                  ? "bg-cyan/10 text-cyan border border-cyan/20"
                  : "glass-surface text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-6 w-20" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-surface rounded-[14px] p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="glass-surface rounded-[14px] p-8 flex flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-6 w-6 text-red-400" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => loadData()}>
            إعادة المحاولة
          </Button>
        </div>
      )}

      {/* ═══════════════════════ UPDATES TAB ═══════════════════════ */}
      {!isLoading && !error && activeTab === "updates" && (
        <>
          {/* Section Summary Cards */}
          {uniqueSections.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
              <button
                onClick={() => setSectionFilter("all")}
                className={`rounded-[14px] border p-3 text-center transition-all ${
                  sectionFilter === "all"
                    ? "border-cyan/20 bg-cyan/5"
                    : "border-border bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <p className="text-xl font-extrabold text-foreground font-mono">
                  {items.length}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">الكل</p>
              </button>
              {uniqueSections.map((sec) => {
                const Icon = SECTION_ICONS[sec.section] || CalendarDays;
                const counts = sectionCounts[sec.section];
                const isActive = sectionFilter === sec.section;
                return (
                  <button
                    key={sec.section}
                    onClick={() =>
                      setSectionFilter(isActive ? "all" : sec.section)
                    }
                    className={`rounded-[14px] border p-3 text-center transition-all ${
                      isActive
                        ? "border-cyan/20 bg-cyan/5"
                        : "border-border bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex justify-center mb-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ring-1 ${
                          COLOR_BG[sec.section_color] || COLOR_BG.emerald
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-lg font-extrabold text-foreground font-mono">
                      {counts?.total || 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {sec.section_label}
                    </p>
                    {(counts?.today || 0) > 0 && (
                      <p className="text-[10px] text-cyan mt-0.5">
                        +{counts.today} اليوم
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="glass-surface rounded-[14px] p-12 text-center">
              <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                <Clock className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">لا توجد تحديثات</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {filter === "today"
                  ? "لم يتم إجراء أي تغييرات اليوم بعد"
                  : "لم يتم إجراء أي تغييرات خلال هذه الفترة"}
              </p>
            </div>
          )}

          {/* Grouped Updates */}
          {grouped.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold text-foreground">{group.date}</h3>
                <span className="text-[11px] text-muted-foreground bg-white/[0.04] rounded-full px-2.5 py-0.5">
                  {group.items.length} تحديث
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-2">
                {group.items.map((item, idx) => {
                  const Icon = SECTION_ICONS[item.section] || CalendarDays;
                  return (
                    <div
                      key={item.id + item.timestamp}
                      className="glass-surface rounded-[14px] px-4 py-3 flex items-center gap-3.5 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ring-1 shrink-0 ${
                          COLOR_BG[item.section_color] || COLOR_BG.emerald
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {item.title}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                              item.action === "created"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {item.action === "created" ? (
                              <Plus className="w-2.5 h-2.5" />
                            ) : (
                              <Pencil className="w-2.5 h-2.5" />
                            )}
                            {item.action === "created" ? "جديد" : "تحديث"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.user_name && (
                            <span className="inline-flex items-center gap-1 text-xs text-cyan-400/80">
                              <User className="w-3 h-3" />
                              {item.user_name}
                            </span>
                          )}
                          {item.user_name && item.subtitle && (
                            <span className="text-muted-foreground/30 text-[10px]">|</span>
                          )}
                          {item.subtitle && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <ColorBadge
                          text={item.section_label}
                          color={
                            (item.section_color as "cyan" | "green" | "amber" | "red" | "purple") ||
                            "cyan"
                          }
                        />
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {formatTime(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ═══════════════════════ ACTIVITY LOG TAB ═══════════════════════ */}
      {!isLoading && !error && activeTab === "log" && (
        <>
          {/* Action Summary */}
          <div className="grid grid-cols-3 gap-3">
            {(["create", "update", "delete"] as const).map((action) => {
              const config = ACTION_CONFIG[action];
              const Icon = config.icon;
              return (
                <div key={action} className="glass-surface rounded-[14px] p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${config.bg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-foreground font-mono">{logActionCounts[action]}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{config.label}</p>
                </div>
              );
            })}
          </div>

          {/* Section Filter Pills */}
          {logUniqueSections.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLogSectionFilter("all")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  logSectionFilter === "all"
                    ? "bg-cyan/10 text-cyan border border-cyan/20"
                    : "bg-white/[0.04] text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                الكل
              </button>
              {logUniqueSections.map((l) => (
                <button
                  key={l.section}
                  onClick={() => setLogSectionFilter(logSectionFilter === l.section ? "all" : l.section)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    logSectionFilter === l.section
                      ? "bg-cyan/10 text-cyan border border-cyan/20"
                      : "bg-white/[0.04] text-muted-foreground hover:text-foreground border border-border"
                  }`}
                >
                  {l.section_label}
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredLogs.length === 0 && (
            <div className="glass-surface rounded-[14px] p-12 text-center">
              <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                <ScrollText className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">سجل التتبع فارغ</p>
              <p className="mt-1 text-xs text-muted-foreground">
                سيتم تسجيل جميع العمليات (إضافة، تعديل، حذف) تلقائياً هنا
              </p>
            </div>
          )}

          {/* Activity Log Timeline */}
          {logGroups.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold text-foreground">{group.date}</h3>
                <span className="text-[11px] text-muted-foreground bg-white/[0.04] rounded-full px-2.5 py-0.5">
                  {group.items.length} عملية
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="relative pr-4">
                {/* Timeline line */}
                <div className="absolute right-[7px] top-3 bottom-3 w-px bg-border" />

                <div className="space-y-1">
                  {group.items.map((log, idx) => {
                    const config = ACTION_CONFIG[log.action];
                    const ActionIcon = config.icon;
                    const SectionIcon = SECTION_ICONS[log.section] || CalendarDays;
                    const sColor = SECTION_COLORS[log.section] || "cyan";

                    return (
                      <div
                        key={log.id}
                        className="relative flex items-start gap-3 pr-5 py-2 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        {/* Timeline dot */}
                        <div className={`absolute right-0 top-4 w-[15px] h-[15px] rounded-full border-2 border-card ${config.dot} z-10`} />

                        <div className="flex-1 glass-surface rounded-[14px] px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ring-1 shrink-0 ${COLOR_BG[sColor] || COLOR_BG.cyan}`}>
                              <SectionIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${config.bg}`}>
                                  <ActionIcon className="w-2.5 h-2.5" />
                                  {config.label}
                                </span>
                                <span className="text-xs font-semibold text-foreground truncate">
                                  {log.entity_title || log.section_label}
                                </span>
                              </div>
                              {log.details && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-muted-foreground/70">
                                  {log.section_label}
                                </span>
                                {log.user_name && (
                                  <>
                                    <span className="text-[10px] text-muted-foreground/40">|</span>
                                    <span className="inline-flex items-center gap-0.5 text-[10px] text-cyan-400/70">
                                      <User className="w-2.5 h-2.5" />
                                      {log.user_name}
                                    </span>
                                  </>
                                )}
                                <span className="text-[10px] text-muted-foreground/40">|</span>
                                <span className="text-[10px] text-muted-foreground/70">
                                  {formatFullTime(log.created_at)}
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                              {formatTime(log.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
