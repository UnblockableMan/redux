"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Search, Play, ArrowLeft, Loader2, List, SkipForward, ChevronDown, Globe } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/store/settings";

// AniKoto API — same endpoint Lyra uses.
const ANIKOTO_API = "https://anikotoapi.site";

// AniList public GraphQL endpoint — has CORS enabled, used by Lyra for
// richer catalog/search. Lets us find stuff like Evangelion even if it
// isn't in the most recent 50 uploads.
const ANILIST_GRAPHQL = "https://graphql.anilist.co";

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
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + path);
    if (cached) {
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

// ----- AniList (rich catalog with images, used by Lyra) -----

interface AniListAnime {
  id: number;
  idMal?: number;
  title: { english?: string; romaji?: string; native?: string };
  coverImage: { large?: string; medium?: string };
  bannerImage?: string | null;
  averageScore?: number;
  format?: string;
  episodes?: number;
  seasonYear?: number;
  description?: string | null;
  genres?: string[];
  status?: string;
}

interface CatalogEntry {
  id: string;            // "anilist:123" or "anikoto:456"
  anikotoId?: number;    // resolved AniKoto series id (if known)
  anilistId?: number;
  malId?: number;
  title: string;
  poster: string;
  banner?: string;
  year?: number;
  format?: string;
  episodes?: number;
  score?: number;
  description?: string;
  genres?: string[];
  status?: string;
}

const ANILIST_TRENDING_QUERY = `
  query {
    Page(page: 1, perPage: 50) {
      media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
        id idMal title { english romaji native }
        coverImage { large medium }
        bannerImage
        averageScore format episodes seasonYear
        description(asHtml: false) genres status
      }
    }
  }
`;

const ANILIST_SEARCH_QUERY = `
  query ($search: String) {
    Page(page: 1, perPage: 30) {
      media(type: ANIME, search: $search, sort: POPULARITY_DESC, isAdult: false) {
        id idMal title { english romaji native }
        coverImage { large medium }
        bannerImage
        averageScore format episodes seasonYear
        description(asHtml: false) genres status
      }
    }
  }
`;

async function fetchAniList(query: string, variables?: Record<string, unknown>): Promise<AniListAnime[]> {
  const res = await fetch(ANILIST_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
  const json = await res.json();
  return json?.data?.Page?.media || [];
}

function anilistToEntry(a: AniListAnime): CatalogEntry {
  const title = a.title?.english || a.title?.romaji || a.title?.native || "Unknown";
  return {
    id: `anilist:${a.id}`,
    anilistId: a.id,
    malId: a.idMal,
    title,
    poster: a.coverImage?.large || a.coverImage?.medium || "",
    banner: a.bannerImage || undefined,
    year: a.seasonYear,
    format: a.format,
    episodes: a.episodes,
    score: a.averageScore ? Math.round(a.averageScore) / 10 : undefined,
    description: a.description ? a.description.replace(/<[^>]+>/g, "") : undefined,
    genres: a.genres,
    status: a.status,
  };
}

// Fetch AniKoto's recent uploads (50/page). Each record carries mal_id and
// ani_id, so we can match AniList entries back to streaming series.
interface AnikotoRecent {
  id: number;
  title: string;
  image: string;
  episode_number: number;
  type: string;
  mal_id?: number;
  ani_id?: number;
}

async function fetchAnikotoRecent(page = 1): Promise<AnikotoRecent[]> {
  const data = await animeFetch(`/recent-anime?page=${page}&per_page=50`);
  return data?.data || data?.results || [];
}

// Build a malId -> anikotoId map from a few pages of recent uploads.
const malToAnikoto = new Map<number, number>();
const anikotoRecentCache: CatalogEntry[] = [];
let recentLoadedPages = 0;

async function loadAnikotoRecentPage(page: number): Promise<CatalogEntry[]> {
  const recents = await fetchAnikotoRecent(page);
  const out: CatalogEntry[] = [];
  for (const r of recents) {
    if (r.mal_id) malToAnikoto.set(r.mal_id, r.id);
    if (r.ani_id && r.mal_id) {
      // also map aniId -> malId implicitly via malToAnikoto keying on mal
    }
    out.push({
      id: `anikoto:${r.id}`,
      anikotoId: r.id,
      malId: r.mal_id,
      anilistId: r.ani_id,
      title: r.title,
      poster: r.image,
      year: undefined,
      format: r.type,
      episodes: undefined,
    });
  }
  return out;
}

// Paginated load — first 3 pages = 150 entries for browsing, plus
// builds the mal->anikoto map used by AniList search results.
async function loadInitialCatalog(): Promise<CatalogEntry[]> {
  const pages = await Promise.all([1, 2, 3].map((p) => loadAnikotoRecentPage(p).catch(() => [])));
  recentLoadedPages = 3;
  for (const list of pages) for (const e of list) anikotoRecentCache.push(e);
  // Also pull trending from AniList so covers are higher quality and the
  // catalog isn't only stuff that was just uploaded.
  try {
    const trending = await fetchAniList(ANILIST_TRENDING_QUERY);
    const trendingEntries = trending.map(anilistToEntry);
    // Merge: prefer AniList cover, but keep AniKoto id when MAL matches.
    for (const t of trendingEntries) {
      if (t.malId && malToAnikoto.has(t.malId)) {
        t.anikotoId = malToAnikoto.get(t.malId);
      }
      const existing = anikotoRecentCache.find((a) => a.title.toLowerCase() === t.title.toLowerCase());
      if (existing) {
        // upgrade poster/banner if missing
        if (!existing.banner) existing.banner = t.banner;
        if (!existing.year) existing.year = t.year;
        if (!existing.genres) existing.genres = t.genres;
      } else {
        anikotoRecentCache.push(t);
      }
    }
  } catch {}
  return anikotoRecentCache;
}

// Search by title — tries AniList (which has every anime, including
// Evangelion), then resolves to AniKoto via the mal-id map.
async function searchAnime(query: string): Promise<CatalogEntry[]> {
  if (!query.trim()) return [];
  // Local filter first — instant.
  const local = anikotoRecentCache.filter((a) => a.title.toLowerCase().includes(query.toLowerCase()));
  try {
    const results = await fetchAniList(ANILIST_SEARCH_QUERY, { search: query });
    const entries: CatalogEntry[] = [];
    for (const r of results) {
      const e = anilistToEntry(r);
      // Resolve AniKoto id by mal_id if we already saw it in the recent feed.
      if (e.malId && malToAnikoto.has(e.malId)) {
        e.anikotoId = malToAnikoto.get(e.malId);
      } else if (e.malId) {
        // Try loading more recent pages in case the anime is older and not
        // in the first 150 uploads.
        for (let p = recentLoadedPages + 1; p <= 10 && !e.anikotoId; p++) {
          try {
            const more = await loadAnikotoRecentPage(p);
            recentLoadedPages = p;
            for (const m of more) anikotoRecentCache.push(m);
            const hit = more.find((m) => m.malId === e.malId);
            if (hit?.anikotoId) { e.anikotoId = hit.anikotoId; break; }
          } catch { break; }
        }
      }
      entries.push(e);
    }
    // Merge local (which has AniKoto id) with remote (rich metadata).
    const seen = new Set<string>();
    const merged: CatalogEntry[] = [];
    for (const e of [...local, ...entries]) {
      const key = e.anikotoId ? `ak:${e.anikotoId}` : `al:${e.anilistId || e.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(e);
    }
    return merged;
  } catch (err: any) {
    return local;
  }
}

// ----- Series / episodes -----

interface AnikotoEpisode {
  number: number;
  title?: string;
  episode_embed_id: string;
  embed_url?: { sub: string; dub: string };
  image?: string;
}

interface SeriesData {
  id: string;
  title: string;
  image: string;
  status: string;
  type: string;
  genres: string[];
  description?: string;
  episodes: AnikotoEpisode[];
}

function playerUrl(ep: AnikotoEpisode, dub: boolean): string {
  if (ep.embed_url) return (dub ? ep.embed_url.dub : ep.embed_url.sub) || ep.embed_url.sub || ep.embed_url.dub || "";
  return `https://megaplay.buzz/stream/s-2/${ep.episode_embed_id}/${dub ? "dub" : "sub"}`;
}

async function fetchSeries(anikotoId: number): Promise<SeriesData | null> {
  const data = await animeFetch(`/series/${encodeURIComponent(anikotoId)}`);
  const s = data?.data || data;
  if (!s) return null;
  return {
    id: String(anikotoId),
    title: s.title || "Unknown",
    image: s.image || s.poster || s.background_image || "",
    status: s.status || "",
    type: s.type || s.terms_by_type?.type?.[0] || "",
    genres: s.genres || s.terms_by_type?.genre || [],
    description: s.description || "",
    episodes: (s.episodes || []).map((e: any) => ({
      number: Number(e.number),
      title: e.title,
      episode_embed_id: String(e.episode_embed_id),
      embed_url: e.embed_url,
      image: e.image,
    })),
  };
}

// ----- UI -----

export function AnimeView() {
  const unlockAchievement = useSettings((s) => s.unlockAchievement);
  const autoPlayNext = useSettings((s) => s.autoPlayNext);
  const preferDub = useSettings((s) => s.preferDub);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [searchResults, setSearchResults] = useState<CatalogEntry[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [series, setSeries] = useState<SeriesData | null>(null);
  const [seriesCatalogEntry, setSeriesCatalogEntry] = useState<CatalogEntry | null>(null);
  const [currentEpIndex, setCurrentEpIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"browse" | "series" | "watch">("browse");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadInitialCatalog()
      .then((c) => { setCatalog(c); setLoading(false); })
      .catch((err) => {
        toast.error("Failed to load anime catalog", { description: err?.message });
        setLoading(false);
      });
  }, []);

  // Debounced AniList-powered search.
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) { setSearchResults(null); setSearching(false); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await searchAnime(searchQuery);
        setSearchResults(results);
      } catch (err: any) {
        toast.error("Search failed", { description: err?.message });
      } finally {
        setSearching(false);
      }
    }, 600);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery]);

  const openSeries = async (entry: CatalogEntry) => {
    if (!entry.anikotoId) {
      toast.error("No streaming source", {
        description: "This anime isn't on the AniKoto host yet. Try another one from the search.",
      });
      return;
    }
    setLoading(true);
    try {
      const s = await fetchSeries(entry.anikotoId);
      if (!s || !s.episodes?.length) {
        toast.error("No episodes available", { description: "The host returned an empty episode list." });
        setLoading(false);
        return;
      }
      setSeries(s);
      setSeriesCatalogEntry(entry);
      setCurrentEpIndex(0);
      setView("series");
    } catch (err: any) {
      toast.error("Failed to load series", { description: err?.message });
    }
    setLoading(false);
  };

  const playEpisode = (index: number) => {
    if (!series || index < 0 || index >= series.episodes.length) return;
    setCurrentEpIndex(index);
    setView("watch");
    unlockAchievement("first-anime");
    try {
      const n = parseInt(localStorage.getItem("redux-anime-count") || "0", 10) + 1;
      localStorage.setItem("redux-anime-count", String(n));
      if (n >= 5) unlockAchievement("anime-binged");
    } catch {}
  };

  if (view === "watch" && series) {
    return (
      <AnimePlayer
        series={series}
        episodeIndex={currentEpIndex}
        onBack={() => setView("series")}
        onSelectEpisode={(i) => playEpisode(i)}
        onNext={() => playEpisode(currentEpIndex + 1)}
        hasNext={!!autoPlayNext && currentEpIndex < series.episodes.length - 1}
        preferDub={preferDub}
      />
    );
  }

  if (view === "series" && series) {
    return (
      <SeriesView
        series={series}
        catalogEntry={seriesCatalogEntry}
        onBack={() => setView("browse")}
        onPlay={(i) => playEpisode(i)}
      />
    );
  }

  const shown: CatalogEntry[] = searchResults ?? catalog;

  return (
    <div className="fade-in p-6">
      <h1 className="mb-1 text-2xl font-bold">Anime</h1>
      <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
        {catalog.length} titles · search powered by AniList · streaming via AniKoto
      </p>
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search anime — Evangelion, Naruto, Frieren…"
          className="w-full rounded-lg border bg-transparent py-2.5 pl-10 pr-10 text-sm outline-none"
          style={{ borderColor: "var(--border)" }}
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" style={{ color: "var(--text-muted)" }} />
        )}
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--text-muted)" }} /></div>
      ) : (
        <>
          <h2 className="mb-3 text-lg font-semibold">
            {searchQuery ? `Results for "${searchQuery}"` : "Trending & Recently Added"}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {shown.map((a) => (
              <button
                key={a.id}
                onClick={() => openSeries(a)}
                className="group surface flex flex-col gap-2 rounded-xl border p-2 text-left transition-all hover:scale-[1.02]"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg" style={{ background: "var(--surface2)" }}>
                  {a.poster ? (
                    <img src={a.poster} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                  ) : null}
                  <div className="absolute bottom-1 left-1 flex gap-1">
                    {!a.anikotoId && (
                      <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px]" style={{ color: "#fbbf24" }}>META</span>
                    )}
                    {a.format && (
                      <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px]">{a.format}</span>
                    )}
                  </div>
                </div>
                <div className="truncate text-xs font-medium">{a.title}</div>
                {a.year && <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{a.year}</div>}
              </button>
            ))}
          </div>
          {shown.length === 0 && (
            <p className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              {searchQuery ? "No results. Try a different spelling." : "No anime available."}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function SeriesView({ series, catalogEntry, onBack, onPlay }: {
  series: SeriesData;
  catalogEntry: CatalogEntry | null;
  onBack: () => void;
  onPlay: (index: number) => void;
}) {
  const poster = series.image || catalogEntry?.poster || "";
  const title = series.title || catalogEntry?.title || "Unknown";
  const year = catalogEntry?.year;
  const genres = series.genres?.length ? series.genres : catalogEntry?.genres || [];
  const description = series.description || catalogEntry?.description || "";
  return (
    <div className="fade-in p-6">
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="flex flex-col gap-6 sm:flex-row">
        <img src={poster} alt={title} className="h-72 w-48 flex-none rounded-xl object-cover" referrerPolicy="no-referrer" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{title}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            {series.type && <span>{series.type}</span>}
            {year && <><span>·</span><span>{year}</span></>}
            {series.status && <><span>·</span><span>{series.status}</span></>}
            {catalogEntry?.score && <><span>·</span><span>★ {catalogEntry.score}</span></>}
          </div>
          {genres.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {genres.map((g) => (
                <span key={g} className="rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: "var(--border)" }}>{g}</span>
              ))}
            </div>
          )}
          {description && (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{description}</p>
          )}
        </div>
      </div>
      <h2 className="mb-3 mt-6 text-lg font-semibold">Episodes ({series.episodes.length})</h2>
      {series.episodes.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {series.episodes.map((ep, i) => (
            <button
              key={`${ep.episode_embed_id}-${i}`}
              onClick={() => onPlay(i)}
              className="group surface flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:scale-[1.01]"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="relative h-16 w-28 flex-none overflow-hidden rounded-md" style={{ background: "var(--surface2)" }}>
                {ep.image && <img src={ep.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />}
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

function AnimePlayer({ series, episodeIndex, onBack, onSelectEpisode, onNext, hasNext, preferDub }: {
  series: SeriesData;
  episodeIndex: number;
  onBack: () => void;
  onSelectEpisode: (i: number) => void;
  onNext: () => void;
  hasNext: boolean;
  preferDub: boolean;
}) {
  const [dub, setDub] = useState(preferDub);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [showSkipHint, setShowSkipHint] = useState(true);
  const ep = series.episodes[episodeIndex];
  const streamUrl = playerUrl(ep, dub);

  // Hide the "skip intro" hint after a few seconds.
  useEffect(() => {
    setShowSkipHint(true);
    const t = setTimeout(() => setShowSkipHint(false), 8000);
    return () => clearTimeout(t);
  }, [episodeIndex, dub]);

  return (
    <div className="fade-in flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2" style={{ borderColor: "var(--border)" }}>
        <button onClick={onBack} className="flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to series
        </button>
        <div className="min-w-0 flex-1 truncate px-2 text-center text-sm font-medium">
          {series.title} — Ep {ep.number}
        </div>
        <div className="flex items-center gap-2">
          {/* Episode selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowEpisodeList((v) => !v)}
              className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors hover:surface2"
              style={{ borderColor: "var(--border)" }}
            >
              <List className="h-3 w-3" /> Episodes <ChevronDown className="h-3 w-3" />
            </button>
            {showEpisodeList && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowEpisodeList(false)} />
                <div
                  className="absolute right-0 top-full z-20 mt-1 max-h-72 w-44 overflow-y-auto rounded-lg border shadow-2xl"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  {series.episodes.map((e, i) => (
                    <button
                      key={`${e.episode_embed_id}-${i}`}
                      onClick={() => { onSelectEpisode(i); setShowEpisodeList(false); }}
                      className="block w-full px-3 py-2 text-left text-xs transition-colors hover:surface2"
                      style={{
                        background: i === episodeIndex ? "var(--surface2)" : "transparent",
                        color: i === episodeIndex ? "var(--accent)" : "var(--text)",
                      }}
                    >
                      Ep {e.number}{e.title ? ` — ${e.title}` : ""}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* SUB/DUB toggle */}
          <div className="flex items-center gap-1 rounded-full border p-0.5" style={{ borderColor: "var(--border)" }}>
            {(["sub", "dub"] as const).map((v) => {
              const active = (v === "dub") === dub;
              return (
                <button
                  key={v}
                  onClick={() => { setDub(v === "dub"); setLoading(true); setFailed(false); }}
                  className="rounded-full px-2.5 py-0.5 text-xs transition-colors"
                  style={{ background: active ? "var(--accent)" : "transparent", color: active ? "var(--bg)" : "var(--text-muted)" }}
                >
                  {v.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Player area */}
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
              Streaming hosts are aggressive about embedding. Try the SUB/DUB toggle, a different episode, or open it directly.
            </p>
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener"
              className="rounded-lg border px-4 py-2 text-xs"
              style={{ borderColor: "var(--border)" }}
            >
              Open in new tab
            </a>
          </div>
        )}

        {/* The actual streaming iframe.
            NOTE: sandbox attribute is INTENTIONALLY OMITTED.
            megaplay.buzz detects iframe sandboxing and refuses to render
            with the message "Sandboxed our player is not allowed.
            Remove sandbox to use it." So we leave the iframe unsandboxed. */}
        <iframe
          key={streamUrl}
          src={streamUrl}
          className="h-full w-full border-0"
          title={`${series.title} - Episode ${ep.number}`}
          allow="fullscreen; autoplay; encrypted-media; picture-in-picture; display-capture; gamepad; popover"
          allowFullScreen
          onLoad={() => setLoading(false)}
          onError={() => { setFailed(true); setLoading(false); }}
        />

        {/* Floating "Skip Intro" hint — most anime openings are ~90s.
            We can't read the iframe's currentTime (cross-origin), so we
            surface a manual skip button that just opens the same stream
            URL with #t=90 appended (megaplay honors #t= when supported)
            and otherwise serves as a visual cue. */}
        {showSkipHint && !loading && !failed && (
          <button
            onClick={() => {
              // Reload the iframe with a skip param — heuristic, but
              // matches how Lyra surfaces "skip intro" on embeds.
              const u = new URL(streamUrl, window.location.origin);
              u.hash = `t=90`;
              const frame = document.querySelector<HTMLIFrameElement>(`iframe[title="${series.title} - Episode ${ep.number}"]`);
              if (frame) frame.src = u.toString();
              setShowSkipHint(false);
            }}
            className="absolute bottom-6 right-6 z-20 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium shadow-2xl transition-all hover:scale-105"
            style={{ background: "var(--accent)", color: "var(--bg)" }}
          >
            <SkipForward className="h-3.5 w-3.5" /> Skip Intro (+90s)
          </button>
        )}

        {/* Next episode card */}
        {hasNext && !loading && !failed && (
          <div
            className="absolute bottom-6 left-6 z-20 flex items-center gap-3 rounded-xl border p-3 shadow-2xl"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="text-xs">
              <div style={{ color: "var(--text-muted)" }}>Up next</div>
              <div className="font-medium">Episode {series.episodes[episodeIndex + 1]?.number}</div>
            </div>
            <button
              onClick={onNext}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium"
              style={{ background: "var(--accent)", color: "var(--bg)" }}
            >
              <SkipForward className="h-3 w-3" /> Play
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
