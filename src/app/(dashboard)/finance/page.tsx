"use client";

import { useState, useEffect } from "react";
import type { Deal, Renewal } from "@/types";
import { fetchDeals, fetchRenewals } from "@/lib/supabase/db";
import { useAuth } from "@/lib/auth-context";
import { MONTHS_AR, SOURCE_COLORS } from "@/lib/utils/constants";
import { formatMoney, formatMoneyFull } from "@/lib/utils/format";
import { StatCard } from "@/components/ui/stat-card";
import { DonutChart } from "@/components/ui/donut-chart";
import { BarChart } from "@/components/ui/bar-chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Banknote,
  TrendingUp,
  Target,
  BarChart3,
} from "lucide-react";

/* CSS variable color → hex for donut chart */
const COLOR_HEX: Record<string, string> = {
  cyan: "#00D4FF",
  "cc-purple": "#8B5CF6",
  "cc-green": "#10B981",
  pink: "#EC4899",
  amber: "#F59E0B",
  "cc-blue": "#3B82F6",
  "muted-foreground": "#64748B",
};

export default function FinancePage() {
  const { activeOrgId: orgId } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchDeals(), fetchRenewals()])
      .then(([d, r]) => {
        setDeals(d);
        setRenewals(r);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orgId]);

  /* ─── Computed Metrics ─── */
  const closedDeals = deals.filter((d) => d.stage === "مكتملة");
  const totalRevenue = closedDeals.reduce((s, d) => s + d.deal_value, 0);
  const pipelineValue = deals.filter((d) => d.stage !== "مكتملة").reduce((s, d) => s + d.deal_value, 0);
  const avgDealValue = closedDeals.length > 0 ? Math.round(totalRevenue / closedDeals.length) : 0;

  /* MRR: current month closed deals + active renewals plan_price */
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const currentMonthRevenue = closedDeals
    .filter((d) => d.month === currentMonth && d.year === currentYear)
    .reduce((s, d) => s + d.deal_value, 0);

  const activeRenewalsRevenue = renewals
    .filter((r) => r.status === "مكتمل")
    .reduce((s, r) => s + r.plan_price, 0);

  const mrr = currentMonthRevenue + activeRenewalsRevenue;
  const arr = mrr * 12;

  /* ─── Monthly Revenue (last 12 months) ─── */
  const monthlyRevenue = (() => {
    const months: { month: string; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const rev = closedDeals
        .filter((deal) => deal.month === m && deal.year === y)
        .reduce((s, deal) => s + deal.deal_value, 0);
      months.push({ month: MONTHS_AR[d.getMonth()], revenue: rev });
    }
    return months;
  })();

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 1);
  const useMillions = maxRevenue >= 1_000_000;
  const divisor = useMillions ? 1_000_000 : 1;
  const chartUnit = useMillions ? "مليون ر.س" : "ر.س";

  const barData = monthlyRevenue.map((m) => ({
    label: m.month.slice(0, 3),
    values: [
      { value: m.revenue / divisor, color: "#00D4FF", label: "الإيرادات" },
    ],
  }));

  /* ─── Revenue by Source (donut) ─── */
  const sourceRevenue = (() => {
    const map: Record<string, number> = {};
    closedDeals.forEach((d) => {
      const src = d.source || "اخرى";
      map[src] = (map[src] || 0) + d.deal_value;
    });
    return Object.entries(map)
      .map(([source, value]) => ({ source, value }))
      .sort((a, b) => b.value - a.value);
  })();

  const donutSegments = sourceRevenue.map((s) => ({
    label: s.source,
    value: s.value,
    color: COLOR_HEX[SOURCE_COLORS[s.source] || "cyan"] || "#00D4FF",
  }));

  const totalClosedRevenue = sourceRevenue.reduce((s, x) => s + x.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-green-dim flex items-center justify-center">
          <Banknote className="w-4 h-4 text-cc-green" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">المالية</h1>
          <p className="text-xs text-muted-foreground">
            مراقبة المؤشرات المالية الرئيسية
          </p>
        </div>
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="cc-card rounded-xl p-4">
              <Skeleton className="h-7 w-20 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              value={formatMoney(arr)}
              label="ARR السنوي"
              color="cyan"
              icon={<Banknote className="w-4 h-4 text-cyan" />}
            />
            <StatCard
              value={formatMoney(mrr)}
              label="MRR الشهري"
              color="green"
              icon={<TrendingUp className="w-4 h-4 text-cc-green" />}
            />
            <StatCard
              value={formatMoney(totalRevenue)}
              label="إجمالي الإيرادات"
              color="purple"
              icon={<BarChart3 className="w-4 h-4 text-cc-purple" />}
            />
            <StatCard
              value={formatMoney(pipelineValue)}
              label="قيمة خط الأنابيب"
              color="amber"
              icon={<Target className="w-4 h-4 text-amber" />}
            />
          </>
        )}
      </div>

      {/* Two charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Revenue bar chart */}
        <div className="cc-card rounded-xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">
            الإيرادات الشهرية ({chartUnit})
          </h3>
          {loading ? (
            <Skeleton className="h-[280px] w-full rounded-lg" />
          ) : (
            <>
              <BarChart data={barData} height={280} />
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-cyan-dim/30 text-center">
                  <p className="text-lg font-bold text-cyan">
                    {formatMoney(totalRevenue)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    إجمالي الإيرادات
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-dim/30 text-center">
                  <p className="text-lg font-bold text-cc-green">
                    {closedDeals.length}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    مبيعات مكتملة
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-dim/30 text-center">
                  <p className="text-lg font-bold text-cc-purple">
                    {formatMoney(avgDealValue)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    متوسط قيمة المبيع
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Revenue by Source donut */}
        <div className="cc-card rounded-xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">
            الإيرادات حسب المصدر
          </h3>
          {loading ? (
            <Skeleton className="h-[280px] w-full rounded-lg" />
          ) : donutSegments.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
              لا توجد بيانات
            </div>
          ) : (
            <>
              <DonutChart
                segments={donutSegments}
                centerValue={formatMoney(totalClosedRevenue)}
                centerLabel="إجمالي"
              />
              <div className="mt-4 space-y-2">
                {sourceRevenue.map((s, i) => {
                  const pct = totalClosedRevenue > 0 ? Math.round((s.value / totalClosedRevenue) * 100) : 0;
                  const hex = COLOR_HEX[SOURCE_COLORS[s.source] || "cyan"] || "#00D4FF";
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="text-muted-foreground">{s.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-medium">
                          {formatMoney(s.value)}
                        </span>
                        <span className="text-muted-foreground">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
