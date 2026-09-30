"use client";

import { Home, Search, Library, Heart, Clock, Plus, Disc3 } from "lucide-react";
import { useNav } from "@/store/nav";
import { useLibrary } from "@/store/library";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const view = useNav((s) => s.view);
  const go = useNav((s) => s.go);
  const playlists = useLibrary((s) => s.playlists);
  const createPlaylist = useLibrary((s) => s.createPlaylist);
  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState(false);

  const isActive = (name: string) => view.name === name;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const id = createPlaylist(newName.trim() || "New Playlist");
    toast.success("Playlist created", { description: newName.trim() || "New Playlist" });
    setNewName("");
    setOpen(false);
    go({ name: "playlist", playlistId: id });
  };

  return (
    <aside className="glass-sidebar hidden h-full w-64 flex-none flex-col gap-2 border-r border-white/[0.06] px-3 py-4 md:flex">
      {/* Wordmark */}
      <div className="px-3 pb-2">
        <div className="text-2xl font-bold tracking-tight text-gradient">abroad</div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          music player
        </div>
      </div>

      {/* Primary nav */}
      <nav className="space-y-1">
        <NavItem
          icon={<Home className="h-5 w-5" />}
          label="Home"
          active={isActive("home")}
          onClick={() => go({ name: "home" })}
        />
        <NavItem
          icon={<Search className="h-5 w-5" />}
          label="Search"
          active={isActive("search")}
          onClick={() => go({ name: "search" })}
        />
        <NavItem
          icon={<Library className="h-5 w-5" />}
          label="Your Library"
          active={isActive("library") || isActive("liked") || isActive("recently-played") || isActive("playlist")}
          onClick={() => go({ name: "library" })}
        />
      </nav>

      {/* Library shortcuts */}
      <div className="mt-3 space-y-1">
        <NavItem
          icon={<Heart className="h-4 w-4" />}
          label="Liked Songs"
          small
          active={isActive("liked")}
          onClick={() => go({ name: "liked" })}
        />
        <NavItem
          icon={<Clock className="h-4 w-4" />}
          label="Recently Played"
          small
          active={isActive("recently-played")}
          onClick={() => go({ name: "recently-played" })}
        />
      </div>

      {/* Playlists */}
      <div className="mt-3 flex items-center justify-between px-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Playlists
        </span>
        <button
          onClick={() => setOpen(true)}
          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          aria-label="Create playlist"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pr-1">
        {playlists.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            No playlists yet. Tap + to create one.
          </div>
        ) : (
          <div className="space-y-0.5">
            {playlists.map((p) => (
              <button
                key={p.id}
                onClick={() => go({ name: "playlist", playlistId: p.id })}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/5",
                  view.name === "playlist" && view.playlistId === p.id && "bg-white/[0.07] text-primary",
                )}
              >
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-gradient-to-br from-primary/40 to-primary/10">
                  <Disc3 className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.trackIds.length} {p.trackIds.length === 1 ? "track" : "tracks"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New playlist dialog */}
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
    </aside>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg font-medium transition-colors",
        small ? "px-3 py-2 text-sm" : "px-3 py-2.5 text-[15px]",
        active
          ? "bg-white/[0.08] text-foreground"
          : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
      )}
    >
      <span className={active ? "text-primary" : ""}>{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
