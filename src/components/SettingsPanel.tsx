"use client";

import { X, Palette, Server, Eye, Info, Layout, Wallpaper, Puzzle, Trash2 } from "lucide-react";
import { useSettings, THEMES, WALLPAPERS, type ThemeId, type WallpaperId, type ToolbarPos } from "@/store/settings";
import { useNav } from "@/store/nav";
import { cn } from "@/lib/utils";

const CLOAK_PRESETS = [
  { title: "", icon: "", label: "None" },
  { title: "Google", icon: "https://google.com/favicon.ico", label: "Google" },
  { title: "My Drive - Google Drive", icon: "https://drive.google.com/favicon.ico", label: "Drive" },
  { title: "Classes", icon: "https://classroom.google.com/favicon.ico", label: "Classroom" },
  { title: "Gmail", icon: "https://mail.google.com/favicon.ico", label: "Gmail" },
  { title: "docs.google.com", icon: "https://docs.google.com/favicon.ico", label: "Docs" },
];

const TOOLBAR_POSITIONS: { id: ToolbarPos; label: string }[] = [
  { id: "top", label: "Top" },
  { id: "left", label: "Left" },
  { id: "right", label: "Right" },
  { id: "bottom", label: "Bottom" },
];

export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useSettings();
  const setView = useNav((state) => state.setView);

  return (
    <>
      <div className={cn("fixed inset-0 z-[60] bg-black/60 transition-opacity", open ? "opacity-100" : "pointer-events-none opacity-0")} onClick={onClose} />
      <div
        className={cn("fixed right-0 top-0 z-[61] flex h-full w-full max-w-sm flex-col border-l transition-transform duration-300", open ? "translate-x-0" : "translate-x-full")}
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:surface2" aria-label="Close"><X className="h-5 w-5" style={{ color: "var(--text-muted)" }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Theme */}
          <Section icon={<Palette className="h-4 w-4" />} title="Theme">
            <div className="grid grid-cols-4 gap-2">
              {THEMES.map((t) => (
                <button key={t.id} onClick={() => s.setTheme(t.id as ThemeId)} className={cn("flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all", s.theme === t.id ? "scale-105" : "opacity-60 hover:opacity-100")} style={{ borderColor: s.theme === t.id ? t.accent : "transparent", background: t.bg }} title={t.label}>
                  <div className="flex gap-1"><span className="h-4 w-4 rounded" style={{ background: t.text }} /><span className="h-4 w-4 rounded" style={{ background: t.accent }} /></div>
                  <span className="text-[9px]" style={{ color: t.text }}>{t.label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Wallpaper */}
          <Section icon={<Wallpaper className="h-4 w-4" />} title="Wallpaper">
            <div className="grid grid-cols-4 gap-2">
              {WALLPAPERS.map((w) => (
                <button key={w.id} onClick={() => s.setWallpaper(w.id as WallpaperId)} className={cn("flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all", s.wallpaper === w.id ? "scale-105" : "opacity-60 hover:opacity-100")} style={{ borderColor: s.wallpaper === w.id ? "var(--accent)" : "transparent", background: "var(--bg)" }}>
                  <div className="h-8 w-full rounded" style={{ background: "var(--surface2)" }} />
                  <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{w.label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Toolbar */}
          <Section icon={<Layout className="h-4 w-4" />} title="Toolbar Position">
            <div className="grid grid-cols-4 gap-2">
              {TOOLBAR_POSITIONS.map((p) => (
                <button key={p.id} onClick={() => s.setToolbarPos(p.id)} className={cn("rounded-lg border py-2 text-xs transition-all", s.toolbarPos === p.id ? "scale-105" : "opacity-60 hover:opacity-100")} style={{ borderColor: s.toolbarPos === p.id ? "var(--accent)" : "var(--border)", background: s.toolbarPos === p.id ? "var(--surface2)" : "transparent", color: s.toolbarPos === p.id ? "var(--accent)" : "var(--text-muted)" }}>
                  {p.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Proxy */}
          <Section icon={<Server className="h-4 w-4" />} title="Proxy (Wisp)">
            <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>Wisp endpoint for Scramjet. Replace with your own for reliability.</p>
            <input value={s.wispUrl} onChange={(e) => s.setWispUrl(e.target.value)} placeholder="wss://your-wisp:443" className="w-full rounded-lg border bg-transparent px-3 py-2 font-mono text-xs outline-none" style={{ borderColor: "var(--border)", color: "var(--text)" }} spellCheck={false} />
          </Section>

          {/* Tab cloak */}
          <Section icon={<Eye className="h-4 w-4" />} title="Tab Cloak">
            <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>Disguise this tab.</p>
            <div className="grid grid-cols-3 gap-2">
              {CLOAK_PRESETS.map((c) => {
                const active = s.cloakTitle === c.title;
                return (
                  <button key={c.label} onClick={() => s.setCloak(c.title, c.icon)} className={cn("flex items-center gap-1.5 rounded-lg border px-2 py-2 text-xs transition-all", active ? "border-current" : "opacity-60 hover:opacity-100")} style={{ borderColor: active ? "var(--accent)" : "var(--border)" }}>
                    {c.icon ? <img src={c.icon} alt="" className="h-4 w-4" /> : <span className="h-4 w-4" />}
                    <span className="truncate">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Extensions */}
          <Section icon={<Puzzle className="h-4 w-4" />} title="Extensions">
            {s.extensions.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No extensions installed.</p>
            ) : (
              <div className="space-y-1">
                {s.extensions.map((ext) => (
                  <div key={ext.id} className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs" style={{ borderColor: "var(--border)" }}>
                    <span>{ext.icon}</span>
                    <span className="flex-1 truncate">{ext.name}</span>
                    <button onClick={() => s.removeExtension(ext.id)} className="rounded p-1 hover:surface2"><Trash2 className="h-3 w-3" style={{ color: "#ef4444" }} /></button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => { setView("extensions"); onClose(); }} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm transition-colors hover:surface2" style={{ borderColor: "var(--border)" }}>Manage extensions</button>
          </Section>

          {/* Setup */}
          <Section icon={<Info className="h-4 w-4" />} title="Setup">
            <button onClick={() => { s.setSetupDone(true); setView("setup"); onClose(); }} className="w-full rounded-lg border px-3 py-2 text-sm transition-colors hover:surface2" style={{ borderColor: "var(--border)" }}>Open setup guide</button>
            <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>Status: {s.setupDone ? "Completed" : "Not completed"}</div>
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}>{icon}{title}</div>
      {children}
    </section>
  );
}
