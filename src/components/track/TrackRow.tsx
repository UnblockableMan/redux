"use client";

import { MoreHorizontal, Play, Pause, Heart } from "lucide-react";
import { usePlayer } from "@/store/player";
import { useLibrary } from "@/store/library";
import { useTrackMenu } from "./TrackContextMenu";
import { artistsLabel, formatTime } from "@/lib/format";
import type { YTMTrack } from "@/lib/ytm/types";
import { cn } from "@/lib/utils";

interface TrackRowProps {
  track: YTMTrack;
  index?: number;
  onPlay?: () => void;
  showAlbum?: boolean;
  showIndex?: boolean;
  compact?: boolean;
}

export function TrackRow({
  track,
  index,
  onPlay,
  showAlbum = true,
  showIndex = false,
  compact = false,
}: TrackRowProps) {
  const currentTrack = usePlayer((s) => s.queue[s.currentIndex]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playTracks = usePlayer((s) => s.playTracks);
  const togglePlay = usePlayer((s) => s.togglePlay);
  const isLiked = useLibrary((s) => s.isLiked(track.videoId));
  const toggleLike = useLibrary((s) => s.toggleLike);
  const openMenu = useTrackMenu();

  const isCurrent = currentTrack?.videoId === track.videoId;
  const active = isCurrent && isPlaying;

  const handlePlay = () => {
    if (isCurrent) {
      togglePlay();
    } else if (onPlay) {
      onPlay();
    } else {
      playTracks([track], 0);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors",
        "hover:bg-white/5",
        isCurrent && "bg-white/[0.07]",
        compact && "py-1.5",
      )}
      onDoubleClick={handlePlay}
    >
      {/* Index / play button */}
      <div className="flex h-9 w-9 flex-none items-center justify-center text-sm text-muted-foreground">
        {showIndex && typeof index === "number" ? (
          <>
            {active ? (
              <span className="flex items-end gap-[2px] h-4">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="eq-bar w-[3px] rounded-full bg-primary"
                    style={{ height: "100%" }}
                  />
                ))}
              </span>
            ) : (
              <>
                <span className="group-hover:hidden">{index + 1}</span>
                <button
                  onClick={handlePlay}
                  className="hidden text-foreground group-hover:block"
                  aria-label="Play"
                >
                  <Play className="h-4 w-4 fill-foreground" />
                </button>
              </>
            )}
          </>
        ) : (
          <button
            onClick={handlePlay}
            className="text-muted-foreground hover:text-foreground"
            aria-label={active ? "Pause" : "Play"}
          >
            {active ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
          </button>
        )}
      </div>

      {/* Thumbnail */}
      <div className="relative h-10 w-10 flex-none overflow-hidden rounded-md bg-white/5">
        {track.thumbnail ? (
          <img
            src={track.thumbnail}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>

      {/* Title + artists */}
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate text-sm font-medium",
            isCurrent ? "text-primary" : "text-foreground",
          )}
        >
          {track.title}
          {track.isExplicit && (
            <span className="ml-2 rounded bg-white/10 px-1 py-[1px] text-[10px] align-middle text-muted-foreground">
              E
            </span>
          )}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {artistsLabel(track.artists)}
        </div>
      </div>

      {/* Album */}
      {showAlbum && track.album && (
        <div className="hidden min-w-0 flex-1 truncate text-sm text-muted-foreground lg:block">
          {track.album.title}
        </div>
      )}

      {/* Like */}
      <button
        onClick={() => toggleLike(track)}
        className={cn(
          "flex-none rounded-full p-2 transition-colors",
          isLiked
            ? "text-primary opacity-100"
            : "text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100",
        )}
        aria-label={isLiked ? "Unlike" : "Like"}
      >
        <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
      </button>

      {/* Duration */}
      <div className="flex-none w-12 text-right text-xs tabular-nums text-muted-foreground">
        {track.duration || formatTime(track.durationSeconds)}
      </div>

      {/* Context menu trigger */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          openMenu(track, e.currentTarget);
        }}
        className="flex-none rounded-full p-2 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
        aria-label="More options"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}
