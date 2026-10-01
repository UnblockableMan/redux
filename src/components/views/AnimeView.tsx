"use client";

import { useEffect, useState, useRef } from "react";
import { Search, Play, ArrowLeft, X, Loader2 } from "lucide-react";
import Hls from "hls.js";
import { toast } from "sonner";

// AniKoto API — the same public endpoint Lyra uses.
const ANIKOTO_API = "https://anikotoapi.site";
const MEGAPLAY_BASE = "https://megaply.buzz/stream/s-2";

interface AnimeSeries {
  id: string;
  title: string;
  image: string;
  status: string;
  type: string;
  genres: string[];
  episodes: Episode[];
  mal_id?: string;
  ani_id?: string;
}

interface Episode {
  episode_embed_id: string;
  number: number;
  title?: string;
  embed_url?: { sub: string; dub: string };
  image?: string;
}

interface RecentAnime {
  id: string;
  title: string;
  image: string;
  episode_number: number;
  episode_embed_id: string;
  type: string;
}

export function AnimeView() {
  const [view, setView] = useState<"browse" | "search" | "series" | "watch">("browse");
  const [recent, setRecent] = useState<RecentAnime[]>([]);
  const [searchResults, setSearchResults] = useState<RecentAnime[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [series, setSeries] = useState<AnimeSeries | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<{ embedId: string; title: string; ep: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch recent anime on mount.
  useEffect(() => {
    fetch(`${ANIKOTO_API}/recent-anime?page=1&per_page=40`)
      .then((r) => r.json())
      .then((data) => {
        setRecent(data?.results || data || []);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to load anime", { description: err.message });
        setLoading(false);
      });
  }, []);

  // Debounced search.
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      fetch(`${ANIKOTO_API}/recent-anime?page=1&per_page=40`)
        .then((r) => r.json())
        .then((data) => {
          const all = data?.results || data || [];
          const q = searchQuery.toLowerCase();
          setSearchResults(all.filter((a: RecentAnime) => a.title.toLowerCase().includes(q)));
        })
        .catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const openSeries = async (id: string, title: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${ANIKOTO_API}/series/${id}`);
      const data = await res.json();
      setSeries({ ...data, id, title: data.title || title });
      setView("series");
    } catch (err: any) {
      toast.error("Failed to load series", { description: err.message });
    }
    setLoading(false);
  };

  const playEpisode = (ep: Episode, title: string) => {
    setCurrentEpisode({
      embedId: ep.episode_embed_id,
      title,
      ep: ep.number,
    });
    setView("watch");
  };

  // Watch view
  if (view === "watch" && currentEpisode) {
    return <AnimePlayer episode={currentEpisode} onBack={() => setView("series")} />;
  }

  // Series view
  if (view === "series" && series) {
    return (
      <div className="fade-in p-6">
        <button onClick={() => setView("browse")} className="mb-4 flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex gap-6">
          <img src={series.image} alt={series.title} className="h-64 w-44 flex-none rounded-xl object-cover" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{series.title}</h1>
            <div className="mt-2 flex gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <span>{series.type}</span>
              <span>·</span>
              <span>{series.status}</span>
            </div>
            {series.genres && series.genres.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {series.genres.map((g) => (
                  <span key={g} className="rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: "var(--border)" }}>{g}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <h2 className="mb-3 mt-6 text-lg font-semibold">Episodes</h2>
        {series.episodes && series.episodes.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {series.episodes.map((ep) => (
              <button
                key={ep.episode_embed_id}
                onClick={() => playEpisode(ep, series.title)}
                className="group surface flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:scale-[1.01]"
                style={{ borderColor: "var(--border)" }}
              >
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

  // Browse / Search view
  return (
    <div className="fade-in p-6">
      <h1 className="mb-4 text-2xl font-bold">Anime</h1>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search anime…"
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
          <h2 className="mb-3 text-lg font-semibold">
            {searchQuery ? `Results for "${searchQuery}"` : "Recently Added"}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {(searchQuery ? searchResults : recent).map((a) => (
              <button
                key={a.id}
                onClick={() => openSeries(a.id, a.title)}
                className="group surface flex flex-col gap-2 rounded-xl border p-2 text-left transition-all hover:scale-[1.02]"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg" style={{ background: "var(--surface2)" }}>
                  {a.image && <img src={a.image} alt="" className="h-full w-full object-cover" />}
                  <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px]">
                    EP {a.episode_number}
                  </div>
                </div>
                <div className="truncate text-xs font-medium">{a.title}</div>
              </button>
            ))}
          </div>
          {(searchQuery ? searchResults : recent).length === 0 && (
            <p className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              {searchQuery ? "No results." : "No anime available."}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function AnimePlayer({ episode, onBack }: { episode: { embedId: string; title: string; ep: number }; onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);

    // Try to load the MegaPlay embed page and extract the HLS stream.
    // The embed URL format: https://megaply.buzz/stream/s-2/{embed_id}/sub
    const embedUrl = `${MEGAPLAY_BASE}/${episode.embedId}/sub`;

    // For direct HLS playback, we'd need to resolve the actual m3u8 URL.
    // Since MegaPlay's embed page requires JS to decrypt the stream, we
    // load the embed page in an iframe as a fallback.
    // This is the same approach Lyra uses for DRM-protected streams.
    setLoading(false);
  }, [episode.embedId]);

  return (
    <div className="fade-in flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2" style={{ borderColor: "var(--border)" }}>
        <button onClick={onBack} className="flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to series
        </button>
        <div className="text-sm font-medium">
          {episode.title} — Ep {episode.ep}
        </div>
        <div className="w-24" />
      </div>

      <div className="relative flex-1 bg-black">
        {error ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <X className="mx-auto mb-4 h-12 w-12 opacity-50" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error}</p>
            </div>
          </div>
        ) : (
          <iframe
            src={`${MEGAPLAY_BASE}/${episode.embedId}/sub`}
            className="h-full w-full border-0"
            title={`${episode.title} - Episode ${episode.ep}`}
            allow="fullscreen; autoplay; encrypted-media"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          />
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent)" }} />
          </div>
        )}
      </div>
    </div>
  );
}
