"use client";

import { LayoutDashboard, Map, Truck, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabId = "dashboard" | "map" | "fleet" | "alerts";

interface TabDef {
  id: TabId;
  label: string;
  icon: typeof LayoutDashboard;
}

const TABS: TabDef[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "map", label: "Live Map", icon: Map },
  { id: "fleet", label: "Fleet", icon: Truck },
  { id: "alerts", label: "Alerts", icon: Bell },
];

interface HeaderNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  alertCount?: number;
  onlineCount?: number;
}

export function HeaderNav({ activeTab, onTabChange, alertCount = 0, onlineCount = 0 }: HeaderNavProps) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <header className="h-14 bg-surface border-b border-border-default flex items-center px-4 gap-6 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-md bg-accent-info/20 border border-accent-info/40 flex items-center justify-center">
          <span className="text-accent-info font-bold text-sm">PT</span>
        </div>
        <span className="text-sm font-semibold text-text-primary tracking-wide hidden sm:inline">
          PetroTwin
        </span>
      </div>

      {/* Navigation tabs */}
      <nav className="flex items-center gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                isActive
                  ? "bg-accent-info/15 text-accent-info"
                  : "text-text-muted hover:text-text-primary hover:bg-surface/50",
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === "alerts" && alertCount > 0 && (
                <span className="ml-1 w-4 h-4 rounded-full bg-accent-critical text-[9px] font-bold flex items-center justify-center text-base">
                  {alertCount > 99 ? "99+" : alertCount}
                </span>
              )}
              {tab.id === "map" && onlineCount > 0 && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-accent-safe" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right side: live indicator + time */}
      <div className="ml-auto flex items-center gap-3 text-text-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-safe animate-pulse" />
          <span className="text-[10px] font-mono">LIVE</span>
        </div>
        <div className="text-[11px] font-mono text-right leading-tight">
          <div>{timeStr}</div>
          <div className="text-[9px] text-text-muted/60">{dateStr}</div>
        </div>
      </div>
    </header>
  );
}
