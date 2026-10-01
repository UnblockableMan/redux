"use client";

import { useOSSettings, WALLPAPERS, ACCENTS } from "@/store/os-settings";
import { useWindows } from "@/store/windows";
import { toast } from "sonner";
import { Trash2, Info } from "lucide-react";

export function SettingsApp() {
  const { wallpaper, accent, reducedMotion, setWallpaper, setAccent, setReducedMotion } = useOSSettings();
  const { windows, close } = useWindows();

  const clearAllData = () => {
    if (!confirm("Clear all local data? This includes library, playlists, and files.")) return;
    localStorage.clear();
    toast.success("All data cleared", { description: "Reloading…" });
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div className="h-full overflow-y-auto bg-background p-6">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      {/* Wallpaper */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">Wallpaper</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {WALLPAPERS.map((w) => (
            <button
              key={w.id}
              onClick={() => setWallpaper(w.id)}
              className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                wallpaper === w.id ? "border-primary scale-105" : "border-transparent hover:border-white/20"
              }`}
              style={{ background: w.css }}
              title={w.label}
            >
              <span className="absolute bottom-1 left-1 right-1 truncate text-[10px] text-white/80">
                {w.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Accent color */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">Accent Color</h2>
        <div className="flex gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAccent(a.id)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                accent === a.id ? "scale-110 border-white" : "border-transparent hover:scale-105"
              }`}
              style={{ background: a.color }}
              title={a.label}
            >
              {accent === a.id && <span className="text-white text-xs">✓</span>}
            </button>
          ))}
        </div>
      </section>

      {/* Behavior */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">Behavior</h2>
        <label className="flex items-center justify-between border-b border-white/5 py-3">
          <div>
            <div className="text-sm">Reduced motion</div>
            <div className="text-xs text-muted-foreground">Disable animations and transitions</div>
          </div>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
            className="h-5 w-5 accent-primary"
          />
        </label>
      </section>

      {/* Open windows */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Open Windows ({windows.length})
        </h2>
        {windows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No windows open.</p>
        ) : (
          <div className="space-y-1">
            {windows.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-white/5">
                <span>{w.title}</span>
                <button
                  onClick={() => close(w.id)}
                  className="rounded px-2 py-0.5 text-xs text-destructive hover:bg-destructive/10"
                >
                  Close
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Data */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">Data</h2>
        <button
          onClick={clearAllData}
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive hover:bg-destructive/20"
        >
          <Trash2 className="h-4 w-4" /> Clear all local data
        </button>
      </section>

      {/* About */}
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">About</h2>
        <div className="flex items-center gap-3 rounded-lg bg-white/5 p-4">
          <img src="/logo.svg" alt="" className="h-10 w-10" />
          <div>
            <div className="font-semibold">abroad OS 1.0</div>
            <div className="text-xs text-muted-foreground">A web desktop. No backend, no account, no corporate slop.</div>
          </div>
        </div>
      </section>
    </div>
  );
}
