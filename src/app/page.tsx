"use client";

import { useEffect } from "react";
import { useNav } from "@/store/nav";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { PlayerBar } from "@/components/player/PlayerBar";
import { NowPlaying } from "@/components/player/NowPlaying";
import { QueuePanel } from "@/components/player/QueuePanel";
import { PlayerAudio } from "@/components/player/PlayerAudio";
import { TrackMenuProvider } from "@/components/track/TrackContextMenu";
import { HomeView } from "@/components/views/HomeView";
import { SearchView } from "@/components/views/SearchView";
import { LibraryView } from "@/components/views/LibraryView";
import { AlbumView } from "@/components/views/AlbumView";
import { ArtistView } from "@/components/views/ArtistView";
import { LikedView, RecentlyPlayedView, PlaylistView } from "@/components/views/LibraryViews";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { ThemeApplier } from "@/components/layout/ThemeApplier";

export default function Page() {
  const view = useNav((s) => s.view);
  useKeyboardShortcuts();

  // Scroll the main view to top whenever it changes.
  useEffect(() => {
    const main = document.getElementById("main-scroll");
    if (main) main.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [view]);

  return (
    <TrackMenuProvider>
      <ThemeApplier />
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main id="main-scroll" className="flex-1 overflow-y-auto">
            <ViewSwitcher view={view} />
          </main>
        </div>

        {/* Player bar (desktop + mobile mini-player) */}
        <PlayerBar />

        {/* Mobile bottom nav */}
        <MobileNav />

        {/* Overlays */}
        <NowPlaying />
        <QueuePanel />

        {/* Hidden audio element — the heart of playback */}
        <PlayerAudio />
      </div>
    </TrackMenuProvider>
  );
}

function ViewSwitcher({ view }: { view: ReturnType<typeof useNav.getState>["view"] }) {
  switch (view.name) {
    case "home":
      return <HomeView />;
    case "search":
      return <SearchView />;
    case "library":
      return <LibraryView />;
    case "album":
      return <AlbumView key={view.albumId} albumId={view.albumId} />;
    case "artist":
      return <ArtistView key={view.artistId} artistId={view.artistId} />;
    case "liked":
      return <LikedView />;
    case "recently-played":
      return <RecentlyPlayedView />;
    case "playlist":
      return <PlaylistView key={view.playlistId} playlistId={view.playlistId} />;
    default:
      return <HomeView />;
  }
}
