"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const TIME_FILTERS = ["اليوم", "الأسبوع", "الشهر", "الكل"];

interface TopbarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function Topbar({ activeFilter, onFilterChange }: TopbarProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] || "CommandCenter";

  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-6 py-3 flex items-center justify-between">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>

      <div className="flex items-center gap-4">
        {/* Time filters */}
        <div className="flex items-center gap-1 bg-card rounded-lg p-1">
          {TIME_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                activeFilter === filter
                  ? "bg-cyan-dim text-cyan font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute -top-0.5 -left-0.5 w-4 h-4 bg-cc-red rounded-full text-[9px] text-white flex items-center justify-center font-bold">
            3
          </span>
        </Button>
      </div>
    </div>
  );
}
