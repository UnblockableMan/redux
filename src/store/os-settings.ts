// OS settings store — wallpaper, accent, boot state. Persisted to localStorage.
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AccentColor = "rose" | "violet" | "amber" | "emerald" | "sky";
export type WallpaperId = "aurora" | "dunes" | "nebula" | "forest" | "mono" | "sunset";

interface OSSettings {
  wallpaper: WallpaperId;
  accent: AccentColor;
  booted: boolean;
  reducedMotion: boolean;
  setWallpaper: (w: WallpaperId) => void;
  setAccent: (a: AccentColor) => void;
  setBooted: (b: boolean) => void;
  setReducedMotion: (r: boolean) => void;
}

export const WALLPAPERS: { id: WallpaperId; label: string; css: string }[] = [
  {
    id: "aurora",
    label: "Aurora",
    css: "radial-gradient(at 20% 30%, #e8332a55 0px, transparent 50%), radial-gradient(at 80% 20%, #7c3aed44 0px, transparent 50%), radial-gradient(at 50% 80%, #0ea5e944 0px, transparent 50%), #0a0a0f",
  },
  {
    id: "dunes",
    label: "Dunes",
    css: "radial-gradient(at 30% 70%, #f59e0b44 0px, transparent 50%), radial-gradient(at 70% 30%, #ef444433 0px, transparent 50%), linear-gradient(135deg, #1a0f0a, #2d1810)",
  },
  {
    id: "nebula",
    label: "Nebula",
    css: "radial-gradient(at 20% 50%, #8b5cf655 0px, transparent 50%), radial-gradient(at 80% 50%, #ec489944 0px, transparent 50%), radial-gradient(at 50% 100%, #3b82f633 0px, transparent 50%), #0a0a1a",
  },
  {
    id: "forest",
    label: "Forest",
    css: "radial-gradient(at 30% 30%, #22c55e33 0px, transparent 50%), radial-gradient(at 70% 70%, #14b8a633 0px, transparent 50%), linear-gradient(135deg, #0a1a0f, #0f2018)",
  },
  {
    id: "mono",
    label: "Mono",
    css: "radial-gradient(at 50% 0%, #ffffff11 0px, transparent 50%), #0a0a0a",
  },
  {
    id: "sunset",
    label: "Sunset",
    css: "linear-gradient(180deg, #1a0a2e 0%, #4a1a3a 30%, #8b2a3a 60%, #e8332a44 100%)",
  },
];

export const ACCENTS: { id: AccentColor; label: string; color: string }[] = [
  { id: "rose", label: "Rose", color: "#e8332a" },
  { id: "violet", label: "Violet", color: "#8b5cf6" },
  { id: "amber", label: "Amber", color: "#f59e0b" },
  { id: "emerald", label: "Emerald", color: "#22c55e" },
  { id: "sky", label: "Sky", color: "#0ea5e9" },
];

export const useOSSettings = create<OSSettings>()(
  persist(
    (set) => ({
      wallpaper: "aurora",
      accent: "rose",
      booted: false,
      reducedMotion: false,
      setWallpaper: (wallpaper) => set({ wallpaper }),
      setAccent: (accent) => set({ accent }),
      setBooted: (booted) => set({ booted }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    }),
    { name: "abroad-os-settings" },
  ),
);
