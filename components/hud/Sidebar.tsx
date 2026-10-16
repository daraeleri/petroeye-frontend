"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Map, Truck, BarChart3, Zap, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export type SidebarTabId = "dashboard" | "map" | "fleet" | "analytics" | "energy" | "alerts";

interface TabDef {
  id: SidebarTabId;
  label: string;
  icon: typeof LayoutDashboard;
}

const TABS: TabDef[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "map", label: "Live Map", icon: Map },
  { id: "fleet", label: "Fleet", icon: Truck },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "energy", label: "Energy", icon: Zap },
  { id: "alerts", label: "Alerts", icon: Bell },
];

interface SidebarProps {
  activeTab: SidebarTabId;
  onTabChange: (tab: SidebarTabId) => void;
  alertCount?: number;
  onlineCount?: number;
}

export function Sidebar({ activeTab, onTabChange, alertCount = 0 }: SidebarProps) {
  // Render a stable placeholder on the server; only set the real (ticking)
  // time after mount so SSR and client HTML match during hydration.
  const [timeStr, setTimeStr] = useState<string>("--:--:--");

  useEffect(() => {
    const update = () =>
      setTimeStr(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <aside className="w-full h-14 md:w-14 md:h-full glass-panel border-t md:border-t-0 md:border-r border-border-default flex flex-row md:flex-col items-center justify-between md:justify-start px-2 py-0 md:py-3 md:gap-1 shrink-0 z-50 order-last md:order-first">
      {/* Brand */}
      <div className="hidden md:flex w-9 h-9 rounded-lg bg-accent-info/20 border border-accent-info/40 items-center justify-center mb-2 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
        <span className="text-accent-info font-bold text-sm drop-shadow-[0_0_5px_rgba(56,189,248,0.8)]">PT</span>
      </div>

      <div className="hidden md:block w-8 h-px bg-border-default mb-2" />

      {/* Nav items */}
      <nav className="flex flex-row md:flex-col items-center flex-1 justify-around md:justify-start w-full md:w-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              title={tab.label}
              className={cn(
                "relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                isActive
                  ? "bg-accent-info/20 text-accent-info shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                  : "text-text-muted hover:text-accent-info hover:bg-accent-info/10 hover:shadow-[0_0_10px_rgba(56,189,248,0.1)]",
              )}
            >
              {isActive && (
                <span className="absolute bottom-0 md:bottom-auto md:left-0 md:top-1/2 md:-translate-y-1/2 w-5 h-0.5 md:w-0.5 md:h-5 rounded-full bg-accent-info shadow-[0_0_5px_rgba(56,189,248,1)]" />
              )}
              <Icon className="w-5 h-5 drop-shadow-md" />
              {tab.id === "alerts" && alertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent-critical text-[8px] font-bold flex items-center justify-center text-base shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                  {alertCount > 99 ? "99+" : alertCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: live indicator */}
      <div className="hidden md:flex flex-col items-center gap-1.5 mt-auto">
        <span className="w-2 h-2 rounded-full bg-accent-safe animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        <span className="text-[8px] font-mono text-text-muted tracking-wider">{timeStr}</span>
      </div>
    </aside>
  );
}
