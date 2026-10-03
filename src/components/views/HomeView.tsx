"use client";

import { useEffect, useState, useRef } from "react";
import { Search, BookOpen, Plus, X } from "lucide-react";
import { useNav } from "@/store/nav";
import { useSettings } from "@/store/settings";
import { withBase } from "@/lib/base";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

// Default shortcuts (favicon-driven). Users can add/remove their own;
// the list persists in localStorage so the home page stays theirs.
interface Shortcut { name: string; url: string; icon: string; }
const DEFAULT_SHORTCUTS: Shortcut[] = [
  { name: "YouTube", url: "https://youtube.com", icon: "https://www.youtube.com/s/desktop/favicon.ico" },
  { name: "Reddit", url: "https://reddit.com", icon: "https://www.redditstatic.com/favicon.ico" },
  { name: "Spotify", url: "https://open.spotify.com", icon: "https://open.spotify.com/favicon.ico" },
  { name: "Twitch", url: "https://twitch.tv", icon: "https://assets.help.twitch.tv/article/img/favicon.ico" },
  { name: "Discord", url: "https://discord.com", icon: "https://discord.com/assets/favicon.ico" },
  { name: "GitHub", url: "https://github.com", icon: "https://github.githubassets.com/favicons/favicon.svg" },
  { name: "Wikipedia", url: "https://wikipedia.org", icon: "https://en.wikipedia.org/static/favicon/wikipedia.ico" },
  { name: "Netflix", url: "https://netflix.com", icon: "https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2023.ico" },
];

// Cloud games — from viroda1/anchor. Each opens in the Browser view via Scramjet.
interface CloudGame { name: string; url: string; icon: string; note: string; }
const CLOUD_GAMES: CloudGame[] = [
  { name: "Roblox", url: "https://nowgg.fun/apps/a/19900/b.html", icon: "https://icons.duckduckgo.com/ip3/roblox.com.ico", note: "Cloud-streamed via now.gg" },
  { name: "Fortnite", url: "https://nowgg.fun/apps/fortnite/b.html", icon: "https://icons.duckduckgo.com/ip3/fortnite.com.ico", note: "Play Fortnite in browser" },
  { name: "Rocket League", url: "https://nowgg.fun/apps/rocket-league/b.html", icon: "https://icons.duckduckgo.com/ip3/rocketleague.com.ico", note: "Soccer with cars" },
  { name: "GeForce NOW", url: "https://play.geforcenow.com/mall/#/loginwall", icon: "https://icons.duckduckgo.com/ip3/geforcenow.com.ico", note: "NVIDIA cloud gaming" },
  { name: "Xbox Cloud", url: "https://www.xbox.com/play", icon: "https://icons.duckduckgo.com/ip3/xbox.com.ico", note: "Xbox Game Pass streaming" },
  { name: "Steam", url: "https://steamcommunity.com", icon: "https://icons.duckduckgo.com/ip3/steampowered.com.ico", note: "Steam community" },
  { name: "itch.io", url: "https://itch.io/games/html5", icon: "https://icons.duckduckgo.com/ip3/itch.io.ico", note: "Indie HTML5 games" },
  { name: "Poki", url: "https://poki.com", icon: "https://icons.duckduckgo.com/ip3/poki.com.ico", note: "Casual browser games" },
];

// Rotating footer phrases — cycled every 4 seconds. The vibe is intentionally
// chaotic / meme-y, matching the opium.best aesthetic.
const ROTATING_PHRASES: string[] = [
  "do ur work boi",
  "larpgellion",
  "Brooklyn do ur work",
  "might add Roblox or wtv",
  "tung tung nooo",
  "redux da goat",
  "someone is angy",
  "aww so cute",
  "I am the alpha boiii 6767 mango",
  "I'm single btw",
  "modern day nitting",
  "I love being larp",
  "I fed ur kid spaghetti",
  "mangos in your mouth",
  "dark pshycologiy",
  "idk how 2 speel",
  "didyou know redux used 2 be called ABSSENT?",
  // Batch 2 — user-added phrases
  "my enemies are many, my equals are none",
  "SPONEGBOBBB",
  "what time is it",
  "#wifedat",
  "Noah Noah pls Collab with me pls pls pls",
  "any other proxies tryna Collab??? #wheredeyat?",
];

const SHORTCUTS_KEY = "opium-shortcuts";

