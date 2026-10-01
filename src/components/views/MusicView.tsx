"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { useSettings } from "@/store/settings";
import { toast } from "sonner";

// Spotify web player shipped by the viroda1/anchor repo. GitHub raw serves
// it as text/plain + x-frame-options: deny, so we fetch it through the
// jsDelivr CDN (correct CORS, no X-Frame-Options) and re-wrap as a Blob
// with the proper text/html type so the iframe actually renders it.
const SPOTIFY_HTML_URL = "https://cdn.jsdelivr.net/gh/viroda1/anchor@main/app-spotify.html";

export function MusicView() {
  const [query, setQuery] = useState("");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unlockAchievement = useSettings((s) => s.unlockAchievement);
  const blobRef = useRef<string | null>(null);

  // Fetch the Spotify HTML once on mount and re-wrap as a Blob URL.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(SPOTIFY_HTML_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        if (cancelled) return;
        // Strip any X-Frame-Options meta — we're rendering through a blob so
        // those headers never apply, but inject a <base> so relative asset
        // URLs (if any) resolve back to the original CDN.
        const fixed = html.includes("<base ")
          ? html
          : html.replace(/<head([^>]*)>/i, `<head$1><base href="${SPOTIFY_HTML_URL}">`);
        const blob = new Blob([fixed], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        if (blobRef.current) URL.revokeObjectURL(blobRef.current);
        blobRef.current = url;
        if (!cancelled) {
          setBlobUrl(url);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load Spotify");
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
    };
  }, []);

  const reload = () => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
    setBlobUrl(null);
    setLoading(true);
    // Force re-fetch by toggling state.
    setTimeout(() => {
      const ev = new Event("reload-spotify");
      window.dispatchEvent(ev);
    }, 50);
  };

  // Listen for forced reloads.
  useEffect(() => {
    const handler = () => {
      const load = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(SPOTIFY_HTML_URL);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const html = await res.text();
          const fixed = html.includes("<base ")
            ? html
            : html.replace(/<head([^>]*)>/i, `<head$1><base href="${SPOTIFY_HTML_URL}">`);
          const blob = new Blob([fixed], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          if (blobRef.current) URL.revokeObjectURL(blobRef.current);
          blobRef.current = url;
          setBlobUrl(url);
          setLoading(false);
        } catch (err: any) {
          setError(err?.message || "Failed to load Spotify");
          setLoading(false);
        }
      };
      load();
    };
    window.addEventListener("reload-spotify", handler);
    return () => window.removeEventListener("reload-spotify", handler);
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    unlockAchievement("first-song");
    // Open Spotify search in a new tab since the embedded player doesn't
    // accept dynamic search terms through a URL parameter.
    window.open(`https://open.spotify.com/search/${encodeURIComponent(query)}`, "_blank", "noopener");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Compact search bar — opens Spotify search in a new tab since the
          anchor player doesn't accept external search params. */}
      <div className="border-b p-3" style={{ borderColor: "var(--border)" }}>
        <form onSubmit={search} className="mx-auto flex max-w-2xl items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs — opens in a new tab…"
              className="w-full rounded-full border bg-transparent py-2 pl-10 pr-4 text-sm outline-none"
              style={{ borderColor: "var(--border)" }}
            />
          </div>
          <button type="submit" className="rounded-full px-5 py-2 text-sm font-medium" style={{ background: "#1db954", color: "#000" }}>
            Search
          </button>
          <button type="button" onClick={reload} title="Reload player" className="rounded-full border p-2 transition-colors hover:opacity-80" style={{ borderColor: "var(--border)" }}>
            <RefreshCw className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          </button>
          <a href="https://open.spotify.com" target="_blank" rel="noopener" title="Open spotify.com" className="rounded-full border p-2 transition-colors hover:opacity-80" style={{ borderColor: "var(--border)" }}>
            <ExternalLink className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          </a>
        </form>
      </div>

      {/* Full-page Spotify web player — the iframe takes the entire remaining
          viewport so it actually feels like a Spotify desktop app, not a tiny
          embed card. */}
      <div className="relative flex-1 bg-black">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#1db954" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading Spotify player…</p>
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black p-6 text-center">
            <p className="text-sm font-medium">Couldn't load the Spotify player.</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{error}</p>
            <button onClick={reload} className="rounded-lg border px-4 py-2 text-xs" style={{ borderColor: "var(--border)" }}>
              Try again
            </button>
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
