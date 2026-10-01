"use client";

import { BookOpen } from "lucide-react";
import { useNav } from "@/store/nav";
import { useSettings } from "@/store/settings";

export function HomeView() {
  const setView = useNav((s) => s.setView);
  const setupDone = useSettings((s) => s.setupDone);

  return (
    <div className="fade-in flex min-h-full flex-col items-center justify-center p-8 text-center">
      {/* Logo */}
      <img src="/logo.svg" alt="redux" className="mb-8 h-20 w-20" />

      {/* Title */}
      <h1 className="text-6xl font-bold tracking-tighter sm:text-7xl lg:text-8xl">
        redux.
      </h1>

      {/* Subtitle */}
      <p className="mt-6 max-w-md text-sm" style={{ color: "var(--text-muted)" }}>
        I'm not finna say nthn stupid, we are not the best, but not the worst.
      </p>

      {/* Get started */}
      {!setupDone && (
        <button
          onClick={() => setView("setup")}
          className="mt-10 inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-medium transition-all hover:scale-105"
          style={{ borderColor: "var(--text)", color: "var(--text)" }}
        >
          <BookOpen className="h-4 w-4" /> Get started
        </button>
      )}

      {/* Footer */}
      <div className="absolute bottom-6 flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
        <span>v1.0</span>
        <span>·</span>
        <span>static · cloudflare-ready</span>
      </div>
    </div>
  );
}
