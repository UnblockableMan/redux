"use client";

import { useEffect } from "react";
import { useSettings, THEMES } from "@/store/settings";

/** Applies theme variables + reduced motion + tab cloak to the document. */
export function ThemeApplier() {
  const theme = useSettings((s) => s.theme);
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
    if (cloakTitle) document.title = cloakTitle;
    else document.title = "abroad";
  }, [cloakTitle]);

  useEffect(() => {
    const icon: HTMLLinkElement | null = document.querySelector("link[rel='icon']");
    if (cloakIcon) {
      if (!icon) {
        const newIcon = document.createElement("link");
        newIcon.rel = "icon";
        newIcon.href = cloakIcon;
        document.head.appendChild(newIcon);
      } else {
        icon.href = cloakIcon;
      }
    }
  }, [cloakIcon]);

  return null;
}
