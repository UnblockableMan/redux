// Settings store — themes, wallpapers, toolbar position, proxy, tab cloak, extensions, achievements.
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId =
  | "jet" | "invert" | "midnight" | "blood" | "matrix" | "ocean" | "rose" | "amber"
  | "grey" | "pastelgreen" | "lotussky" | "blvd2" | "bluedoo" | "redscar" | "yelloh" | "blackout";

export type ToolbarPos = "top" | "left" | "right" | "bottom";
export type WallpaperId = "none" | "grid" | "dots" | "aurora" | "waves" | "mountains" | "gradient1" | "gradient2" | "noise" | "stars";

interface Settings {
  theme: ThemeId;
  wallpaper: WallpaperId;
  toolbarPos: ToolbarPos;
  wispUrl: string;
  cloakTitle: string;
  cloakIcon: string;
  setupDone: boolean;
  extensions: ExtDef[];
  achievements: string[]; // unlocked achievement IDs
  setTheme: (t: ThemeId) => void;
  setWallpaper: (w: WallpaperId) => void;
  setToolbarPos: (p: ToolbarPos) => void;
  setWispUrl: (u: string) => void;
  setCloak: (title: string, icon: string) => void;
  setSetupDone: (d: boolean) => void;
  addExtension: (e: ExtDef) => void;
  removeExtension: (id: string) => void;
  unlockAchievement: (id: string) => void;
}

interface ExtDef {
  id: string;
  name: string;
  icon: string;
  url: string;
  enabled: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-launch", name: "Hello World", desc: "Opened redux for the first time.", icon: "👋" },
  { id: "first-game", name: "Gamer", desc: "Played your first game.", icon: "🎮" },
  { id: "first-song", name: "Music Lover", desc: "Searched for a song.", icon: "🎵" },
  { id: "first-browse", name: "Explorer", desc: "Browsed a website.", icon: "🌐" },
  { id: "first-anime", name: "Otaku", desc: "Watched an anime episode.", icon: "📺" },
  { id: "theme-changer", name: "Stylish", desc: "Changed your theme.", icon: "🎨" },
  { id: "wallpaper-set", name: "Interior Designer", desc: "Set a wallpaper.", icon: "🖼️" },
  { id: "toolbar-moved", name: "Mover", desc: "Moved the toolbar.", icon: "🔀" },
  { id: "cloaked", name: "Undercover", desc: "Enabled tab cloak.", icon: "🕵️" },
  { id: "extension-added", name: "Power User", desc: "Installed an extension.", icon: "🧩" },
  { id: "setup-done", name: "All Set", desc: "Completed the setup guide.", icon: "✅" },
  { id: "10-games", name: "Game Addict", desc: "Played 10 games.", icon: "🕹️" },
];

export const THEMES: { id: ThemeId; label: string; bg: string; surface: string; text: string; textMuted: string; accent: string; border: string }[] = [
  { id: "jet", label: "Jet", bg: "#000000", surface: "#0a0a0a", text: "#ffffff", textMuted: "#888888", accent: "#ffffff", border: "#1a1a1a" },
  { id: "invert", label: "Invert", bg: "#ffffff", surface: "#f0f0f0", text: "#000000", textMuted: "#666666", accent: "#000000", border: "#d0d0d0" },
  { id: "midnight", label: "Midnight", bg: "#050508", surface: "#0d0d14", text: "#e8e8f0", textMuted: "#666680", accent: "#ffffff", border: "#1a1a24" },
  { id: "blood", label: "Blood", bg: "#080404", surface: "#100808", text: "#f0e0e0", textMuted: "#7a5a5a", accent: "#cc2222", border: "#1a0e0e" },
  { id: "matrix", label: "Matrix", bg: "#000000", surface: "#080a08", text: "#c8e8c8", textMuted: "#4a6a4a", accent: "#22c55e", border: "#0e1a0e" },
  { id: "ocean", label: "Ocean", bg: "#020617", surface: "#0a1128", text: "#e0e7ff", textMuted: "#64748b", accent: "#38bdf8", border: "#1e293b" },
  { id: "rose", label: "Rose", bg: "#0a0408", surface: "#14080e", text: "#fce4ec", textMuted: "#8a5a6a", accent: "#ec4899", border: "#1a0e14" },
  { id: "amber", label: "Amber", bg: "#0a0804", surface: "#140e08", text: "#fef3c7", textMuted: "#8a7a5a", accent: "#f59e0b", border: "#1a140e" },
  // New themes
  { id: "grey", label: "Grey", bg: "#1a1a1a", surface: "#242424", text: "#e0e0e0", textMuted: "#909090", accent: "#b0b0b0", border: "#333333" },
  { id: "pastelgreen", label: "Pastel Green", bg: "#0a1410", surface: "#0f1d16", text: "#c8e6c9", textMuted: "#6a8a70", accent: "#81c784", border: "#1a2a1f" },
  { id: "lotussky", label: "Lotus Sky", bg: "#0a0e1a", surface: "#101828", text: "#e1bee7", textMuted: "#7a6a8a", accent: "#ba68c8", border: "#1a1a2e" },
  { id: "blvd2", label: "BLVD2", bg: "#0c0a14", surface: "#14101e", text: "#d1c4e9", textMuted: "#6a5a7a", accent: "#7e57c2", border: "#1e1830" },
  { id: "bluedoo", label: "Bluedoo", bg: "#040814", surface: "#08101e", text: "#bbdefb", textMuted: "#5a7a9a", accent: "#42a5f5", border: "#0e1a2e" },
  { id: "redscar", label: "Redscar", bg: "#100404", surface: "#180808", text: "#ffcdd2", textMuted: "#8a5a5a", accent: "#ef5350", border: "#24100e" },
  { id: "yelloh", label: "Yelloh", bg: "#141004", surface: "#1e1808", text: "#fff9c4", textMuted: "#8a8a5a", accent: "#ffeb3b", border: "#2a2410" },
  { id: "blackout", label: "Blackout", bg: "#000000", surface: "#000000", text: "#333333", textMuted: "#1a1a1a", accent: "#444444", border: "#0a0a0a" },
];

