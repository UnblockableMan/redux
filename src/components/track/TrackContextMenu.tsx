"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  Heart,
  ListPlus,
  ListMusic,
  Disc3,
  User,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { usePlayer } from "@/store/player";
import { useLibrary } from "@/store/library";
import { useNav } from "@/store/nav";
import type { YTMTrack } from "@/lib/ytm/types";
import { artistsLabel } from "@/lib/format";
import { toast } from "sonner";

interface MenuState {
  track: YTMTrack | null;
  anchor: HTMLElement | null;
}

const TrackMenuContext = createContext<{
  openMenu: (track: YTMTrack, anchor: HTMLElement) => void;
}>({ openMenu: () => {} });

export function useTrackMenu() {
  return useContext(TrackMenuContext);
}

export function TrackMenuProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MenuState>({ track: null, anchor: null });
  const [newPlaylistOpen, setNewPlaylistOpen] = useState(false);

  const openMenu = useCallback((track: YTMTrack, anchor: HTMLElement) => {
    setState({ track, anchor });
  }, []);

  const close = useCallback(() => setState({ track: null, anchor: null }), []);

  return (
    <TrackMenuContext.Provider value={{ openMenu }}>
      {children}
      <DropdownRoot
        track={state.track}
        anchor={state.anchor}
        onClose={close}
        onOpenNewPlaylist={() => setNewPlaylistOpen(true)}
      />
      <NewPlaylistDialog
        open={newPlaylistOpen}
        onOpenChange={setNewPlaylistOpen}
        track={state.track}
        onDone={close}
      />
    </TrackMenuContext.Provider>
  );
}

