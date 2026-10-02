"use client";

import { useState } from "react";
import { Search, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Spotify web player. We try TWO approaches:
//  1) Primary: viroda1/anchor's app-spotify.html via jsDelivr, wrapped as a
//     Blob URL (because GitHub raw serves it as text/plain + X-Frame-Options:
//     deny, browsers refuse to render it as HTML in an iframe).
//  2) Fallback: Spotify's official embed player (open.spotify.com/embed/...)
//     which Spotify DOES allow iframing, but it only shows a small widget.
//
// If the primary fails (network error, HTML doesn't parse), we automatically
// fall back to the official embed so the user always sees SOMETHING.

const SPOTIFY_HTML_URL = "https://cdn.jsdelivr.net/gh/viroda1/anchor@main/app-spotify.html";
const SPOTIFY_EMBED_FALLBACK = "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator&theme=0";

export function MusicView() {
  const [query, setQuery] = useState("");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Try the primary approach first; if it fails, switch to fallback.
  const loadPrimary = async (): Promise<string | null> => {
    try {
      const res = await fetch(SPOTIFY_HTML_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      // Inject a <base> so relative asset URLs resolve back to the CDN.
      const fixed = html.includes("<base ")
        ? html
        : html.replace(/<head([^>]*)>/i, `<head$1><base href="${SPOTIFY_HTML_URL}">`);
      const blob = new Blob([fixed], { type: "text/html" });
      return URL.createObjectURL(blob);
    } catch (err: any) {
      console.warn("Spotify primary failed:", err?.message);
      return null;
    }
  };

  // Mount: try primary, fall back to Spotify's official embed.
  useState(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const primary = await loadPrimary();
      if (cancelled) return;
      if (primary) {
        setBlobUrl(primary);
        setUsingFallback(false);
      } else {
        // Fall back to the official embed — it's smaller but always works.
        setBlobUrl(SPOTIFY_EMBED_FALLBACK);
        setUsingFallback(true);
        toast.info("Using Spotify embed fallback", {
          description: "The custom player didn't load — showing the official embed instead.",
        });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  });

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Open Spotify search in a new tab since the embedded player doesn't
    // accept dynamic search terms through a URL parameter.
    window.open(`https://open.spotify.com/search/${encodeURIComponent(query)}`, "_blank", "noopener");
    toast.success("Opened Spotify search in a new tab");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Compact search bar — opens Spotify search in a new tab */}
      <div className="border-b p-3" style={{ borderColor: "var(--border)" }}>
        <form onSubmit={search} className="mx-auto flex max-w-2xl items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs (opens in new tab)…"
              className="w-full rounded-full border bg-transparent py-2 pl-10 pr-4 text-sm outline-none"
              style={{ borderColor: "var(--border)" }}
            />
          </div>
          <button type="submit" className="rounded-full px-5 py-2 text-sm font-medium" style={{ background: "#1db954", color: "#000" }}>
            Search
          </button>
          <a href="https://open.spotify.com" target="_blank" rel="noopener" title="Open spotify.com" className="rounded-full border p-2 transition-colors hover:opacity-80" style={{ borderColor: "var(--border)" }}>
            <ExternalLink className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          </a>
        </form>
        {usingFallback && (
          <p className="mt-2 text-center text-[10px]" style={{ color: "var(--text-muted)" }}>
            Showing Spotify's official embed (the custom player didn't load).
          </p>
        )}
      </div>

      {/* Full-page player — iframe takes the entire remaining viewport. */}
      <div className="relative flex-1 bg-black">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#1db954" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading Spotify player…</p>
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black p-6 text-center">
            <p className="text-sm font-medium">Couldn't load Spotify.</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{error}</p>
            <a href="https://open.spotify.com" target="_blank" rel="noopener" className="rounded-lg border px-4 py-2 text-xs" style={{ borderColor: "var(--border)" }}>
              Open spotify.com directly
            </a>
          </div>
        )}
        {blobUrl && !loading && (
          <iframe
            src={blobUrl}
            className="h-full w-full border-0"
            title="Spotify"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; popup; popups-to-escape-sandbox"
          />
        )}
      </div>
    </div>
  );
}
