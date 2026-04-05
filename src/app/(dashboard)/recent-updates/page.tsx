"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { fetchRecentUpdates, type RecentUpdateItem } from "@/lib/supabase/db";
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
};

type FilterMode = "all" | "today" | "week";

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

export default function RecentUpdatesPage() {
  const [items, setItems] = useState<RecentUpdateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const { activeOrgId: orgId } = useAuth();
  const { setControls } = useTopbarControls();

  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (silent) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const data = await fetchRecentUpdates();
        setItems(data);
        setLastUpdatedAt(new Date().toISOString());
      } catch {
        setError("تعذر تحميل التحديثات");
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

  const filteredItems = useMemo(() => {
    let result = items;

    if (filter === "today") {
      result = result.filter((i) => isToday(i.timestamp));
    } else if (filter === "week") {
      result = result.filter((i) => isThisWeek(i.timestamp));
    }

    if (sectionFilter !== "all") {
      result = result.filter((i) => i.section === sectionFilter);
    }

    return result;
  }, [items, filter, sectionFilter]);

  // Group by date
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

  // Section summary counts
  const sectionCounts = useMemo(() => {
    const counts: Record<string, { total: number; today: number }> = {};
    for (const item of items) {
      if (!counts[item.section]) {
        counts[item.section] = { total: 0, today: 0 };
      }
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

      {/* Section Summary Cards */}
      {!isLoading && uniqueSections.length > 0 && (
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

      {/* Empty State */}
      {!isLoading && !error && filteredItems.length === 0 && (
        <div className="glass-surface rounded-[14px] p-12 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center">
            <Clock className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            لا توجد تحديثات
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {filter === "today"
              ? "لم يتم إجراء أي تغييرات اليوم بعد"
              : "لم يتم إجراء أي تغييرات خلال هذه الفترة"}
          </p>
        </div>
      )}

      {/* Grouped Updates */}
      {!isLoading &&
        !error &&
        grouped.map((group) => (
          <div key={group.date}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-sm font-bold text-foreground">
                {group.date}
              </h3>
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
    </div>
  );
}
