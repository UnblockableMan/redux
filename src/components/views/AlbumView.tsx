"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Play, Shuffle } from "lucide-react";
import { fetchAlbum } from "@/lib/ytm/browse";
import type { YTMAlbum, YTMTrack } from "@/lib/ytm/types";
import { usePlayer } from "@/store/player";
import { useNav } from "@/store/nav";
import { artistsLabel } from "@/lib/format";
import { TrackRow } from "@/components/track/TrackRow";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export function AlbumView({ albumId }: { albumId: string }) {
  const [data, setData] = useState<{ album: YTMAlbum; tracks: YTMTrack[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const playTracks = usePlayer((s) => s.playTracks);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const shuffle = usePlayer((s) => !!s.shuffleOrder);
  const back = useNav((s) => s.back);

  useEffect(() => {
    let cancelled = false;
    fetchAlbum(albumId)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? "Failed to load album");
          setLoading(false);
          toast.error("Couldn't load album", { description: err?.message });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [albumId]);

  if (loading) {
    return (
      <div className="p-6 fade-up">
        <button onClick={back} className="mb-6 text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </button>
        <div className="flex flex-col gap-6 sm:flex-row">
          <Skeleton className="aspect-square w-full max-w-[240px] rounded-xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="mt-8 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 fade-up">
        <button onClick={back} className="mb-6 text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </button>
        <div className="py-12 text-center text-sm text-muted-foreground">{error}</div>
      </div>
    );
  }

  const { album, tracks } = data;

  return (
    <div className="p-6 pb-32 fade-up lg:pb-8">
      <button onClick={back} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <header className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
        <div className="aspect-square w-full max-w-[240px] flex-none overflow-hidden rounded-xl bg-white/5 shadow-2xl">
          {album.thumbnail && (
            <img src={album.thumbnail} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Album
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{album.title}</h1>
          <div className="mt-2 text-sm text-muted-foreground">
            {album.year ?? "—"} · {tracks.length} track{tracks.length === 1 ? "" : "s"}
          </div>
        </div>
      </header>

      {/* Actions */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => playTracks(tracks, 0)}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90"
        >
          <Play className="h-4 w-4 fill-current" /> Play
        </button>
        <button
          onClick={() => {
            if (!shuffle) toggleShuffle();
            playTracks(tracks, 0);
          }}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
            shuffle ? "bg-primary/20 text-primary" : "bg-white/5 hover:bg-white/10"
          }`}
        >
          <Shuffle className="h-4 w-4" /> Shuffle
        </button>
      </div>

      {/* Track list */}
      <div className="mt-8 space-y-0.5">
        {tracks.map((t, i) => (
          <TrackRow
            key={t.videoId + i}
            track={{ ...t, album }}
            index={i}
            showIndex
            showAlbum={false}
            onPlay={() => playTracks(tracks, i)}
          />
        ))}
        {tracks.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No playable tracks found in this album.
          </div>
        )}
      </div>
    </div>
  );
}
