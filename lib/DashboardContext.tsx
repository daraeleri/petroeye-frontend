"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Alert, TelemetryReading, Truck, WsMessage } from "@/lib/types";
import {
  fetchTrucks as apiFetchTrucks,
  fetchAlerts as apiFetchAlerts,
  fetchTelemetry as apiFetchTelemetry,
} from "@/lib/api";
import { WsClient } from "@/lib/ws";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws";
const MAX_TELEMETRY_POINTS = 200;
const MAX_FLEET_HISTORY = 120;
const FLEET_HISTORY_INTERVAL_MS = 2000;

export interface FleetHistorySample {
  ts: number;
  online: number;
  alert: number;
  total: number;
  avgFuel: number;
  avgTemp: number;
}

interface DashboardState {
  trucks: Map<string, Truck>;
  telemetry: Map<string, TelemetryReading[]>;
  alerts: Alert[];
  selectedTruckId: string | null;
  selectTruck: (id: string | null) => void;
  connected: boolean;
  lastUpdate: number | null;
  fleetHistory: FleetHistorySample[];
}

const DashboardContext = createContext<DashboardState | null>(null);

export function useDashboard(): DashboardState {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within a DashboardProvider");
  return ctx;
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [trucks, setTrucks] = useState<Map<string, Truck>>(new Map());
  const [telemetry, setTelemetry] = useState<Map<string, TelemetryReading[]>>(new Map());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedTruckId, setSelectedTruck] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [fleetHistory, setFleetHistory] = useState<FleetHistorySample[]>([]);

  const wsRef = useRef<WsClient | null>(null);
  const trucksRef = useRef(trucks);
  trucksRef.current = trucks;

  const updateTelemetry = useCallback((truckId: string, reading: TelemetryReading) => {
    setTelemetry((prev) => {
      const next = new Map(prev);
      const existing = next.get(truckId) ?? [];
      next.set(truckId, [reading, ...existing].slice(0, MAX_TELEMETRY_POINTS));
      return next;
    });
  }, []);

  const handleWsMessage = useCallback((msg: WsMessage) => {
    if (msg.type === "telemetry") {
      setTrucks((prev) => {
        const t = prev.get(msg.truck_id);
        if (!t) {
          const next = new Map(prev);
          next.set(msg.truck_id, {
            truck_id: msg.truck_id,
            plate: null,
            operator: null,
            status: "in_transit",
            last_seen_at: msg.data.ts,
          });
          return next;
        }
        return prev;
      });
      updateTelemetry(msg.truck_id, msg.data);
      setLastUpdate(Date.now());
    } else if (msg.type === "alert") {
      setAlerts((prev) => [
        {
          id: msg.data.id,
          truck_id: msg.truck_id,
          type: msg.data.alert_type,
          severity: msg.data.severity,
          message: msg.data.message,
          triggered_by: msg.data.triggered_by,
          created_at: new Date().toISOString(),
          resolved_at: null,
          onchain_tx_hash: null,
        },
        ...prev,
      ].slice(0, 500));
      setTrucks((prev) => {
        const t = prev.get(msg.truck_id);
        if (t && t.status !== "alert") {
          const next = new Map(prev);
          next.set(msg.truck_id, { ...t, status: "alert" });
          return next;
        }
        return prev;
      });
    } else if (msg.type === "status") {
      setTrucks((prev) => {
        const t = prev.get(msg.truck_id);
        if (t) {
          const next = new Map(prev);
          next.set(msg.truck_id, {
            ...t,
            status: msg.data.online ? (t.status === "offline" ? "in_transit" : t.status) : "offline",
          });
          return next;
        }
        return prev;
      });
    }
  }, [updateTelemetry]);

  useEffect(() => {
    const ws = new WsClient(WS_URL);
    wsRef.current = ws;
    const unsub = ws.onMessage(handleWsMessage);
    ws.onOpen(() => setConnected(true));
    ws.onClose(() => setConnected(false));
    return () => {
      unsub();
      ws.destroy();
      wsRef.current = null;
      setConnected(false);
    };
  }, [handleWsMessage]);

  useEffect(() => {
    apiFetchTrucks()
      .then((data) => {
        setTrucks((prev) => {
          const next = new Map(prev);
          for (const truck of data) {
            next.set(truck.truck_id, truck);
          }
          return next;
        });
      })
      .catch(() => {});

    apiFetchAlerts(undefined, undefined, 100)
      .then((data) => setAlerts(data))
      .catch(() => {});
  }, []);

  const selectTruck = useCallback((id: string | null) => {
    setSelectedTruck((prev) => {
      if (prev === id) return prev;
      return id;
    });
  }, []);

  // Rolling fleet-wide snapshot for the overview charts (only while connected)
  useEffect(() => {
    if (!connected) return;
    const timer = setInterval(() => {
      setTelemetry((prev) => {
        const samples = Array.from(prev.values())
          .map((arr) => arr[0])
          .filter((r): r is TelemetryReading => Boolean(r));
        const online = Array.from(trucksRef.current.values()).filter(
          (t) => t.status !== "offline",
        ).length;
        const alert = Array.from(trucksRef.current.values()).filter(
          (t) => t.status === "alert",
        ).length;
        const total = trucksRef.current.size;
        const avgFuel = samples.length
          ? samples.reduce((s, r) => s + r.fuel_level_pct, 0) / samples.length
          : 0;
        const avgTemp = samples.length
          ? samples.reduce((s, r) => s + r.temperature_c, 0) / samples.length
          : 0;
        setFleetHistory((prevHist) =>
          [...prevHist, { ts: Date.now(), online, alert, total, avgFuel, avgTemp }].slice(-MAX_FLEET_HISTORY),
        );
        return prev;
      });
    }, FLEET_HISTORY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [connected]);

  useEffect(() => {
    if (!selectedTruckId) return;
    apiFetchTelemetry(selectedTruckId, MAX_TELEMETRY_POINTS)
      .then((data) => {
        setTelemetry((prev) => {
          const next = new Map(prev);
          const existing = next.get(selectedTruckId) ?? [];
          const merged = [...data, ...existing]
            .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
            .slice(0, MAX_TELEMETRY_POINTS);
          next.set(selectedTruckId, merged);
          return next;
        });
      })
      .catch(() => {});
  }, [selectedTruckId]);

  const state = useMemo<DashboardState>(
    () => ({ trucks, telemetry, alerts, selectedTruckId, selectTruck, connected, lastUpdate, fleetHistory }),
    [trucks, telemetry, alerts, selectedTruckId, selectTruck, connected, lastUpdate, fleetHistory],
  );

  return (
    <DashboardContext value={state}>
      {children}
    </DashboardContext>
  );
}
