"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/store/player";
import { useLibrary } from "@/store/library";
import { loadYouTubeAPI } from "@/lib/youtube";
import { toast } from "sonner";

/**
 * PlayerAudio — YouTube IFrame API backend.
 *
 * Creates a hidden YT.Player instance, loads videos by ID, and syncs state
 * with the player store. The IFrame API always works (no CORS, no flaky
 * third-party instances) and YouTube Music video IDs are standard YouTube IDs.
 */
export function PlayerAudio() {
  const playerRef = useRef<any>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const lastVideoIdRef = useRef<string | null>(null);
  const repeatRef = useRef<string>("off");
  // Track whether we're in the middle of loading a new video so the
  // play/pause effect doesn't interfere with loadVideoById.
  const loadingRef = useRef(false);

  const currentTrack = usePlayer((s) => s.queue[s.currentIndex] ?? null);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const seekRequest = usePlayer((s) => s.seekRequest);
  const repeat = usePlayer((s) => s.repeat);

  const setPlaying = usePlayer((s) => s.setPlaying);
  const setBuffering = usePlayer((s) => s.setBuffering);
  const setCurrentTime = usePlayer((s) => s.setCurrentTime);
  const setDuration = usePlayer((s) => s.setDuration);
  const clearSeek = usePlayer((s) => s.clearSeek);
  const next = usePlayer((s) => s.next);
  const addRecentlyPlayed = useLibrary((s) => s.addRecentlyPlayed);

  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);

  // Initialize the YT.Player once.
  useEffect(() => {
    let destroyed = false;
    let hostEl: HTMLElement | null = null;

    loadYouTubeAPI()
      .then(() => {
        if (destroyed) return;
        const YT = window.YT;
        if (!YT?.Player) return;

        const host = document.createElement("div");
        host.style.cssText =
          "position:fixed;width:1px;height:1px;left:-9999px;top:-9999px;pointer-events:none;opacity:0;";
        document.body.appendChild(host);
        hostEl = host;

        playerRef.current = new YT.Player(host, {
          height: "1",
          width: "1",
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            iv_load_policy: 3,
          },
          events: {
            onReady: () => {
              setPlayerReady(true);
              const p = playerRef.current;
              if (p) {
                const st = usePlayer.getState();
                p.setVolume(Math.round(st.volume * 100));
                if (st.muted) p.mute();
                else p.unMute();
              }
            },
            onStateChange: (e: any) => {
              const Y = window.YT;
              const p = playerRef.current;
              if (!p || !Y) return;

              if (e.data === Y.PlayerState.PLAYING) {
                loadingRef.current = false;
                setPlaying(true);
                setBuffering(false);
                const d = p.getDuration?.() ?? 0;
                if (d > 0) setDuration(d);
              } else if (e.data === Y.PlayerState.PAUSED) {
                loadingRef.current = false;
                setPlaying(false);
                setBuffering(false);
              } else if (e.data === Y.PlayerState.BUFFERING) {
                setBuffering(true);
              } else if (e.data === Y.PlayerState.ENDED) {
                loadingRef.current = false;
                if (repeatRef.current === "one") {
                  p.seekTo(0, true);
                  p.playVideo();
                } else {
                  next();
                }
              }
            },
            onError: (e: any) => {
              loadingRef.current = false;
              const code = e?.data;
              let msg = "This video can't be played.";
              if (code === 2) msg = "Invalid video ID.";
              else if (code === 5) msg = "HTML5 player error.";
              else if (code === 100) msg = "Video not found or is private.";
              else if (code === 101 || code === 150)
                msg = "This video doesn't allow embedded playback.";
              toast.error("Playback error", {
                description: `${msg} Skipping to next track.`,
              });
              next();
            },
          },
        });
      })
      .catch((err) => {
        toast.error("Couldn't start the player", {
          description: err?.message ?? "Please reload the page.",
        });
      });

    return () => {
      destroyed = true;
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
      setPlayerReady(false);
      if (hostEl) hostEl.remove();
    };
  }, [setPlaying, setBuffering, setDuration, next]);

  // Load a new video when the track changes.
  // Uses loadVideoById which auto-plays — the play/pause effect skips
  // while loadingRef is true to avoid interference.
  useEffect(() => {
    const p = playerRef.current;
    if (!p || !currentTrack || !playerReady) return;
    if (lastVideoIdRef.current === currentTrack.videoId) return;

    lastVideoIdRef.current = currentTrack.videoId;
    loadingRef.current = true;
    setBuffering(true);
    setCurrentTime(0);
    setDuration(0);
    p.loadVideoById(currentTrack.videoId);
    addRecentlyPlayed(currentTrack);

    // Fallback: some browsers block auto-play after loadVideoById when
    // the call happens in an effect rather than directly in the click handler.
    // If the video hasn't started after 1.5s, explicitly call playVideo().
    const fallbackTimer = setTimeout(() => {
      try {
        const st = playerRef.current?.getPlayerState?.();
        // -1 = unstarted, 5 = cued, 2 = paused — all mean "not playing"
        if (st === -1 || st === 5 || st === 2) {
          playerRef.current?.playVideo();
        }
      } catch {}
    }, 1500);

    // Second fallback at 3s in case the first one was too early.
    const fallbackTimer2 = setTimeout(() => {
      try {
        const st = playerRef.current?.getPlayerState?.();
        if (st === -1 || st === 5 || st === 2) {
          if (usePlayer.getState().isPlaying) {
            playerRef.current?.playVideo();
          }
        }
      } catch {}
    }, 3000);

    return () => {
      clearTimeout(fallbackTimer);
      clearTimeout(fallbackTimer2);
    };
  }, [currentTrack?.videoId, playerReady, setBuffering, setCurrentTime, setDuration, addRecentlyPlayed]);

  // Play / pause — but skip while a new video is loading.
  useEffect(() => {
    const p = playerRef.current;
    if (!p || !playerReady || !currentTrack) return;
    if (loadingRef.current) return; // loadVideoById handles auto-play
    if (isPlaying) p.playVideo();
    else p.pauseVideo();
  }, [isPlaying, playerReady, currentTrack?.videoId]);

  // Volume / mute.
  useEffect(() => {
    const p = playerRef.current;
    if (!p || !playerReady) return;
    p.setVolume(Math.round(volume * 100));
    if (muted) p.mute();
    else p.unMute();
  }, [volume, muted, playerReady]);

  // Seek.
  useEffect(() => {
    const p = playerRef.current;
    if (!p || !playerReady || seekRequest === null) return;
    p.seekTo(seekRequest, true);
    setCurrentTime(seekRequest);
    clearSeek();
  }, [seekRequest, playerReady, clearSeek, setCurrentTime]);

  // Poll current time.
  useEffect(() => {
    if (!playerReady) return;
    const id = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      try {
        const t = p.getCurrentTime?.();
        const d = p.getDuration?.();
        if (typeof t === "number" && isFinite(t)) setCurrentTime(t);
        if (typeof d === "number" && d > 0) setDuration(d);
      } catch {}
    }, 250);
    return () => clearInterval(id);
  }, [playerReady, setCurrentTime, setDuration]);

  return null;
}
