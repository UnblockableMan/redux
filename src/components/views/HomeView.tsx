"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { fetchHome } from "@/lib/ytm/home";
import { DEMO_HOME_SECTIONS } from "@/lib/ytm/demo";
import type { HomeSection, YTMTrack, YTMAlbum, YTMArtist, YTMPlaylist } from "@/lib/ytm/types";
import { usePlayer } from "@/store/player";
import { useNav } from "@/store/nav";
import { artistsLabel } from "@/lib/format";

export function HomeView() {
  // Start with demo content immediately so the page is never blank, then
  // try to replace it with the live feed in the background.
  const [sections, setSections] = useState<HomeSection[]>(DEMO_HOME_SECTIONS);
  const [usedFallback, setUsedFallback] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchHome()
      .then((s) => {
        if (!cancelled && s.length > 0) {
          setSections(s);
          setUsedFallback(false);
        }
      })
      .catch(() => {
        // Keep the demo content.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-10 p-6 pb-32 fade-up lg:pb-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Good evening</h1>
        <p className="text-sm text-muted-foreground">
          {usedFallback
            ? "Demo tracks — live feed unavailable in this environment. Search and playback work when Piped/Invidious instances are reachable."
            : "Trending music, fresh picks and what's hot right now."}
        </p>
      </header>

      {sections.map((section, i) => (
        <Section key={i} section={section} />
      ))}
    </div>
  );
}

function Section({ section }: { section: HomeSection }) {
  if (!section.items.length) return null;
  // Collect all tracks in this section so clicking any one plays the whole list.
  const sectionTracks = section.items.filter(
    (i): i is YTMTrack => !!(i as any).videoId,
  );
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold tracking-tight">{section.title}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {section.items.slice(0, 12).map((item, i) => (
          <Card key={i} item={item} sectionTracks={sectionTracks} />
        ))}
      </div>
    </section>
  );
}

function Card({
  item,
  sectionTracks = [],
}: {
  item: YTMTrack | YTMAlbum | YTMArtist | YTMPlaylist;
  sectionTracks?: YTMTrack[];
}) {
  const playTracks = usePlayer((s) => s.playTracks);
  const go = useNav((s) => s.go);

  const isTrack = (x: any): x is YTMTrack => !!x.videoId;
  const isArtist = (x: any): x is YTMArtist => !!x.artistId && !x.videoId && !x.albumId;
  const isAlbum = (x: any): x is YTMAlbum => !!x.albumId && !x.videoId && !x.artistId;
  const isPlaylist = (x: any): x is YTMPlaylist => !!x.playlistId && !x.videoId && !x.artistId && !x.albumId;

  let title = "";
  let subtitle = "";
  let thumbnail = "";
  let onClick = () => {};
  let onPlay: (() => void) | undefined;

  if (isTrack(item)) {
    title = item.title;
    subtitle = artistsLabel(item.artists);
    thumbnail = item.thumbnail;
    // Play from this track's position within the section's track list.
    const trackIndex = sectionTracks.findIndex((t) => t.videoId === item.videoId);
    const list = trackIndex >= 0 ? sectionTracks : [item];
    const startIndex = trackIndex >= 0 ? trackIndex : 0;
    onClick = () => playTracks(list, startIndex);
    onPlay = () => playTracks(list, startIndex);
  } else if (isAlbum(item)) {
    title = item.title;
    subtitle = item.year ?? "Album";
    thumbnail = item.thumbnail ?? "";
    onClick = () => go({ name: "album", albumId: item.albumId });
  } else if (isArtist(item)) {
    title = item.name;
    subtitle = item.subscribers ?? "Artist";
    thumbnail = item.thumbnail ?? "";
    onClick = () => go({ name: "artist", artistId: item.artistId! });
  } else if (isPlaylist(item)) {
    title = item.title;
    subtitle = item.subtitle ?? "Playlist";
    thumbnail = item.thumbnail ?? "";
  }

  const isCircle = isArtist(item);

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col gap-3 rounded-xl p-3 text-left transition-colors hover:bg-white/[0.05]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-white/5 shadow-lg">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className={isCircle ? "h-full w-full rounded-full object-cover" : "h-full w-full object-cover"}
            loading="lazy"
          />
        ) : null}
        {onPlay && (
          <div
            className="absolute bottom-2 right-2 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-primary opacity-0 shadow-xl transition-all hover:scale-105 group-hover:translate-y-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.();
            }}
          >
            <Play className="h-5 w-5 translate-x-[1px] fill-primary-foreground text-primary-foreground" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </button>
  );
}
