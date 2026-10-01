"use client";

import { useEffect, useState, useRef } from "react";
import { Search, BookOpen, Plus, X } from "lucide-react";
import { useNav } from "@/store/nav";
import { useSettings } from "@/store/settings";
import { withBase } from "@/lib/base";
import { toast } from "sonner";

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

// Cloud games — embedded via iframe. Each opens a real streaming service.
interface CloudGame { name: string; url: string; icon: string; note: string; }
const CLOUD_GAMES: CloudGame[] = [
  {
    name: "Roblox",
    url: "https://nowgg.fun/apps/a/19900/b.html",
    icon: "https://www.roblox.com/favicon.ico",
    note: "Cloud-streamed via now.gg — no install, plays in browser.",
  },
  {
    name: "GeForce NOW",
    url: "https://play.geforcenow.com/mall/#/loginwall",
    icon: "https://images.nvidia.com/etc/designs/nvidiaGDC/clientlibs/assets/images/favicon.ico",
    note: "NVIDIA's cloud gaming service. Steam/Epic library in the cloud.",
  },
  {
    name: "Xbox Cloud",
    url: "https://www.xbox.com/play",
    icon: "https://www.xbox.com/favicon.ico",
    note: "Xbox Game Pass cloud streaming (requires Game Pass Ultimate).",
  },
  {
    name: "Steam",
    url: "https://steamcommunity.com",
    icon: "https://store.steampowered.com/favicon.ico",
    note: "Steam community — profile, friends, marketplace in the browser.",
  },
  {
    name: "itch.io",
    url: "https://itch.io/games/html5",
    icon: "https://static.itch.io/favicon.ico",
    note: "Indie HTML5 games, browse and play in-browser.",
  },
  {
    name: "Poki",
    url: "https://poki.com",
    icon: "https://poki.com/favicon.ico",
    note: "Casual browser games, big catalog of HTML5 picks.",
  },
  {
    name: "CrazyGames",
    url: "https://crazygames.com",
    icon: "https://crazygames.com/favicon.ico",
    note: "Another huge HTML5 game portal.",
  },
  {
    name: "Yandex Games",
    url: "https://yandex.com/games",
    icon: "https://yandex.com/favicon.ico",
    note: "Free browser games, mobile and desktop.",
  },
];

