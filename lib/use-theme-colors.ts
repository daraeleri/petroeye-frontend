"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export interface ThemeColors {
  ink: string;
  ink3: string;
  ink4: string;
  critical: string;
  border: string;
  muted: string;
}

const FALLBACK: ThemeColors = {
  ink: "currentColor",
  ink3: "currentColor",
  ink4: "currentColor",
  critical: "currentColor",
  border: "currentColor",
  muted: "currentColor",
};

/**
 * Resolved values of the design tokens, for libraries (Leaflet, Recharts)
 * that need literal colors instead of CSS classes. Updates with the theme.
 */
export function useThemeColors(): ThemeColors {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState<ThemeColors>(FALLBACK);
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    const v = (name: string) => css.getPropertyValue(name).trim() || "currentColor";
    setColors({
      ink: v("--ink"),
      ink3: v("--ink-3"),
      ink4: v("--ink-4"),
      critical: v("--critical"),
      border: v("--border"),
      muted: v("--muted-foreground"),
    });
  }, [resolvedTheme]);
  return colors;
}
