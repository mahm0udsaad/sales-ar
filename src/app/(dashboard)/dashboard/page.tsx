"use client";

import { useState, useEffect } from "react";
import { fetchDeals, fetchTickets, fetchProjects, fetchKpiSnapshots } from "@/lib/supabase/db";
import type { Deal, Ticket, Project, KPISnapshot } from "@/types";
import { StatCard } from "@/components/ui/stat-card";
import { DonutChart } from "@/components/ui/donut-chart";
import { LineChart } from "@/components/ui/line-chart";
import { ColorBadge } from "@/components/ui/color-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatDate } from "@/lib/utils/format";
import { Ticket as TicketIcon, TrendingUp, DollarSign, Users, Heart, FolderOpen } from "lucide-react";

const STAGE_COLORS: Record<string, string> = {
  "تواصل": "#00e676",
  "عرض سعر": "#ffab00",
  "تفاوض": "#e040fb",
  "إغلاق": "#00e5ff",
};

const STAGE_BADGE: Record<string, "cyan" | "green" | "amber" | "red" | "purple"> = {
  "تواصل": "green",
  "عرض سعر": "amber",
  "تفاوض": "purple",
  "إغلاق": "cyan",
  "خسارة": "red",
};

const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export default function DashboardPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [kpiSnapshots, setKpiSnapshots] = useState<KPISnapshot[]>([]);

  useEffect(() => {
    Promise.all([
      fetchDeals().then(setDeals),
      fetchTickets().then(setTickets),
      fetchProjects().then(setProjects),
      fetchKpiSnapshots().then(setKpiSnapshots),
    ]).catch(console.error);
  }, []);

  const openTickets = tickets.filter((t) => t.status === "مفتوح").length;
  const periodDeals = deals.length;
  const periodRevenue = deals.reduce((s, d) => s + d.deal_value, 0);
  const activeProjects = projects.length;

  // Stage distribution for donut
  const stageCounts = deals.reduce(
    (acc, d) => {
      acc[d.stage] = (acc[d.stage] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const donutSegments = Object.entries(stageCounts).map(([label, value]) => ({
    label,
    value,
    color: STAGE_COLORS[label] || "#64748b",
  }));

  const lineData = kpiSnapshots.map((k) => ({
    label: (MONTH_NAMES[k.month - 1] ?? String(k.month)).slice(0, 3),
    value: k.total_revenue,
    target: k.target_revenue || 0,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          value={String(openTickets)}
          label="تذاكر مفتوحة"
          color="green"
          icon={<TicketIcon className="w-4 h-4 text-cc-green" />}
        />
        <StatCard
          value={String(periodDeals)}
          label="صفقات الفترة"
          color="cyan"
          icon={<TrendingUp className="w-4 h-4 text-cyan" />}
        />
        <StatCard
          value={formatMoney(periodRevenue)}
          label="إيرادات الفترة"
          color="cyan"
          icon={<DollarSign className="w-4 h-4 text-cyan" />}
        />
        <StatCard
          value="—"
          label="حمل الفريق"
          color="green"
          icon={<Users className="w-4 h-4 text-cc-green" />}
        />
        <StatCard
          value="—"
          label="رضا العملاء"
          color="pink"
          icon={<Heart className="w-4 h-4 text-pink" />}
        />
        <StatCard
          value={String(activeProjects)}
          label="مشاريع الفترة"
          color="purple"
          icon={<FolderOpen className="w-4 h-4 text-cc-purple" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deal Stages Donut */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">مراحل الصفقات</h3>
          {donutSegments.length > 0 ? (
            <DonutChart
              segments={donutSegments}
              centerValue={String(periodDeals)}
              centerLabel="صفقة"
            />
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              لا توجد صفقات بعد
            </div>
          )}
        </div>

        {/* Revenue Growth Line */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">نمو الإيرادات</h3>
          {lineData.length > 0 ? (
            <LineChart data={lineData} showArea />
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              لا توجد بيانات شهرية بعد
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Projects */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">مشاريع قيد التنفيذ</h3>
          {projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-foreground truncate">{project.name}</p>
                      <ColorBadge
                        text={project.status_tag || ""}
                        color={
                          project.status_tag === "متأخر"
                            ? "red"
                            : project.status_tag === "يكتمل قريباً"
                            ? "amber"
                            : "green"
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-cyan transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{project.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
              لا توجد مشاريع بعد
            </div>
          )}
        </div>

        {/* Recent Deals */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">أحدث الصفقات</h3>
          {deals.length > 0 ? (
            <div className="space-y-3">
              {deals.slice(0, 5).map((deal) => (
                <div key={deal.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{deal.client_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {deal.assigned_rep_name} • {deal.deal_date ? formatDate(deal.deal_date) : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-cyan">{formatMoney(deal.deal_value)}</span>
                    <ColorBadge text={deal.stage} color={STAGE_BADGE[deal.stage] || "blue"} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
              لا توجد صفقات بعد
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
