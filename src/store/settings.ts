// Settings store — themes, wallpapers, toolbar position, proxy, tab cloak, extensions.
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId =
  // Themes remaining after the great theme purge of v3.9. Each one was
  // hand-picked by the user — see the comment above each entry for the vibe.
  | "blvd2"      // user-pick: BLVD2
  | "cartridge"  // user-pick: cartridge (new — retro game cart aesthetic)
  | "theend"     // user-pick: the end
  | "twilight"   // user-pick: twilight (new — purple dusk)
  | "larping"    // user-pick: larping anime (new — soft pastel)
  | "y2k"        // user-pick: 200s (Y2K aesthetic)
  | "aesthetic"  // user-pick: aesthetic (new — soft Tumblr aesthetic)
  | "gojosukuna" // user-pick: gojo vs sukuna (new — JJK purple-black)
  | "blackhole" // user-pick: blackhole (new — deep space)
  | "sumbrun"    // user-pick: sumbrun (new — summer sunset burn)
  | "whiteout"   // user-pick: whiteout
  | "blackout"   // user-pick: blackout
  | "greyscale"  // user-pick: greyscale (was "grey", renamed)
  | "invert"     // user-pick: invert
  | "unnatural"  // user-pick: "unnatural eye of the dead internet" — blue/white/black tri-tone
  ;

export type VideoWallpaperId = "none" | "blackhole" | "rainycity" | "gojosukuna" | "minecraft" | "snowfox" | "f1" | "cozyfox" | "hunt" | "custom";

export const VIDEO_WALLPAPERS: { id: VideoWallpaperId; label: string; url: string }[] = [
  { id: "none", label: "None", url: "" },
  { id: "blackhole", label: "Black Hole", url: "https://cdn.jsdelivr.net/gh/cineosweb/cineosweb.github.io@main/Videos/BlackHole.mp4" },
  { id: "rainycity", label: "Rainy City", url: "https://cdn.jsdelivr.net/gh/cineosweb/cineosweb.github.io@main/Videos/RainyCity.mp4" },
  { id: "gojosukuna", label: "Gojo vs Sukuna", url: "https://cdn.jsdelivr.net/gh/cineosweb/cineosweb.github.io@main/Videos/Gojo-Sukuna.mp4" },
  { id: "minecraft", label: "Minecraft", url: "https://cdn.jsdelivr.net/gh/cineosweb/cineosweb.github.io@main/Videos/Minecraft01.mp4" },
  { id: "snowfox", label: "Snow Fox", url: "https://cdn.jsdelivr.net/gh/cineosweb/cineosweb.github.io@main/Videos/SnowFox.mp4" },
  { id: "f1", label: "F-1", url: "https://cdn.jsdelivr.net/gh/cineosweb/cineosweb.github.io@main/Videos/F-1.mp4" },
  { id: "cozyfox", label: "Cozy Fox", url: "https://cdn.jsdelivr.net/gh/cineosweb/cineosweb.github.io@main/Videos/CozyFox.mp4" },
  { id: "hunt", label: "Hunt", url: "https://cdn.jsdelivr.net/gh/cineosweb/cineosweb.github.io@main/Videos/Hunt.mp4" },
  { id: "custom", label: "Custom URL", url: "" },
];

export type ToolbarPos = "top" | "left" | "right" | "bottom";
export type WallpaperId = "none" | "grid" | "dots" | "aurora" | "waves" | "mountains" | "gradient1" | "gradient2" | "noise" | "stars" | "yuki-kath" | "yuki-nier" | "yuki-mint" | "yuki-corndog" | "yuki-end4" | "yuki-redwin10" | "yuki-win10" | "yuki-win11" | "yuki-win11dark" | "yuki-win7" | "yuki-xp" | "yuki-w1" | "yuki-w2" | "yuki-w3" | "yuki-w4" | "yuki-w5";

