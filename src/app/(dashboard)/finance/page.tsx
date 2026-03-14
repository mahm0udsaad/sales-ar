"use client";

import { useState, useEffect } from "react";
import { fetchDeals } from "@/lib/supabase/db";
import type { Deal } from "@/types";
import { formatMoney, formatPercent } from "@/lib/utils/format";
import { StatCard } from "@/components/ui/stat-card";
import { DonutChart } from "@/components/ui/donut-chart";
import { BarChart } from "@/components/ui/bar-chart";
import {
  DollarSign,
  TrendingUp,
  Percent,
  Target,
} from "lucide-react";

const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export default function FinancePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals()
      .then(setDeals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ── Compute finance metrics from deals ── */
  const closedDeals = deals.filter((d) => d.stage === "إغلاق");
  const totalRevenue = closedDeals.reduce((s, d) => s + d.deal_value, 0);
  const totalPipelineValue = deals.reduce((s, d) => s + d.deal_value, 0);

  // Group by month for bar chart
  const revenueByMonth: Record<string, number> = {};
  const pipelineByMonth: Record<string, number> = {};
  for (const d of deals) {
    const key = `${d.year ?? 0}-${String(d.month ?? 0).padStart(2, "0")}`;
    if (d.stage === "إغلاق") {
      revenueByMonth[key] = (revenueByMonth[key] || 0) + d.deal_value;
    }
    pipelineByMonth[key] = (pipelineByMonth[key] || 0) + d.deal_value;
  }

  const sortedMonths = Object.keys({ ...revenueByMonth, ...pipelineByMonth }).sort();

  const barData = sortedMonths.map((key) => {
    const m = parseInt(key.split("-")[1]);
    return {
      label: (MONTH_NAMES[m - 1] ?? key).slice(0, 3),
      values: [
        { value: (revenueByMonth[key] || 0) / 1000, color: "#00e5ff", label: "محققة" },
        { value: (pipelineByMonth[key] || 0) / 1000, color: "#e040fb", label: "خط الأنابيب" },
      ],
    };
  });

  const months = sortedMonths.length || 1;
  const mrr = totalRevenue / months;
  const arr = mrr * 12;
  const closeRate = deals.length > 0
    ? Math.round((closedDeals.length / deals.length) * 100)
    : 0;

  // Stage distribution for donut
  const stageCounts = deals.reduce((acc, d) => {
    acc[d.stage] = (acc[d.stage] || 0) + d.deal_value;
    return acc;
  }, {} as Record<string, number>);

  const STAGE_COLORS: Record<string, string> = {
    "تواصل": "#00e676",
    "عرض سعر": "#ffab00",
    "تفاوض": "#e040fb",
    "إغلاق": "#00e5ff",
    "خسارة": "#ff5252",
  };

  const donutSegments = Object.entries(stageCounts).map(([label, value]) => ({
    label,
    value,
    color: STAGE_COLORS[label] || "#64748b",
  }));

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-20">جاري التحميل...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-green-dim flex items-center justify-center">
          <DollarSign className="w-4 h-4 text-cc-green" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">المالية</h1>
          <p className="text-xs text-muted-foreground">
            محسوبة من بيانات الصفقات الفعلية
          </p>
        </div>
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          value={formatMoney(arr)}
          label="ARR السنوي (تقديري)"
          color="cyan"
          icon={<DollarSign className="w-4 h-4 text-cyan" />}
        />
        <StatCard
          value={formatMoney(mrr)}
          label="MRR الشهري"
          color="green"
          icon={<TrendingUp className="w-4 h-4 text-cc-green" />}
        />
        <StatCard
          value={formatPercent(closeRate)}
          label="نسبة الإغلاق"
          color="purple"
          progress={closeRate}
          icon={<Percent className="w-4 h-4 text-cc-purple" />}
        />
        <StatCard
          value={formatMoney(totalPipelineValue)}
          label="قيمة خط الأنابيب"
          color="amber"
          icon={<Target className="w-4 h-4 text-amber" />}
        />
      </div>

      {/* Two charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: Pipeline distribution donut */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">
            توزيع القيمة حسب المرحلة
          </h3>
          {donutSegments.length > 0 ? (
            <>
              <DonutChart
                segments={donutSegments}
                centerValue={formatMoney(totalPipelineValue)}
                centerLabel="إجمالي"
              />
              <div className="mt-4 space-y-2">
                {donutSegments.map((seg, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="text-muted-foreground">{seg.label}</span>
                    </div>
                    <span className="text-foreground font-medium">
                      {formatMoney(seg.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              لا توجد صفقات بعد
            </div>
          )}
        </div>

        {/* RIGHT: Revenue bar chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">
            الإيرادات الشهرية (ألف $)
          </h3>
          {barData.length > 0 ? (
            <>
              <BarChart data={barData} height={280} />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-cyan-dim/30 text-center">
                  <p className="text-lg font-bold text-cyan">
                    {formatMoney(totalRevenue)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    إجمالي الإيرادات المحققة
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-dim/30 text-center">
                  <p className="text-lg font-bold text-cc-purple">
                    {formatMoney(totalPipelineValue - totalRevenue)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    قيمة الفرص المتبقية
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              لا توجد بيانات شهرية بعد
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
