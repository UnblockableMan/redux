// Navigation / view-router state.
// We deliberately keep everything in one client-side view (single `/` route)
// so the app exports cleanly to GitHub Pages as a static bundle.

import { create } from "zustand";

export type View =
  | { name: "home" }
  | { name: "search" }
  | { name: "library" }
  | { name: "album"; albumId: string }
  | { name: "artist"; artistId: string }
  | { name: "liked" }
  | { name: "playlist"; playlistId: string }
  | { name: "recently-played" };

interface NavState {
  view: View;
  history: View[];
  future: View[];
  go: (view: View) => void;
  back: () => void;
  forward: () => void;
  canBack: () => boolean;
  canForward: () => boolean;
}

export const useNav = create<NavState>((set, get) => ({
  view: { name: "home" },
  history: [],
  future: [],
  go: (view) =>
    set((s) => ({
      view,
      history: [...s.history, s.view],
      future: [],
    })),
  back: () => {
    const { history, view } = get();
    if (!history.length) return;
    const prev = history[history.length - 1];
    set({
      view: prev,
      history: history.slice(0, -1),
      future: [view, ...get().future],
    });
  },
  forward: () => {
    const { future, view } = get();
    if (!future.length) return;
    const next = future[0];
    set({
      view: next,
      history: [...get().history, view],
      future: future.slice(1),
    });
  },
  canBack: () => get().history.length > 0,
  canForward: () => get().future.length > 0,
}));