// Built-in apps (jump to redux views, not external sites).
interface AppShortcut { name: string; view: string; icon: string; }
const APPS: AppShortcut[] = [
  { name: "Games", view: "games", icon: "https://cdn.simpleicons.org/playstation/white" },
  { name: "Music", view: "music", icon: "https://commons.wikimedia.org/wiki/Special:FilePath/Spotify_App_Logo.svg?width=128" },
  { name: "Browser", view: "browser", icon: "https://www.google.com/chrome/static/images/chrome-logo.svg" },
  { name: "Anime", view: "anime", icon: "https://cdn.simpleicons.org/crunchyroll/orange" },
  { name: "Forms", view: "forms", icon: "https://www.google.com/forms/about/favicon.ico" },
  { name: "Extensions", view: "extensions", icon: "🧩" },
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
  const [now, setNow] = useState(new Date());
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setShortcuts(loadShortcuts());
    const t = setInterval(() => setNow(new Date()), 1000);
    // Focus the search bar on mount so typing immediately starts a search.
    const ft = setTimeout(() => searchRef.current?.focus(), 300);
    return () => { clearInterval(t); clearTimeout(ft); };
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
    // If the query looks like a URL, navigate directly. Otherwise search.
    const q = query.trim();
    const looksLikeUrl = /^[\w-]+(\.[\w-]+)+/.test(q);
    const url = looksLikeUrl ? (q.startsWith("http") ? q : "https://" + q) : base + encodeURIComponent(q);
    // Open in the Browser view via Scramjet proxy.
    setView("browser");
    setTimeout(() => {
      // The BrowserView listens for an init-url CustomEvent so it can
      // immediately navigate to this URL on mount.
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
      {/* Time + date top-left */}
      <div className="absolute left-6 top-6 text-left" style={{ color: "var(--text-muted)" }}>
        <div className="font-mono text-2xl tabular-nums" style={{ color: "var(--text)" }}>{fmtTime(now)}</div>
        <div className="text-xs uppercase tracking-[0.18em]">
          {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Status top-right */}
      <div className="absolute right-6 top-6 flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
        <span className="font-mono">v3.3</span>
        <span>·</span>
        <span>opium</span>
      </div>

      {/* Wordmark — italic Playfair-style gradient text, like the opium.best home */}
      <style>{`
        .opium-wordmark {
          font-family: 'Playfair Display', Georgia, serif;
          font-style: italic;
          font-size: clamp(64px, 11vw, 100px);
          font-weight: 400;
          background: linear-gradient(135deg, var(--text) 40%, var(--accent) 130%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          letter-spacing: -0.01em;
          line-height: 1;
          margin-bottom: clamp(10px, 1.5vw, 16px);
          user-select: none;
        }
        .opium-tagline {
          font-family: 'Playfair Display', Georgia, serif;
          font-style: normal;
          font-size: clamp(13px, 1.5vw, 17px);
          font-weight: 300;
          color: color-mix(in srgb, var(--text) 75%, transparent);
          margin-bottom: clamp(26px, 3.2vw, 36px);
          letter-spacing: 0.01em;
          max-width: 32em;
        }
        .opium-search-bar {
          display: flex;
          align-items: center;
          background: color-mix(in srgb, var(--text) 4%, transparent);
          border: 1px solid color-mix(in srgb, var(--text) 8%, transparent);
          border-radius: 12px;
          padding: 0 16px;
          width: 100%;
          gap: 10px;
          transition: border-color 0.2s, background 0.2s;
        }
        .opium-search-bar:focus-within {
          border-color: color-mix(in srgb, var(--accent) 50%, transparent);
          background: color-mix(in srgb, var(--text) 6%, transparent);
        }
        .opium-search-bar input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: inherit;
          font-size: 14px;
          color: var(--text);
          padding: 13px 0;
        }
        .opium-search-bar input::placeholder {
          color: color-mix(in srgb, var(--text) 40%, transparent);
        }
        .opium-shortcut {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 14px 12px;
          background: color-mix(in srgb, var(--text) 4.5%, transparent);
          border: 1px solid color-mix(in srgb, var(--text) 11%, transparent);
          border-radius: 12px;
          cursor: pointer;
          user-select: none;
          transition: all 0.18s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .opium-shortcut:hover {
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          border-color: color-mix(in srgb, var(--accent) 50%, transparent);
          transform: translateY(-2px);
        }
        .opium-shortcut img {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          object-fit: contain;
        }
        .opium-shortcut span {
          font-size: 11px;
          color: color-mix(in srgb, var(--text) 75%, transparent);
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .opium-shortcut:hover span { color: var(--text); }
        .opium-shortcut .sc-del {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 18px;
          height: 18px;
          border-radius: 5px;
          background: color-mix(in srgb, var(--bg) 80%, transparent);
          color: #ff5c5c;
          border: none;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.15s;
          font-size: 12px;
          line-height: 18px;
        }
        .opium-shortcut:hover .sc-del { opacity: 1; }
        .opium-section-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-style: italic;
          font-size: 18px;
          color: color-mix(in srgb, var(--text) 70%, transparent);
          margin: 32px 0 16px;
          user-select: none;
        }
      `}</style>

      <h1 className="opium-wordmark">redux.</h1>
      <p className="opium-tagline">
        a static web proxy hub · games · music · browser · anime · cloud gaming
      </p>

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

      {/* Built-in apps */}
      <div className="opium-section-title w-full max-w-3xl text-left">apps</div>
      <div className="grid w-full max-w-3xl grid-cols-3 gap-3 sm:grid-cols-6">
        {APPS.map((a) => (
          <button
            key={a.view}
            onClick={() => setView(a.view as any)}
            className="opium-shortcut"
          >
            {a.icon.startsWith("http") ? (
              <img src={a.icon} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-3xl">{a.icon}</span>
            )}
            <span>{a.name}</span>
          </button>
        ))}
      </div>

      {/* Cloud games — Roblox, GeForce Now, Xbox Cloud, etc. */}
      <div className="opium-section-title w-full max-w-3xl text-left">cloud gaming</div>
      <div className="grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        {CLOUD_GAMES.map((g) => (
          <button
            key={g.name}
            onClick={() => {
              // Open the cloud game in the Browser view via Scramjet proxy
              // so it loads through the SW (some sites need wisp).
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

      {/* User shortcuts (customizable) */}
      <div className="opium-section-title w-full max-w-3xl text-left">
        shortcuts
        <button
          onClick={() => setAddingShortcut((v) => !v)}
          className="ml-3 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] align-middle transition-colors hover:opacity-80"
          style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
        >
          <Plus className="h-3 w-3" /> add
        </button>
      </div>
      {addingShortcut && (
        <form onSubmit={addShortcut} className="mb-4 flex w-full max-w-md items-center gap-2 rounded-lg border p-2" style={{ borderColor: "var(--border)" }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: "var(--text)" }}
            autoFocus
          />
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: "var(--text)" }}
            spellCheck={false}
          />
          <button type="submit" className="rounded-full px-3 py-1 text-xs" style={{ background: "var(--accent)", color: "var(--bg)" }}>Add</button>
          <button type="button" onClick={() => setAddingShortcut(false)} className="rounded-full p-1"><X className="h-3 w-3" /></button>
        </form>
      )}
      <div className="grid w-full max-w-3xl grid-cols-3 gap-3 pb-12 sm:grid-cols-6">
        {shortcuts.map((s, i) => (
          <button
            key={s.url + i}
            onClick={() => {
              setView("browser");
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent("redux-browser-init", { detail: s.url }));
              }, 50);
            }}
            className="opium-shortcut"
          >
            <img src={s.icon} alt="" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='100%' height='100%' fill='%231a1a2e'/><text x='50%' y='50%' font-family='monospace' font-size='20' fill='%23fff' text-anchor='middle' dominant-baseline='middle'>" + s.name.charAt(0).toUpperCase() + "</text></svg>")}`; }} />
            <span>{s.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeShortcut(i); }}
              className="sc-del"
              aria-label={`Remove ${s.name}`}
            >×</button>
          </button>
        ))}
      </div>

      {/* Bottom footer */}
      <div className="absolute bottom-4 flex items-center gap-3 text-[10px]" style={{ color: "var(--text-muted)" }}>
        <span className="font-mono">© opium.best-inspired · redux</span>
        <span>·</span>
        <span>static · scramjet · wisp</span>
      </div>
    </div>
  );
}
