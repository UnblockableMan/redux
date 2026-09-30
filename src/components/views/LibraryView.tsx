"use client";

import { Heart, Clock, Disc3, Plus, Trash2, Play, ArrowRight } from "lucide-react";
import { useState, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useLibrary } from "@/store/library";
import { useNav } from "@/store/nav";
import { usePlayer } from "@/store/player";
import { toast } from "sonner";
import type { YTMTrack } from "@/lib/ytm/types";
import { artistsLabel } from "@/lib/format";

export function LibraryView() {
  const go = useNav((s) => s.go);
  const likedMap = useLibrary((s) => s.liked);
  const liked = useMemo(() => Object.values(likedMap) as YTMTrack[], [likedMap]);
  const recentlyPlayed = useLibrary((s) => s.recentlyPlayed);
  const playlists = useLibrary((s) => s.playlists);
  const createPlaylist = useLibrary((s) => s.createPlaylist);
  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const id = createPlaylist(newName.trim() || "New Playlist");
    setNewName("");
    setOpen(false);
    go({ name: "playlist", playlistId: id });
    toast.success("Playlist created");
  };

  const isEmpty =
    liked.length === 0 && recentlyPlayed.length === 0 && playlists.length === 0;

  return (
    <div className="space-y-10 p-6 pb-32 fade-up lg:pb-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Library</h1>
          <p className="text-sm text-muted-foreground">
            Saved locally on this device.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New playlist
        </button>
      </header>

      {isEmpty && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <Heart className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Your library is empty</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tap the heart on any song to save it here, or create a playlist to
            start collecting.
          </p>
        </div>
      )}

      {/* Quick cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <QuickCard
          icon={<Heart className="h-6 w-6" />}
          gradient="from-rose-500/40 to-rose-500/5"
          title="Liked Songs"
          subtitle={`${liked.length} song${liked.length === 1 ? "" : "s"}`}
          onClick={() => go({ name: "liked" })}
        />
        <QuickCard
          icon={<Clock className="h-6 w-6" />}
          gradient="from-violet-500/40 to-violet-500/5"
          title="Recently Played"
          subtitle={`${recentlyPlayed.length} track${recentlyPlayed.length === 1 ? "" : "s"}`}
          onClick={() => go({ name: "recently-played" })}
        />
      </div>

      {/* Playlists */}
      {playlists.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Playlists</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {playlists.map((p) => (
              <PlaylistCard
                key={p.id}
                playlist={p}
                onOpen={() => go({ name: "playlist", playlistId: p.id })}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recently played preview */}
      {recentlyPlayed.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recently played</h2>
            <button
              onClick={() => go({ name: "recently-played" })}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              See all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {recentlyPlayed.slice(0, 12).map((t) => (
              <MiniTrackCard key={t.videoId} track={t} />
            ))}
          </div>
        </section>
      )}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[61] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-popover p-6 shadow-2xl">
            <Dialog.Title className="text-lg font-semibold">
              Create playlist
            </Dialog.Title>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Playlist name"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Create
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function QuickCard({
  icon,
  gradient,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  gradient: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-4 overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-4 text-left transition-transform hover:scale-[1.02]`}
    >
      <div className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-white/10">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </button>
  );
}

function PlaylistCard({
  playlist,
  onOpen,
}: {
  playlist: { id: string; name: string; trackIds: string[] };
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col gap-3 rounded-xl p-3 text-left transition-colors hover:bg-white/[0.05]"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gradient-to-br from-primary/30 to-primary/5 shadow-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <Disc3 className="h-12 w-12 text-primary/50" />
        </div>
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{playlist.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {playlist.trackIds.length} track{playlist.trackIds.length === 1 ? "" : "s"}
        </div>
      </div>
    </button>
  );
}

function MiniTrackCard({ track }: { track: YTMTrack }) {
  const playTracks = usePlayer((s) => s.playTracks);
  return (
    <button
      onClick={() => playTracks([track], 0)}
      className="group flex flex-col gap-2 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.05]"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white/5">
        {track.thumbnail && (
          <img src={track.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
        <div className="absolute bottom-2 right-2 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-primary opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100">
          <Play className="h-4 w-4 translate-x-[1px] fill-primary-foreground text-primary-foreground" />
        </div>
      </div>
      <div className="min-w-0">
        <div className="truncate text-xs font-medium">{track.title}</div>
        <div className="truncate text-[11px] text-muted-foreground">{artistsLabel(track.artists)}</div>
      </div>
    </button>
  );
}