interface Settings {
  theme: ThemeId;
  wallpaper: WallpaperId;
  videoWallpaper: VideoWallpaperId;
  customVideoUrl: string;
  toolbarPos: ToolbarPos;
  wispUrl: string;
  cloakTitle: string;
  cloakIcon: string;
  setupDone: boolean;
  extensions: ExtDef[];
  // Playback settings (anime + music)
  autoSkipIntro: boolean;
  autoPlayNext: boolean;
  preferDub: boolean;
  defaultQuality: "auto" | "1080" | "720" | "480" | "360";
  searchEngine: "duckduckgo" | "google" | "bing" | "startpage" | "brave";
  // Privacy settings
  blockAds: boolean;
  blockTrackers: boolean;
  doNotTrack: boolean;
  clearDataOnExit: boolean;
  hideReferrer: boolean;
  // Browser settings
  newTabPage: "shortcuts" | "google" | "duckduckgo" | "blank" | "custom";
  customNewTabUrl: string;
  saveHistory: boolean;
  // Games settings
  gamesSource: "all" | "ubg" | "cartel";
  // Keyboard shortcuts
  enableKeyboardShortcuts: boolean;
  // Panic mode (stealth disguise) — when on, overlays a fake "Google Docs"
  // / Classroom / Khan Academy page so teachers walking by don't notice.
  panicMode: boolean;
  panicDisguise: "google-docs" | "classroom" | "khan-academy" | "wikipedia" | "google";
  setTheme: (t: ThemeId) => void;
  setWallpaper: (w: WallpaperId) => void;
  setVideoWallpaper: (v: VideoWallpaperId) => void;
  setCustomVideoUrl: (u: string) => void;
  setToolbarPos: (p: ToolbarPos) => void;
  setWispUrl: (u: string) => void;
  setCloak: (title: string, icon: string) => void;
  setSetupDone: (d: boolean) => void;
  addExtension: (e: ExtDef) => void;
  removeExtension: (id: string) => void;
  setAutoSkipIntro: (v: boolean) => void;
  setAutoPlayNext: (v: boolean) => void;
  setPreferDub: (v: boolean) => void;
  setDefaultQuality: (q: "auto" | "1080" | "720" | "480" | "360") => void;
  setSearchEngine: (e: "duckduckgo" | "google" | "bing" | "startpage" | "brave") => void;
  setBlockAds: (v: boolean) => void;
  setBlockTrackers: (v: boolean) => void;
  setDoNotTrack: (v: boolean) => void;
  setClearDataOnExit: (v: boolean) => void;
  setHideReferrer: (v: boolean) => void;
  setNewTabPage: (p: "shortcuts" | "google" | "duckduckgo" | "blank" | "custom") => void;
  setCustomNewTabUrl: (u: string) => void;
  setSaveHistory: (v: boolean) => void;
  setGamesSource: (g: "all" | "ubg" | "cartel") => void;
  setEnableKeyboardShortcuts: (v: boolean) => void;
  setPanicMode: (v: boolean) => void;
  setPanicDisguise: (d: "google-docs" | "classroom" | "khan-academy" | "wikipedia" | "google") => void;
}

export interface ExtDef {
  id: string;
  name: string;
  icon: string;
  url: string;
  enabled: boolean;
}

// Preset extensions users can install with one click. The url is the
// Chrome Web Store update2/crx endpoint which serves the .crx file
// directly (the ExtensionsView already handles loading .crx files).
export const STARTER_EXTENSIONS: ExtDef[] = [
  {
    id: "starter-ublock",
    name: "uBlock Origin",
    icon: "🛡️",
    url: "https://clients2.google.com/service/update2/crx?response=redirect&prodversion=120.0&acceptformat=crx2,crx3&x=id%3Dcjpalhlbkobfjnphlfalionpjpjcgfll%26uc",
    enabled: true,
  },
  {
    id: "starter-adblock",
    name: "AdBlock",
    icon: "🚫",
    url: "https://clients2.google.com/service/update2/crx?response=redirect&prodversion=120.0&acceptformat=crx2,crx3&x=id%3Dgighmmpiobklfepjocjmefokdkhphfhlc%26uc",
    enabled: true,
  },
  {
    id: "starter-darkreader",
    name: "Dark Reader",
    icon: "🌙",
    url: "https://clients2.google.com/service/update2/crx?response=redirect&prodversion=120.0&acceptformat=crx2,crx3&x=id%3Deimcpclopinpjbepphbkepmhplbmcmcm%26uc",
    enabled: true,
  },
  {
    id: "starter-privacybadger",
    name: "Privacy Badger",
    icon: "🦡",
    url: "https://clients2.google.com/service/update2/crx?response=redirect&prodversion=120.0&acceptformat=crx2,crx3&x=id%3Dpkehgclaebpjeibpbpmpplbmhbhjlkbp%26uc",
    enabled: true,
  },
  {
    id: "starter-https-everywhere",
    name: "HTTPS Everywhere",
    icon: "🔒",
    url: "https://clients2.google.com/service/update2/crx?response=redirect&prodversion=120.0&acceptformat=crx2,crx3&x=id%3Dgcbommkclmcllkhjgbfckakagkllboia%26uc",
    enabled: true,
  },
  {
    id: "starter-decidly",
    name: "Decentraleyes",
    icon: "🌐",
    url: "https://clients2.google.com/service/update2/crx?response=redirect&prodversion=120.0&acceptformat=crx2,crx3&x=id%3Dldpochfpcgdkilbgbfbgfmibiejineoc%26uc",
    enabled: true,
  },
];

