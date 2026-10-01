"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Star, Play, X, ExternalLink, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

interface Game {
  id: number;
  name: string;
  cover: string;
  url: string;
  author?: string;
  authorLink?: string;
  // Cartel games use a direct slug — no template substitution.
  cartel?: boolean;
}

const GAMES_JSON = "https://cdn.jsdelivr.net/gh/bestsabplayerox/assets@main/zones.json";
const COVER_URL = "https://cdn.jsdelivr.net/gh/bestsabplayerox/covers@main";
const HTML_URL = "https://cdn.jsdelivr.net/gh/bestsabplayerox/html@master";

// Second catalog: the 35 HTML games from UnblockableMan/Cartel.
// Each entry maps a slug (file in Cartel/games/<slug>.html) to a human title.
const CARTEL_GAME_URL = "https://cdn.jsdelivr.net/gh/UnblockableMan/Cartel@main/games";
const CARTEL_GAMES: { id: number; name: string; slug: string; cover?: string }[] = [
  { id: 9001, name: "Class of '09", slug: "09" },
  { id: 9002, name: "3D", slug: "3d" },
  { id: 9003, name: "3D 2", slug: "3d2" },
  { id: 9004, name: "Lethal Ape", slug: "ape" },
  { id: 9005, name: "Arch", slug: "arch" },
  { id: 9006, name: "Baldi 2", slug: "baldi2" },
  { id: 9007, name: "Bank Robbery 2", slug: "bank" },
  { id: 9008, name: "Bart Blast", slug: "bart" },
  { id: 9009, name: "Bhop", slug: "bhop" },
  { id: 9010, name: "Blade Ball", slug: "blade" },
  { id: 9011, name: "Bowmasters", slug: "bow" },
  { id: 9012, name: "Brawl", slug: "brawl" },
  { id: 9013, name: "CaseOh's Basics", slug: "case" },
  { id: 9014, name: "Clash", slug: "clash" },
  { id: 9015, name: "Baldi", slug: "crack" },
  { id: 9016, name: "Infinite Craft", slug: "craft" },
  { id: 9017, name: "Baldi's Ultra Decompile", slug: "decompile" },
  { id: 9018, name: "Doki Doki Literature Club", slug: "doki" },
  { id: 9019, name: "Frag", slug: "frag" },
  { id: 9020, name: "Gabriel's Schoolhouse", slug: "gabe" },
  { id: 9021, name: "Granny 2", slug: "granny2" },
  { id: 9022, name: "Web Dashers", slug: "gweb" },
  { id: 9023, name: "Media Player", slug: "mp3" },
  { id: 9024, name: "R.E.P.O", slug: "repo" },
  { id: 9025, name: "SDK", slug: "sdk" },
  { id: 9026, name: "Slope Plus", slug: "slope" },
  { id: 9027, name: "Snowball.IO", slug: "snow" },
  { id: 9028, name: "Ultra", slug: "ultra" },
  { id: 9029, name: "Us", slug: "us" },
  { id: 9030, name: "GTA: Vice City", slug: "vice" },
  { id: 9031, name: "W1", slug: "w1" },
  { id: 9032, name: "W2", slug: "w2" },
  { id: 9033, name: "W3", slug: "w3" },
  { id: 9034, name: "Geometry Dash World", slug: "world" },
  { id: 9035, name: "Crunchy XP", slug: "xp" },
];

function cartelGameUrl(slug: string): string {
  return `${CARTEL_GAME_URL}/${slug}.html`;
}

function resolveUrl(url: string): string {
  return url.replace("{COVER_URL}", COVER_URL).replace("{HTML_URL}", HTML_URL);
}

// jsDelivr serves these .html files as text/plain, so browsers render the
// SOURCE CODE instead of running the game. Fix: fetch the HTML, re-type it
// as text/html via a Blob URL, and inject a <base> so relative assets load.
function useGameBlobUrl(game: Game | null): { url: string; error: string | null } {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!game) return;
    // Cartel games already point to a direct .html URL on jsDelivr, no
    // template substitution needed. jsDelivr serves them as text/plain, so
    // we still have to fetch + re-wrap as text/html Blob for them to run.
    const direct = game.cartel ? game.url : resolveUrl(game.url);
    let revoke = "";
    let cancelled = false;

    // Non-local games (already proper URLs) can go straight into the iframe.
    if (!game.url.includes("{HTML_URL}") && !game.cartel) {
      setUrl(direct);
      setError(null);
      return;
    }

    setUrl("");
    setError(null);
    fetch(direct)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((html) => {
        if (cancelled) return;
        if (!/<base\s/i.test(html)) {
          const dir = direct.substring(0, direct.lastIndexOf("/") + 1);
          html = /<head[^>]*>/i.test(html)
            ? html.replace(/<head([^>]*)>/i, `<head$1><base href="${dir}">`)
            : `<base href="${dir}">` + html;
        }
        const blob = new Blob([html], { type: "text/html" });
        revoke = URL.createObjectURL(blob);
        setUrl(revoke);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Failed to load game");
          setUrl(direct); // last-ditch: try direct anyway
        }
      });

    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [game]);

  return { url, error };
}

