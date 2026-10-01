"use client";

import { useWindows } from "@/store/windows";
import { APPS } from "@/apps/registry";
import { cn } from "@/lib/utils";

export function Dock() {
  const { open, windows, activeId, focus, minimize } = useWindows();

  const isOpen = (appId: string) => windows.some((w) => w.appId === appId);
  const isActive = (appId: string) =>
    windows.some((w) => w.appId === appId && w.id === activeId && !w.minimized);

  const handleClick = (appId: string, name: string) => {
    const app = APPS.find((a) => a.id === appId)!;
    const existing = windows.find((w) => w.appId === appId);
    if (existing) {
      // Toggle: if active, minimize; otherwise focus.
      if (existing.id === activeId && !existing.minimized) {
        minimize(existing.id);
      } else {
        focus(existing.id);
      }
    } else {
      open(appId, name, { width: app.defaultWidth, height: app.defaultHeight });
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-2 left-1/2 z-[9000] -translate-x-1/2">
      <div className="pointer-events-auto flex items-end gap-1.5 rounded-2xl border border-white/10 bg-black/40 px-2 py-2 backdrop-blur-2xl">
        {APPS.map((app) => {
          const Icon = app.icon;
          const open_ = isOpen(app.id);
          const active = isActive(app.id);
          return (
            <button
              key={app.id}
              onClick={() => handleClick(app.id, app.name)}
              className={cn(
                "group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all hover:scale-110 hover:-translate-y-1",
                active && "scale-105 -translate-y-0.5",
              )}
              title={app.name}
              aria-label={app.name}
            >
              <div
                className="flex h-full w-full items-center justify-center rounded-xl text-white shadow-lg"
                style={{ background: app.iconBg }}
              >
                <Icon className="h-5 w-5" />
              </div>
              {/* Active indicator dot */}
              {open_ && (
                <div
                  className={cn(
                    "absolute -bottom-1 h-1 w-1 rounded-full bg-white transition-opacity",
                    active ? "opacity-100" : "opacity-40",
                  )}
                />
              )}
              {/* Tooltip */}
              <div className="pointer-events-none absolute -top-8 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                {app.name}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
