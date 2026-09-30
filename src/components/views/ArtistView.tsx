"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Play, Shuffle } from "lucide-react";
import { fetchArtist } from "@/lib/ytm/browse";
import type { YTMArtist, YTMTrack, YTMAlbum } from "@/lib/ytm/types";
import { usePlayer } from "@/store/player";
import { useNav } from "@/store/nav";
import { TrackRow } from "@/components/track/TrackRow";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type ArtistData = YTMArtist & {
  topTracks: YTMTrack[];
  albums: YTMAlbum[];
  singles: YTMAlbum[];
};

export function ArtistView({ artistId }: { artistId: string }) {
  const [data, setData] = useState<ArtistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const playTracks = usePlayer((s) => s.playTracks);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const shuffle = usePlayer((s) => !!s.shuffleOrder);
  const go = useNav((s) => s.go);
  const back = useNav((s) => s.back);

  useEffect(() => {
    let cancelled = false;
    fetchArtist(artistId)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? "Failed to load artist");
          setLoading(false);
          toast.error("Couldn't load artist", { description: err?.message });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [artistId]);

  if (loading) {
    return (
      <div className="p-6 fade-up">
        <Skeleton className="mb-6 h-6 w-16" />
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-40 w-40 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="mt-8 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
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

  return (
    <div className="p-6 pb-32 fade-up lg:pb-8">
      <button onClick={back} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <header className="flex flex-col items-center gap-4">
        <div className="h-44 w-44 overflow-hidden rounded-full bg-white/5 shadow-2xl">
          {data.thumbnail && (
            <img src={data.thumbnail} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="text-center">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Artist
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{data.name}</h1>
          {data.subscribers && (
            <div className="mt-2 text-sm text-muted-foreground">{data.subscribers}</div>
          )}
        </div>
      </header>

      {data.description && (
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted-foreground">
          {data.description}
        </p>
      )}

      {/* Actions */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => playTracks(data.topTracks, 0)}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90"
        >
          <Play className="h-4 w-4 fill-current" /> Play
        </button>
        <button
          onClick={() => {
            if (!shuffle) toggleShuffle();
            playTracks(data.topTracks, 0);
          }}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
            shuffle ? "bg-primary/20 text-primary" : "bg-white/5 hover:bg-white/10"
          }`}
        >
          <Shuffle className="h-4 w-4" /> Shuffle
        </button>
      </div>

      {/* Top tracks */}
      {data.topTracks.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Popular</h2>
          <div className="space-y-0.5">
            {data.topTracks.slice(0, 10).map((t, i) => (
              <TrackRow
                key={t.videoId + i}
                track={t}
                index={i}
                showIndex
                showAlbum={false}
                onPlay={() => playTracks(data.topTracks, i)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Albums */}
      {data.albums.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Albums</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {data.albums.map((a) => (
              <button
                key={a.albumId}
                onClick={() => go({ name: "album", albumId: a.albumId })}
                className="group flex flex-col gap-3 rounded-xl p-3 text-left transition-colors hover:bg-white/[0.05]"
              >
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-white/5 shadow-lg">
                  {a.thumbnail && (
                    <img src={a.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{a.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.year ?? "Album"}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Singles */}
      {data.singles.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Singles & EPs</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {data.singles.map((a) => (
              <button
                key={a.albumId}
                onClick={() => go({ name: "album", albumId: a.albumId })}
                className="group flex flex-col gap-3 rounded-xl p-3 text-left transition-colors hover:bg-white/[0.05]"
              >
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-white/5 shadow-lg">
                  {a.thumbnail && (
                    <img src={a.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{a.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.year ?? "Single"}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
