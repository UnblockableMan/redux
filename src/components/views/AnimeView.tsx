"use client";

import { useEffect, useState } from "react";
import { Search, Play, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/store/settings";

// AniKoto API — same endpoint Lyra uses.
const ANIKOTO_API = "https://anikotoapi.site";

// The API sends no CORS headers, so a direct browser fetch is blocked.
// Chain of public CORS relays (first one that answers wins) + localStorage cache.
const CORS_PROXIES = [
  (u: string) => u,
  (u: string) => `https://cors.eu.org/${u}`,
  (u: string) => `https://test.cors.workers.dev/?${u}`,
  (u: string) => `https://api.cors.lol/?url=${encodeURIComponent(u)}`,
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
];

const CACHE_PREFIX = "redux-anime-cache:";

async function animeFetch(path: string): Promise<any> {
  const target = `${ANIKOTO_API}${path}`;

  // Serve from cache instantly when present (stale-while-error).
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + path);
    if (cached) {
      // Refresh in the background, but return cached data right away.
      animeFetchNetwork(target).catch(() => {});
      return JSON.parse(cached);
    }
  } catch {}

  const json = await animeFetchNetwork(target);
  try { localStorage.setItem(CACHE_PREFIX + path, JSON.stringify(json)); } catch {}
  return json;
}

