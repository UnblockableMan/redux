"use client";

import { useState } from "react";
import { X, Menu, Settings, Home } from "lucide-react";
import { useNav } from "@/store/nav";
import { useSettings } from "@/store/settings";
import { SettingsPanel } from "./SettingsPanel";
import { cn } from "@/lib/utils";

// Brand icons — loaded as images from CDNs.
const BRAND_ICONS = {
  music: "https://commons.wikimedia.org/wiki/Special:FilePath/Spotify_App_Logo.svg?width=128",
  games: "https://cdn.simpleicons.org/playstation/white",
  browser: "https://www.google.com/chrome/static/images/chrome-logo.svg",
  anime: "https://cdn.simpleicons.org/crunchroll/white",
} as const;

export function ToolBar() {
  const view = useNav((s) => s.view);
  const setView = useNav((s) => s.setView);
  const toolbarOpen = useSettings((s) => s.toolbarOpen);
  const setToolbarOpen = useSettings((s) => s.setToolbarOpen);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!toolbarOpen) {
    return (
      <>
        <button
          onClick={() => setToolbarOpen(true)}
          className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border bg-black/80 backdrop-blur-md transition-all hover:scale-105"
          style={{ borderColor: "var(--border)" }}
          aria-label="Open toolbar"
        >
          <Menu className="h-5 w-5" style={{ color: "var(--text)" }} />
        </button>
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <SettingsButton onClick={() => setSettingsOpen(true)} />
      </>
    );
  }

  const items: { id: typeof view; label: string; icon: string | typeof Home }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "games", label: "Games", icon: BRAND_ICONS.games },
    { id: "music", label: "Music", icon: BRAND_ICONS.music },
    { id: "browser", label: "Browser", icon: BRAND_ICONS.browser },
    { id: "anime", label: "Anime", icon: BRAND_ICONS.anime },
  ];

  return (
    <>
      <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2">
        <div
          className="flex items-center gap-1 rounded-2xl border p-1.5 shadow-2xl backdrop-blur-2xl"
          style={{
            borderColor: "var(--border)",
            background: "color-mix(in srgb, var(--surface) 90%, transparent)",
          }}
        >
          {/* Logo */}
          <button
            onClick={() => setView("home")}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-xl transition-transform hover:scale-105"
            title="redux"
          >
            <img src="/logo.svg" alt="redux" className="h-7 w-7" />
          </button>

          <div className="mx-1 h-7 w-px" style={{ background: "var(--border)" }} />

          {/* App icons */}
          {items.map((item) => {
            const active = view === item.id;
            const isImg = typeof item.icon === "string";
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={cn(
                  "group relative flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                )}
                style={{
                  background: active ? "var(--accent)" : "transparent",
                }}
                title={item.label}
                aria-label={item.label}
              >
                {isImg ? (
                  <img
                    src={item.icon as string}
                    alt={item.label}
                    className={cn(
                      "h-5 w-5 transition-all",
                      item.id === "browser" && "rounded-full",
                      active && item.id !== "browser" && "invert",
                    )}
                  />
                ) : (
                  <Home
                    className="h-5 w-5"
                    style={{ color: active ? "var(--bg)" : "var(--text)" }}
                  />
                )}
              </button>
            );
          })}

          <div className="mx-1 h-7 w-px" style={{ background: "var(--border)" }} />

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:surface2"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
          </button>

          {/* Close toolbar */}
          <button
            onClick={() => setToolbarOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:surface2"
            title="Hide toolbar"
            aria-label="Hide toolbar"
          >
            <X className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border bg-black/80 backdrop-blur-md transition-all hover:scale-105"
      style={{ borderColor: "var(--border)" }}
      aria-label="Settings"
    >
      <Settings className="h-5 w-5" style={{ color: "var(--text)" }} />
    </button>
  );
}
