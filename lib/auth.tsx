"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as api from "@/lib/api";
import type { Role, User } from "@/lib/types";

interface AuthState {
  user: User | null;
  status: "loading" | "authenticated" | "anonymous";
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const router = useRouter();
  const queryClient = useQueryClient();

  // Restore the session from a stored token.
  useEffect(() => {
    if (!api.tokenStore.get()) {
      setStatus("anonymous");
      return;
    }
    api
      .getMe()
      .then((me) => {
        setUser(me);
        setStatus("authenticated");
      })
      .catch(() => {
        api.tokenStore.clear();
        setStatus("anonymous");
      });
  }, []);

  const logout = useCallback(() => {
    api.tokenStore.clear();
    setUser(null);
    setStatus("anonymous");
    queryClient.clear();
    router.replace("/login");
  }, [queryClient, router]);

  // Any 401 from the API (expired token, deactivated user) logs out.
  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener(api.UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(api.UNAUTHORIZED_EVENT, onUnauthorized);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    api.tokenStore.set(res.access_token);
    setUser(res.user);
    setStatus("authenticated");
  }, []);

  const can = useCallback((...roles: Role[]) => !!user && roles.includes(user.role), [user]);

  const value = useMemo(() => ({ user, status, login, logout, can }), [user, status, login, logout, can]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
