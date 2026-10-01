// Player store: current track, queue, playback state, shuffle/repeat.
// Audio is driven by the YouTube IFrame API (see PlayerAudio component).
// This store owns *state* only — the IFrame player reads from us and reports
// state changes back to us.

import { create } from "zustand";
import type { YTMTrack, RepeatMode } from "@/lib/ytm/types";

interface PlayerState {
  queue: YTMTrack[];
  currentIndex: number;
  shuffleOrder: number[] | null;
  repeat: RepeatMode;

  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;

  // When non-null, the player should seek to this position and clear it.
  seekRequest: number | null;

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
  clearSeek: () => void;
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
  setNowPlayingOpen: (open: boolean) => void;
  setQueueOpen: (open: boolean) => void;

  currentTrack: () => YTMTrack | null;
  effectiveIndex: () => number;
  effectiveList: () => YTMTrack[];
}

function shuffleArray(n: number, except: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
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
  seekRequest: null,
  nowPlayingOpen: false,
  queueOpen: false,

  playTracks: (tracks, startIndex = 0) => {
    if (!tracks.length) return;
    set({
      queue: tracks,
      currentIndex: startIndex,
      isPlaying: true,
      currentTime: 0,
      seekRequest: null,
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
      seekRequest: null,
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
      // Loop the current track: seek to 0 and keep playing.
      set({ seekRequest: 0, currentTime: 0, isPlaying: true });
      return;
    }
    if (idx + 1 < list.length) {
      const nextTrack = list[idx + 1];
      const nextIdx = get().queue.indexOf(nextTrack);
      set({ currentIndex: nextIdx, currentTime: 0, isPlaying: true });
    } else if (repeat === "all" && list.length) {
      const nextTrack = list[0];
      const nextIdx = get().queue.indexOf(nextTrack);
      set({ currentIndex: nextIdx, currentTime: 0, isPlaying: true });
    } else {
      set({ isPlaying: false, currentTime: 0 });
    }
  },

  prev: () => {
    const { effectiveList, effectiveIndex, currentTime } = get();
    if (currentTime > 3) {
      set({ seekRequest: 0, currentTime: 0 });
      return;
    }
    const list = effectiveList();
    const idx = effectiveIndex();
    if (idx - 1 >= 0) {
      const prevTrack = list[idx - 1];
      const prevIdx = get().queue.indexOf(prevTrack);
      set({ currentIndex: prevIdx, currentTime: 0, isPlaying: true });
    } else {
      set({ seekRequest: 0, currentTime: 0 });
    }
  },

  seek: (seconds) => set({ currentTime: seconds, seekRequest: seconds }),
  clearSeek: () => set({ seekRequest: null }),
  setCurrentTime: (seconds) => set({ currentTime: seconds }),
  setDuration: (seconds) => set({ duration: seconds }),

  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)), muted: v === 0 }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),

  toggleShuffle: () =>
    set((s) => {
      if (s.shuffleOrder) return { shuffleOrder: null };
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
      const curTrack = s.queue[s.currentIndex];
      const newIdx = queue.indexOf(curTrack);
      let shuffleOrder = s.shuffleOrder;
      if (shuffleOrder) {
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
