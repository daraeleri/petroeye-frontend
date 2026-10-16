"use client";

// TanStack Query hooks: the only way components read server data.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

export const keys = {
  trucks: ["trucks"] as const,
  truck: (id: string) => ["trucks", id] as const,
  telemetry: (id: string, params: object) => ["telemetry", id, params] as const,
  tank: (id: string) => ["tank", id] as const,
  geofences: (params: object = {}) => ["geofences", params] as const,
  alerts: (params: object = {}) => ["alerts", params] as const,
  discharges: (params: object = {}) => ["discharges", params] as const,
  summary: (params: object = {}) => ["summary", params] as const,
  activity: (params: object = {}) => ["activity", params] as const,
  users: ["users"] as const,
  health: ["health"] as const,
};

export const useTrucks = () => useQuery({ queryKey: keys.trucks, queryFn: api.listTrucks, refetchInterval: 60_000 });

export const useTruck = (id: string) => useQuery({ queryKey: keys.truck(id), queryFn: () => api.getTruck(id) });

export const useTelemetry = (id: string, params: { start?: string; limit?: number; order?: "asc" | "desc" }) =>
  useQuery({
    queryKey: keys.telemetry(id, params),
    queryFn: () => api.getTelemetry(id, params),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });

export const useTank = (id: string) =>
  useQuery({
    queryKey: keys.tank(id),
    queryFn: () => api.getTank(id).catch((e: unknown) => (e instanceof api.ApiError && e.status === 404 ? null : Promise.reject(e))),
  });

export const useGeofences = (params: { truck_id?: string; include_inactive?: boolean } = {}) =>
  useQuery({ queryKey: keys.geofences(params), queryFn: () => api.listGeofences(params) });

export const useAlerts = (params: api.AlertQuery = {}) =>
  useQuery({ queryKey: keys.alerts(params), queryFn: () => api.listAlerts(params), placeholderData: keepPreviousData });

export const useDischarges = (params: api.DischargeQuery = {}) =>
  useQuery({ queryKey: keys.discharges(params), queryFn: () => api.listDischarges(params), placeholderData: keepPreviousData });

export const useSummary = (params: api.RangeQuery = {}) =>
  useQuery({ queryKey: keys.summary(params), queryFn: () => api.getSummary(params), placeholderData: keepPreviousData });

export const useActivity = (params: api.RangeQuery = {}) =>
  useQuery({ queryKey: keys.activity(params), queryFn: () => api.getActivity(params), placeholderData: keepPreviousData });

export const useUsers = (enabled = true) => useQuery({ queryKey: keys.users, queryFn: api.listUsers, enabled });

export const useHealth = () => useQuery({ queryKey: keys.health, queryFn: api.getHealth, refetchInterval: 30_000 });

// --- Mutations ----------------------------------------------------------------

export function useAcknowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => api.acknowledgeAlert(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: keys.trucks });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useGeofenceMutations() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ["geofences"] });
  return {
    create: useMutation({ mutationFn: api.createGeofence, onSuccess: done }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Parameters<typeof api.updateGeofence>[1]) => api.updateGeofence(id, body),
      onSuccess: done,
    }),
    deactivate: useMutation({ mutationFn: api.deactivateGeofence, onSuccess: done }),
  };
}

export function useTruckMutations() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: keys.trucks });
  return {
    create: useMutation({ mutationFn: api.createTruck, onSuccess: done }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Parameters<typeof api.updateTruck>[1]) => api.updateTruck(id, body),
      onSuccess: done,
    }),
    tank: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Parameters<typeof api.putTank>[1]) => api.putTank(id, body),
      onSuccess: (_d, v) => {
        qc.invalidateQueries({ queryKey: keys.tank(v.id) });
        done();
      },
    }),
  };
}

export function useUserMutations() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: keys.users });
  return {
    create: useMutation({ mutationFn: api.createUser, onSuccess: done }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Parameters<typeof api.updateUser>[1]) => api.updateUser(id, body),
      onSuccess: done,
    }),
  };
}
