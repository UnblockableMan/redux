"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Star, Play, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useNav } from "@/store/nav";
import { CLOUD_GAMES, type CloudGame } from "./cloud-games";

// Cloud games from kmaifdifik-cpu/mathstudypractice (stratus-api).
// 225 AAA/indie games via RaccoonGame cloud platform.
// Each game streams via raccoongame.com — opens in the Browser view
// through the Scramjet proxy.

const RACCOON_URL = "https://www.raccoongame.com/wap/dist/#/platform/cloudgame/gamedetail";

export function GamesView() {
  const [games] = useState<CloudGame[]>(CLOUD_GAMES);
  const [query, setQuery] = useState("");
  const [playing, setPlaying] = useState<CloudGame | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const setView = useNav((s) => s.setView);

  useEffect(() => {
    try {
      setFavorites(JSON.parse(localStorage.getItem("redux-game-favs") || "[]"));
    } catch {}
  }, []);

  const toggleFav = (id: number) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("redux-game-favs", JSON.stringify(next));
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return games;
    const q = query.toLowerCase();
    return games.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      g.desc.toLowerCase().includes(q) ||
      g.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [games, query]);

  const favGames = useMemo(
    () => games.filter((g) => favorites.includes(g.id)),
    [games, favorites],
  );

  const launchGame = (g: CloudGame) => {
    // Each game has a game_key — construct the RaccoonGame URL.
    const url = `${RACCOON_URL}?gid=${g.game_key}&name=${encodeURIComponent(g.name)}`;
    setView("browser");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("redux-browser-init", { detail: url }));
    }, 50);
    toast.info(`Launching ${g.name}`, { description: "Opening in the proxy browser..." });
  };

  if (playing) {
    return <GamePlayer game={playing} onExit={() => setPlaying(null)} onLaunch={() => launchGame(playing)} />;
  }

  return (
    <div className="fade-in p-6 lg:p-8">
      <div className="mb-2 flex items-center gap-3">
        <h1 className="text-2xl font-bold">Games</h1>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {games.length} cloud games · via RaccoonGame
        </span>
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
              <GameCard
                key={g.id}
                game={g}
                onPlay={() => launchGame(g)}
                onFav={() => toggleFav(g.id)}
                isFav={favorites.includes(g.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function GameCard({ game, onPlay, onFav, isFav }: { game: CloudGame; onPlay: () => void; onFav: () => void; isFav: boolean }) {
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

function GamePlayer({ game, onExit, onLaunch }: { game: CloudGame; onExit: () => void; onLaunch: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2" style={{ borderColor: "var(--border)" }}>
        <span className="text-sm font-medium">{game.name}</span>
        <div className="flex items-center gap-2">
          <button onClick={onLaunch} className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors hover:surface2" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
            <ExternalLink className="h-3 w-3" /> Launch
          </button>
          <button onClick={onExit} className="rounded-lg border px-3 py-1 text-xs transition-colors hover:surface2" style={{ borderColor: "var(--border)" }}>Exit</button>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8" style={{ background: "var(--bg)" }}>
        <img src={game.cover} alt={game.name} className="max-h-64 rounded-xl shadow-2xl" referrerPolicy="no-referrer" />
        <h2 className="text-xl font-bold">{game.name}</h2>
        <p className="max-w-lg text-center text-sm" style={{ color: "var(--text-muted)" }}>{game.desc}</p>
        {game.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {game.tags.map((t) => <span key={t} className="rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: "var(--border)" }}>{t}</span>)}
          </div>
        )}
        <button onClick={onLaunch} className="mt-4 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all hover:scale-105" style={{ background: "var(--accent)", color: "var(--bg)" }}>
          <Play className="h-5 w-5 fill-current" /> Play Now
        </button>
      </div>
    </div>
  );
}