export const THEMES: { id: ThemeId; label: string; bg: string; surface: string; text: string; textMuted: string; accent: string; border: string }[] = [
  // The great theme purge of v3.9 — kept only these 15 hand-picked by the user.
  // Each one has a distinct visual identity; no filler.

  // BLVD2 — Boulevard 2: deep purple haze
  { id: "blvd2", label: "BLVD2", bg: "#0c0a14", surface: "#14101e", text: "#d1c4e9", textMuted: "#6a5a7a", accent: "#7e57c2", border: "#1e1830" },

  // Cartridge — retro game-cartridge vibe (warm grey plastic + orange label)
  { id: "cartridge", label: "Cartridge", bg: "#1a1612", surface: "#241e18", text: "#f0e0c8", textMuted: "#8a7a5a", accent: "#ff8c1a", border: "#3a2e1e" },

  // The End — apocalyptic sickly-green on black
  { id: "theend", label: "The End", bg: "#000000", surface: "#0a0a0a", text: "#c8c8a0", textMuted: "#6a6a4a", accent: "#7a8c3a", border: "#1a1a14" },

  // Twilight — purple dusk gradient
  { id: "twilight", label: "Twilight", bg: "#1a0e2e", surface: "#24103e", text: "#e0d0ff", textMuted: "#8a6ab0", accent: "#a855f7", border: "#2a1a4a" },

  // Larping Anime — soft pastel pink/lavender
  { id: "larping", label: "Larping", bg: "#1a0a14", surface: "#24101e", text: "#ffd6e7", textMuted: "#a05a78", accent: "#ff6b9d", border: "#3a1a2e" },

  // Y2K — 2000s: chrome silver + cyan
  { id: "y2k", label: "Y2K", bg: "#0a0e1a", surface: "#14182a", text: "#d0e0ff", textMuted: "#5a6a8a", accent: "#00ffff", border: "#2a2e4a" },

  // Aesthetic — Tumblr soft pastel mint
  { id: "aesthetic", label: "Aesthetic", bg: "#0a1410", surface: "#0f1d16", text: "#c8e6c9", textMuted: "#6a8a70", accent: "#81c784", border: "#1a2a1f" },

  // Gojo vs Sukuna — JJK purple-black with crimson accents
  { id: "gojosukuna", label: "Gojo vs Sukuna", bg: "#0a0008", surface: "#14000c", text: "#e0d0e0", textMuted: "#7a5a7a", accent: "#cc0033", border: "#1e0014" },

  // Blackhole — deep space black with star-white accent
  { id: "blackhole", label: "Black Hole", bg: "#000000", surface: "#050508", text: "#e0e0ff", textMuted: "#5a5a7a", accent: "#ffffff", border: "#0a0a14" },

  // Sumbrun — summer sunset burn (orange/red/purple)
  { id: "sumbrun", label: "Sum Burn", bg: "#1a0408", surface: "#240a14", text: "#ffd6a0", textMuted: "#a05a4a", accent: "#ff5a1a", border: "#3a0e1a" },

  // Whiteout — clean white
  { id: "whiteout", label: "Whiteout", bg: "#fafafa", surface: "#f0f0f0", text: "#1a1a1a", textMuted: "#777777", accent: "#2563eb", border: "#e0e0e0" },

  // Blackout — pure black
  { id: "blackout", label: "Blackout", bg: "#000000", surface: "#000000", text: "#333333", textMuted: "#1a1a1a", accent: "#444444", border: "#0a0a0a" },

  // Greyscale — neutral grey scale
  { id: "greyscale", label: "Greyscale", bg: "#1a1a1a", surface: "#242424", text: "#e0e0e0", textMuted: "#909090", accent: "#b0b0b0", border: "#333333" },

  // Invert — light-on-dark inverted to dark-on-light with crimson accent
  { id: "invert", label: "Invert", bg: "#ffffff", surface: "#f0f0f0", text: "#000000", textMuted: "#666666", accent: "#000000", border: "#d0d0d0" },

  // Unnatural — "unnatural eye of the dead internet": blue + white + black tri-tone
  { id: "unnatural", label: "Unnatural", bg: "#000014", surface: "#000028", text: "#ffffff", textMuted: "#5555aa", accent: "#0080ff", border: "#000044" },
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
  // YukiOS image wallpapers — served via jsDelivr CDN
  { id: "yuki-kath", label: "Kath", css: "background-image: url('https://cdn.jsdelivr.net/gh/Reeyuki/YukiOS@main/static/wallpapers/Kath.jpg'); background-size: cover; background-position: center; opacity: 0.3;" },
  { id: "yuki-nier", label: "Nier", css: "background-image: url('https://cdn.jsdelivr.net/gh/Reeyuki/YukiOS@main/static/wallpapers/nier.webp'); background-size: cover; background-position: center; opacity: 0.3;" },
  { id: "yuki-mint", label: "Mint", css: "background-image: url('https://cdn.jsdelivr.net/gh/Reeyuki/YukiOS@main/static/wallpapers/mint.webp'); background-size: cover; background-position: center; opacity: 0.3;" },
  { id: "yuki-corndog", label: "Corndog", css: "background-image: url('https://cdn.jsdelivr.net/gh/Reeyuki/YukiOS@main/static/wallpapers/corndog.jpg'); background-size: cover; background-position: center; opacity: 0.3;" },
  { id: "yuki-end4", label: "End", css: "background-image: url('https://cdn.jsdelivr.net/gh/Reeyuki/YukiOS@main/static/wallpapers/end_4.jpg'); background-size: cover; background-position: center; opacity: 0.3;" },
  { id: "yuki-redwin10", label: "Red Win10", css: "background-image: url('https://cdn.jsdelivr.net/gh/Reeyuki/YukiOS@main/static/wallpapers/redwin10.jpg'); background-size: cover; background-position: center; opacity: 0.3;" },
  { id: "yuki-win10", label: "Windows 10", css: "background-image: url('https://cdn.jsdelivr.net/gh/Reeyuki/YukiOS@main/static/wallpapers/win10.webp'); background-size: cover; background-position: center; opacity: 0.3;" },
  { id: "yuki-win11", label: "Windows 11", css: "background-image: url('https://cdn.jsdelivr.net/gh/Reeyuki/YukiOS@main/static/wallpapers/win11.webp'); background-size: cover; background-position: center; opacity: 0.3;" },
  { id: "yuki-win11dark", label: "Win 11 Dark", css: "background-image: url('https://cdn.jsdelivr.net/gh/Reeyuki/YukiOS@main/static/wallpapers/win11dark.webp'); background-size: cover; background-position: center; opacity: 0.3;" },
  { id: "yuki-win7", label: "Windows 7", css: "background-image: url('https://cdn.jsdelivr.net/gh/Reeyuki/YukiOS@main/static/wallpapers/win7.webp'); background-size: cover; background-position: center; opacity: 0.3;" },
  { id: "yuki-xp", label: "Windows XP", css: "background-image: url('https://cdn.jsdelivr.net/gh/Reeyuki/YukiOS@main/static/wallpapers/xp.webp'); background-size: cover; background-position: center; opacity: 0.3;" },
  { id: "yuki-w1", label: "Yuki 1", css: "background-image: url('https://cdn.jsdelivr.net/gh/Reeyuki/YukiOS@main/static/wallpapers/wallpaper1.webp'); background-size: cover; background-position: center; opacity: 0.3;" },
  { id: "yuki-w2", label: "Yuki 2", css: "background-image: url('https://cdn.jsdelivr.net/gh/Reeyuki/YukiOS@main/static/wallpapers/wallpaper2.webp'); background-size: cover; background-position: center; opacity: 0.3;" },
  { id: "yuki-w3", label: "Yuki 3", css: "background-image: url('https://cdn.jsdelivr.net/gh/Reeyuki/YukiOS@main/static/wallpapers/wallpaper3.webp'); background-size: cover; background-position: center; opacity: 0.3;" },
  { id: "yuki-w4", label: "Yuki 4", css: "background-image: url('https://cdn.jsdelivr.net/gh/Reeyuki/YukiOS@main/static/wallpapers/wallpaper4.webp'); background-size: cover; background-position: center; opacity: 0.3;" },
  { id: "yuki-w5", label: "Yuki 5", css: "background-image: url('https://cdn.jsdelivr.net/gh/Reeyuki/YukiOS@main/static/wallpapers/wallpaper5.webp'); background-size: cover; background-position: center; opacity: 0.3;" },
];