function loadShortcuts(): Shortcut[] {
  try {
    const raw = localStorage.getItem(SHORTCUTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_SHORTCUTS;
}
function saveShortcuts(list: Shortcut[]) {
  try { localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(list)); } catch {}
}

export function HomeView() {
  const setView = useNav((s) => s.setView);
  const setupDone = useSettings((s) => s.setupDone);
  const searchEngine = useSettings((s) => s.searchEngine);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [addingShortcut, setAddingShortcut] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [query, setQuery] = useState("");
  // Use null initially to avoid SSR/client hydration mismatch on the clock.
  const [now, setNow] = useState<Date | null>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setShortcuts(loadShortcuts());
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    // Rotate the footer phrase every 4 seconds.
    const p = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % ROTATING_PHRASES.length);
    }, 4000);
    // Focus the search bar on mount so typing immediately starts a search.
    const ft = setTimeout(() => searchRef.current?.focus(), 300);
    return () => { clearInterval(t); clearInterval(p); clearTimeout(ft); };
  }, []);

  // Keyboard shortcut: '/' focuses the search bar.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const searchEngines: Record<string, string> = {
    duckduckgo: "https://duckduckgo.com/?q=",
    google: "https://www.google.com/search?q=",
    bing: "https://www.bing.com/search?q=",
    startpage: "https://www.startpage.com/sp/search?query=",
    brave: "https://search.brave.com/search?q=",
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const base = searchEngines[searchEngine] || searchEngines.duckduckgo;
    const q = query.trim();
    const looksLikeUrl = /^[\w-]+(\.[\w-]+)+/.test(q);
    const url = looksLikeUrl ? (q.startsWith("http") ? q : "https://" + q) : base + encodeURIComponent(q);
    setView("browser");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("redux-browser-init", { detail: url }));
    }, 50);
  };

  const addShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;
    let url = newUrl.trim();
    if (!/^https?:\/\//.test(url)) url = "https://" + url;
    const icon = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
    const next = [...shortcuts, { name: newName.trim(), url, icon }];
    setShortcuts(next);
    saveShortcuts(next);
    setNewName("");
    setNewUrl("");
    setAddingShortcut(false);
    toast.success("Shortcut added");
  };

  const removeShortcut = (i: number) => {
    const next = shortcuts.filter((_, idx) => idx !== i);
    setShortcuts(next);
    saveShortcuts(next);
  };

  const fmtTime = (d: Date) => {
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const s = d.getSeconds().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m}:${s} ${ampm}`;
  };

  return (
    <div className="opium-home fade-in relative flex min-h-full flex-col items-center justify-center overflow-hidden p-6 text-center">
      {/* Top-left brand tag — inline Logo so colors change with the theme */}
      <div className="absolute left-6 top-6 flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
        <Logo className="h-6" />
        <span className="font-mono">v10</span>
      </div>

      {/* Top-right rotating phrase label */}
      <div className="absolute right-6 top-6 text-xs font-mono opacity-50" style={{ color: "var(--text-muted)" }}>
        opium-inspired
      </div>

      {/* Wordmark — italic Playfair-style gradient text, like the opium.best home.
          CSS classes (.opium-*) live in src/app/globals.css so they get bundled
          in the CSS chunk on first load instead of being injected after React
          hydration (which caused the "CSS is messed up" flash on the live site). */}
      <h1 className="opium-wordmark">redux.</h1>

      {/* Search bar */}
      <form onSubmit={submitSearch} className="opium-search-bar mb-8 max-w-md">
        <Search className="h-4 w-4 flex-none" style={{ color: "var(--text-muted)" }} />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${searchEngine} or type a URL  —  press / to focus`}
          spellCheck={false}
        />
        <kbd className="hidden text-[10px] font-mono opacity-50 sm:inline">/</kbd>
      </form>

      {/* Setup hint */}
      {!setupDone && (
        <button
          onClick={() => setView("setup")}
          className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all hover:scale-105"
          style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
        >
          <BookOpen className="h-3.5 w-3.5" /> First-time setup
        </button>
      )}

      {/* Cloud gaming tiles — Roblox, Fortnite, Rocket League, PS5, Xbox, etc.
          from viroda1/anchor. Opens in the Browser view via Scramjet proxy. */}
      <div className="opium-section-title w-full max-w-3xl text-left">cloud gaming</div>
      <div className="grid w-full max-w-3xl grid-cols-2 gap-3 pb-24 sm:grid-cols-4">
        {CLOUD_GAMES.map((g) => (
          <button
            key={g.name}
            onClick={() => {
              setView("browser");
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent("redux-browser-init", { detail: g.url }));
              }, 50);
              toast.info(`Loading ${g.name}`, { description: g.note });
            }}
            className="opium-shortcut"
            title={g.note}
          >
            <img src={g.icon} alt="" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <span>{g.name}</span>
          </button>
        ))}
      </div>

      {/* Bottom footer — time on the left, rotating phrase on the right. */}
      <div className="opium-footer fixed bottom-4 left-0 right-0 z-30 flex items-center justify-between px-6 text-xs" style={{ color: "var(--text-muted)" }}>
        <div className="font-mono tabular-nums" style={{ color: "var(--text)" }}>
          {now ? fmtTime(now) : "--:--:--"}
          {now && <span className="ml-3 hidden text-[10px] uppercase tracking-[0.18em] opacity-60 sm:inline">
            {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </span>}
        </div>
        <div key={phraseIndex} className="opium-phrase fade-in font-mono text-right" style={{ color: "var(--accent)" }}>
          {ROTATING_PHRASES[phraseIndex]}
        </div>
      </div>
    </div>
  );
}
