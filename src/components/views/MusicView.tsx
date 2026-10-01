"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Heart, Loader2, ChevronDown, Search as SearchIcon,
  X, ListMusic, Home, Library,
} from "lucide-react";
import { usePlayer } from "@/store/player";
import { useLibrary } from "@/store/library";
import { fetchHome } from "@/lib/ytm/home";
import { search as ytmSearch } from "@/lib/ytm/search";
import { DEMO_HOME_SECTIONS, DEMO_TRACKS, demoSearch } from "@/lib/ytm/demo";
import type { YTMTrack, HomeSection, SearchResults } from "@/lib/ytm/types";
import { formatTime, artistsLabel, hueFromId } from "@/lib/format";
import { cn } from "@/lib/utils";

type MView = "home" | "search" | "library" | "liked" | "recent";

export function MusicView() {
  const [mview, setMView] = useState<MView>("home");
  const [npOpen, setNpOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* Music sidebar */}
      <div className="flex w-44 flex-none flex-col gap-1 border-r p-3" style={{ borderColor: "var(--border)" }}>
        <div className="mb-3 px-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Music
        </div>
        <MNavItem icon={<Home className="h-4 w-4" />} label="Home" active={mview === "home"} onClick={() => setMView("home")} />
        <MNavItem icon={<SearchIcon className="h-4 w-4" />} label="Search" active={mview === "search"} onClick={() => setMView("search")} />
        <MNavItem icon={<Library className="h-4 w-4" />} label="Library" active={mview === "library"} onClick={() => setMView("library")} />
        <MNavItem icon={<Heart className="h-4 w-4" />} label="Liked" active={mview === "liked"} onClick={() => setMView("liked")} />
        <MNavItem icon={<ListMusic className="h-4 w-4" />} label="Recent" active={mview === "recent"} onClick={() => setMView("recent")} />
      </div>

      {/* Main */}
      <div className="relative flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto pb-24">
          {mview === "home" && <MusicHome />}
          {mview === "search" && <MusicSearch />}
          {mview === "library" && <MusicLibrary />}
          {mview === "liked" && <MusicLiked />}
          {mview === "recent" && <MusicRecent />}
        </div>
        <MusicBar onOpenNP={() => setNpOpen(true)} />
        {npOpen && <NowPlaying onClose={() => setNpOpen(false)} />}
      </div>
    </div>
  );
}

function MNavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
      style={{ background: active ? "var(--surface2)" : "transparent", color: active ? "var(--text)" : "var(--text-muted)" }}
    >
      {icon}
      {label}
    </button>
  );
}

