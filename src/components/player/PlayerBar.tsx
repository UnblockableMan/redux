"use client";

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  ListMusic,
  ChevronUp,
  Heart,
  Loader2,
} from "lucide-react";
import { usePlayer } from "@/store/player";
import { useLibrary } from "@/store/library";
import { formatTime, artistsLabel, hueFromId } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PlayerBar() {
  const track = usePlayer((s) => s.queue[s.currentIndex] ?? null);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const isBuffering = usePlayer((s) => s.isBuffering);
  const currentTime = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const repeat = usePlayer((s) => s.repeat);
  const shuffle = usePlayer((s) => !!s.shuffleOrder);
  const togglePlay = usePlayer((s) => s.togglePlay);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seek = usePlayer((s) => s.seek);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const setNowPlayingOpen = usePlayer((s) => s.setNowPlayingOpen);
  const setQueueOpen = usePlayer((s) => s.setQueueOpen);
  const nowPlayingOpen = usePlayer((s) => s.nowPlayingOpen);

  const isLiked = useLibrary((s) => (track ? s.isLiked(track.videoId) : false));
  const toggleLike = useLibrary((s) => s.toggleLike);

  if (!track) {
    return (
      <div className="glass hidden h-16 items-center justify-center border-t border-white/[0.06] text-xs text-muted-foreground md:flex">
        Nothing playing — pick a song to start.
      </div>
    );
  }

  const hue = hueFromId(track.videoId);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="glass relative z-30 border-t border-white/[0.06]">
      {/* Progress bar (very thin, top of the bar) */}
      <div className="absolute -top-px left-0 right-0 h-[3px] bg-transparent">
        <div
          className="h-full bg-primary/80"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-3 items-center gap-3 px-4 py-2.5">
        {/* Left: track info */}
        <button
          onClick={() => setNowPlayingOpen(!nowPlayingOpen)}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <div className="relative h-12 w-12 flex-none overflow-hidden rounded-md bg-white/5 shadow-md">
            {track.thumbnail && (
              <img src={track.thumbnail} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 hidden sm:block">
            <div className="truncate text-sm font-medium">{track.title}</div>
            <div className="truncate text-xs text-muted-foreground">
              {artistsLabel(track.artists)}
            </div>
          </div>
          <ChevronUp
            className={cn(
              "h-4 w-4 flex-none text-muted-foreground transition-transform",
              nowPlayingOpen && "rotate-180",
            )}
          />
        </button>

        {/* Center: transport */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={toggleShuffle}
              className={cn(
                "hidden rounded-full p-1.5 transition-colors sm:block",
                shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Shuffle"
            >
              <Shuffle className="h-4 w-4" />
            </button>
            <button
              onClick={prev}
              className="rounded-full p-1.5 text-foreground hover:text-primary"
              aria-label="Previous"
            >
              <SkipBack className="h-5 w-5 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105 active:scale-95"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isBuffering ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 translate-x-[1px] fill-current" />
              )}
            </button>
            <button
              onClick={next}
              className="rounded-full p-1.5 text-foreground hover:text-primary"
              aria-label="Next"
            >
              <SkipForward className="h-5 w-5 fill-current" />
            </button>
            <button
              onClick={cycleRepeat}
              className={cn(
                "hidden rounded-full p-1.5 transition-colors sm:block",
                repeat !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Repeat"
            >
              {repeat === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
            </button>
          </div>

          {/* Seek bar (desktop) */}
          <div className="hidden w-full max-w-xl items-center gap-2 px-2 sm:flex">
            <span className="w-10 text-right text-[11px] tabular-nums text-muted-foreground">
              {formatTime(currentTime)}
            </span>
            <SeekSlider
              value={currentTime}
              max={duration || 0}
              onChange={seek}
              hue={hue}
            />
            <span className="w-10 text-[11px] tabular-nums text-muted-foreground">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: volume + queue */}
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <button
            onClick={() => toggleLike(track)}
            className={cn(
              "rounded-full p-2 transition-colors",
              isLiked ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          </button>
          <button
            onClick={() => setQueueOpen(true)}
            className="rounded-full p-2 text-muted-foreground hover:text-foreground"
            aria-label="Queue"
          >
            <ListMusic className="h-4 w-4" />
          </button>
          <div className="hidden items-center gap-1 md:flex">
            <button
              onClick={toggleMute}
              className="rounded-full p-2 text-muted-foreground hover:text-foreground"
              aria-label="Mute"
            >
              {muted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : volume < 0.5 ? (
                <Volume1 className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <SeekSlider
              value={muted ? 0 : volume}
              max={1}
              onChange={setVolume}
              hue={hue}
              small
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SeekSlider({
  value,
  max,
  onChange,
  hue,
  small,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  hue: number;
  small?: boolean;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div
      className={cn(
        "group relative flex items-center",
        small ? "h-1 w-24" : "h-1 flex-1",
      )}
    >
      <div
        className="absolute inset-0 rounded-full bg-white/15"
        style={{
          background: `linear-gradient(to right, hsl(${hue} 80% 60%) ${pct}%, rgba(255,255,255,0.15) ${pct}%)`,
        }}
      />
      <div
        className="absolute h-3 w-3 -translate-x-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover:opacity-100"
        style={{ left: `${pct}%` }}
      />
      <input
        type="range"
        min={0}
        max={max || 1}
        step={small ? 0.01 : 0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="absolute inset-0 w-full cursor-pointer opacity-0"
      />
    </div>
  );
}
