// Window manager store — tracks open windows, their positions, sizes, and state.
import { create } from "zustand";

export interface OSWindow {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  // Saved bounds for restoring from maximized.
  savedBounds?: { x: number; y: number; width: number; height: number };
}

interface WindowStore {
  windows: OSWindow[];
  topZ: number;
  activeId: string | null;

  open: (appId: string, title: string, opts?: Partial<Pick<OSWindow, "width" | "height" | "x" | "y">>) => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, width: number, height: number) => void;
  setBounds: (id: string, bounds: Partial<Pick<OSWindow, "x" | "y" | "width" | "height">>) => void;
  restore: (id: string) => void;
}

let idCounter = 0;
function genId() {
  idCounter += 1;
  return `win_${Date.now().toString(36)}_${idCounter}`;
}

export const useWindows = create<WindowStore>((set, get) => ({
  windows: [],
  topZ: 10,
  activeId: null,

  open: (appId, title, opts) => {
    const existing = get().windows.find((w) => w.appId === appId);
    if (existing) {
      // Focus existing window.
      get().focus(existing.id);
      if (existing.minimized) get().restore(existing.id);
      return;
    }
    const id = genId();
    const z = get().topZ + 1;
    const w = opts?.width ?? 720;
    const h = opts?.height ?? 480;
    // Center-ish with a slight cascade.
    const offset = (get().windows.length % 6) * 28;
    const x = opts?.x ?? Math.max(40, (window.innerWidth - w) / 2 + offset);
    const y = opts?.y ?? Math.max(40, (window.innerHeight - h) / 2 - 40 + offset);
    set((s) => ({
      windows: [
        ...s.windows,
        {
          id,
          appId,
          title,
          x,
          y,
          width: w,
          height: h,
          zIndex: z,
          minimized: false,
          maximized: false,
        },
      ],
      topZ: z,
      activeId: id,
    }));
  },

  close: (id) =>
    set((s) => ({
      windows: s.windows.filter((w) => w.id !== id),
      activeId: s.activeId === id ? null : s.activeId,
    })),

  focus: (id) =>
    set((s) => {
      const z = s.topZ + 1;
      return {
        windows: s.windows.map((w) =>
          w.id === id ? { ...w, zIndex: z, minimized: false } : w,
        ),
        topZ: z,
        activeId: id,
      };
    }),

  minimize: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, minimized: true } : w,
      ),
      activeId: s.activeId === id ? null : s.activeId,
    })),

  restore: (id) => {
    get().focus(id);
  },

  toggleMaximize: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id) return w;
        if (w.maximized && w.savedBounds) {
          return { ...w, maximized: false, ...w.savedBounds, savedBounds: undefined };
        }
        return {
          ...w,
          maximized: true,
          savedBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
        };
      }),
    })),

  move: (id, x, y) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    })),

  resize: (id, width, height) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, width, height } : w,
      ),
    })),

  setBounds: (id, bounds) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, ...bounds } : w)),
    })),
}));
