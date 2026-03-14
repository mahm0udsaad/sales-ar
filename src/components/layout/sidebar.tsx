"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Headphones,
  Code,
  Handshake,
  Users,
  DollarSign,
  Upload,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "نظرة عامة", href: "/dashboard", icon: LayoutDashboard },
  { label: "المبيعات", href: "/sales", icon: TrendingUp },
  { label: "الدعم", href: "/support", icon: Headphones },
  { label: "التطويرات", href: "/development", icon: Code },
  { label: "الشراكات", href: "/partnerships", icon: Handshake },
  { label: "الفريق", href: "/team", icon: Users },
  { label: "المالية", href: "/finance", icon: DollarSign },
  { label: "رفع البيانات", href: "/upload", icon: Upload },
  { label: "المساعد الذكي", href: "/agent", icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 right-0 h-screen w-[200px] bg-[var(--sidebar)] border-l border-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <h1 className="text-lg font-bold text-cyan">CommandCenter</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">RESTAVO</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors",
                isActive
                  ? "bg-cyan-dim text-cyan font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-dim flex items-center justify-center text-cyan text-xs font-bold">
            م
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">المدير العام</p>
            <p className="text-[10px] text-muted-foreground">متصل</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
