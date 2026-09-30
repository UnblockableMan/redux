// Player store: current track, queue, playback state, shuffle/repeat.
// Audio is rendered by a single hidden <audio> element (see PlayerAudio).
// This store only owns *state* — the audio element reads from us and reports
// timeupdates back to us.

import { create } from "zustand";
import type { YTMTrack, RepeatMode } from "@/lib/ytm/types";

interface PlayerState {
  // Queue (in original order; shuffle uses a separate index list).
  queue: YTMTrack[];
  currentIndex: number; // index into `queue`
  shuffleOrder: number[] | null; // when not null, plays in this order
  repeat: RepeatMode;

  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;

  // Resolved stream URL + its source (for toasts / debugging).
  streamUrl: string | null;
  streamSource: string | null;

  // Show the full-screen Now Playing panel.
  nowPlayingOpen: boolean;
  queueOpen: boolean;

  // Actions
  playTracks: (tracks: YTMTrack[], startIndex?: number) => void;
  playTrackAt: (index: number) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setCurrentTime: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  setBuffering: (b: boolean) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  reorderQueue: (from: number, to: number) => void;
  removeFromQueue: (index: number) => void;
  addToQueue: (track: YTMTrack, position?: "next" | "end") => void;
  setStream: (url: string | null, source: string | null) => void;
  setNowPlayingOpen: (open: boolean) => void;
  setQueueOpen: (open: boolean) => void;

  // The track currently being played (resolved from queue + index + shuffle).
  currentTrack: () => YTMTrack | null;
  // Index in shuffle order (or normal order) for "next/prev" math.
  effectiveIndex: () => number;
  effectiveList: () => YTMTrack[];
}

function shuffleArray(n: number, except: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Move `except` to the front so it plays first.
  const idx = arr.indexOf(except);
  if (idx > 0) {
    [arr[0], arr[idx]] = [arr[idx], arr[0]];
  }
  return arr;
}

export const usePlayer = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: 0,
  shuffleOrder: null,
  repeat: "off",
  isPlaying: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  volume: 0.85,
  muted: false,
  streamUrl: null,
  streamSource: null,
  nowPlayingOpen: false,
  queueOpen: false,

  playTracks: (tracks, startIndex = 0) => {
    if (!tracks.length) return;
    set({
      queue: tracks,
      currentIndex: startIndex,
      isPlaying: true,
      currentTime: 0,
      streamUrl: null,
      streamSource: null,
      shuffleOrder: get().shuffleOrder
        ? shuffleArray(tracks.length, startIndex)
        : null,
    });
  },

  playTrackAt: (index) => {
    set({
      currentIndex: index,
      isPlaying: true,
      currentTime: 0,
      streamUrl: null,
      streamSource: null,
    });
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setBuffering: (b) => set({ isBuffering: b }),

  next: () => {
    const { effectiveList, effectiveIndex, repeat } = get();
    const list = effectiveList();
    const idx = effectiveIndex();
    if (repeat === "one") {
      // Restart same track.
      set({ currentTime: 0, streamUrl: null, streamSource: null, isPlaying: true });
      return;
    }
    if (idx + 1 < list.length) {
      const nextTrack = list[idx + 1];
      const nextIdx = get().queue.indexOf(nextTrack);
      set({
        currentIndex: nextIdx,
        currentTime: 0,
        streamUrl: null,
        streamSource: null,
        isPlaying: true,
      });
    } else if (repeat === "all" && list.length) {
      const nextTrack = list[0];
      const nextIdx = get().queue.indexOf(nextTrack);
      set({
        currentIndex: nextIdx,
        currentTime: 0,
        streamUrl: null,
        streamSource: null,
        isPlaying: true,
      });
    } else {
      set({ isPlaying: false, currentTime: 0 });
    }
  },

  prev: () => {
    const { effectiveList, effectiveIndex, currentTime } = get();
    // If we're more than 3s into the track, restart instead of going back.
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }
    const list = effectiveList();
    const idx = effectiveIndex();
    if (idx - 1 >= 0) {
      const prevTrack = list[idx - 1];
      const prevIdx = get().queue.indexOf(prevTrack);
      set({
        currentIndex: prevIdx,
        currentTime: 0,
        streamUrl: null,
        streamSource: null,
        isPlaying: true,
      });
    } else {
      set({ currentTime: 0 });
    }
  },

  seek: (seconds) => set({ currentTime: seconds }),
  setCurrentTime: (seconds) => set({ currentTime: seconds }),
  setDuration: (seconds) => set({ duration: seconds }),

  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)), muted: v === 0 }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),

  toggleShuffle: () =>
    set((s) => {
      if (s.shuffleOrder) {
        // Turn shuffle off — keep playing the current track.
        return { shuffleOrder: null };
      }
      // Turn shuffle on, but make the current track play first.
      const cur = s.currentIndex;
      return { shuffleOrder: shuffleArray(s.queue.length, cur) };
    }),

  cycleRepeat: () =>
    set((s) => ({
      repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
    })),

  reorderQueue: (from, to) =>
    set((s) => {
      const queue = [...s.queue];
      const [moved] = queue.splice(from, 1);
      queue.splice(to, 0, moved);
      // Keep currentIndex pointing at the same track.
      const curTrack = s.queue[s.currentIndex];
      const newIdx = queue.indexOf(curTrack);
      let shuffleOrder = s.shuffleOrder;
      if (shuffleOrder) {
        // Rebuild shuffle order to match new queue positions.
        shuffleOrder = queue.map((_, i) => i);
        for (let i = shuffleOrder.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffleOrder[i], shuffleOrder[j]] = [shuffleOrder[j], shuffleOrder[i]];
        }
        shuffleOrder.unshift(shuffleOrder.splice(shuffleOrder.indexOf(newIdx), 1)[0]);
      }
      return { queue, currentIndex: newIdx, shuffleOrder };
    }),

  removeFromQueue: (index) =>
    set((s) => {
      const queue = [...s.queue];
      queue.splice(index, 1);
      let currentIndex = s.currentIndex;
      if (index < currentIndex) currentIndex--;
      if (queue.length === 0) currentIndex = 0;
      if (currentIndex >= queue.length) currentIndex = queue.length - 1;
      return { queue, currentIndex };
    }),

  addToQueue: (track, position = "end") =>
    set((s) => {
      if (position === "next") {
        const queue = [...s.queue];
        queue.splice(s.currentIndex + 1, 0, track);
        return { queue };
      }
      return { queue: [...s.queue, track] };
    }),

  setStream: (url, source) => set({ streamUrl: url, streamSource: source }),
  setNowPlayingOpen: (open) => set({ nowPlayingOpen: open }),
  setQueueOpen: (open) => set({ queueOpen: open }),

  currentTrack: () => {
    const { queue, currentIndex } = get();
    return queue[currentIndex] ?? null;
  },

  effectiveList: () => {
    const { queue, shuffleOrder } = get();
    if (!shuffleOrder) return queue;
    return shuffleOrder.map((i) => queue[i]).filter((t) => t);
  },

  effectiveIndex: () => {
    const { queue, currentIndex, shuffleOrder } = get();
    if (!shuffleOrder) return currentIndex;
    const pos = shuffleOrder.indexOf(currentIndex);
    return pos < 0 ? 0 : pos;
  },
}));
