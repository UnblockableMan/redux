"use client";

import { useEffect, useState, useRef } from "react";
import { Search, Play, ArrowLeft, X, Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";

// AniKoto API — same endpoint Lyra uses.
const ANIKOTO_API = "https://anikotoapi.site";
const MEGAPLAY_BASE = "https://megaply.buzz/stream/s-2";

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

export function AnimeView() {
  const [recent, setRecent] = useState<AnikotoRecentItem[]>([]);
  const [searchResults, setSearchResults] = useState<AnikotoRecentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [series, setSeries] = useState<AnikotoSeries | null>(null);
  const [currentEp, setCurrentEp] = useState<{ embedId: string; title: string; ep: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"browse" | "series" | "watch">("browse");

  useEffect(() => {
    fetch(`${ANIKOTO_API}/recent-anime?page=1&per_page=50`)
      .then((r) => r.json())
      .then((data) => {
        // Lyra uses { data: [...] } format
        const items = data?.data || data?.results || [];
        setRecent(items);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to load anime", { description: err.message });
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
      const res = await fetch(`${ANIKOTO_API}/series/${id}`);
      const data = await res.json();
      const seriesData = data?.data || data;
      setSeries({ ...seriesData, id, title: seriesData.title || title });
      setView("series");
    } catch (err: any) {
      toast.error("Failed to load series", { description: err.message });
    }
    setLoading(false);
  };

  const playEpisode = (ep: AnikotoEpisode, title: string) => {
    setCurrentEp({ embedId: ep.episode_embed_id, title, ep: ep.number });
    setView("watch");
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

function AnimePlayer({ episode, onBack }: { episode: { embedId: string; title: string; ep: number }; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const streamUrl = `${MEGAPLAY_BASE}/${episode.embedId}/sub`;

  return (
    <div className="fade-in flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2" style={{ borderColor: "var(--border)" }}>
        <button onClick={onBack} className="flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to series
        </button>
        <div className="text-sm font-medium">{episode.title} — Ep {episode.ep}</div>
        <div className="w-24" />
      </div>
      <div className="relative flex-1 bg-black">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent)" }} />
          </div>
        )}
        <iframe
          src={streamUrl}
          className="h-full w-full border-0"
          title={`${episode.title} - Episode ${episode.ep}`}
          allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
}
