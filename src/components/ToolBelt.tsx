"use client";

import { Home, Gamepad2, Music, Globe, Tv, Settings } from "lucide-react";
import { useNav, type View } from "@/store/nav";
import { useState } from "react";
import { SettingsPanel } from "./SettingsPanel";
import { cn } from "@/lib/utils";

const ITEMS: { id: View; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "music", label: "Music", icon: Music },
  { id: "browser", label: "Browser", icon: Globe },
  { id: "anime", label: "Anime", icon: Tv },
];

export function ToolBelt() {
  const view = useNav((s) => s.view);
  const setView = useNav((s) => s.setView);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <aside
        className="fixed left-0 top-0 z-50 flex h-full w-16 flex-col items-center justify-between border-r py-4"
        style={{ borderColor: "var(--border)", background: "var(--bg)" }}
      >
        {/* Logo */}
        <button
          onClick={() => setView("home")}
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-transform hover:scale-105"
          title="abroad"
        >
          <img src="/logo.svg" alt="abroad" className="h-8 w-8" />
        </button>

        {/* App icons */}
        <nav className="flex flex-1 flex-col items-center gap-2 pt-6">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={cn(
                  "group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all",
                  active ? "surface2" : "hover:surface2",
                )}
                title={item.label}
                aria-label={item.label}
              >
                {active && (
                  <span
                    className="absolute -left-3 h-6 w-1 rounded-r-full"
                    style={{ background: "var(--accent)" }}
                  />
                )}
                <Icon
                  className="h-5 w-5 transition-colors"
                  style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
                />
                {/* Tooltip */}
                <span
                  className="pointer-events-none absolute left-14 z-50 whitespace-nowrap rounded-md px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)" }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Settings */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:surface2"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
        </button>
      </aside>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