async function animeFetchNetwork(target: string): Promise<any> {
  let lastErr: any = null;
  for (const wrap of CORS_PROXIES) {
    try {
      const res = await fetch(wrap(target), { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("All anime sources failed");
}

interface AnikotoRecentItem {
  id: string;
  title: string;
  image: string;
  episode_number: number;
  episode_embed_id: string;
  type: string;
}

interface AnikotoSeries {
  id: string;
  title: string;
  image: string;
  status: string;
  type: string;
  genres: string[];
  description?: string;
  episodes: AnikotoEpisode[];
}

interface AnikotoEpisode {
  number: number;
  title?: string;
  episode_embed_id: string;
  embed_url?: { sub: string; dub: string };
  image?: string;
}

function playerUrl(ep: AnikotoEpisode, dub: boolean): string {
  // Prefer the embed URL the API gives us (correct domain: megaplay.buzz).
  if (ep.embed_url) return (dub ? ep.embed_url.dub : ep.embed_url.sub) || ep.embed_url.sub || ep.embed_url.dub || "";
  // Fallback: build it (note: megaplay.buzz — the old code had "megaply" typo).
  return `https://megaplay.buzz/stream/s-2/${ep.episode_embed_id}/${dub ? "dub" : "sub"}`;
}

export function AnimeView() {
  const unlockAchievement = useSettings((s) => s.unlockAchievement);
  const [recent, setRecent] = useState<AnikotoRecentItem[]>([]);
  const [searchResults, setSearchResults] = useState<AnikotoRecentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [series, setSeries] = useState<AnikotoSeries | null>(null);
  const [currentEp, setCurrentEp] = useState<{ ep: AnikotoEpisode; title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"browse" | "series" | "watch">("browse");

  useEffect(() => {
    animeFetch("/recent-anime?page=1&per_page=50")
      .then((data) => {
        const items = data?.data || data?.results || [];
        setRecent(items);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to load anime", { description: err?.message });
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      const q = searchQuery.toLowerCase();
      setSearchResults(recent.filter((a) => a.title.toLowerCase().includes(q)));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, recent]);

  const openSeries = async (id: string, title: string) => {
    setLoading(true);
    try {
      const data = await animeFetch(`/series/${id}`);
      const seriesData = data?.data || data;
      setSeries({ ...seriesData, id, title: seriesData.title || title });
      setView("series");
    } catch (err: any) {
      toast.error("Failed to load series", { description: err?.message });
    }
    setLoading(false);
  };

  const playEpisode = (ep: AnikotoEpisode, title: string) => {
    setCurrentEp({ ep, title });
    setView("watch");
    unlockAchievement("first-anime");
    try {
      const n = parseInt(localStorage.getItem("redux-anime-count") || "0", 10) + 1;
      localStorage.setItem("redux-anime-count", String(n));
      if (n >= 5) unlockAchievement("anime-binged");
    } catch {}
  };

  if (view === "watch" && currentEp) {
    return <AnimePlayer episode={currentEp} onBack={() => setView("series")} />;
  }

  if (view === "series" && series) {
    return (
      <div className="fade-in p-6">
        <button onClick={() => setView("browse")} className="mb-4 flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex flex-col gap-6 sm:flex-row">
          <img src={series.image} alt={series.title} className="h-72 w-48 flex-none rounded-xl object-cover" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{series.title}</h1>
            <div className="mt-2 flex flex-wrap gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <span>{series.type}</span><span>·</span><span>{series.status}</span>
            </div>
            {series.genres?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {series.genres.map((g) => (
                  <span key={g} className="rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: "var(--border)" }}>{g}</span>
                ))}
              </div>
            )}
            {series.description && (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{series.description}</p>
            )}
          </div>
        </div>
        <h2 className="mb-3 mt-6 text-lg font-semibold">Episodes</h2>
        {series.episodes?.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {series.episodes.map((ep) => (
              <button key={ep.episode_embed_id} onClick={() => playEpisode(ep, series.title)} className="group surface flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:scale-[1.01]" style={{ borderColor: "var(--border)" }}>
                <div className="relative h-16 w-28 flex-none overflow-hidden rounded-md" style={{ background: "var(--surface2)" }}>
                  {ep.image && <img src={ep.image} alt="" className="h-full w-full object-cover" />}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Play className="h-6 w-6 fill-current" style={{ color: "var(--accent)" }} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">Episode {ep.number}</div>
                  {ep.title && <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{ep.title}</div>}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No episodes available.</p>
        )}
      </div>
    );
  }

  return (
    <div className="fade-in p-6">
      <h1 className="mb-4 text-2xl font-bold">Anime</h1>
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search anime…" className="w-full rounded-lg border bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--text-muted)" }} /></div>
      ) : (
        <>
          <h2 className="mb-3 text-lg font-semibold">{searchQuery ? `Results for "${searchQuery}"` : "Recently Added"}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {(searchQuery ? searchResults : recent).map((a) => (
              <button key={a.id} onClick={() => openSeries(a.id, a.title)} className="group surface flex flex-col gap-2 rounded-xl border p-2 text-left transition-all hover:scale-[1.02]" style={{ borderColor: "var(--border)" }}>
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg" style={{ background: "var(--surface2)" }}>
                  {a.image && <img src={a.image} alt="" className="h-full w-full object-cover" loading="lazy" />}
                  <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px]">EP {a.episode_number}</div>
                </div>
                <div className="truncate text-xs font-medium">{a.title}</div>
              </button>
            ))}
          </div>
          {(searchQuery ? searchResults : recent).length === 0 && (
            <p className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>{searchQuery ? "No results." : "No anime available."}</p>
          )}
        </>
      )}
    </div>
  );
}

function AnimePlayer({ episode, onBack }: { episode: { ep: AnikotoEpisode; title: string }; onBack: () => void }) {
  const [dub, setDub] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const streamUrl = playerUrl(episode.ep, dub);

  return (
    <div className="fade-in flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2" style={{ borderColor: "var(--border)" }}>
        <button onClick={onBack} className="flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to series
        </button>
        <div className="text-sm font-medium">{episode.title} — Ep {episode.ep.number}</div>
        <div className="flex items-center gap-1 rounded-full border p-0.5" style={{ borderColor: "var(--border)" }}>
          {(["sub", "dub"] as const).map((v) => {
            const active = (v === "dub") === dub;
            return (
              <button key={v} onClick={() => { setDub(v === "dub"); setLoading(true); setFailed(false); }}
                className="rounded-full px-2.5 py-0.5 text-xs transition-colors"
                style={{ background: active ? "var(--accent)" : "transparent", color: active ? "var(--bg)" : "var(--text-muted)" }}>
                {v.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>
      <div className="relative flex-1 bg-black">
        {loading && !failed && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent)" }} />
          </div>
        )}
        {failed && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm font-medium">This episode's host refused to load.</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Streaming hosts are aggressive about embedding. Try the SUB/DUB toggle, or open it in a new tab.
            </p>
            <a href={streamUrl} target="_blank" rel="noopener" className="rounded-lg border px-4 py-2 text-xs" style={{ borderColor: "var(--border)" }}>
              Open in new tab
            </a>
          </div>
        )}
        <iframe
          key={streamUrl}
          src={streamUrl}
          className="h-full w-full border-0"
          title={`${episode.title} - Episode ${episode.ep.number}`}
          allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          onLoad={() => setLoading(false)}
          onError={() => { setFailed(true); setLoading(false); }}
        />
      </div>
    </div>
  );
}
