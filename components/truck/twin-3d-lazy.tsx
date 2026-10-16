"use client";

import { Box } from "lucide-react";
import dynamic from "next/dynamic";
import type { Twin3DProps } from "@/components/truck/twin-3d";

/** three.js + the 3.8 MB model load only when this panel renders. */
export const Twin3D = dynamic<Twin3DProps>(() => import("@/components/truck/twin-3d"), {
  ssr: false,
  loading: () => (
    <div className="grid size-full place-items-center">
      <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
        <Box className="size-6 animate-pulse" />
        Loading 3D model…
      </div>
    </div>
  ),
});
