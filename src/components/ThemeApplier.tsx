"use client";

import { useEffect } from "react";
import { useSettings, THEMES, WALLPAPERS } from "@/store/settings";

export function ThemeApplier() {
  const theme = useSettings((s) => s.theme);
  const wallpaper = useSettings((s) => s.wallpaper);
  const cloakTitle = useSettings((s) => s.cloakTitle);
  const cloakIcon = useSettings((s) => s.cloakIcon);
  const blockAds = useSettings((s) => s.blockAds);
  const blockTrackers = useSettings((s) => s.blockTrackers);
  const hideReferrer = useSettings((s) => s.hideReferrer);
  const doNotTrack = useSettings((s) => s.doNotTrack);

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
    if (t.fontFamily) {
      root.style.setProperty("--font-theme", t.fontFamily);
      document.body.style.fontFamily = t.fontFamily;
    } else {
      root.style.setProperty("--font-theme", "inherit");
      document.body.style.fontFamily = "";
    }
  }, [theme]);

  useEffect(() => {
    const w = WALLPAPERS.find((x) => x.id === wallpaper) ?? WALLPAPERS[0];
    if (w.css) {
      const div = document.createElement("div");
      div.style.cssText = w.css;
      const computed = div.style;
      ["background", "background-image", "background-size", "background-position",
       "background-repeat", "background-attachment", "opacity"].forEach(p =>
        document.body.style.removeProperty(p));
      for (let i = 0; i < computed.length; i++) {
        document.body.style.setProperty(computed[i], computed.getPropertyValue(computed[i]));
      }
    } else {
      document.body.style.background = "";
    }
  }, [wallpaper]);

  // Send privacy settings to the SW so it can actually apply them.
  useEffect(() => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "privacy-config",
        blockAds, blockTrackers, hideReferrer, doNotTrack,
      });
    }
  }, [blockAds, blockTrackers, hideReferrer, doNotTrack]);

  useEffect(() => { document.title = cloakTitle || "redux V10"; }, [cloakTitle]);

  useEffect(() => {
    const icon: HTMLLinkElement | null = document.querySelector("link[rel='icon']");
    if (cloakIcon) {
      if (!icon) {
        const ni = document.createElement("link");
        ni.rel = "icon"; ni.href = cloakIcon;
        document.head.appendChild(ni);
      } else { icon.href = cloakIcon; }
    }
  }, [cloakIcon]);

  return null;
}
