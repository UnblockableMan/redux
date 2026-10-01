"use client";

import { useRef, useCallback, type ReactNode } from "react";
import { X, Minus, Square, Copy } from "lucide-react";
import { useWindows, type OSWindow } from "@/store/windows";
import { cn } from "@/lib/utils";

interface WindowFrameProps {
  win: OSWindow;
  children: ReactNode;
}

export function WindowFrame({ win, children }: WindowFrameProps) {
  const { focus, close, minimize, toggleMaximize, move, resize } = useWindows();
  const dragState = useRef<{
    mode: "move" | "resize" | null;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  }>({ mode: null, startX: 0, startY: 0, origX: 0, origY: 0, origW: 0, origH: 0 });

  const onPointerDownMove = useCallback(
    (e: React.PointerEvent) => {
      if (win.maximized) return;
      if ((e.target as HTMLElement).closest("button")) return;
      focus(win.id);
      dragState.current = {
        mode: "move",
        startX: e.clientX,
        startY: e.clientY,
        origX: win.x,
        origY: win.y,
        origW: win.width,
        origH: win.height,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [win.id, win.x, win.y, win.width, win.height, win.maximized, focus],
  );

  const onPointerDownResize = useCallback(
    (e: React.PointerEvent) => {
      if (win.maximized) return;
      e.stopPropagation();
      focus(win.id);
      dragState.current = {
        mode: "resize",
        startX: e.clientX,
        startY: e.clientY,
        origX: win.x,
        origY: win.y,
        origW: win.width,
        origH: win.height,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [win.id, win.x, win.y, win.width, win.height, win.maximized, focus],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const ds = dragState.current;
      if (!ds.mode) return;
      const dx = e.clientX - ds.startX;
      const dy = e.clientY - ds.startY;
      if (ds.mode === "move") {
        const newX = Math.max(0, Math.min(window.innerWidth - 80, ds.origX + dx));
        const newY = Math.max(0, Math.min(window.innerHeight - 60, ds.origY + dy));
        move(win.id, newX, newY);
      } else if (ds.mode === "resize") {
        const newW = Math.max(320, ds.origW + dx);
        const newH = Math.max(240, ds.origH + dy);
        resize(win.id, newW, newH);
      }
    },
    [win.id, move, resize],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (dragState.current.mode) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
    dragState.current.mode = null;
  }, []);

  if (win.minimized) return null;

  const style: React.CSSProperties = win.maximized
    ? {
        left: 0,
        top: 0,
        width: "100vw",
        height: "calc(100vh - 56px)",
        zIndex: win.zIndex,
      }
    : {
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex,
      };

  return (
    <div
      className={cn(
        "absolute flex flex-col overflow-hidden rounded-xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur-2xl",
        "ring-1 ring-black/20",
      )}
      style={style}
      onPointerDown={() => focus(win.id)}
    >
      {/* Title bar */}
      <div
        className="flex h-9 flex-none items-center gap-2 border-b border-white/10 bg-white/5 px-3 select-none"
        onPointerDown={onPointerDownMove}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={() => toggleMaximize(win.id)}
      >
        {/* Traffic-light buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              close(win.id);
            }}
            className="group flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#ff5f57] transition-colors hover:bg-[#ff5f57]"
            aria-label="Close"
          >
            <X className="h-2 w-2 text-black/60 opacity-0 group-hover:opacity-100" strokeWidth={3} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              minimize(win.id);
            }}
            className="group flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#febc2e] transition-colors"
            aria-label="Minimize"
          >
            <Minus className="h-2 w-2 text-black/60 opacity-0 group-hover:opacity-100" strokeWidth={3} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMaximize(win.id);
            }}
            className="group flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#28c840] transition-colors"
            aria-label="Maximize"
          >
            {win.maximized ? (
              <Copy className="h-2 w-2 text-black/60 opacity-0 group-hover:opacity-100" strokeWidth={3} />
            ) : (
              <Square className="h-2 w-2 text-black/60 opacity-0 group-hover:opacity-100" strokeWidth={3} />
            )}
          </button>
        </div>
        <div className="flex-1 truncate text-center text-xs font-medium text-muted-foreground">
          {win.title}
        </div>
        <div className="w-12" />
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-hidden bg-background">
        {children}
      </div>

      {/* Resize handle */}
      {!win.maximized && (
        <div
          className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
          onPointerDown={onPointerDownResize}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div className="absolute bottom-1 right-1 h-2 w-2 border-b-2 border-r-2 border-white/20" />
        </div>
      )}
    </div>
  );
}
