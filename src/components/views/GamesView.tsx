"use client";

import { useState, useMemo } from "react";
import { Search, Star, Play, ExternalLink } from "lucide-react";
import { useSettings } from "@/store/settings";
import { toast } from "sonner";

// A curated set of games. These are HTML5 games hosted on public CDNs that
// allow embedding. Sources: gn-math, truffled, and other open game hosts.
// Each game opens in a full-screen iframe overlay.
interface Game {
  id: string;
  title: string;
  url: string;
  category: string;
  emoji: string;
  featured?: boolean;
}

const GAMES: Game[] = [
  // Action / Arcade
  { id: "2048", title: "2048", url: "https://gn-math.github.io/2048/", category: "Puzzle", emoji: "🔢", featured: true },
  { id: "tetris", title: "Tetris", url: "https://gn-math.github.io/tetris/", category: "Arcade", emoji: "🟦", featured: true },
  { id: "snake", title: "Snake", url: "https://gn-math.github.io/snake/", category: "Arcade", emoji: "🐍" },
  { id: "breakout", title: "Breakout", url: "https://gn-math.github.io/breakout/", category: "Arcade", emoji: "🧱" },
  { id: "asteroids", title: "Asteroids", url: "https://gn-math.github.io/asteroids/", category: "Arcade", emoji: "🚀" },
  { id: "pong", title: "Pong", url: "https://gn-math.github.io/pong/", category: "Arcade", emoji: "🏓" },
  { id: "flappy", title: "Flappy Bird", url: "https://gn-math.github.io/flappy-bird/", category: "Arcade", emoji: "🐤", featured: true },
  { id: "doodle", title: "Doodle Jump", url: "https://gn-math.github.io/doodle-jump/", category: "Arcade", emoji: "🦘" },
  { id: "minecraft", title: "Minecraft 2D", url: "https://gn-math.github.io/minecraft/", category: "Sandbox", emoji: "⛏️", featured: true },
  // Puzzle
  { id: "minesweeper", title: "Minesweeper", url: "https://gn-math.github.io/minesweeper/", category: "Puzzle", emoji: "💣" },
  { id: "sudoku", title: "Sudoku", url: "https://gn-math.github.io/sudoku/", category: "Puzzle", emoji: "🔲" },
  { id: "chess", title: "Chess", url: "https://gn-math.github.io/chess/", category: "Strategy", emoji: "♟️", featured: true },
  { id: "solitaire", title: "Solitaire", url: "https://gn-math.github.io/solitaire/", category: "Card", emoji: "🃏" },
  // Racing
  { id: "drift", title: "Drift Hunters", url: "https://gn-math.github.io/drift-hunters/", category: "Racing", emoji: "🏎️" },
  // Strategy
  { id: "tower", title: "Tower Defense", url: "https://gn-math.github.io/tower-defense/", category: "Strategy", emoji: "🏰" },
  // Popular web games
  { id: "1v1lol", title: "1v1.LOL", url: "https://1v1.lol/", category: "Shooter", emoji: "🎯", featured: true },
  { id: "smashkarts", title: "Smash Karts", url: "https://smashkarts.io/", category: "Action", emoji: "🛺" },
  { id: "retrobowl", title: "Retro Bowl", url: "https://retro-bowl.github.io/", category: "Sports", emoji: "🏈" },
  { id: "cookie", title: "Cookie Clicker", url: "https://orteil.dashnet.org/cookieclicker/", category: "Idle", emoji: "🍪" },
  { id: "wordle", title: "Wordle", url: "https://www.nytimes.com/games/wordle/index.html", category: "Puzzle", emoji: "📝" },
  { id: "geoguessr", title: "GeoGuessr", url: "https://www.geoguessr.com/", category: "Trivia", emoji: "🌍" },
  // More arcade
  { id: "pacman", title: "Pac-Man", url: "https://gn-math.github.io/pacman/", category: "Arcade", emoji: "🟡" },
  { id: "donkeykong", title: "Donkey Kong", url: "https://gn-math.github.io/donkey-kong/", category: "Arcade", emoji: "🦍" },
  { id: "spaceinvaders", title: "Space Invaders", url: "https://gn-math.github.io/space-invaders/", category: "Arcade", emoji: "👾" },
  { id: "frogger", title: "Frogger", url: "https://gn-math.github.io/frogger/", category: "Arcade", emoji: "🐸" },
];

const CATEGORIES = ["All", "Featured", "Arcade", "Puzzle", "Strategy", "Card", "Racing", "Shooter", "Action", "Sports", "Idle", "Trivia", "Sandbox"];

export function GamesView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [playing, setPlaying] = useState<Game | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("abroad-game-favs") || "[]");
    } catch {
      return [];
    }
  });

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("abroad-game-favs", JSON.stringify(next));
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = GAMES;
    if (category === "Featured") list = list.filter((g) => g.featured);
    else if (category !== "All") list = list.filter((g) => g.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((g) => g.title.toLowerCase().includes(q) || g.category.toLowerCase().includes(q));
    }
    return list;
  }, [query, category]);

  if (playing) {
    return <GamePlayer game={playing} onExit={() => setPlaying(null)} />;
  }

  return (
    <div className="fade-in p-6 lg:p-8">
      <h1 className="mb-1 text-2xl font-bold">Games</h1>
      <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
        {GAMES.length} games · aggregated from open sources
      </p>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search games…"
          className="w-full rounded-lg border bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none"
          style={{ borderColor: "var(--border)" }}
        />
      </div>

      {/* Categories */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className="rounded-full border px-3 py-1 text-xs transition-all"
            style={{
              borderColor: category === c ? "var(--accent)" : "var(--border)",
              color: category === c ? "var(--accent)" : "var(--text-muted)",
              background: category === c ? "var(--surface2)" : "transparent",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
          No games found.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((g) => (
            <div
              key={g.id}
              className="group surface relative overflow-hidden rounded-xl border transition-all hover:scale-[1.02]"
              style={{ borderColor: "var(--border)" }}
            >
              <button
                onClick={() => setPlaying(g)}
                className="flex w-full flex-col items-center gap-2 p-4"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-lg text-3xl" style={{ background: "var(--surface2)" }}>
                  {g.emoji}
                </div>
                <div className="w-full">
                  <div className="truncate text-center text-sm font-medium">{g.title}</div>
                  <div className="truncate text-center text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {g.category}
                  </div>
                </div>
              </button>
              <button
                onClick={() => toggleFav(g.id)}
                className="absolute right-2 top-2 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Favorite"
              >
                <Star
                  className="h-4 w-4"
                  style={{
                    color: favorites.includes(g.id) ? "var(--accent)" : "var(--text-muted)",
                    fill: favorites.includes(g.id) ? "var(--accent)" : "none",
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GamePlayer({ game, onExit }: { game: Game; onExit: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* Bar */}
      <div className="flex items-center justify-between border-b px-4 py-2" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg">{game.emoji}</span>
          <span className="font-medium">{game.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={game.url}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors hover:surface2"
            style={{ borderColor: "var(--border)" }}
          >
            <ExternalLink className="h-3 w-3" /> Open
          </a>
          <button
            onClick={onExit}
            className="rounded-lg border px-3 py-1 text-xs transition-colors hover:surface2"
            style={{ borderColor: "var(--border)" }}
          >
            Exit
          </button>
        </div>
      </div>
      {/* Iframe */}
      <div className="relative flex-1 bg-black">
        <iframe
          src={game.url}
          className="h-full w-full border-0"
          title={game.title}
          allow="fullscreen; gamepad; autoplay"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
        />
      </div>
    </div>
  );
}
