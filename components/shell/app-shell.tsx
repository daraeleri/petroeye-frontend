"use client";

import {
  Bell,
  Droplets,
  FileDown,
  LayoutGrid,
  Map,
  Menu,
  Moon,
  Sun,
  Truck as TruckIcon,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Dot } from "@/components/kit/status";
import { AccountMenu } from "@/components/shell/account-menu";
import { Logo } from "@/components/shell/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { useLiveStatus } from "@/lib/live";
import { useAlerts, useHealth, useTrucks } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

function useNav() {
  const { can } = useAuth();
  const { data: open } = useAlerts({ acknowledged: false, limit: 100 });
  const openCount = open?.length ?? 0;
  const main: NavItem[] = [
    { href: "/", label: "Overview", icon: LayoutGrid },
    { href: "/map", label: "Live map", icon: Map },
    { href: "/trucks", label: "Trucks", icon: TruckIcon },
    { href: "/alerts", label: "Alerts", icon: Bell, badge: openCount },
    { href: "/discharges", label: "Discharges", icon: Droplets },
    { href: "/reports", label: "Reports", icon: FileDown },
  ];
  const manage: NavItem[] = can("admin") ? [{ href: "/users", label: "Users & roles", icon: Users }] : [];
  return { main, manage, openCount };
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

function NavList({ title, items, onNavigate }: { title: string; items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  if (!items.length) return null;
  return (
    <div className="grid gap-0.5">
      <p className="px-2 pb-1 text-[11px] font-medium text-muted-foreground">{title}</p>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
              active ? "bg-card font-medium text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className={cn("size-4", active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
            <span className="flex-1">{item.label}</span>
            {!!item.badge && (
              <span className="tabular rounded-full bg-critical px-1.5 py-px font-mono text-[10px] font-semibold text-white">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function SystemStatus() {
  const { data: health } = useHealth();
  const live = useLiveStatus();
  const rows = [
    { label: "Live feed", ok: live === "live", text: live === "live" ? "Connected" : live === "connecting" ? "Connecting…" : "Reconnecting" },
    { label: "Database", ok: !!health?.database, text: health ? (health.database ? "OK" : "Down") : "…" },
    { label: "MQTT broker", ok: !!health?.mqtt_connected, text: health ? (health.mqtt_connected ? "Connected" : "Down") : "…" },
  ];
  return (
    <div className="grid gap-1.5 rounded-lg border bg-card p-3">
      <p className="label-caps">System</p>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{r.label}</span>
          <span className="flex items-center gap-1.5">
            <Dot className={r.ok ? "bg-success" : "bg-warning"} />
            {r.text}
          </span>
        </div>
      ))}
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { main, manage } = useNav();
  return (
    <div className="flex h-full flex-col gap-6 p-3">
      <div className="px-1 pt-1">
        <Logo />
      </div>
      <nav className="grid gap-5">
        <NavList title="Main menu" items={main} onNavigate={onNavigate} />
        <NavList title="Management" items={manage} onNavigate={onNavigate} />
      </nav>
      <div className="mt-auto grid gap-3">
        <SystemStatus />
        <AccountMenu />
      </div>
    </div>
  );
}

const TITLES: [string, string][] = [
  ["/map", "Live map"],
  ["/trucks", "Trucks"],
  ["/alerts", "Alerts"],
  ["/discharges", "Discharges"],
  ["/reports", "Reports"],
  ["/users", "Users & roles"],
];

function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const live = useLiveStatus();
  const { data: trucks } = useTrucks();
  const { openCount } = useNav();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const section = TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? "Overview";
  const sub = pathname.startsWith("/trucks/") ? decodeURIComponent(pathname.split("/")[2] ?? "") : null;
  const online = trucks?.filter((t) => t.online).length ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="size-5" />
      </Button>
      <nav className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
        <span className="hidden sm:inline">Dashboard</span>
        <span className="hidden sm:inline">/</span>
        {sub ? (
          <>
            <Link href="/trucks" className="hover:text-foreground">{section}</Link>
            <span>/</span>
            <span className="truncate font-medium text-foreground">{sub}</span>
          </>
        ) : (
          <span className="truncate font-medium text-foreground">{section}</span>
        )}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <span className="hidden items-center gap-2 rounded-full border bg-card px-2.5 py-1 text-xs sm:flex">
          <Dot className={live === "live" ? "bg-success" : "bg-warning"} pulse={live === "live"} />
          <span className="font-medium">{live === "live" ? "Live" : "Reconnecting"}</span>
          <span className="tabular text-muted-foreground">
            {online}/{trucks?.length ?? 0} online
          </span>
        </span>
        <Button variant="outline" size="icon" asChild aria-label="Alerts" className="relative bg-card">
          <Link href="/alerts">
            <Bell className="size-4" />
            {openCount > 0 && <span className="absolute -top-1 -right-1 size-2.5 rounded-full border-2 border-background bg-critical" />}
          </Link>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-card"
          aria-label="Toggle theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {mounted && resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex h-dvh overflow-hidden bg-sidebar">
      <aside className="hidden w-60 shrink-0 border-r md:block">
        <SidebarContent />
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

