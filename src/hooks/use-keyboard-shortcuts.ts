"use client";

import { useEffect } from "react";
import { usePlayer } from "@/store/player";
import { useNav } from "@/store/nav";

/**
 * Global keyboard shortcuts.
 *   Space            play / pause
 *   ArrowRight       next track
 *   ArrowLeft        previous track
 *   ArrowUp          volume up
 *   ArrowDown        volume down
 *   Shift+ArrowRight seek +10s
 *   Shift+ArrowLeft  seek -10s
 *   M                mute toggle
 *   S                shuffle toggle
 *   R                repeat cycle
 *   Q                toggle queue
 *   Escape           close now playing / queue
 *
 * Shortcuts are ignored when focus is in an input, textarea, or contenteditable
 * element so typing a search query isn't hijacked.
 */
export function useKeyboardShortcuts() {
  const togglePlay = usePlayer((s) => s.togglePlay);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seek = usePlayer((s) => s.seek);
  const currentTime = usePlayer((s) => s.currentTime);
  const setVolume = usePlayer((s) => s.setVolume);
  const volume = usePlayer((s) => s.volume);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const setQueueOpen = usePlayer((s) => s.setQueueOpen);
  const setNowPlayingOpen = usePlayer((s) => s.setNowPlayingOpen);
  const queueOpen = usePlayer((s) => s.queueOpen);
  const nowPlayingOpen = usePlayer((s) => s.nowPlayingOpen);
  const back = useNav((s) => s.back);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        if (
          tag === "input" ||
          tag === "textarea" ||
          target.isContentEditable ||
          tag === "select"
        ) {
          return;
        }
      }

      switch (e.key) {
        case " ":
        case "Spacebar":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          if (e.shiftKey) {
            e.preventDefault();
            seek(currentTime + 10);
          } else {
            e.preventDefault();
            next();
          }
          break;
        case "ArrowLeft":
          if (e.shiftKey) {
            e.preventDefault();
            seek(Math.max(0, currentTime - 10));
          } else {
            e.preventDefault();
            prev();
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.05));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.05));
          break;
        case "m":
        case "M":
          toggleMute();
          break;
        case "s":
        case "S":
          toggleShuffle();
          break;
        case "r":
        case "R":
          cycleRepeat();
          break;
        case "q":
        case "Q":
          setQueueOpen(!queueOpen);
          break;
        case "Escape":
          if (nowPlayingOpen) setNowPlayingOpen(false);
          else if (queueOpen) setQueueOpen(false);
          else back();
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    togglePlay,
    next,
    prev,
    seek,
    currentTime,
    setVolume,
    volume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    setQueueOpen,
    setNowPlayingOpen,
    queueOpen,
    nowPlayingOpen,
    back,
  ]);
}
