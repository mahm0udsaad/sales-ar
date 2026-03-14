"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
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
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="mr-[200px]">
        <Topbar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        <main className="p-6">
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
  );
}