function DropdownRoot({
  track,
  anchor,
  onClose,
  onOpenNewPlaylist,
}: {
  track: YTMTrack | null;
  anchor: HTMLElement | null;
  onClose: () => void;
  onOpenNewPlaylist: () => void;
}) {
  const addToQueue = usePlayer((s) => s.addToQueue);
  const playTracks = usePlayer((s) => s.playTracks);
  const toggleLike = useLibrary((s) => s.toggleLike);
  const isLiked = useLibrary((s) => (track ? s.isLiked(track.videoId) : false));
  const playlists = useLibrary((s) => s.playlists);
  const addToPlaylist = useLibrary((s) => s.addToPlaylist);
  const go = useNav((s) => s.go);

  if (!track) return null;

  const handle = (fn: () => void) => (e: Event) => {
    e.preventDefault();
    fn();
    onClose();
  };

  return (
    <DropdownMenu.Root
      open={!!track}
      onOpenChange={(o) => !o && onClose()}
      modal
    >
      <DropdownMenu.Trigger asChild>
        <span
          ref={(el) => {
            // We render an invisible anchor at the same position as `anchor`.
            if (el && anchor) {
              const r = anchor.getBoundingClientRect();
              el.style.position = "fixed";
              el.style.left = `${r.left}px`;
              el.style.top = `${r.top}px`;
              el.style.width = `${r.width}px`;
              el.style.height = `${r.height}px`;
              el.style.pointerEvents = "none";
              el.style.opacity = "0";
            }
          }}
          aria-hidden
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          className="z-50 min-w-[220px] overflow-hidden rounded-xl border border-white/10 bg-popover/95 p-1 text-popover-foreground shadow-2xl backdrop-blur-xl"
        >
          <div className="px-3 py-2">
            <div className="truncate text-sm font-medium">{track.title}</div>
            <div className="truncate text-xs text-muted-foreground">
              {artistsLabel(track.artists)}
            </div>
          </div>
          <div className="my-1 h-px bg-white/5" />
          <MenuItem
            icon={<ListPlus className="h-4 w-4" />}
            label="Play next"
            onSelect={handle(() => {
              addToQueue(track, "next");
              toast.success("Added to queue", { description: "Plays next" });
            })}
          />
          <MenuItem
            icon={<ListMusic className="h-4 w-4" />}
            label="Add to queue"
            onSelect={handle(() => {
              addToQueue(track, "end");
              toast.success("Added to queue");
            })}
          />
          <MenuItem
            icon={
              <Heart
                className={`h-4 w-4 ${isLiked ? "fill-current text-primary" : ""}`}
              />
            }
            label={isLiked ? "Remove from Liked" : "Save to Liked"}
            onSelect={handle(() => {
              toggleLike(track);
              toast.success(isLiked ? "Removed from Liked" : "Added to Liked");
            })}
          />
          {playlists.length > 0 && (
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className="flex w-full cursor-default select-none items-center gap-3 rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-white/5 focus:bg-white/5 data-[highlighted]:bg-white/5">
                <Disc3 className="h-4 w-4" />
                Add to playlist
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className="z-50 min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-popover/95 p-1 text-popover-foreground shadow-2xl backdrop-blur-xl"
                  sideOffset={4}
                >
                  <MenuItem
                    icon={<Plus className="h-4 w-4" />}
                    label="New playlist…"
                    onSelect={(e) => {
                      e.preventDefault();
                      onOpenNewPlaylist();
                    }}
                  />
                  <div className="my-1 h-px bg-white/5" />
                  <div className="max-h-64 overflow-y-auto">
                    {playlists.map((p) => (
                      <MenuItem
                        key={p.id}
                        icon={<ListMusic className="h-4 w-4" />}
                        label={p.name}
                        onSelect={handle(() => {
                          addToPlaylist(p.id, track);
                          toast.success("Added to playlist", {
                            description: p.name,
                          });
                        })}
                      />
                    ))}
                  </div>
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>
          )}
          {playlists.length === 0 && (
            <MenuItem
              icon={<Plus className="h-4 w-4" />}
              label="Add to new playlist…"
              onSelect={(e) => {
                e.preventDefault();
                onOpenNewPlaylist();
              }}
            />
          )}
          <div className="my-1 h-px bg-white/5" />
          {track.album?.albumId && (
            <MenuItem
              icon={<Disc3 className="h-4 w-4" />}
              label="Go to album"
              onSelect={handle(() => go({ name: "album", albumId: track.album!.albumId }))}
            />
          )}
          {track.artists[0]?.artistId && (
            <MenuItem
              icon={<User className="h-4 w-4" />}
              label="Go to artist"
              onSelect={handle(() =>
                go({ name: "artist", artistId: track.artists[0].artistId! }),
              )}
            />
          )}
          <MenuItem
            icon={<Trash2 className="h-4 w-4" />}
            label="Play just this"
            onSelect={handle(() => playTracks([track], 0))}
          />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MenuItem({
  icon,
  label,
  onSelect,
}: {
  icon: ReactNode;
  label: string;
  onSelect: (e: Event) => void;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className="flex w-full cursor-default select-none items-center gap-3 rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-white/5 focus:bg-white/5 data-[highlighted]:bg-white/5"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="truncate">{label}</span>
    </DropdownMenu.Item>
  );
}

function NewPlaylistDialog({
  open,
  onOpenChange,
  track,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  track: YTMTrack | null;
  onDone: () => void;
}) {
  const createPlaylist = useLibrary((s) => s.createPlaylist);
  const addToPlaylist = useLibrary((s) => s.addToPlaylist);
  const [name, setName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!track) return;
    const id = createPlaylist(name.trim() || "New Playlist");
    addToPlaylist(id, track);
    toast.success("Created playlist", {
      description: name.trim() || "New Playlist",
    });
    setName("");
    onOpenChange(false);
    onDone();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[61] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-popover p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              New playlist
            </Dialog.Title>
            <Dialog.Close className="rounded-full p-1 text-muted-foreground hover:bg-white/10">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Playlist name"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-primary"
            />
            {track && (
              <p className="text-xs text-muted-foreground">
                Adds “{track.title}” as the first track.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
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
  );
}
