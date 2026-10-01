"use client";

import { useEffect } from "react";
import { useSettings, THEMES, WALLPAPERS } from "@/store/settings";

export function ThemeApplier() {
  const theme = useSettings((s) => s.theme);
  const wallpaper = useSettings((s) => s.wallpaper);
  const cloakTitle = useSettings((s) => s.cloakTitle);
  const cloakIcon = useSettings((s) => s.cloakIcon);

  useEffect(() => {
    const t = THEMES.find((x) => x.id === theme) ?? THEMES[0];
    const root = document.documentElement;
    root.style.setProperty("--bg", t.bg);
    root.style.setProperty("--surface", t.surface);
    root.style.setProperty("--surface2", t.surface);
    root.style.setProperty("--text", t.text);
    root.style.setProperty("--text-muted", t.textMuted);
    root.style.setProperty("--accent", t.accent);
    root.style.setProperty("--border", t.border);
  }, [theme]);

  useEffect(() => {
    const w = WALLPAPERS.find((x) => x.id === wallpaper) ?? WALLPAPERS[0];
    document.body.setAttribute("style", w.css);
  }, [wallpaper]);

  useEffect(() => {
    document.title = cloakTitle || "redux.";
  }, [cloakTitle]);

  useEffect(() => {
    const icon: HTMLLinkElement | null = document.querySelector("link[rel='icon']");
    if (cloakIcon) {
      if (!icon) {
        const ni = document.createElement("link");
        ni.rel = "icon";
        ni.href = cloakIcon;
        document.head.appendChild(ni);
      } else {
        icon.href = cloakIcon;
      }
    }
  }, [cloakIcon]);

  return null;
}
