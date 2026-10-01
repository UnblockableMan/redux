"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { PlayerBar } from "@/components/player/PlayerBar";
import { NowPlaying } from "@/components/player/NowPlaying";
import { QueuePanel } from "@/components/player/QueuePanel";
import { TrackMenuProvider } from "@/components/track/TrackContextMenu";
import { useNav } from "@/store/nav";
import { HomeView } from "@/components/views/HomeView";
import { SearchView } from "@/components/views/SearchView";
import { LibraryView } from "@/components/views/LibraryView";
import { AlbumView } from "@/components/views/AlbumView";
import { ArtistView } from "@/components/views/ArtistView";
import { LikedView, RecentlyPlayedView, PlaylistView } from "@/components/views/LibraryViews";
import { useEffect } from "react";

/**
 * MusicApp — the "abroad" music player running inside an OS window.
 * The PlayerAudio (YouTube IFrame) is mounted at the OS root so audio keeps
 * playing even when this window is closed/minimized.
 */
export function MusicApp() {
  const view = useNav((s) => s.view);

  useEffect(() => {
    const el = document.getElementById("music-scroll");
    if (el) el.scrollTo({ top: 0 });
  }, [view]);

  return (
    <TrackMenuProvider>
      <div className="flex h-full w-full flex-col overflow-hidden bg-background text-foreground">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main id="music-scroll" className="flex-1 overflow-y-auto">
            <ViewSwitcher view={view} />
          </main>
        </div>
        <PlayerBar />
        <MobileNav />
        <NowPlaying />
        <QueuePanel />
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
