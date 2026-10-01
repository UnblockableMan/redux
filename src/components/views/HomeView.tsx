"use client";

import { Gamepad2, Music, Globe, Tv, ArrowRight, Github, BookOpen } from "lucide-react";
import { useNav } from "@/store/nav";
import { useSettings } from "@/store/settings";

export function HomeView() {
  const setView = useNav((s) => s.setView);
  const setupDone = useSettings((s) => s.setupDone);

  const cards = [
    {
      view: "games" as const,
      title: "Games",
      desc: "Arcade, puzzle, strategy & more — all playable in your browser.",
      icon: Gamepad2,
      emoji: "🎮",
    },
    {
      view: "music" as const,
      title: "Music",
      desc: "Search and stream from YouTube Music. Build your library.",
      icon: Music,
      emoji: "🎧",
    },
    {
      view: "browser" as const,
      title: "Browser",
      desc: "A full web browser with proxy support. Go anywhere.",
      icon: Globe,
      emoji: "🌐",
    },
    {
      view: "anime" as const,
      title: "Anime",
      desc: "Stream anime episodes. Configure your source in settings.",
      icon: Tv,
      emoji: "📺",
    },
  ];

  return (
    <div className="fade-in p-6 lg:p-10">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">abroad</h1>
        <p className="mt-2 max-w-xl text-sm" style={{ color: "var(--text-muted)" }}>
          A static web proxy hub. Games, music, browser, and anime — all in one place.
          No backend, no account, no corporate slop.
        </p>
        {!setupDone && (
          <button
            onClick={() => setView("setup")}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors hover:surface2"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            <BookOpen className="h-4 w-4" /> Get started
          </button>
        )}
      </div>

      {/* App cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.view}
              onClick={() => setView(c.view)}
              className="group surface relative overflow-hidden rounded-2xl border p-5 text-left transition-all hover:scale-[1.02]"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-3xl">{c.emoji}</span>
                <Icon className="h-5 w-5 opacity-30 transition-opacity group-hover:opacity-100" style={{ color: "var(--accent)" }} />
              </div>
              <h3 className="mb-1 text-lg font-semibold">{c.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {c.desc}
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs" style={{ color: "var(--accent)" }}>
                Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-12 flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
        <span>v1.0</span>
        <span>·</span>
        <span>Static · Cloudflare-ready</span>
        <span>·</span>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-1 transition-colors hover:text-current"
        >
          <Github className="h-3 w-3" /> Source
        </a>
      </div>
    </div>
  );
}