export function GamesView() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [playing, setPlaying] = useState<Game | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    // Load favorites from localStorage
    try {
      setFavorites(JSON.parse(localStorage.getItem("redux-game-favs") || "[]"));
    } catch {}

    // Fetch the full games manifest (743 games) AND merge in the 35 Cartel games.
    fetch(GAMES_JSON)
      .then((r) => r.json())
      .then((data: Game[]) => {
        const base = (Array.isArray(data) ? data : []).filter((g) => g.id >= 0);
        // Build Cartel game entries — they have no cover image, so we ship a
        // simple SVG thumbnail with the game's initial.
        const cartelEntries: Game[] = CARTEL_GAMES.map((c) => ({
          id: c.id,
          name: c.name,
          cover: `data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='100%25' height='100%25' fill='%231a1a2e'/><text x='50%25' y='50%25' font-family='monospace' font-size='72' fill='%23ffffff' text-anchor='middle' dominant-baseline='middle'>${c.name.charAt(0).toUpperCase()}</text></svg>`
          )}`,
          url: cartelGameUrl(c.slug),
          author: "Cartel",
          cartel: true,
        }));
        setGames([...base, ...cartelEntries]);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to load games", { description: err.message });
        setLoading(false);
      });
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
    return games.filter((g) => g.name.toLowerCase().includes(q));
  }, [games, query]);

  const favGames = useMemo(
    () => games.filter((g) => favorites.includes(g.id)),
    [games, favorites],
  );

  if (playing) {
    return <GamePlayer game={playing} onExit={() => setPlaying(null)} />;
  }

  return (
    <div className="fade-in p-6 lg:p-8">
      <h1 className="mb-1 text-2xl font-bold">Games</h1>
      <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
        {games.length} games · from anchor ubg
      </p>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search games…"
          className="w-full rounded-lg border bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none"
          style={{ borderColor: "var(--border)" }}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      ) : (
        <>
          {/* Favorites */}
          {!query && favGames.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold">Favorites</h2>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {favGames.map((g) => (
                  <GameCard key={g.id} game={g} onPlay={() => setPlaying(g)} onFav={() => toggleFav(g.id)} isFav />
                ))}
              </div>
            </section>
          )}

          {/* All games */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">
              {query ? `Results (${filtered.length})` : "All Games"}
            </h2>
            {filtered.length === 0 ? (
              <p className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>No games found.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {filtered.map((g) => (
                  <GameCard
                    key={g.id}
                    game={g}
                    onPlay={() => setPlaying(g)}
                    onFav={() => toggleFav(g.id)}
                    isFav={favorites.includes(g.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function GameCard({ game, onPlay, onFav, isFav }: { game: Game; onPlay: () => void; onFav: () => void; isFav: boolean }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="group surface relative overflow-hidden rounded-xl border transition-all hover:scale-[1.03]" style={{ borderColor: "var(--border)" }}>
      <button onClick={onPlay} className="flex w-full flex-col items-center gap-2 p-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg" style={{ background: "var(--surface2)" }}>
          {!imgError ? (
            <img src={resolveUrl(game.cover)} alt={game.name} className="h-full w-full object-cover" loading="lazy" onError={() => setImgError(true)} />
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

function GamePlayer({ game, onExit }: { game: Game; onExit: () => void }) {
    const { url: frameSrc, error: loadError } = useGameBlobUrl(game);

  const openAboutBlank = () => {
    // Opens the game in a new about:blank window so it can't be tab-closed easily.
    if (!frameSrc) {
      toast.error("Still loading", { description: "Give the game a second to load first." });
      return;
    }
    const win = window.open("about:blank", "_blank");
    if (!win) {
      toast.error("Popup blocked", { description: "Allow popups to use about:blank." });
      return;
    }
    win.document.write(`
      <!DOCTYPE html><html><head><title>${game.name}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:#000}iframe{width:100%;height:100%;border:0}</style>
      </head><body><iframe src="${frameSrc}" allow="fullscreen;gamepad;autoplay"></iframe></body></html>
    `);
    win.document.close();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{game.name}</span>
          {game.author && <span style={{ color: "var(--text-muted)" }}>· {game.author}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openAboutBlank} className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors hover:surface2" style={{ borderColor: "var(--border)" }}>
            <FileText className="h-3 w-3" /> about:blank
          </button>
          <a href={resolveUrl(game.url)} target="_blank" rel="noopener" className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors hover:surface2" style={{ borderColor: "var(--border)" }}>
            <ExternalLink className="h-3 w-3" /> Open
          </a>
          <button onClick={onExit} className="rounded-lg border px-3 py-1 text-xs transition-colors hover:surface2" style={{ borderColor: "var(--border)" }}>
            Exit
          </button>
        </div>
      </div>
      <div className="relative flex-1 bg-black">
        {!frameSrc ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--accent)" }} />
            {loadError && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{loadError}</span>}
          </div>
        ) : (
          <iframe src={frameSrc} className="h-full w-full border-0" title={game.name} allow="fullscreen; gamepad; autoplay; encrypted-media; pointer-lock" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-pointer-lock" />
        )}
      </div>
    </div>
  );
}
