"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { TopbarProvider } from "@/components/layout/topbar-context";
import { NotificationPanel } from "@/components/layout/notification-panel";
import { AIChatFAB } from "@/components/ai/ai-chat-fab";
import { AIAlertsBanner } from "@/components/ai/ai-alerts-banner";
import { DEMO_TICKETS, DEMO_PROJECTS, DEMO_PARTNERSHIPS } from "@/lib/demo-data";
import type { AppNotification } from "@/types";

function generateNotifications(): AppNotification[] {
  const now = new Date().toISOString();
  const notifications: AppNotification[] = [];

  // Urgent tickets
  DEMO_TICKETS.filter((t) => t.priority === "عاجل" && t.status !== "محلول").forEach((t) => {
    notifications.push({
      id: `notif-ticket-${t.id}`,
      type: "urgent_ticket",
      icon: "🚨",
      message: `تذكرة عاجلة: "${t.issue}" من ${t.client_name}`,
      section: "support",
      timestamp: now,
      isRead: false,
    });
  });

  // Overdue projects
  DEMO_PROJECTS.filter((p) => p.status_tag === "متأخر").forEach((p) => {
    notifications.push({
      id: `notif-project-${p.id}`,
      type: "overdue_project",
      icon: "⏰",
      message: `مشروع متأخر: "${p.name}" — تقدم ${p.progress}%`,
      section: "development",
      timestamp: now,
      isRead: false,
    });
  });

  // Near-complete projects (90%+)
  DEMO_PROJECTS.filter((p) => p.progress >= 85 && p.status_tag !== "متأخر").forEach((p) => {
    notifications.push({
      id: `notif-near-${p.id}`,
      type: "near_complete",
      icon: "🎯",
      message: `مشروع يقترب من الاكتمال: "${p.name}" — ${p.progress}%`,
      section: "development",
      timestamp: now,
      isRead: true,
    });
  });

  // Negotiating partnerships
  DEMO_PARTNERSHIPS.filter((p) => p.status === "قيد التفاوض").forEach((p) => {
    notifications.push({
      id: `notif-partner-${p.id}`,
      type: "negotiating",
      icon: "◇",
      message: `شراكة قيد التفاوض: ${p.name}`,
      section: "partnerships",
      timestamp: now,
      isRead: true,
    });
  });

  return notifications;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("الكل");
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => generateNotifications());

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const isAgentPage = pathname === "/agent";

  return (
    <TopbarProvider>
      <div className="min-h-screen bg-background panel-grid">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Content area — has margin on lg+ for sidebar, full-width on mobile/tablet */}
        <div className="lg:mr-[260px] min-h-screen">
          <Topbar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            activeMonth={activeMonth}
            onMonthChange={setActiveMonth}
            unreadCount={unreadCount}
            onBellClick={() => setNotifOpen((prev) => !prev)}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="px-4 sm:px-6 pb-8 pt-5">
            <AIAlertsBanner />
            {children}
          </main>
        </div>

        {/* Notification Panel */}
        {notifOpen && (
          <NotificationPanel
            notifications={notifications}
            onClose={() => setNotifOpen(false)}
            onMarkAllRead={() =>
              setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
            }
            onClearAll={() => {
              setNotifications([]);
              setNotifOpen(false);
            }}
          />
        )}

        {/* AI Chat — hidden on agent page */}
        {!isAgentPage && (
          <AIChatFAB onClick={() => router.push("/agent")} />
        )}
      </div>
    </TopbarProvider>
  );
}
