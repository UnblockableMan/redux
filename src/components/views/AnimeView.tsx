"use client";

import { Tv, Settings, BookOpen } from "lucide-react";
import { useSettings } from "@/store/settings";
import { useNav } from "@/store/nav";

export function AnimeView() {
  const wispUrl = useSettings((s) => s.wispUrl);
  const setView = useNav((s) => s.setView);

  return (
    <div className="fade-in flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl text-4xl" style={{ background: "var(--surface)" }}>
        📺
      </div>
      <h1 className="mb-2 text-2xl font-bold">Anime</h1>
      <p className="mb-6 max-w-md text-sm" style={{ color: "var(--text-muted)" }}>
        This is a placeholder. You bring your own anime source — point it at any
        streaming site or API in the settings, and it'll load here.
      </p>

      {/* Config preview */}
      <div className="w-full max-w-md rounded-xl border p-4 text-left" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Current proxy
        </div>
        <code className="block truncate font-mono text-xs" style={{ color: "var(--accent)" }}>
          {wispUrl}
        </code>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setView("setup")}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors hover:surface2"
          style={{ borderColor: "var(--border)" }}
        >
          <BookOpen className="h-4 w-4" /> Setup guide
        </button>
      </div>

      <p className="mt-8 max-w-sm text-xs" style={{ color: "var(--text-muted)" }}>
        Tip: use the Browser app to navigate to your anime site, then bookmark it here.
      </p>
    </div>
  );
}
