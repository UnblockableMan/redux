"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Star, Play, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNav } from "@/store/nav";
import { CLOUD_GAMES, type CloudGame } from "./cloud-games";
import { UBG_GAMES, type HtmlGame } from "./ubg-games";
import { PETEZAH_GAMES, type PeteZahGame } from "./petezah-games";
import { CARTEL_GAMES, type CartelGame } from "./cartel-games";

const RACCOON_URL = "https://www.raccoongame.com/wap/dist/#/platform/cloudgame/gamedetail";

interface UnifiedGame {
  id: string; name: string; desc: string; cover: string; tags: string[];
  source: "cloud" | "html5" | "petezah" | "cartel";
  gameKey?: string; htmlUrl?: string;
}

const ALL_GAMES: UnifiedGame[] = [
  ...PETEZAH_GAMES.map((g) => ({ id: `pz-${g.id}`, name: g.name, desc: "", cover: g.cover, tags: ["HTML5"], source: "petezah" as const, htmlUrl: g.url })),
  ...CARTEL_GAMES.map((g) => ({ id: `ct-${g.id}`, name: g.name, desc: "", cover: "", tags: ["HTML5", "Cartel"], source: "cartel" as const, htmlUrl: g.url })),
  ...UBG_GAMES.map((g) => ({ id: `ubg-${g.id}`, name: g.name, desc: "", cover: g.cover, tags: ["HTML5"], source: "html5" as const, htmlUrl: g.url })),
  ...CLOUD_GAMES.map((g) => ({ id: `cc-${g.id}`, name: g.name, desc: g.desc, cover: g.cover, tags: g.tags, source: "cloud" as const, gameKey: g.game_key })),
];

// Blob URL hook for HTML5 games — jsDelivr serves .html as text/plain,
// so we fetch + re-wrap as text/html Blob for the iframe to actually run.
function useGameBlobUrl(url: string | undefined): { blobUrl: string; error: string | null; loading: boolean } {
  const [blobUrl, setBlobUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) return;
    let revoked = "";
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((html) => {
        if (cancelled) return;
        if (!/<base\s/i.test(html)) {
          const dir = url.substring(0, url.lastIndexOf("/") + 1);
          html = /<head[^>]*>/i.test(html)
            ? html.replace(/<head([^>]*)>/i, `<head$1><base href="${dir}">`)
            : `<base href="${dir}">` + html;
        }
        const blob = new Blob([html], { type: "text/html" });
        revoked = URL.createObjectURL(blob);
        setBlobUrl(revoked);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Failed to load game");
        setLoading(false);
      });

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [url]);

  return { blobUrl, error, loading };
}