export const WALLPAPERS: { id: WallpaperId; label: string; css: string }[] = [
  { id: "none", label: "None", css: "" },
  { id: "grid", label: "Grid", css: "background-image: linear-gradient(rgba(128,128,128,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.05) 1px, transparent 1px); background-size: 40px 40px;" },
  { id: "dots", label: "Dots", css: "background-image: radial-gradient(rgba(128,128,128,0.1) 1px, transparent 1px); background-size: 24px 24px;" },
  { id: "aurora", label: "Aurora", css: "background: radial-gradient(at 20% 30%, rgba(99,102,241,0.08) 0px, transparent 50%), radial-gradient(at 80% 20%, rgba(236,72,153,0.06) 0px, transparent 50%), radial-gradient(at 50% 80%, rgba(34,197,94,0.05) 0px, transparent 50%);" },
  { id: "waves", label: "Waves", css: "background: linear-gradient(180deg, transparent 0%, rgba(56,189,248,0.03) 50%, transparent 100%), radial-gradient(at 50% 100%, rgba(99,102,241,0.05) 0px, transparent 60%);" },
  { id: "mountains", label: "Mountains", css: "background: linear-gradient(180deg, transparent 60%, rgba(120,120,120,0.04) 70%, rgba(80,80,80,0.06) 100%);" },
  { id: "gradient1", label: "Gradient 1", css: "background: linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(236,72,153,0.04) 50%, rgba(245,158,11,0.04) 100%);" },
  { id: "gradient2", label: "Gradient 2", css: "background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(255,255,255,0.02) 100%);" },
  { id: "noise", label: "Noise", css: "background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.03%22/%3E%3C/svg%3E');" },
  { id: "stars", label: "Stars", css: "background-image: radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.15), transparent), radial-gradient(2px 2px at 60% 70%, rgba(255,255,255,0.1), transparent), radial-gradient(1px 1px at 80% 10%, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.1), transparent); background-size: 200px 200px;" },
];

const DEFAULT_WISP = "wss://wisp.mercurywork.shop:443";

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      theme: "jet",
      wallpaper: "grid",
      toolbarPos: "top",
      wispUrl: DEFAULT_WISP,
      cloakTitle: "",
      cloakIcon: "",
      setupDone: false,
      extensions: [],
      achievements: [],
      setTheme: (theme) => set({ theme }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      setToolbarPos: (toolbarPos) => set({ toolbarPos }),
      setWispUrl: (wispUrl) => set({ wispUrl }),
      setCloak: (cloakTitle, cloakIcon) => set({ cloakTitle, cloakIcon }),
      setSetupDone: (setupDone) => set({ setupDone }),
      addExtension: (e) => set((s) => ({ extensions: [...s.extensions, e] })),
      removeExtension: (id) => set((s) => ({ extensions: s.extensions.filter((x) => x.id !== id) })),
      unlockAchievement: (id) => set((s) => ({
        achievements: s.achievements.includes(id) ? s.achievements : [...s.achievements, id],
      })),
    }),
    { name: "redux-settings" },
  ),
);
