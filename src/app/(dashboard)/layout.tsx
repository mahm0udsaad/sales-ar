"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { TopbarProvider } from "@/components/layout/topbar-context";
import { AIChatFAB } from "@/components/ai/ai-chat-fab";
import { AIChatPanel } from "@/components/ai/ai-chat-panel";
import { AIAlertsBanner } from "@/components/ai/ai-alerts-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [activeFilter, setActiveFilter] = useState("الكل");
  const [chatOpen, setChatOpen] = useState(false);

  const isAgentPage = pathname === "/agent";

  return (
    <TopbarProvider>
      <div className="min-h-screen bg-background panel-grid">
        <Sidebar />
        <div className="mr-[260px] min-h-screen">
          <Topbar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          <main className="px-6 pb-8 pt-5">
            <AIAlertsBanner />
            {children}
          </main>
        </div>

        {/* AI Chat — hidden on agent page */}
        {!isAgentPage && (
          <>
            <AIChatFAB onClick={() => setChatOpen(!chatOpen)} />
            <AIChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
          </>
        )}
      </div>
    </TopbarProvider>
  );
}