const DEFAULT_WISP = "wss://petezahgames.com/wisp/";

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      theme: "blvd2",
      wallpaper: "grid",
      videoWallpaper: "none",
      customVideoUrl: "",
      toolbarPos: "top",
      wispUrl: DEFAULT_WISP,
      cloakTitle: "",
      cloakIcon: "",
      setupDone: false,
      extensions: [],
      autoSkipIntro: false,
      autoPlayNext: true,
      preferDub: false,
      defaultQuality: "auto",
      searchEngine: "duckduckgo",
      blockAds: true,
      blockTrackers: true,
      doNotTrack: true,
      clearDataOnExit: false,
      hideReferrer: true,
      newTabPage: "shortcuts",
      customNewTabUrl: "",
      saveHistory: true,
      gamesSource: "all",
      enableKeyboardShortcuts: true,
      panicMode: false,
      panicDisguise: "google-docs",
      setTheme: (theme) => set({ theme }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      setVideoWallpaper: (videoWallpaper) => set({ videoWallpaper }),
      setCustomVideoUrl: (customVideoUrl) => set({ customVideoUrl }),
      setToolbarPos: (toolbarPos) => set({ toolbarPos }),
      setWispUrl: (wispUrl) => set({ wispUrl }),
      setCloak: (cloakTitle, cloakIcon) => set({ cloakTitle, cloakIcon }),
      setSetupDone: (setupDone) => set({ setupDone }),
      addExtension: (e) => set((s) => ({ extensions: [...s.extensions, e] })),
      removeExtension: (id) => set((s) => ({ extensions: s.extensions.filter((x) => x.id !== id) })),
      setAutoSkipIntro: (autoSkipIntro) => set({ autoSkipIntro }),
      setAutoPlayNext: (autoPlayNext) => set({ autoPlayNext }),
      setPreferDub: (preferDub) => set({ preferDub }),
      setDefaultQuality: (defaultQuality) => set({ defaultQuality }),
      setSearchEngine: (searchEngine) => set({ searchEngine }),
      setBlockAds: (blockAds) => set({ blockAds }),
      setBlockTrackers: (blockTrackers) => set({ blockTrackers }),
      setDoNotTrack: (doNotTrack) => set({ doNotTrack }),
      setClearDataOnExit: (clearDataOnExit) => set({ clearDataOnExit }),
      setHideReferrer: (hideReferrer) => set({ hideReferrer }),
      setNewTabPage: (newTabPage) => set({ newTabPage }),
      setCustomNewTabUrl: (customNewTabUrl) => set({ customNewTabUrl }),
      setSaveHistory: (saveHistory) => set({ saveHistory }),
      setGamesSource: (gamesSource) => set({ gamesSource }),
      setEnableKeyboardShortcuts: (enableKeyboardShortcuts) => set({ enableKeyboardShortcuts }),
      setPanicMode: (panicMode) => set({ panicMode }),
      setPanicDisguise: (panicDisguise) => set({ panicDisguise }),
    }),
    { name: "redux-settings" },
  ),
);