export function GamesView() {
  const [games] = useState<UnifiedGame[]>(ALL_GAMES);
  const [query, setQuery] = useState("");
  const [playing, setPlaying] = useState<UnifiedGame | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "petezah" | "cartel" | "html5" | "cloud">("all");
  const setView = useNav((s) => s.setView);

  useEffect(() => {
    try {
      setFavorites(JSON.parse(localStorage.getItem("redux-game-favs") || "[]"));
    } catch {}
  }, []);

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("redux-game-favs", JSON.stringify(next));
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = games;
    if (activeTab === "petezah") list = list.filter((g) => g.source === "petezah");
    if (activeTab === "cartel") list = list.filter((g) => g.source === "cartel");
    if (activeTab === "html5") list = list.filter((g) => g.source === "html5");
    if (activeTab === "cloud") list = list.filter((g) => g.source === "cloud");
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((g) => g.name.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q));
  }, [games, query, activeTab]);

  const favGames = useMemo(() => games.filter((g) => favorites.includes(g.id)), [games, favorites]);

  const launchGame = (g: UnifiedGame) => {
    if (g.source === "cloud") {
      const url = `${RACCOON_URL}?gid=${g.gameKey}&name=${encodeURIComponent(g.name)}`;
      setView("browser");
      setTimeout(() => window.dispatchEvent(new CustomEvent("redux-browser-init", { detail: url })), 50);
      toast.info(`Launching ${g.name}`, { description: "Opening in the proxy browser..." });
    } else {
      // html5, petezah, and cartel sources all use the blob URL player
      setPlaying(g);
    }
  };

  if (playing) {
    return <HtmlGamePlayer game={playing} onExit={() => setPlaying(null)} />;
  }

  return (
    <div className="fade-in p-6 lg:p-8">
      <div className="mb-2 flex items-center gap-3">
        <h1 className="text-2xl font-bold">Games</h1>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {games.length} games · HTML5 + Cloud
        </span>
      </div>

      {/* Source tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {([
          { id: "all", label: "All Games", count: games.length },
          { id: "petezah", label: "PeteZah", count: games.filter((g) => g.source === "petezah").length },
          { id: "cartel", label: "Cartel", count: games.filter((g) => g.source === "cartel").length },
          { id: "html5", label: "UBG HTML5", count: games.filter((g) => g.source === "html5").length },
          { id: "cloud", label: "Cloud", count: games.filter((g) => g.source === "cloud").length },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${activeTab === t.id ? "scale-105" : "opacity-60 hover:opacity-100"}`}
            style={{ borderColor: activeTab === t.id ? "var(--accent)" : "var(--border)", color: activeTab === t.id ? "var(--accent)" : "var(--text-muted)" }}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search games..."
          className="w-full rounded-lg border bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none"
          style={{ borderColor: "var(--border)" }}
        />
      </div>

      {/* Favorites */}
      {!query && favGames.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Favorites</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {favGames.map((g) => (
              <GameCard key={g.id} game={g} onPlay={() => launchGame(g)} onFav={() => toggleFav(g.id)} isFav />
            ))}
          </div>
        </section>
      )}

      {/* All games */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          {query ? `Results (${filtered.length})` : `All Games (${filtered.length})`}
        </h2>
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>No games found.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {filtered.map((g) => (
              <GameCard key={g.id} game={g} onPlay={() => launchGame(g)} onFav={() => toggleFav(g.id)} isFav={favorites.includes(g.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function GameCard({ game, onPlay, onFav, isFav }: { game: UnifiedGame; onPlay: () => void; onFav: () => void; isFav: boolean }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="group surface relative overflow-hidden rounded-xl border transition-all hover:scale-[1.03]" style={{ borderColor: "var(--border)" }}>
      <button onClick={onPlay} className="flex w-full flex-col items-center gap-2 p-2">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg" style={{ background: "var(--surface2)" }}>
          {!imgError ? (
            <img src={game.cover} alt={game.name} className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" onError={() => setImgError(true)} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">🎮</div>
          )}
          <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px]">
            {game.source === "cloud" ? "☁️" : "🎮"}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
            <Play className="h-8 w-8 fill-current" style={{ color: "var(--accent)" }} />
          </div>
        </div>
        <span className="w-full truncate text-center text-xs font-medium">{game.name}</span>
      </button>
      <button onClick={onFav} className="absolute right-1.5 top-1.5 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100" style={{ background: "rgba(0,0,0,0.6)" }}>
        <Star className="h-3.5 w-3.5" style={{ color: isFav ? "#fbbf24" : "#fff", fill: isFav ? "#fbbf24" : "none" }} />
      </button>
    </div>
  );
}

// HTML5 game player — uses blob URL so the game actually RUNS
// instead of showing source code (jsDelivr serves .html as text/plain).
function HtmlGamePlayer({ game, onExit }: { game: UnifiedGame; onExit: () => void }) {
  const { blobUrl, error, loading } = useGameBlobUrl(game.htmlUrl);

  useEffect(() => {
    // Track play count
    const n = parseInt(localStorage.getItem("redux-game-count") || "0", 10) + 1;
    localStorage.setItem("redux-game-count", String(n));
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2" style={{ borderColor: "var(--border)" }}>
        <span className="text-sm font-medium">{game.name}</span>
        <div className="flex items-center gap-2">
          {game.htmlUrl && (
            <a href={game.htmlUrl} target="_blank" rel="noopener" className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors hover:surface2" style={{ borderColor: "var(--border)" }}>
              <ExternalLink className="h-3 w-3" /> Open
            </a>
          )}
          <button onClick={onExit} className="rounded-lg border px-3 py-1 text-xs transition-colors hover:surface2" style={{ borderColor: "var(--border)" }}>Exit</button>
        </div>
      </div>
      <div className="relative flex-1 bg-black">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent)" }} />
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Loading game...</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black p-6 text-center">
            <p className="text-sm font-medium">Couldn't load the game.</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{error}</p>
            {game.htmlUrl && (
              <a href={game.htmlUrl} target="_blank" rel="noopener" className="rounded-lg border px-4 py-2 text-xs" style={{ borderColor: "var(--border)" }}>Try direct URL</a>
            )}
          </div>
        )}
        {blobUrl && !loading && !error && (
          <iframe
            src={blobUrl}
            className="h-full w-full border-0"
            title={game.name}
            allow="fullscreen; gamepad; autoplay; encrypted-media; pointer-lock"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-pointer-lock"
          />
        )}
      </div>
    </div>
  );
}
