"use client";

import { useEffect, useState } from "react";

export interface ThemeColors {
  content: string; // primary text / bars
  contentMuted: string;
  safety: string; // brand accent
  grid: string; // gridlines / axis
  cursor: string; // hover cursor fill
  tooltipBg: string;
  tooltipBorder: string;
}

function readVar(name: string): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  // Vars are stored as "r g b" channels.
  return raw ? `rgb(${raw.replace(/\s+/g, " ")})` : "";
}

function rgba(name: string, alpha: number): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return raw ? `rgb(${raw} / ${alpha})` : "";
}

function snapshot(): ThemeColors {
  return {
    content: readVar("--content"),
    contentMuted: rgba("--content", 0.55),
    safety: readVar("--safety"),
    grid: rgba("--content", 0.08),
    cursor: rgba("--content", 0.04),
    tooltipBg: readVar("--surface"),
    tooltipBorder: rgba("--content", 0.12),
  };
}

const FALLBACK: ThemeColors = {
  content: "#242B33",
  contentMuted: "rgba(36,43,51,0.55)",
  safety: "#E1622F",
  grid: "rgba(36,43,51,0.08)",
  cursor: "rgba(36,43,51,0.04)",
  tooltipBg: "#FFFFFF",
  tooltipBorder: "rgba(36,43,51,0.12)",
};

/** Reads chart colors from the active theme's CSS variables and refreshes them
 *  whenever the theme is toggled (via the `themechange` event). */
export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(FALLBACK);

  useEffect(() => {
    const update = () => setColors(snapshot());
    update();
    window.addEventListener("themechange", update);
    return () => window.removeEventListener("themechange", update);
  }, []);

  return colors;
}
