"use client";

import { useEffect, useRef } from "react";
import { usePlayer } from "@/store/player";
import { useLibrary } from "@/store/library";
import { resolveStream } from "@/lib/ytm/stream";
import { toast } from "sonner";

/**
 * PlayerAudio
 * ------------
 * A single hidden <audio> element that is the source of truth for playback.
 * It reads the player store, resolves a stream URL on demand, and reports
 * timeupdates / ended events back to the store. Mounted once at the app root.
 */
export function PlayerAudio() {
  const ref = useRef<HTMLAudioElement | null>(null);
  const resolvingRef = useRef<string | null>(null);

  // Subscribe to the slices we care about.
  const currentTrack = usePlayer((s) => s.queue[s.currentIndex] ?? null);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const seekTarget = usePlayer((s) => (s.currentTime === 0 ? null : null)); // placeholder
  const streamUrl = usePlayer((s) => s.streamUrl);

  const setPlaying = usePlayer((s) => s.setPlaying);
  const setBuffering = usePlayer((s) => s.setBuffering);
  const setCurrentTime = usePlayer((s) => s.setCurrentTime);
  const setDuration = usePlayer((s) => s.setDuration);
  const next = usePlayer((s) => s.next);
  const setStream = usePlayer((s) => s.setStream);
  const addRecentlyPlayed = useLibrary((s) => s.addRecentlyPlayed);

  // Resolve a stream URL whenever the current track changes.
  useEffect(() => {
    if (!currentTrack) {
      setStream(null, null);
      return;
    }
    if (resolvingRef.current === currentTrack.videoId) return;
    resolvingRef.current = currentTrack.videoId;

    let cancelled = false;
    const controller = new AbortController();
    setBuffering(true);
    setStream(null, null);

    resolveStream(currentTrack.videoId, controller.signal)
      .then((s) => {
        if (cancelled) return;
        setStream(s.url, s.source);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error("Couldn't load this track", {
          description:
            err?.message ??
            "All streaming mirrors failed. Try another track or wait a moment.",
        });
        setPlaying(false);
        setBuffering(false);
      })
      .finally(() => {
        if (!cancelled) setBuffering(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [currentTrack?.videoId]);

  // Apply the resolved stream URL to the <audio> element.
  useEffect(() => {
    const el = ref.current;
    if (!el || !streamUrl) return;
    if (el.src !== streamUrl) {
      el.src = streamUrl;
      el.load();
    }
  }, [streamUrl]);

  // Play / pause.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isPlaying && streamUrl) {
      el.play().catch((err) => {
        // Autoplay can be blocked; surface it once.
        if (err?.name === "NotAllowedError") {
          toast.info("Tap play to start audio", {
            description: "Your browser blocked autoplay. Press the play button.",
          });
          setPlaying(false);
        }
      });
    } else {
      el.pause();
    }
  }, [isPlaying, streamUrl, setPlaying]);

  // Volume / mute.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.volume = volume;
    el.muted = muted;
  }, [volume, muted]);

  // Track recently played when a track actually starts.
  const lastLoggedRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentTrack && isPlaying && lastLoggedRef.current !== currentTrack.videoId) {
      lastLoggedRef.current = currentTrack.videoId;
      addRecentlyPlayed(currentTrack);
    }
  }, [currentTrack, isPlaying, addRecentlyPlayed]);

  return (
    <audio
      ref={ref}
      preload="auto"
      crossOrigin="anonymous"
      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => {
        setDuration(e.currentTarget.duration);
      }}
      onDurationChange={(e) => setDuration(e.currentTarget.duration)}
      onWaiting={() => setBuffering(true)}
      onPlaying={() => setBuffering(false)}
      onCanPlay={() => setBuffering(false)}
      onEnded={() => next()}
      onError={() => {
        // Surface a toast and skip ahead.
        toast.error("Playback error", {
          description: "Skipping to the next track.",
        });
        next();
      }}
    />
  );
}
