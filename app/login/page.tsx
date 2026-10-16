"use client";

import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Field } from "@/components/kit/controls";
import { Logo } from "@/components/shell/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

/** Decorative pixel grid for the brand panel (static, deterministic). */
function PixelField() {
  const cols = 22;
  const rows = 14;
  return (
    <svg viewBox={`0 0 ${cols * 14} ${rows * 14}`} className="w-full opacity-90" aria-hidden>
      {Array.from({ length: cols }, (_, c) => {
        const h = Math.round(3 + 9 * Math.abs(Math.sin(c * 0.55) * Math.cos(c * 0.21)) + (c % 5 === 0 ? 2 : 0));
        return Array.from({ length: rows }, (_, r) => (
          <rect
            key={`${c}-${r}`}
            x={c * 14}
            y={(rows - 1 - r) * 14}
            width={10}
            height={10}
            rx={1.5}
            className={r < h ? (c === 15 && r >= h - 2 ? "fill-critical" : "fill-background") : "fill-background/10"}
          />
        ));
      })}
    </svg>
  );
}

export default function LoginPage() {
  const { login, status } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Wrong email or password, or the account is deactivated."
          : "Can't reach the server. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-background lg:flex">
        <div className="flex items-center gap-2.5 text-background">
          <span className="grid size-8 place-items-center rounded-lg bg-background text-ink">
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-tight">PetroEye</span>
        </div>
        <div className="grid gap-8">
          <PixelField />
          <div className="max-w-md">
            <p className="font-mono text-[11px] tracking-[0.08em] text-background/60 uppercase">Digital twin · tanker fleet</p>
            <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-tight">
              Every litre, every valve, every kilometre — live.
            </h2>
            <p className="mt-3 text-sm text-background/60">
              GPS position, tank volume and valve state from each truck, with instant alerts when a valve opens outside an
              approved geofence.
            </p>
          </div>
        </div>
        <p className="text-xs text-background/50">© {new Date().getFullYear()} PetroEye</p>
      </aside>

      <main className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="grid w-full max-w-sm gap-6">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Use the account your administrator created for you.</p>
          </div>
          <div className="grid gap-4">
            <Field label="Email">
              <Input
                type="email"
                autoComplete="username"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-10 bg-card"
              />
            </Field>
            <Field label="Password">
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 bg-card pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
          </div>
          {error && (
            <p role="alert" className="rounded-md border border-critical/30 bg-critical/10 px-3 py-2 text-sm text-critical">
              {error}
            </p>
          )}
          <Button type="submit" className="h-10" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            {busy ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">No account? Ask an administrator to create one.</p>
        </form>
      </main>
    </div>
  );
}
