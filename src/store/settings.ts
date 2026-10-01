// Settings store — themes, proxy config, tab cloak. Persisted to localStorage.
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId = "charcoal" | "midnight" | "blood" | "matrix" | "paper";

interface Settings {
  theme: ThemeId;
  // Scramjet/Wisp proxy endpoint for the browser app.
  wispUrl: string;
  // Tab cloak — disguise the browser tab as something else.
  cloakTitle: string;
  cloakIcon: string; // emoji or data URI
  // Whether the setup guide has been completed.
  setupDone: boolean;
  setTheme: (t: ThemeId) => void;
  setWispUrl: (u: string) => void;
  setCloak: (title: string, icon: string) => void;
  setSetupDone: (d: boolean) => void;
}

export const THEMES: {
  id: ThemeId;
  label: string;
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
  accent: string;
  border: string;
}[] = [
  {
    id: "charcoal",
    label: "Charcoal",
    bg: "#0d0d0f",
    surface: "#161618",
    text: "#e5e5e5",
    textMuted: "#7a7a7a",
    accent: "#a0a0a0",
    border: "#262628",
  },
  {
    id: "midnight",
    label: "Midnight",
    bg: "#0a0e1a",
    surface: "#121826",
    text: "#d4d4d8",
    textMuted: "#6b7280",
    accent: "#6366f1",
    border: "#1e293b",
  },
  {
    id: "blood",
    label: "Blood",
    bg: "#0f0808",
    surface: "#1a0e0e",
    text: "#e0d0d0",
    textMuted: "#7a5a5a",
    accent: "#dc2626",
    border: "#2a1414",
  },
  {
    id: "matrix",
    label: "Matrix",
    bg: "#000000",
    surface: "#0a0f0a",
    text: "#c0d0c0",
    textMuted: "#4a6a4a",
    accent: "#22c55e",
    border: "#1a2a1a",
  },
  {
    id: "paper",
    label: "Paper",
    bg: "#f5f5f0",
    surface: "#ffffff",
    text: "#1a1a1a",
    textMuted: "#6a6a6a",
    accent: "#404040",
    border: "#d4d4cf",
  },
];

// Default Wisp endpoint — users replace this with their own during setup.
const DEFAULT_WISP = "wss://wisp.mercurywork.shop:443";

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      theme: "charcoal",
      wispUrl: DEFAULT_WISP,
      cloakTitle: "",
      cloakIcon: "",
      setupDone: false,
      setTheme: (theme) => set({ theme }),
      setWispUrl: (wispUrl) => set({ wispUrl }),
      setCloak: (cloakTitle, cloakIcon) => set({ cloakTitle, cloakIcon }),
      setSetupDone: (setupDone) => set({ setupDone }),
    }),
    { name: "abroad-proxy-settings" },
  ),
);
