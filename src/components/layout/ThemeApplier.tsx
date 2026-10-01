"use client";

import { useEffect } from "react";
import { useTheme } from "@/store/theme";

/** Applies the current theme from the Zustand store to the document. */
export function ThemeApplier() {
  const theme = useTheme((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  return null;
}
