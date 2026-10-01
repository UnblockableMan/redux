// Theme store — persisted to localStorage so the theme survives reloads.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeName = "dark" | "light" | "midnight" | "sunset";

interface ThemeState {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "abroad-theme",
    },
  ),
);

export const THEMES: { id: ThemeName; label: string; swatch: string; accent: string }[] = [
  { id: "dark", label: "Dark", swatch: "#0a0a0f", accent: "#e8332a" },
  { id: "light", label: "Light", swatch: "#f5f5f7", accent: "#dc2626" },
  { id: "midnight", label: "Midnight", swatch: "#0a0e1a", accent: "#3b82f6" },
  { id: "sunset", label: "Sunset", swatch: "#1a0f0a", accent: "#f97316" },
];
