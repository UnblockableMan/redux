"use client";

import { useOSSettings, WALLPAPERS } from "@/store/os-settings";
import { APPS } from "@/apps/registry";
import { useWindows } from "@/store/windows";

export function Desktop() {
  const wallpaper = useOSSettings((s) => s.wallpaper);
  const { open } = useWindows();
  const wp = WALLPAPERS.find((w) => w.id === wallpaper) ?? WALLPAPERS[0];

  // Desktop shows the first 6 apps as double-click icons.
  const desktopApps = APPS.slice(0, 6);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: wp.css }}>
      {/* Subtle grain / vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.25) 100%)",
        }}
      />

      {/* Desktop icons (top-right cluster) */}
      <div className="absolute right-4 top-12 flex flex-col flex-wrap gap-1">
        {desktopApps.map((app) => {
          const Icon = app.icon;
          return (
            <button
              key={app.id}
              onDoubleClick={() =>
                open(app.id, app.name, { width: app.defaultWidth, height: app.defaultHeight })
              }
              className="group flex w-20 flex-col items-center gap-1 rounded-lg p-2 transition-colors hover:bg-white/10"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg"
                style={{ background: app.iconBg }}
              >
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-center text-[11px] font-medium text-white drop-shadow-md">
                {app.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
