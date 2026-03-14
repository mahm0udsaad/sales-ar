"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface TopbarControls {
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
  lastUpdatedAt?: string | null;
}

interface TopbarContextValue {
  controls: TopbarControls;
  setControls: React.Dispatch<React.SetStateAction<TopbarControls>>;
}

const TopbarContext = createContext<TopbarContextValue | null>(null);

export function TopbarProvider({ children }: { children: React.ReactNode }) {
  const [controls, setControls] = useState<TopbarControls>({});

  const value = useMemo(
    () => ({
      controls,
      setControls,
    }),
    [controls]
  );

  return <TopbarContext.Provider value={value}>{children}</TopbarContext.Provider>;
}

export function useTopbarControls() {
  const context = useContext(TopbarContext);

  if (!context) {
    throw new Error("useTopbarControls must be used within TopbarProvider");
  }

  return context;
}
