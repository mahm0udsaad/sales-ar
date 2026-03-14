"use client";

import { usePathname } from "next/navigation";
import { Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTopbarControls } from "@/components/layout/topbar-context";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "نظرة عامة",
  "/sales": "المبيعات",
  "/support": "الدعم",
  "/development": "التطويرات",
  "/partnerships": "الشراكات",
  "/team": "الفريق",
  "/finance": "المالية",
  "/upload": "رفع البيانات",
  "/agent": "المساعد الذكي",
};

const PAGE_SUBTITLES: Record<string, string> = {
  "/dashboard": "لوحة تنفيذية مركزة على الإشارات الأهم الآن",
  "/sales": "متابعة الصفقات وخط الأنابيب من مكان واحد",
  "/support": "رؤية أسرع لحالة التذاكر والاستجابة",
  "/development": "حالة المشاريع الجارية والتقدم الفعلي",
  "/partnerships": "متابعة العلاقات والقيمة الاستراتيجية",
  "/team": "نظرة تشغيلية على الفريق وتوزيع الجهد",
  "/finance": "قراءة مالية مبنية على البيانات الفعلية",
  "/upload": "إدخال البيانات وربط النظام بالمصادر",
  "/agent": "طبقة ذكاء مساعدة فوق بيانات الشركة",
};

const TIME_FILTERS = ["اليوم", "الأسبوع", "الشهر", "الكل"];

interface TopbarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function Topbar({ activeFilter, onFilterChange }: TopbarProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] || "CommandCenter";
  const subtitle = PAGE_SUBTITLES[pathname] || "Operational command surface";
  const {
    controls: { onRefresh, isRefreshing, lastUpdatedAt },
  } = useTopbarControls();
  const showRefresh = pathname === "/dashboard" && !!onRefresh;
  const formattedLastUpdated = lastUpdatedAt
    ? new Intl.DateTimeFormat("ar-EG", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(lastUpdatedAt))
    : null;

  return (
    <div className="sticky top-0 z-40 px-6 pt-3">
      <div className="glass-surface flex items-center justify-between rounded-[26px] px-5 py-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full border border-cyan/15 bg-cyan-dim px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-cyan uppercase">
              Command Layer
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">{title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
        {showRefresh && (
          <div className="flex items-center gap-2 rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2">
            {formattedLastUpdated && (
              <p className="text-[11px] text-muted-foreground">
                آخر تحديث: {formattedLastUpdated}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void onRefresh?.()}
              disabled={Boolean(isRefreshing)}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              تحديث
            </Button>
          </div>
        )}

        {/* Time filters */}
        <div className="flex items-center gap-1 rounded-2xl border border-white/6 bg-white/[0.03] p-1.5">
          {TIME_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                activeFilter === filter
                  ? "bg-white/[0.08] text-foreground font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative rounded-2xl bg-white/[0.03] hover:bg-white/[0.06]">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute -top-0.5 -left-0.5 w-4 h-4 bg-cc-red rounded-full text-[9px] text-white flex items-center justify-center font-bold">
            3
          </span>
        </Button>
      </div>
      </div>
    </div>
  );
}
