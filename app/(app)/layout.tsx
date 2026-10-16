"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogoMark } from "@/components/shell/logo";
import { AppShell } from "@/components/shell/app-shell";
import { useAuth } from "@/lib/auth";
import { LiveProvider } from "@/lib/live";

/** Every dashboard page: requires login, opens the live feed, wraps the shell. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="grid h-dvh place-items-center bg-background">
        <LogoMark className="size-10 animate-pulse" />
      </div>
    );
  }

  return (
    <LiveProvider>
      <AppShell>{children}</AppShell>
    </LiveProvider>
  );
}
