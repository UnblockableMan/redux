"use client";

import { useState } from "react";
import { X, Palette, Server, Eye, Info, Layout, Wallpaper, Puzzle, Trash2, Trophy, ClipboardList, Film, Ghost, Wifi, RotateCcw, Database, Search } from "lucide-react";
import { useSettings, THEMES, WALLPAPERS, VIDEO_WALLPAPERS, ACHIEVEMENTS, type ThemeId, type WallpaperId, type VideoWallpaperId, type ToolbarPos } from "@/store/settings";
import { useNav } from "@/store/nav";
import { withBase } from "@/lib/base";
import { toast } from "sonner";
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

type Tab = "appearance" | "proxy" | "cloak" | "extensions" | "achievements" | "playback" | "more";

const TABS: { id: Tab; label: string; icon: typeof Palette }[] = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "playback", label: "Playback", icon: Film },
  { id: "proxy", label: "Proxy", icon: Server },
  { id: "cloak", label: "Cloak", icon: Eye },
  { id: "extensions", label: "Extensions", icon: Puzzle },
  { id: "achievements", label: "Achievements", icon: Trophy },
  { id: "more", label: "More", icon: Info },
];

export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useSettings();
  const setView = useNav((state) => state.setView);
  const [tab, setTab] = useState<Tab>("appearance");
  const [wispTest, setWispTest] = useState<"idle" | "testing" | "ok" | "fail">("idle");

  // Open the whole app inside an about:blank cloaked window.
  const openAboutBlank = () => {
    const win = window.open("about:blank", "_blank");
    if (!win) {
      toast.error("Popup blocked", { description: "Allow popups to use about:blank." });
      return;
    }
    s.unlockAchievement("about-blank");
    const appUrl = withBase("");
    win.document.write(`<!DOCTYPE html><html><head><title>Home</title><link rel="icon" href="https://google.com/favicon.ico" /><style>*{margin:0;padding:0;box-sizing:border-box}html,body,iframe{width:100%;height:100%;border:0;overflow:hidden;background:#000}</style></head><body><iframe src="${appUrl}" allow="fullscreen; autoplay"></iframe></body></html>`);
    win.document.close();
  };

  // Probe a wisp server by opening a WebSocket to it.
  const testWisp = () => {
    if (!s.wispUrl.startsWith("wss://") && !s.wispUrl.startsWith("ws://")) {
      toast.error("Invalid wisp URL", { description: "It should start with wss://" });
      return;
    }
    setWispTest("testing");
    s.unlockAchievement("proxy-test");
    let settled = false;
    try {
      const ws = new WebSocket(s.wispUrl, "wisp");
      const timer = setTimeout(() => {
        if (!settled) { settled = true; ws.close(); setWispTest("fail"); }
      }, 8000);
      ws.onopen = () => { if (!settled) { settled = true; clearTimeout(timer); ws.close(); setWispTest("ok"); toast.success("Wisp server reachable"); } };
      ws.onerror = () => { if (!settled) { settled = true; clearTimeout(timer); setWispTest("fail"); } };
      ws.onclose = () => { if (!settled) { settled = true; clearTimeout(timer); setWispTest("fail"); } };
    } catch {
      setWispTest("fail");
    }
  };

  return (
    <>
      <div className={cn("fixed inset-0 z-[60] bg-black/60 transition-opacity", open ? "opacity-100" : "pointer-events-none opacity-0")} onClick={onClose} />
      <div
        className={cn("fixed right-0 top-0 z-[61] flex h-full w-full max-w-md flex-col border-l transition-transform duration-300", open ? "translate-x-0" : "translate-x-full")}
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:surface2" aria-label="Close"><X className="h-5 w-5" style={{ color: "var(--text-muted)" }} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b px-3 py-2" style={{ borderColor: "var(--border)" }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex flex-none items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors")} style={{ background: active ? "var(--surface2)" : "transparent", color: active ? "var(--accent)" : "var(--text-muted)" }}>
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Appearance */}
          {tab === "appearance" && (
            <>
              <Section icon={<Palette className="h-4 w-4" />} title="Theme">
                <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>{THEMES.length} themes — pick your vibe.</p>
                <div className="grid grid-cols-4 gap-2">
                  {THEMES.map((t) => (
                    <button key={t.id} onClick={() => { s.setTheme(t.id as ThemeId); s.unlockAchievement("theme-changer"); }} className={cn("flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all", s.theme === t.id ? "scale-105" : "opacity-60 hover:opacity-100")} style={{ borderColor: s.theme === t.id ? t.accent : "transparent", background: t.bg }} title={t.label}>
                      <div className="flex gap-1"><span className="h-4 w-4 rounded" style={{ background: t.text }} /><span className="h-4 w-4 rounded" style={{ background: t.accent }} /></div>
                      <span className="text-[9px]" style={{ color: t.text }}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </Section>
              <Section icon={<Wallpaper className="h-4 w-4" />} title="Wallpaper">
                <div className="grid grid-cols-5 gap-2">
                  {WALLPAPERS.map((w) => (
                    <button key={w.id} onClick={() => { s.setWallpaper(w.id as WallpaperId); s.unlockAchievement("wallpaper-set"); }} className={cn("flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all", s.wallpaper === w.id ? "scale-105" : "opacity-60 hover:opacity-100")} style={{ borderColor: s.wallpaper === w.id ? "var(--accent)" : "transparent", background: "var(--bg)" }}>
                      <div className="h-6 w-full rounded" style={{ background: "var(--surface2)" }} />
                      <span className="text-[8px]" style={{ color: "var(--text-muted)" }}>{w.label}</span>
                    </button>
                  ))}
                </div>
              </Section>
              <Section icon={<Film className="h-4 w-4" />} title="Video Wallpaper">
                <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>Looping video behind the UI. Sources: cineosweb.</p>
                <div className="grid grid-cols-5 gap-2">
                  {VIDEO_WALLPAPERS.map((v) => (
                    <button key={v.id} onClick={() => { s.setVideoWallpaper(v.id as VideoWallpaperId); if (v.id !== "none") s.unlockAchievement("video-wallpaper"); }} className={cn("flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all", s.videoWallpaper === v.id ? "scale-105" : "opacity-60 hover:opacity-100")} style={{ borderColor: s.videoWallpaper === v.id ? "var(--accent)" : "transparent", background: "var(--bg)" }}>
                      <Film className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                      <span className="truncate text-[8px]" style={{ color: "var(--text-muted)" }}>{v.label}</span>
                    </button>
                  ))}
                </div>
                {s.videoWallpaper === "custom" && (
                  <input
                    value={s.customVideoUrl}
                    onChange={(e) => s.setCustomVideoUrl(e.target.value)}
                    placeholder="https://example.com/background.mp4"
                    className="mt-2 w-full rounded-lg border bg-transparent px-3 py-2 font-mono text-xs outline-none"
                    style={{ borderColor: "var(--border)", color: "var(--text)" }}
                    spellCheck={false}
                  />
                )}
              </Section>
              <Section icon={<Layout className="h-4 w-4" />} title="Toolbar Position">
                <div className="grid grid-cols-4 gap-2">
                  {TOOLBAR_POSITIONS.map((p) => (
                    <button key={p.id} onClick={() => { s.setToolbarPos(p.id); s.unlockAchievement("toolbar-moved"); }} className={cn("rounded-lg border py-2 text-xs transition-all", s.toolbarPos === p.id ? "scale-105" : "opacity-60 hover:opacity-100")} style={{ borderColor: s.toolbarPos === p.id ? "var(--accent)" : "var(--border)", background: s.toolbarPos === p.id ? "var(--surface2)" : "transparent", color: s.toolbarPos === p.id ? "var(--accent)" : "var(--text-muted)" }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </Section>
            </>
          )}

          {/* Playback */}
          {tab === "playback" && (
            <>
              <Section icon={<Film className="h-4 w-4" />} title="Anime Playback">
                <label className="mb-3 flex items-center justify-between gap-3 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--border)" }}>
                  <span>
                    <div className="font-medium">Auto-skip intro</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Jump past the opening automatically when available.</div>
                  </span>
                  <input
                    type="checkbox"
                    checked={s.autoSkipIntro}
                    onChange={(e) => s.setAutoSkipIntro(e.target.checked)}
                    className="h-4 w-4"
                  />
                </label>
                <label className="mb-3 flex items-center justify-between gap-3 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--border)" }}>
                  <span>
                    <div className="font-medium">Auto-play next episode</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Show a "Play next" card at the end of each episode.</div>
                  </span>
                  <input
                    type="checkbox"
                    checked={s.autoPlayNext}
                    onChange={(e) => s.setAutoPlayNext(e.target.checked)}
                    className="h-4 w-4"
                  />
                </label>
                <label className="mb-3 flex items-center justify-between gap-3 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--border)" }}>
                  <span>
                    <div className="font-medium">Prefer dub</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Default to English dub when available (toggle still appears in player).</div>
                  </span>
                  <input
                    type="checkbox"
                    checked={s.preferDub}
                    onChange={(e) => s.setPreferDub(e.target.checked)}
                    className="h-4 w-4"
                  />
                </label>
              </Section>
              <Section icon={<Search className="h-4 w-4" />} title="Default Search Engine">
                <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>Used by the Browser start page and the address bar.</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: "duckduckgo", label: "DuckDuckGo", url: "https://duckduckgo.com" },
                    { id: "google", label: "Google", url: "https://google.com" },
                    { id: "bing", label: "Bing", url: "https://bing.com" },
                    { id: "startpage", label: "Startpage", url: "https://startpage.com" },
                    { id: "brave", label: "Brave", url: "https://search.brave.com" },
                  ] as const).map((e) => (
                    <button
                      key={e.id}
                      onClick={() => s.setSearchEngine(e.id)}
                      className={cn("rounded-lg border px-3 py-2 text-xs transition-all", s.searchEngine === e.id ? "scale-105" : "opacity-60 hover:opacity-100")}
                      style={{ borderColor: s.searchEngine === e.id ? "var(--accent)" : "var(--border)" }}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </Section>
              <Section icon={<Film className="h-4 w-4" />} title="Default Quality">
                <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>Used by the anime player when the host exposes quality options.</p>
                <div className="grid grid-cols-5 gap-2">
                  {(["auto", "1080", "720", "480", "360"] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => s.setDefaultQuality(q)}
                      className={cn("rounded-lg border py-2 text-xs uppercase transition-all", s.defaultQuality === q ? "scale-105" : "opacity-60 hover:opacity-100")}
                      style={{ borderColor: s.defaultQuality === q ? "var(--accent)" : "var(--border)" }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </Section>
            </>
          )}

          {/* Proxy */}
          {tab === "proxy" && (
            <>
              <Section icon={<Server className="h-4 w-4" />} title="Wisp Endpoint">
                <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>Wisp endpoint for Scramjet. If the default is blocked on your network, pick another or run your own.</p>
                <input value={s.wispUrl} onChange={(e) => { s.setWispUrl(e.target.value); setWispTest("idle"); }} placeholder="wss://your-wisp:443" className="w-full rounded-lg border bg-transparent px-3 py-2 font-mono text-xs outline-none" style={{ borderColor: "var(--border)", color: "var(--text)" }} spellCheck={false} />
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={testWisp} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors hover:surface2" style={{ borderColor: "var(--border)" }}>
                    <Wifi className="h-3.5 w-3.5" /> Test connection
                  </button>
                  {wispTest === "testing" && <span className="text-xs" style={{ color: "var(--text-muted)" }}>Testing…</span>}
                  {wispTest === "ok" && <span className="text-xs" style={{ color: "#22c55e" }}>Reachable ✓</span>}
                  {wispTest === "fail" && <span className="text-xs" style={{ color: "#ef4444" }}>Unreachable ✗</span>}
                </div>
                <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  Run your own: <code className="rounded px-1" style={{ background: "var(--surface2)" }}>npx @mercuryworkshop/wisp-server</code>
                </p>
              </Section>
              <Section icon={<Server className="h-4 w-4" />} title="Quick Presets">
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: "Mercury Workshop (default)", url: "wss://wisp.mercurywork.shop:443" },
                    { label: "Custom / self-hosted", url: "" },
                  ].map((p) => (
                    <button key={p.label} onClick={() => { if (p.url) { s.setWispUrl(p.url); setWispTest("idle"); } }} className={cn("rounded-lg border px-3 py-2 text-left text-xs transition-all", s.wispUrl === p.url ? "border-current" : "opacity-60 hover:opacity-100")} style={{ borderColor: s.wispUrl === p.url ? "var(--accent)" : "var(--border)" }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </Section>
            </>
          )}

          {/* Cloak */}
          {tab === "cloak" && (
            <>
              <Section icon={<Eye className="h-4 w-4" />} title="Tab Cloak">
                <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>Disguise this tab as another site.</p>
                <div className="grid grid-cols-3 gap-2">
                  {CLOAK_PRESETS.map((c) => {
                    const active = s.cloakTitle === c.title;
                    return (
                      <button key={c.label} onClick={() => { s.setCloak(c.title, c.icon); if (c.title) s.unlockAchievement("cloaked"); }} className={cn("flex items-center gap-1.5 rounded-lg border px-2 py-2 text-xs transition-all", active ? "border-current" : "opacity-60 hover:opacity-100")} style={{ borderColor: active ? "var(--accent)" : "var(--border)" }}>
                        {c.icon ? <img src={c.icon} alt="" className="h-4 w-4" /> : <span className="h-4 w-4" />}
                        <span className="truncate">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </Section>
              <Section icon={<Ghost className="h-4 w-4" />} title="about:blank">
                <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>Launch redux inside a blank window with no URL bar — it leaves no trace in the tab history.</p>
                <button onClick={openAboutBlank} className="flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all hover:scale-[1.01]" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
                  <Ghost className="h-4 w-4" /> Open redux in about:blank
                </button>
              </Section>
            </>
          )}

          {/* Extensions */}
          {tab === "extensions" && (
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
          )}

          {/* Achievements */}
          {tab === "achievements" && (
            <Section icon={<Trophy className="h-4 w-4" />} title={`Achievements (${s.achievements.length}/${ACHIEVEMENTS.length})`}>
              <div className="space-y-1">
                {ACHIEVEMENTS.map((a) => {
                  const unlocked = s.achievements.includes(a.id);
                  return (
                    <div key={a.id} className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs" style={{ borderColor: unlocked ? "var(--accent)" : "var(--border)", opacity: unlocked ? 1 : 0.5 }}>
                      <span className="text-lg">{unlocked ? a.icon : "🔒"}</span>
                      <div className="flex-1">
                        <div className="font-medium">{a.name}</div>
                        <div style={{ color: "var(--text-muted)" }}>{a.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* More */}
          {tab === "more" && (
            <>
              <Section icon={<Info className="h-4 w-4" />} title="Quick Links">
                <button onClick={() => { setView("forms"); onClose(); }} className="mb-2 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:surface2" style={{ borderColor: "var(--border)" }}>
                  <ClipboardList className="h-4 w-4" /> Open Google Form
                </button>
                <button onClick={() => { setView("extensions"); onClose(); }} className="mb-2 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:surface2" style={{ borderColor: "var(--border)" }}>
                  <Puzzle className="h-4 w-4" /> Manage Extensions
                </button>
              </Section>
              <Section icon={<Database className="h-4 w-4" />} title="Data">
                <button
                  onClick={() => {
                    if (confirm("Clear all locally cached anime data? This won't affect your settings or favorites.")) {
                      Object.keys(localStorage).filter((k) => k.startsWith("redux-anime-cache:")).forEach((k) => localStorage.removeItem(k));
                      toast.success("Anime cache cleared");
                    }
                  }}
                  className="mb-2 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:surface2"
                  style={{ borderColor: "var(--border)" }}
                >
                  <Database className="h-4 w-4" /> Clear anime cache
                </button>
                <button
                  onClick={() => {
                    if (confirm("Reset ALL redux settings to defaults? This includes themes, extensions, achievements, and proxy config.")) {
                      try {
                        localStorage.removeItem("redux-settings");
                        Object.keys(localStorage).filter((k) => k.startsWith("redux-")).forEach((k) => localStorage.removeItem(k));
                        toast.success("Settings reset", { description: "Reload to apply." });
                        setTimeout(() => location.reload(), 800);
                      } catch (err: any) {
                        toast.error("Reset failed", { description: err?.message });
                      }
                    }
                  }}
                  className="mb-2 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:surface2"
                  style={{ borderColor: "#ef4444", color: "#ef4444" }}
                >
                  <RotateCcw className="h-4 w-4" /> Reset all settings
                </button>
              </Section>
              <Section icon={<Info className="h-4 w-4" />} title="Setup">
                <button onClick={() => { s.setSetupDone(true); s.unlockAchievement("setup-done"); setView("setup"); onClose(); }} className="w-full rounded-lg border px-3 py-2 text-sm transition-colors hover:surface2" style={{ borderColor: "var(--border)" }}>Open setup guide</button>
                <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>Status: {s.setupDone ? "Completed" : "Not completed"}</div>
              </Section>
              <Section icon={<Info className="h-4 w-4" />} title="About">
                <div className="rounded-lg p-3 text-xs" style={{ background: "var(--bg)" }}>
                  <div className="font-semibold">redux v3.1</div>
                  <div style={{ color: "var(--text-muted)" }}>static web proxy hub</div>
                  <div className="mt-1" style={{ color: "var(--text-muted)" }}>Scramjet · BareMux · Wisp · AniList</div>
                </div>
              </Section>
            </>
          )}
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
