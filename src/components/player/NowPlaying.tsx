"use client";

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  ChevronDown,
  Heart,
  ListMusic,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { usePlayer } from "@/store/player";
import { useLibrary } from "@/store/library";
import { useTrackMenu } from "@/components/track/TrackContextMenu";
import { formatTime, artistsLabel, hueFromId } from "@/lib/format";
import { useNav } from "@/store/nav";
import { cn } from "@/lib/utils";

export function NowPlaying() {
  const open = usePlayer((s) => s.nowPlayingOpen);
  const setOpen = usePlayer((s) => s.setNowPlayingOpen);
  const track = usePlayer((s) => s.queue[s.currentIndex] ?? null);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const isBuffering = usePlayer((s) => s.isBuffering);
  const currentTime = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);
  const repeat = usePlayer((s) => s.repeat);
  const shuffle = usePlayer((s) => !!s.shuffleOrder);
  const togglePlay = usePlayer((s) => s.togglePlay);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seek = usePlayer((s) => s.seek);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const setQueueOpen = usePlayer((s) => s.setQueueOpen);
  const go = useNav((s) => s.go);

  const isLiked = useLibrary((s) => (track ? s.isLiked(track.videoId) : false));
  const toggleLike = useLibrary((s) => s.toggleLike);
  const openMenu = useTrackMenu();

  if (!open || !track) return null;

  const hue = hueFromId(track.videoId);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 fade-up">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 overflow-hidden">
        {track.thumbnail ? (
          <img
            src={track.thumbnail}
            alt=""
            className="h-full w-full scale-125 object-cover blur-3xl"
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(160deg, hsla(${hue}, 60%, 20%, 0.85) 0%, hsla(${hue}, 40%, 8%, 0.92) 60%, hsla(0, 0%, 5%, 0.95) 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-aurora opacity-40" />
      </div>

      {/* Content */}
      <div className="relative flex h-full flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 sm:p-6">
          <button
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20"
            aria-label="Collapse"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
          <div className="text-center">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">
              Playing from
            </div>
            <div className="text-sm font-medium">
              {track.album?.title ?? "Now Playing"}
            </div>
          </div>
          <button
            onClick={(e) => openMenu(track, e.currentTarget)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20"
            aria-label="More"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Artwork */}
        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
            {track.thumbnail ? (
              <img src={track.thumbnail} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
        </div>

        {/* Info + controls */}
        <div className="px-6 pb-8 sm:px-10">
          <div className="mx-auto max-w-2xl">
            {/* Title row */}
            <div className="mb-4 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold sm:text-3xl">{track.title}</h1>
                <button
                  onClick={() =>
                    track.artists[0]?.artistId &&
                    go({ name: "artist", artistId: track.artists[0].artistId })
                  }
                  className="mt-1 truncate text-base text-white/70 hover:text-white"
                >
                  {artistsLabel(track.artists)}
                </button>
              </div>
              <button
                onClick={() => toggleLike(track)}
                className={cn(
                  "flex-none rounded-full p-2 transition-colors",
                  isLiked ? "text-primary" : "text-white/70 hover:text-white",
                )}
              >
                <Heart className={cn("h-6 w-6", isLiked && "fill-current")} />
              </button>
            </div>

            {/* Seek */}
            <div className="mb-2 flex items-center gap-3">
              <span className="w-12 text-right text-xs tabular-nums text-white/60">
                {formatTime(currentTime)}
              </span>
              <BigSeek value={currentTime} max={duration} onChange={seek} hue={hue} />
              <span className="w-12 text-xs tabular-nums text-white/60">
                {formatTime(duration)}
              </span>
            </div>

            {/* Transport */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={toggleShuffle}
                className={cn(
                  "rounded-full p-3 transition-colors",
                  shuffle ? "text-primary" : "text-white/60 hover:text-white",
                )}
              >
                <Shuffle className="h-5 w-5" />
              </button>
              <button
                onClick={prev}
                className="rounded-full p-3 text-white hover:text-primary"
              >
                <SkipBack className="h-7 w-7 fill-current" />
              </button>
              <button
                onClick={togglePlay}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-2xl transition-transform hover:scale-105 active:scale-95"
              >
                {isBuffering ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-7 w-7 fill-current" />
                ) : (
                  <Play className="h-7 w-7 translate-x-[1px] fill-current" />
                )}
              </button>
              <button
                onClick={next}
                className="rounded-full p-3 text-white hover:text-primary"
              >
                <SkipForward className="h-7 w-7 fill-current" />
              </button>
              <button
                onClick={cycleRepeat}
                className={cn(
                  "rounded-full p-3 transition-colors",
                  repeat !== "off" ? "text-primary" : "text-white/60 hover:text-white",
                )}
              >
                {repeat === "one" ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
              </button>
            </div>

            {/* Queue shortcut */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => {
                  setOpen(false);
                  setQueueOpen(true);
                }}
                className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-md hover:bg-white/20"
              >
                <ListMusic className="h-4 w-4" /> View queue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BigSeek({
  value,
  max,
  onChange,
  hue,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  hue: number;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="group relative flex h-1.5 flex-1 items-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `linear-gradient(to right, hsl(${hue} 85% 65%) ${pct}%, rgba(255,255,255,0.18) ${pct}%)`,
        }}
      />
      <div
        className="absolute h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-white shadow-md transition-transform group-hover:scale-110"
        style={{ left: `${pct}%` }}
      />
      <input
        type="range"
        min={0}
        max={max || 1}
        step={0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="absolute inset-0 w-full cursor-pointer opacity-0"
      />
    </div>
  );
}
