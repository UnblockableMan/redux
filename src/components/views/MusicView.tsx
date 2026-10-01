"use client";

import { useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import { useSettings } from "@/store/settings";

export function MusicView() {
  const [query, setQuery] = useState("");
  const [embedUrl, setEmbedUrl] = useState("https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator&theme=0");
  const unlockAchievement = useSettings((s) => s.unlockAchievement);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    unlockAchievement("first-song");
    if (query.includes("open.spotify.com")) {
      const embed = query.replace("open.spotify.com/", "open.spotify.com/embed/");
      setEmbedUrl(embed);
    } else {
      setEmbedUrl(`https://open.spotify.com/embed/search/${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Search bar */}
      <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
        <form onSubmit={search} className="mx-auto flex max-w-2xl items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or paste a Spotify URL…"
              className="w-full rounded-full border bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none"
              style={{ borderColor: "var(--border)" }}
            />
          </div>
          <button type="submit" className="rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: "#1db954", color: "#000" }}>
            Search
          </button>
          <a href="https://open.spotify.com" target="_blank" rel="noopener" className="rounded-full border p-2.5 transition-colors hover:surface2" style={{ borderColor: "var(--border)" }}>
            <ExternalLink className="h-4 w-4" />
          </a>
        </form>
      </div>

      {/* Spotify embed */}
      <div className="flex-1 bg-black">
        <iframe
          src={embedUrl}
          className="h-full w-full border-0"
          title="Spotify"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  );
}
