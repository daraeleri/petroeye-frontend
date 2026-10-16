"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Map, Truck, BarChart3, Zap, Bell, Settings, HelpCircle, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export type SidebarTabId = "dashboard" | "map" | "fleet" | "analytics" | "energy" | "alerts" | "settings" | "help" | "truck-detail";

interface TabDef {
  id: SidebarTabId;
  label: string;
  icon: typeof LayoutDashboard;
}

const MAIN_TABS: TabDef[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "map", label: "Live Map", icon: Map },
  { id: "fleet", label: "Fleet", icon: Truck },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "energy", label: "Energy", icon: Zap },
  { id: "alerts", label: "Alerts", icon: Bell },
];

const BOTTOM_TABS: TabDef[] = [
  { id: "settings", label: "Settings", icon: Settings },
  { id: "help", label: "Help", icon: HelpCircle },
];

interface SidebarProps {
  activeTab: SidebarTabId;
  onTabChange: (tab: SidebarTabId) => void;
  alertCount?: number;
  onlineCount?: number;
  className?: string;
}

export function Sidebar({ activeTab, onTabChange, alertCount = 0, className }: SidebarProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">PT</span>
          </div>
          <span className="font-semibold text-sm">PetroTwin</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">PT</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground text-sm">PetroTwin</span>
                    <span className="text-xs text-muted-foreground">Digital Twin</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                {MAIN_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        onTabChange(tab.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="text-sm font-medium">{tab.label}</span>
                      {tab.id === "alerts" && alertCount > 0 && (
                        <span className="ml-auto w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                          {alertCount > 99 ? "99+" : alertCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
              <div className="p-4 border-t space-y-1">
                {BOTTOM_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        onTabChange(tab.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden md:flex w-64 h-full bg-background border-r flex-col shrink-0 z-50",
        className
      )}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-4 border-b">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">PT</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-sm">PetroTwin</span>
            <span className="text-xs text-muted-foreground">Digital Twin</span>
          </div>
        </div>

        {/* Main nav items */}
        <nav className="flex-1 p-4 space-y-1">
          {MAIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{tab.label}</span>
                {tab.id === "alerts" && alertCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {alertCount > 99 ? "99+" : alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom nav items */}
        <div className="p-4 border-t space-y-1">
          {BOTTOM_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}