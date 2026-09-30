"use client";

import { useEffect, useRef, useState } from "react";
import { Search as SearchIcon, X, Play } from "lucide-react";
import { search } from "@/lib/ytm/search";
import type { SearchResults, YTMTrack, YTMArtist, YTMAlbum, YTMPlaylist } from "@/lib/ytm/types";
import { usePlayer } from "@/store/player";
import { useNav } from "@/store/nav";
import { artistsLabel } from "@/lib/format";
import { TrackRow } from "@/components/track/TrackRow";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export function SearchView() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const playTracks = usePlayer((s) => s.playTracks);

  useEffect(() => {
    const el = inputRef.current;
    if (el) el.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      // Defer to avoid synchronous setState in the effect body.
      const r = requestAnimationFrame(() => {
        setResults(null);
        setLoading(false);
        setError(null);
      });
      return () => cancelAnimationFrame(r);
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const t = setTimeout(() => {
      setLoading(true);
      setError(null);
      search(query, controller.signal)
        .then((r) => {
          if (!controller.signal.aborted) {
            setResults(r);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setError(err?.message ?? "Search failed");
          setLoading(false);
          toast.error("Search failed", { description: err?.message });
        });
    }, 350);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="flex h-full flex-col p-6 pb-32 fade-up lg:pb-8">
      {/* Search bar */}
      <div className="relative mx-auto mb-6 w-full max-w-2xl">
        <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, albums…"
          className="w-full rounded-full border border-white/10 bg-white/5 py-3.5 pl-12 pr-12 text-base outline-none transition-colors focus:border-primary focus:bg-white/[0.08]"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results */}
      <div className="mx-auto w-full max-w-5xl flex-1 overflow-y-auto">
        {!query.trim() && <EmptyState />}
        {loading && <LoadingState />}
        {error && !loading && (
          <div className="py-12 text-center text-sm text-muted-foreground">{error}</div>
        )}
        {results && !loading && !error && (
          <ResultsView results={results} onPlayAll={(tracks) => playTracks(tracks, 0)} />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
        <SearchIcon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold">Find your sound</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Search YouTube Music for songs, artists, albums and playlists.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsView({
  results,
  onPlayAll,
}: {
  results: SearchResults;
  onPlayAll: (tracks: YTMTrack[]) => void;
}) {
  const go = useNav((s) => s.go);
  const hasAny =
    results.tracks.length ||
    results.artists.length ||
    results.albums.length ||
    results.playlists.length;

  if (!hasAny) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No results. Try a different query.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {results.topResult && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Top result</h2>
          <TopResultCard item={results.topResult} />
        </section>
      )}

      {results.tracks.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Songs</h2>
            <button
              onClick={() => onPlayAll(results.tracks)}
              className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium hover:bg-white/10"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Play all
            </button>
          </div>
          <div className="space-y-0.5">
            {results.tracks.slice(0, 8).map((t, i) => (
              <TrackRow key={t.videoId} track={t} index={i} showIndex onPlay={() => onPlayAll(results.tracks.slice(i))} />
            ))}
          </div>
        </section>
      )}

      {results.artists.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Artists</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {results.artists.slice(0, 8).map((a) => (
              <ArtistCard key={a.artistId} artist={a} onClick={() => go({ name: "artist", artistId: a.artistId! })} />
            ))}
          </div>
        </section>
      )}

      {results.albums.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Albums</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {results.albums.slice(0, 8).map((a) => (
              <AlbumCard key={a.albumId} album={a} onClick={() => go({ name: "album", albumId: a.albumId })} />
            ))}
          </div>
        </section>
      )}

      {results.playlists.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Playlists</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {results.playlists.slice(0, 8).map((p) => (
              <PlaylistCard key={p.playlistId} playlist={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TopResultCard({ item }: { item: YTMTrack | YTMArtist | YTMAlbum }) {
  const playTracks = usePlayer((s) => s.playTracks);
  const go = useNav((s) => s.go);

  const isTrack = (x: any): x is YTMTrack => !!x.videoId;
  const isArtist = (x: any): x is YTMArtist => !!x.artistId && !x.videoId;
  const isAlbum = (x: any): x is YTMAlbum => !!x.albumId && !x.videoId;

  let title = "";
  let subtitle = "";
  let thumbnail = "";
  let onPlay: () => void = () => {};
  let isCircle = false;

  if (isTrack(item)) {
    title = item.title;
    subtitle = `Song · ${artistsLabel(item.artists)}`;
    thumbnail = item.thumbnail;
    onPlay = () => playTracks([item], 0);
  } else if (isArtist(item)) {
    title = item.name;
    subtitle = `Artist${item.subscribers ? ` · ${item.subscribers}` : ""}`;
    thumbnail = item.thumbnail ?? "";
    onPlay = () => go({ name: "artist", artistId: item.artistId! });
    isCircle = true;
  } else if (isAlbum(item)) {
    title = item.title;
    subtitle = `Album${item.year ? ` · ${item.year}` : ""}`;
    thumbnail = item.thumbnail ?? "";
    onPlay = () => go({ name: "album", albumId: item.albumId });
  }

  return (
    <button
      onClick={onPlay}
      className="group relative flex w-full max-w-md items-center gap-4 rounded-2xl bg-white/[0.04] p-4 text-left transition-colors hover:bg-white/[0.08]"
    >
      <div className="relative h-20 w-20 flex-none overflow-hidden bg-white/5">
        {thumbnail && (
          <img
            src={thumbnail}
            alt=""
            className={isCircle ? "h-full w-full rounded-full object-cover" : "h-full w-full object-cover"}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-lg font-semibold">{title}</div>
        <div className="truncate text-sm text-muted-foreground">{subtitle}</div>
      </div>
      <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-primary opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
        <Play className="h-5 w-5 translate-x-[1px] fill-primary-foreground text-primary-foreground" />
      </div>
    </button>
  );
}

function ArtistCard({ artist, onClick }: { artist: YTMArtist; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex flex-col items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/[0.05]">
      <div className="aspect-square w-full overflow-hidden rounded-full bg-white/5 shadow-lg">
        {artist.thumbnail && (
          <img src={artist.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
      </div>
      <div className="w-full text-center">
        <div className="truncate text-sm font-medium">{artist.name}</div>
        <div className="truncate text-xs text-muted-foreground">Artist</div>
      </div>
    </button>
  );
}

function AlbumCard({ album, onClick }: { album: YTMAlbum; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex flex-col gap-3 rounded-xl p-3 text-left transition-colors hover:bg-white/[0.05]">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-white/5 shadow-lg">
        {album.thumbnail && (
          <img src={album.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{album.title}</div>
        <div className="truncate text-xs text-muted-foreground">{album.year ?? "Album"}</div>
      </div>
    </button>
  );
}

function PlaylistCard({ playlist }: { playlist: YTMPlaylist }) {
  return (
    <div className="group flex flex-col gap-3 rounded-xl p-3 text-left transition-colors hover:bg-white/[0.05]">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-white/5 shadow-lg">
        {playlist.thumbnail && (
          <img src={playlist.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{playlist.title}</div>
        <div className="truncate text-xs text-muted-foreground">{playlist.subtitle}</div>
      </div>
    </div>
  );
}
