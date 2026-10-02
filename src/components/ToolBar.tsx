"use client";

import { useState } from "react";
import { Settings, Home, Puzzle, ClipboardList, AlertTriangle, Wrench } from "lucide-react";
import { useNav } from "@/store/nav";
import { useSettings, type ToolbarPos } from "@/store/settings";
import { withBase } from "@/lib/base";
import { SettingsPanel } from "./SettingsPanel";
import { cn } from "@/lib/utils";

const BRAND_ICONS = {
  music: "https://open.spotify.com/favicon.ico",
  games: "https://playstation.com/favicon.ico",
  browser: "https://www.google.com/chrome/static/images/chrome-logo.svg",
  anime: "https://www.crunchyroll.com/favicon.ico",
} as const;

export function ToolBar() {
  const view = useNav((s) => s.view);
  const setView = useNav((s) => s.setView);
  const toolbarPos = useSettings((s) => s.toolbarPos);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const items: { id: typeof view; label: string; icon: string | typeof Home }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "games", label: "Games", icon: BRAND_ICONS.games },
    { id: "music", label: "Music", icon: BRAND_ICONS.music },
    { id: "browser", label: "Browser", icon: BRAND_ICONS.browser },
    { id: "anime", label: "Anime", icon: BRAND_ICONS.anime },
    { id: "forms", label: "Forms", icon: ClipboardList },
    { id: "tools", label: "Tools", icon: Wrench },
    { id: "extensions", label: "Extensions", icon: Puzzle },
  ];

  const isHorizontal = toolbarPos === "top" || toolbarPos === "bottom";

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 50,
    ...(toolbarPos === "top" && { top: "1rem", left: "50%", transform: "translateX(-50%)" }),
    ...(toolbarPos === "bottom" && { bottom: "1rem", left: "50%", transform: "translateX(-50%)" }),
    ...(toolbarPos === "left" && { left: "1rem", top: "50%", transform: "translateY(-50%)" }),
    ...(toolbarPos === "right" && { right: "1rem", top: "50%", transform: "translateY(-50%)" }),
  };

  return (
    <>
      <div style={containerStyle}>
        <div
          className={cn(
            "flex max-h-[calc(100vh-2rem)] items-center gap-1 overflow-y-auto rounded-2xl border p-1.5 shadow-2xl backdrop-blur-2xl",
            !isHorizontal && "flex-col",
          )}
          style={{
            borderColor: "var(--border)",
            background: "color-mix(in srgb, var(--surface) 90%, transparent)",
          }}
        >
          {/* Logo */}
          <button onClick={() => setView("home")} className="flex h-9 w-9 flex-none items-center justify-center rounded-xl transition-transform hover:scale-105" title="redux">
            <img src={withBase("logo.svg")} alt="redux" className="h-7 w-7" />
          </button>

          <div className={cn("mx-1 flex-none", isHorizontal ? "h-7 w-px" : "w-7 h-px")} style={{ background: "var(--border)" }} />

          {/* App icons */}
          {items.map((item) => {
            const active = view === item.id;
            const isImg = typeof item.icon === "string";
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className="group relative flex h-9 w-9 flex-none items-center justify-center rounded-xl transition-all"
                style={{ background: active ? "var(--accent)" : "transparent" }}
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
                      active && item.id !== "browser" && item.id !== "anime" && "invert",
                      active && item.id === "anime" && "invert",
                    )}
                  />
                ) : (
                  (() => {
                    const Icon = item.icon as typeof Home;
                    return <Icon className="h-5 w-5" style={{ color: active ? "var(--bg)" : "var(--text)" }} />;
                  })()
                )}
                <span
                  className={cn(
                    "pointer-events-none absolute z-50 whitespace-nowrap rounded-md px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100",
                    toolbarPos === "top" && "top-full mt-2 left-1/2 -translate-x-1/2",
                    toolbarPos === "bottom" && "bottom-full mb-2 left-1/2 -translate-x-1/2",
                    toolbarPos === "left" && "left-full ml-2 top-1/2 -translate-y-1/2",
                    toolbarPos === "right" && "right-full mr-2 top-1/2 -translate-y-1/2",
                  )}
                  style={{ background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)" }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          <div className={cn("mx-1 flex-none", isHorizontal ? "h-7 w-px" : "w-7 h-px")} style={{ background: "var(--border)" }} />

          {/* Settings */}
          <button onClick={() => setSettingsOpen(true)} className="flex h-9 w-9 flex-none items-center justify-center rounded-xl transition-colors hover:surface2" title="Settings" aria-label="Settings">
            <Settings className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
          </button>

          {/* Panic — instantly disguises the tab as Google Docs (or other
              selected disguise) so teachers walking by don't notice. */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("redux-panic-toggle"))}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-xl transition-colors hover:surface2"
            title="PANIC — disguise as Google Docs (Esc×3 also toggles)"
            aria-label="Panic"
            style={{ color: "#ef4444" }}
          >
            <AlertTriangle className="h-5 w-5" />
          </button>
        </div>
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
