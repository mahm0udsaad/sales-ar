"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  RefreshCw,
  Heart,
  Headphones,
  Code,
  Handshake,
  Users,
  Banknote,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "نظرة عامة", href: "/dashboard", icon: LayoutDashboard },
  { label: "المبيعات", href: "/sales", icon: TrendingUp },
  { label: "التجديدات", href: "/renewals", icon: RefreshCw },
  { label: "رضا العملاء", href: "/satisfaction", icon: Heart },
  { label: "الدعم", href: "/support", icon: Headphones },
  { label: "التطويرات", href: "/development", icon: Code },
  { label: "الشراكات", href: "/partnerships", icon: Handshake },
  { label: "الفريق", href: "/team", icon: Users },
  { label: "المالية", href: "/finance", icon: Banknote },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop for mobile/tablet */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-3 right-3 bottom-3 z-50 w-[244px] overflow-hidden rounded-[28px] glass-surface border-l-0 flex flex-col transition-transform duration-300 ease-in-out",
          // On lg+: always visible
          "lg:translate-x-0",
          // On <lg: slide in/out from right (RTL)
          open ? "translate-x-0" : "translate-x-[260px] lg:translate-x-0"
        )}
      >
        {/* Logo + close button on mobile */}
        <div className="px-5 pt-5 pb-4 border-b border-white/6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-cyan/30 to-cc-purple/30 ring-1 ring-white/10 shrink-0">
              <span className="text-sm font-extrabold tracking-[0.2em] text-cyan">CC</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan/70">Restavo</p>
              <h1 className="text-[1.05rem] font-extrabold text-foreground">Command Center</h1>
              <p className="mt-1 text-[11px] text-muted-foreground">مركز متابعة حي للمبيعات والتشغيل</p>
            </div>
            {/* Close button — only on mobile/tablet */}
            <button
              onClick={onClose}
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-3 text-[13px] transition-all",
                  isActive
                    ? "bg-white/[0.04] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
                )}
              >
                {isActive && (
                  <span className="absolute inset-y-2 right-1 w-1 rounded-full bg-linear-to-b from-cyan to-cc-purple" />
                )}
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                    isActive ? "bg-cyan-dim text-cyan" : "bg-white/[0.03] text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  <Icon className="w-[17px] h-[17px]" />
                </span>
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="m-3 mt-0 rounded-2xl border border-white/6 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">الحالة التشغيلية</span>
            <span className="rounded-full bg-green-dim px-2 py-0.5 text-cc-green">مباشر</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-dim flex items-center justify-center text-cyan text-xs font-bold ring-1 ring-cyan/20">
              م
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">المدير العام</p>
              <p className="text-[11px] text-muted-foreground">متصل ويتابع المؤشرات</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
