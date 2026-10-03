// View router — which app is currently active.
import { create } from "zustand";

export type View = "home" | "games" | "browser" | "anime" | "extensions" | "links" | "tools" | "setup";

interface NavState {
  view: View;
  setView: (v: View) => void;
}

export const useNav = create<NavState>((set) => ({
  view: "home",
  setView: (view) => set({ view }),
}));
