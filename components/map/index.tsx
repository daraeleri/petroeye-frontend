"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/kit/panel";
import type { FleetMapProps } from "@/components/map/fleet-map";

/** Leaflet touches `window`, so the map is client-only and code-split. */
export const FleetMap = dynamic<FleetMapProps>(() => import("@/components/map/fleet-map"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});

export type { FleetMapProps };
