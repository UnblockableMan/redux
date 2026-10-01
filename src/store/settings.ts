// Settings store — themes, proxy config, tab cloak. Persisted to localStorage.
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId = "jet" | "invert" | "midnight" | "blood" | "matrix";

interface Settings {
  theme: ThemeId;
  wispUrl: string;
  cloakTitle: string;
  cloakIcon: string;
  setupDone: boolean;
  toolbarOpen: boolean;
  setTheme: (t: ThemeId) => void;
  setWispUrl: (u: string) => void;
  setCloak: (title: string, icon: string) => void;
  setSetupDone: (d: boolean) => void;
  setToolbarOpen: (o: boolean) => void;
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
    id: "jet",
    label: "Jet",
    bg: "#000000",
    surface: "#0a0a0a",
    text: "#ffffff",
    textMuted: "#888888",
    accent: "#ffffff",
    border: "#1a1a1a",
  },
  {
    id: "invert",
    label: "Invert",
    bg: "#ffffff",
    surface: "#f0f0f0",
    text: "#000000",
    textMuted: "#666666",
    accent: "#000000",
    border: "#d0d0d0",
  },
  {
    id: "midnight",
    label: "Midnight",
    bg: "#050508",
    surface: "#0d0d14",
    text: "#e8e8f0",
    textMuted: "#666680",
    accent: "#ffffff",
    border: "#1a1a24",
  },
  {
    id: "blood",
    label: "Blood",
    bg: "#080404",
    surface: "#100808",
    text: "#f0e0e0",
    textMuted: "#7a5a5a",
    accent: "#cc2222",
    border: "#1a0e0e",
  },
  {
    id: "matrix",
    label: "Matrix",
    bg: "#000000",
    surface: "#080a08",
    text: "#c8e8c8",
    textMuted: "#4a6a4a",
    accent: "#22c55e",
    border: "#0e1a0e",
  },
];

const DEFAULT_WISP = "wss://wisp.mercurywork.shop:443";

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      theme: "jet",
      wispUrl: DEFAULT_WISP,
      cloakTitle: "",
      cloakIcon: "",
      setupDone: false,
      toolbarOpen: true,
      setTheme: (theme) => set({ theme }),
      setWispUrl: (wispUrl) => set({ wispUrl }),
      setCloak: (cloakTitle, cloakIcon) => set({ cloakTitle, cloakIcon }),
      setSetupDone: (setupDone) => set({ setupDone }),
      setToolbarOpen: (toolbarOpen) => set({ toolbarOpen }),
    }),
    { name: "redux-settings" },
  ),
);
