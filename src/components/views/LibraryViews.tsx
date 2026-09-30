"use client";

import { Play, Shuffle, Heart, Clock, ArrowLeft, Trash2 } from "lucide-react";
import { useLibrary } from "@/store/library";
import { usePlayer } from "@/store/player";
import { useNav } from "@/store/nav";
import { TrackRow } from "@/components/track/TrackRow";
import type { YTMTrack } from "@/lib/ytm/types";
import { useState, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

export function LikedView() {
  const likedMap = useLibrary((s) => s.liked);
  const likedArr = useMemo(() => Object.values(likedMap) as YTMTrack[], [likedMap]);
  const playTracks = usePlayer((s) => s.playTracks);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const shuffle = usePlayer((s) => !!s.shuffleOrder);
  const back = useNav((s) => s.back);

  // Most recent first.
  const tracks = [...likedArr];

  return (
    <div className="p-6 pb-32 fade-up lg:pb-8">
      <button onClick={back} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
        <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/40 to-rose-500/5 shadow-2xl">
          <Heart className="h-16 w-16 fill-primary text-primary" />
        </div>
        <div className="text-center sm:text-left">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Playlist
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Liked Songs</h1>
          <div className="mt-2 text-sm text-muted-foreground">
            {tracks.length} song{tracks.length === 1 ? "" : "s"}
          </div>
        </div>
      </header>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => tracks.length && playTracks(tracks, 0)}
          disabled={!tracks.length}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90 disabled:opacity-40"
        >
          <Play className="h-4 w-4 fill-current" /> Play
        </button>
        <button
          onClick={() => {
            if (!shuffle) toggleShuffle();
            if (tracks.length) playTracks(tracks, 0);
          }}
          disabled={!tracks.length}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 ${
            shuffle ? "bg-primary/20 text-primary" : "bg-white/5 hover:bg-white/10"
          }`}
        >
          <Shuffle className="h-4 w-4" /> Shuffle
        </button>
      </div>

      <div className="mt-8 space-y-0.5">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Heart className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Songs you like will appear here.
            </p>
          </div>
        ) : (
          tracks.map((t, i) => (
            <TrackRow
              key={t.videoId + i}
              track={t}
              index={i}
              showIndex
              onPlay={() => playTracks(tracks, i)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function RecentlyPlayedView() {
  const tracks = useLibrary((s) => s.recentlyPlayed);
  const playTracks = usePlayer((s) => s.playTracks);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const shuffle = usePlayer((s) => !!s.shuffleOrder);
  const back = useNav((s) => s.back);

  return (
    <div className="p-6 pb-32 fade-up lg:pb-8">
      <button onClick={back} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
        <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/40 to-violet-500/5 shadow-2xl">
          <Clock className="h-16 w-16 text-primary" />
        </div>
        <div className="text-center sm:text-left">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            History
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Recently Played</h1>
          <div className="mt-2 text-sm text-muted-foreground">
            {tracks.length} track{tracks.length === 1 ? "" : "s"}
          </div>
        </div>
      </header>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => tracks.length && playTracks(tracks, 0)}
          disabled={!tracks.length}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90 disabled:opacity-40"
        >
          <Play className="h-4 w-4 fill-current" /> Play
        </button>
        <button
          onClick={() => {
            if (!shuffle) toggleShuffle();
            if (tracks.length) playTracks(tracks, 0);
          }}
          disabled={!tracks.length}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 ${
            shuffle ? "bg-primary/20 text-primary" : "bg-white/5 hover:bg-white/10"
          }`}
        >
          <Shuffle className="h-4 w-4" /> Shuffle
        </button>
      </div>

      <div className="mt-8 space-y-0.5">
        {tracks.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Tracks you play will show up here.
          </div>
        ) : (
          tracks.map((t, i) => (
            <TrackRow
              key={t.videoId + i}
              track={t}
              index={i}
              showIndex
              onPlay={() => playTracks(tracks, i)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function PlaylistView({ playlistId }: { playlistId: string }) {
  const playlist = useLibrary((s) => s.playlists.find((p) => p.id === playlistId));
  const tracksMap = useLibrary((s) => s.playlistTracks[playlistId] ?? {});
  const playTracks = usePlayer((s) => s.playTracks);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const shuffle = usePlayer((s) => !!s.shuffleOrder);
  const rename = useLibrary((s) => s.renamePlaylist);
  const remove = useLibrary((s) => s.deletePlaylist);
  const back = useNav((s) => s.back);
  const go = useNav((s) => s.go);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(playlist?.name ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!playlist) {
    return (
      <div className="p-6 fade-up">
        <button onClick={back} className="mb-6 text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </button>
        <div className="py-12 text-center text-sm text-muted-foreground">
          Playlist not found.
        </div>
      </div>
    );
  }

  const tracks = playlist.trackIds.map((id) => tracksMap[id]).filter(Boolean) as YTMTrack[];

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    rename(playlist.id, name.trim() || playlist.name);
    setRenaming(false);
    toast.success("Playlist renamed");
  };

  const handleDelete = () => {
    remove(playlist.id);
    toast.success("Playlist deleted");
    go({ name: "library" });
  };

  return (
    <div className="p-6 pb-32 fade-up lg:pb-8">
      <button onClick={back} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
        <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-gradient-to-br from-primary/40 to-primary/5 shadow-2xl">
          <Heart className="h-16 w-16 text-primary" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Playlist
          </div>
          {renaming ? (
            <form onSubmit={handleRename} className="mt-1 flex items-center gap-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-2xl font-bold outline-none focus:border-primary"
              />
              <button type="submit" className="rounded-full bg-primary px-4 py-1.5 text-sm">
                Save
              </button>
            </form>
          ) : (
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{playlist.name}</h1>
          )}
          <div className="mt-2 text-sm text-muted-foreground">
            {tracks.length} track{tracks.length === 1 ? "" : "s"}
          </div>
          <div className="mt-3 flex items-center gap-3 justify-center sm:justify-start">
            <button
              onClick={() => setRenaming((r) => !r)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {renaming ? "Cancel" : "Rename"}
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        </div>
      </header>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => tracks.length && playTracks(tracks, 0)}
          disabled={!tracks.length}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90 disabled:opacity-40"
        >
          <Play className="h-4 w-4 fill-current" /> Play
        </button>
        <button
          onClick={() => {
            if (!shuffle) toggleShuffle();
            if (tracks.length) playTracks(tracks, 0);
          }}
          disabled={!tracks.length}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 ${
            shuffle ? "bg-primary/20 text-primary" : "bg-white/5 hover:bg-white/10"
          }`}
        >
          <Shuffle className="h-4 w-4" /> Shuffle
        </button>
      </div>

      <div className="mt-8 space-y-0.5">
        {tracks.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            This playlist is empty. Add songs from the track menu (⋯).
          </div>
        ) : (
          tracks.map((t, i) => (
            <TrackRow
              key={t.videoId + i}
              track={t}
              index={i}
              showIndex
              onPlay={() => playTracks(tracks, i)}
            />
          ))
        )}
      </div>

      <Dialog.Root open={confirmDelete} onOpenChange={setConfirmDelete}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[61] w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-popover p-6 text-center shadow-2xl">
            <Dialog.Title className="text-lg font-semibold">Delete playlist?</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              “{playlist.name}” and its {tracks.length} track{tracks.length === 1 ? "" : "s"} will be removed.
            </Dialog.Description>
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-full bg-destructive px-5 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