// --- Home ---
function MusicHome() {
  const [sections, setSections] = useState<HomeSection[]>(DEMO_HOME_SECTIONS);
  const playTracks = usePlayer((s) => s.playTracks);

  useEffect(() => {
    fetchHome()
      .then((s) => { if (s.length) setSections(s); })
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 fade-in">
      <h1 className="mb-4 text-2xl font-bold">Good evening</h1>
      {sections.map((sec, i) => (
        <div key={i} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">{sec.title}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sec.items.map((t, j) => (
              <button
                key={j}
                onClick={() => (t as YTMTrack).videoId && playTracks(sec.items.filter(x => (x as YTMTrack).videoId) as YTMTrack[], j)}
                className="group surface flex flex-col gap-2 rounded-xl border p-3 text-left transition-all hover:scale-[1.02]"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-lg" style={{ background: "var(--surface2)" }}>
                  {(t as YTMTrack).thumbnail && (
                    <img src={(t as YTMTrack).thumbnail} alt="" className="h-full w-full object-cover" />
                  )}
                  <div className="absolute bottom-2 right-2 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100" style={{ background: "var(--accent)" }}>
                    <Play className="h-4 w-4 translate-x-[1px] fill-current" style={{ color: "var(--bg)" }} />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{(t as YTMTrack).title}</div>
                  <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{artistsLabel((t as YTMTrack).artists)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Search ---
function MusicSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const playTracks = usePlayer((s) => s.playTracks);

  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    const t = setTimeout(() => {
      setLoading(true);
      ytmSearch(query)
        .then((r) => { setResults(r); setLoading(false); })
        .catch(() => { setResults(demoSearch(query)); setLoading(false); });
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="p-6 fade-in">
      <div className="relative mb-6 max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists…"
          className="w-full rounded-lg border bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none"
          style={{ borderColor: "var(--border)" }}
        />
      </div>
      {!query.trim() && <p className="text-sm" style={{ color: "var(--text-muted)" }}>Find your sound.</p>}
      {loading && <p className="text-sm" style={{ color: "var(--text-muted)" }}>Searching…</p>}
      {results && results.tracks.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Songs</h2>
          <div className="space-y-1">
            {results.tracks.map((t, i) => (
              <TrackRow key={t.videoId} track={t} index={i} onPlay={() => playTracks(results.tracks, i)} />
            ))}
          </div>
        </div>
      )}
      {results && results.tracks.length === 0 && !loading && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No results.</p>
      )}
    </div>
  );
}

// --- Library ---
function MusicLibrary() {
  const likedMap = useLibrary((s) => s.liked);
  const liked = useMemo(() => Object.values(likedMap) as YTMTrack[], [likedMap]);
  const recent = useLibrary((s) => s.recentlyPlayed);
  const playlists = useLibrary((s) => s.playlists);

  return (
    <div className="p-6 fade-in">
      <h1 className="mb-4 text-2xl font-bold">Your Library</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <LibCard title="Liked Songs" subtitle={`${liked.length} songs`} icon="❤️" />
        <LibCard title="Recently Played" subtitle={`${recent.length} tracks`} icon="🕐" />
      </div>
      {playlists.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">Playlists</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {playlists.map((p) => (
              <LibCard key={p.id} title={p.name} subtitle={`${p.trackIds.length} tracks`} icon="💿" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LibCard({ title, subtitle, icon }: { title: string; subtitle: string; icon: string }) {
  return (
    <div className="surface flex items-center gap-3 rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
      <span className="text-2xl">{icon}</span>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{subtitle}</div>
      </div>
    </div>
  );
}

// --- Liked ---
function MusicLiked() {
  const likedMap = useLibrary((s) => s.liked);
  const liked = useMemo(() => Object.values(likedMap) as YTMTrack[], [likedMap]);
  const playTracks = usePlayer((s) => s.playTracks);
  return (
    <div className="p-6 fade-in">
      <h1 className="mb-4 text-2xl font-bold">Liked Songs</h1>
      {liked.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Songs you like will appear here.</p>
      ) : (
        <div className="space-y-1">
          {liked.map((t, i) => (
            <TrackRow key={t.videoId} track={t} index={i} onPlay={() => playTracks(liked, i)} />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Recent ---
function MusicRecent() {
  const recent = useLibrary((s) => s.recentlyPlayed);
  const playTracks = usePlayer((s) => s.playTracks);
  return (
    <div className="p-6 fade-in">
      <h1 className="mb-4 text-2xl font-bold">Recently Played</h1>
      {recent.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Tracks you play will show up here.</p>
      ) : (
        <div className="space-y-1">
          {recent.map((t, i) => (
            <TrackRow key={t.videoId} track={t} index={i} onPlay={() => playTracks(recent, i)} />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Track row ---
function TrackRow({ track, index, onPlay }: { track: YTMTrack; index: number; onPlay: () => void }) {
  const currentTrack = usePlayer((s) => s.queue[s.currentIndex]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const toggleLike = useLibrary((s) => s.toggleLike);
  const isLiked = useLibrary((s) => s.isLiked(track.videoId));
  const isCurrent = currentTrack?.videoId === track.videoId;
  const active = isCurrent && isPlaying;

  return (
    <div
      className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:surface2"
      style={{ background: isCurrent ? "var(--surface2)" : undefined }}
      onDoubleClick={onPlay}
    >
      <button onClick={onPlay} className="flex h-9 w-9 flex-none items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
        {active ? (
          <span className="flex items-end gap-[2px] h-3.5">
            {[0,1,2,3].map(i => <span key={i} className="eq-bar w-[2px] rounded-full" style={{ height: "100%", background: "var(--accent)" }} />)}
          </span>
        ) : (
          <>
            <span className="group-hover:hidden">{index + 1}</span>
            <Play className="hidden h-4 w-4 fill-current group-hover:block" style={{ color: "var(--text)" }} />
          </>
        )}
      </button>
      <div className="h-10 w-10 flex-none overflow-hidden rounded-md" style={{ background: "var(--surface2)" }}>
        {track.thumbnail && <img src={track.thumbnail} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium" style={{ color: isCurrent ? "var(--accent)" : "var(--text)" }}>{track.title}</div>
        <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{artistsLabel(track.artists)}</div>
      </div>
      <button onClick={() => toggleLike(track)} className="rounded-full p-1.5 opacity-0 transition-opacity group-hover:opacity-100" aria-label="Like">
        <Heart className="h-4 w-4" style={{ color: isLiked ? "var(--accent)" : "var(--text-muted)", fill: isLiked ? "var(--accent)" : "none" }} />
      </button>
      <div className="w-10 text-right text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{track.duration}</div>
    </div>
  );
}

// --- Player bar ---
function MusicBar({ onOpenNP }: { onOpenNP: () => void }) {
  const track = usePlayer((s) => s.queue[s.currentIndex] ?? null);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const isBuffering = usePlayer((s) => s.isBuffering);
  const currentTime = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const repeat = usePlayer((s) => s.repeat);
  const shuffle = usePlayer((s) => !!s.shuffleOrder);
  const togglePlay = usePlayer((s) => s.togglePlay);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seek = usePlayer((s) => s.seek);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);

  if (!track) {
    return (
      <div className="absolute bottom-0 left-0 right-0 flex h-16 items-center justify-center border-t text-xs" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text-muted)" }}>
        Nothing playing — pick a song.
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 flex h-16 items-center gap-4 border-t px-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      {/* Track info */}
      <button onClick={onOpenNP} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className="h-11 w-11 flex-none overflow-hidden rounded-md" style={{ background: "var(--surface2)" }}>
          {track.thumbnail && <img src={track.thumbnail} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{track.title}</div>
          <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{artistsLabel(track.artists)}</div>
        </div>
      </button>

      {/* Transport */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <button onClick={toggleShuffle} className="rounded-full p-1.5 transition-colors" style={{ color: shuffle ? "var(--accent)" : "var(--text-muted)" }}><Shuffle className="h-4 w-4" /></button>
          <button onClick={prev} className="rounded-full p-1.5 transition-colors hover:text-current"><SkipBack className="h-4 w-4 fill-current" /></button>
          <button onClick={togglePlay} className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-105" style={{ background: "var(--text)", color: "var(--bg)" }}>
            {isBuffering ? <Loader2 className="h-4 w-4 animate-spin" /> : isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 translate-x-[1px] fill-current" />}
          </button>
          <button onClick={next} className="rounded-full p-1.5 transition-colors hover:text-current"><SkipForward className="h-4 w-4 fill-current" /></button>
          <button onClick={cycleRepeat} className="rounded-full p-1.5 transition-colors" style={{ color: repeat !== "off" ? "var(--accent)" : "var(--text-muted)" }}>
            {repeat === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
          </button>
        </div>
        {/* Seek */}
        <div className="hidden items-center gap-2 sm:flex">
          <span className="w-9 text-right text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>{formatTime(currentTime)}</span>
          <div className="group relative h-1 w-48">
            <div className="absolute inset-0 rounded-full" style={{ background: "var(--surface2)" }} />
            <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${progress}%`, background: "var(--accent)" }} />
            <input type="range" min={0} max={duration || 1} step={0.1} value={currentTime} onChange={(e) => seek(parseFloat(e.target.value))} className="absolute inset-0 w-full cursor-pointer opacity-0" />
          </div>
          <span className="w-9 text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 md:flex">
        <button onClick={toggleMute} className="rounded-full p-1.5 transition-colors hover:text-current">
          {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <div className="group relative h-1 w-20">
          <div className="absolute inset-0 rounded-full" style={{ background: "var(--surface2)" }} />
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(muted ? 0 : volume) * 100}%`, background: "var(--accent)" }} />
          <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="absolute inset-0 w-full cursor-pointer opacity-0" />
        </div>
      </div>
    </div>
  );
}

// --- Now Playing ---
function NowPlaying({ onClose }: { onClose: () => void }) {
  const track = usePlayer((s) => s.queue[s.currentIndex] ?? null);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const isBuffering = usePlayer((s) => s.isBuffering);
  const currentTime = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);
  const repeat = usePlayer((s) => s.repeat);
  const shuffle = usePlayer((s) => !!s.shuffleOrder);
  const togglePlay = usePlayer((s) => s.togglePlay);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seek = usePlayer((s) => s.seek);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const toggleLike = useLibrary((s) => s.toggleLike);
  const isLiked = useLibrary((s) => (track ? s.isLiked(track.videoId) : false));

  if (!track) return null;
  const hue = hueFromId(track.videoId);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="absolute inset-0 z-50 fade-in" style={{ background: "var(--bg)" }}>
      {/* Backdrop */}
      <div className="absolute inset-0 overflow-hidden">
        {track.thumbnail && <img src={track.thumbnail} alt="" className="h-full w-full scale-125 object-cover opacity-20 blur-3xl" />}
        <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, hsla(${hue}, 50%, 15%, 0.85), hsla(0, 0%, 5%, 0.95))` }} />
      </div>

      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between p-4">
          <button onClick={onClose} className="rounded-full p-2 transition-colors hover:surface2"><ChevronDown className="h-5 w-5" /></button>
          <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Now Playing</span>
          <div className="w-9" />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="mb-6 aspect-square w-full max-w-xs overflow-hidden rounded-2xl shadow-2xl">
            {track.thumbnail && <img src={track.thumbnail} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="w-full max-w-md text-center">
            <h1 className="truncate text-2xl font-bold">{track.title}</h1>
            <p className="mt-1 text-base" style={{ color: "var(--text-muted)" }}>{artistsLabel(track.artists)}</p>
          </div>

          {/* Seek */}
          <div className="mt-6 flex w-full max-w-md items-center gap-3">
            <span className="w-10 text-right text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{formatTime(currentTime)}</span>
            <div className="group relative h-1.5 flex-1">
              <div className="absolute inset-0 rounded-full" style={{ background: "var(--surface2)" }} />
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${progress}%`, background: "var(--accent)" }} />
              <input type="range" min={0} max={duration || 1} step={0.1} value={currentTime} onChange={(e) => seek(parseFloat(e.target.value))} className="absolute inset-0 w-full cursor-pointer opacity-0" />
            </div>
            <span className="w-10 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{formatTime(duration)}</span>
          </div>

          {/* Transport */}
          <div className="mt-4 flex items-center gap-6">
            <button onClick={toggleShuffle} style={{ color: shuffle ? "var(--accent)" : "var(--text-muted)" }}><Shuffle className="h-5 w-5" /></button>
            <button onClick={prev}><SkipBack className="h-6 w-6 fill-current" /></button>
            <button onClick={togglePlay} className="flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-105" style={{ background: "var(--text)", color: "var(--bg)" }}>
              {isBuffering ? <Loader2 className="h-6 w-6 animate-spin" /> : isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 translate-x-[1px] fill-current" />}
            </button>
            <button onClick={next}><SkipForward className="h-6 w-6 fill-current" /></button>
            <button onClick={cycleRepeat} style={{ color: repeat !== "off" ? "var(--accent)" : "var(--text-muted)" }}>
              {repeat === "one" ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
            </button>
            <button onClick={() => toggleLike(track)} style={{ color: isLiked ? "var(--accent)" : "var(--text-muted)" }}>
              <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
