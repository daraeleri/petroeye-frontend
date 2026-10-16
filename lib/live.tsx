"use client";

// Live updates: one authenticated WebSocket for the whole app. Events are
// written straight into the TanStack Query cache, so every screen updates
// without its own subscription.
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { WS_URL, tokenStore } from "@/lib/api";
import { alertLabel } from "@/lib/format";
import { keys } from "@/lib/queries";
import type { Truck, WsMessage } from "@/lib/types";

type LiveStatus = "connecting" | "live" | "offline";
const LiveContext = createContext<LiveStatus>("connecting");

export function LiveProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const attempt = useRef(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const connect = () => {
      const token = tokenStore.get();
      if (!token || stopped) return;
      setStatus("connecting");
      ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
      ws.onopen = () => {
        attempt.current = 0;
        setStatus("live");
        // Catch up on anything missed while disconnected.
        qc.invalidateQueries();
      };
      ws.onmessage = (ev) => {
        let msg: WsMessage;
        try {
          msg = JSON.parse(ev.data as string) as WsMessage;
        } catch {
          return;
        }
        handle(msg);
      };
      ws.onclose = () => {
        setStatus("offline");
        if (stopped) return;
        const delay = Math.min(15_000, 1_000 * 2 ** attempt.current++);
        timer = setTimeout(connect, delay);
      };
    };

    const handle = (msg: WsMessage) => {
      switch (msg.type) {
        case "truck.update": {
          const truck = msg.data;
          qc.setQueryData<Truck[]>(keys.trucks, (old) => {
            if (!old) return old;
            const i = old.findIndex((t) => t.truck_id === truck.truck_id);
            if (i === -1) return [...old, truck].sort((a, b) => a.truck_id.localeCompare(b.truck_id));
            const next = old.slice();
            next[i] = truck;
            return next;
          });
          qc.setQueryData(keys.truck(truck.truck_id), truck);
          qc.invalidateQueries({ queryKey: ["telemetry", truck.truck_id] });
          break;
        }
        case "alert.created": {
          const a = msg.data;
          qc.invalidateQueries({ queryKey: ["alerts"] });
          qc.invalidateQueries({ queryKey: ["summary"] });
          qc.invalidateQueries({ queryKey: ["activity"] });
          const show = a.severity === "critical" ? toast.error : a.severity === "warning" ? toast.warning : toast.info;
          show(`${a.truck_id} · ${alertLabel(a.type)}`, {
            description: a.message,
            duration: a.severity === "critical" ? 15_000 : 6_000,
          });
          break;
        }
        case "alert.acknowledged":
          qc.invalidateQueries({ queryKey: ["alerts"] });
          break;
        case "discharge.started":
        case "discharge.ended":
          qc.invalidateQueries({ queryKey: ["discharges"] });
          qc.invalidateQueries({ queryKey: ["summary"] });
          qc.invalidateQueries({ queryKey: ["activity"] });
          break;
      }
    };

    connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      ws?.close();
    };
  }, [qc]);

  return <LiveContext.Provider value={status}>{children}</LiveContext.Provider>;
}

export const useLiveStatus = () => useContext(LiveContext);
