"use client";

import { useState } from "react";
import { X, Palette, Server, Eye, Info, Layout, Wallpaper, Puzzle, Trash2, ClipboardList, Film, Ghost, Wifi, RotateCcw, Database, Search, Shield, Gamepad2, Keyboard, Globe } from "lucide-react";
import { useSettings, THEMES, WALLPAPERS, VIDEO_WALLPAPERS, type ThemeId, type WallpaperId, type VideoWallpaperId, type ToolbarPos } from "@/store/settings";
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

// All public wisp servers from zinc + ghostlinkhub + mercuryworkshop, exposed
// in the Proxy tab so users can pick one and skip the auto-fallback delay.
const WISP_PRESETS: { label: string; url: string }[] = [
  { label: "Mercury Workshop (default)", url: "wss://wisp.mercurywork.shop:443" },
  { label: "Proxiflux", url: "wss://wisps.proxiflux.dev:443" },
  { label: "LibreY Comet", url: "wss://comet.librey.tech:443" },
  { label: "Loclin CF", url: "wss://wisp.loclin-cf.lol:443" },
  { label: "Dragonuno", url: "wss://wisp-proxy.dragonuno.vercel.app:443" },
  { label: "Gettoast", url: "wss://wispg0.gettoast.in:443" },
  { label: "Anyspeed", url: "wss://anyspeed.mercurywork.shop:443" },
  { label: "PeteZah Games", url: "wss://petezahgames.com/wisp/" },
  { label: "Bare Server (Fly)", url: "wss://bare-server.fly.dev/wisp/" },
  { label: "Businessschool", url: "wss://businessschool.cc/wisp/" },
  { label: "Crypto College", url: "wss://crypto-college.cc/wisp/" },
  { label: "Fulcrum Theatre", url: "wss://fulcrumtheatreinc.com/wisp/" },
  { label: "Go Into Space", url: "wss://gointospace.app/wisp/" },
  { label: "Homework Help", url: "wss://homeworkhelp.cc/wisp/" },
  { label: "Hotel Sunrise Grand", url: "wss://info.hotelsunrisegrand.com/wisp/" },
  { label: "Shop1StopOnline", url: "wss://info.shop1stoponline.com/wisp/" },
  { label: "Videnom", url: "wss://info.videnom.com/wisp/" },
  { label: "Lunar (Asirargentina)", url: "wss://lunar.asirargentina.com.ar/w/" },
  { label: "Lunar (Colegio)", url: "wss://lunar.colegioitalocomposto.cl/w/" },
  { label: "Lunar (Globalscholar)", url: "wss://lunar.globalscholarpress.com/w/" },
  { label: "Lunar (KKMSilvia)", url: "wss://lunar.kkmsilvia.com/w/" },
  { label: "Lunaron", url: "wss://lunaron.top/w/" },
  { label: "PGIS Wisp 2", url: "wss://pgis-wisp-2.onrender.com/" },
  { label: "PGIS Wisp 3", url: "wss://pgis-wisp-3.onrender.com/" },
  { label: "PGIS Wisp 4", url: "wss://pgis-wisp-4.onrender.com/" },
  { label: "PGIS Bonto", url: "wss://pgis-wisp.bonto.run/" },
  { label: "PGIS Voroa", url: "wss://pgis-wisp.getvoroa.com/" },
  { label: "PGIS Joytree", url: "wss://pgis-wisp.joytree.site/" },
  { label: "PGIS OnRender", url: "wss://pgis-wisp.onrender.com/" },
  { label: "Vjason Places", url: "wss://places.vjason.com/wisp/" },
  { label: "Science News", url: "wss://sciencenews.cc/wisp/" },
  { label: "Science Park", url: "wss://sciencepark.cc/wisp/" },
  { label: "Space Asirargentina", url: "wss://space.asirargentina.com.ar/wisp/" },
  { label: "Space Colegio", url: "wss://space.colegioitalocomposto.cl/wisp/" },
  { label: "Space KKMSilvia", url: "wss://space.kkmsilvia.com/wisp/" },
  { label: "Studyhub Asirargentina", url: "wss://studyhub.asirargentina.com.ar/wisp/" },
  { label: "Studyhub Colegio", url: "wss://studyhub.colegioitalocomposto.cl/wisp/" },
  { label: "Studyhub Hadtea", url: "wss://studyhub.hadtea.com/wisp/" },
  { label: "Studyhub KKMSilvia", url: "wss://studyhub.kkmsilvia.com/wisp/" },
  { label: "Triplet Bumon", url: "wss://triplet.bumon.ar/wisp/" },
  { label: "Tungtung Asirargentina", url: "wss://tungtung.asirargentina.com.ar/wisp/" },
  { label: "Tungtung.best", url: "wss://tungtung.best/wisp/" },
  { label: "Tungtung KKMSilvia", url: "wss://tungtung.kkmsilvia.com/wisp/" },
  { label: "Ritebooks", url: "wss://3658729.ritebooks.com/wisp/" },
  { label: "Hydrovolter", url: "wss://admin.proxy.hydrovolter.com/scramjet/wisp/" },
  { label: "GLSeries", url: "wss://glseries.net/wisp/" },
  { label: "Owoellen Scram", url: "wss://scram.owoellen.rocks/wisp/" },
  { label: "WispServer.dev", url: "wss://wispserver.dev/wisp/" },
];

type Tab = "appearance" | "playback" | "privacy" | "browser" | "games" | "proxy" | "cloak" | "extensions" | "shortcuts" | "more";

const TABS: { id: Tab; label: string; icon: typeof Palette }[] = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "playback", label: "Playback", icon: Film },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "browser", label: "Browser", icon: Globe },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "proxy", label: "Proxy", icon: Server },
  { id: "cloak", label: "Cloak", icon: Eye },
  { id: "extensions", label: "Extensions", icon: Puzzle },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
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
    // about:blank launched
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
    // proxy test ran
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
                    <button key={t.id} onClick={() => { s.setTheme(t.id as ThemeId); }} className={cn("flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all", s.theme === t.id ? "scale-105" : "opacity-60 hover:opacity-100")} style={{ borderColor: s.theme === t.id ? t.accent : "transparent", background: t.bg }} title={t.label}>
                      <div className="flex gap-1"><span className="h-4 w-4 rounded" style={{ background: t.text }} /><span className="h-4 w-4 rounded" style={{ background: t.accent }} /></div>
                      <span className="text-[9px]" style={{ color: t.text }}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </Section>
              <Section icon={<Wallpaper className="h-4 w-4" />} title="Wallpaper">
                <div className="grid grid-cols-5 gap-2">
                  {WALLPAPERS.map((w) => (
                    <button key={w.id} onClick={() => { s.setWallpaper(w.id as WallpaperId); }} className={cn("flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all", s.wallpaper === w.id ? "scale-105" : "opacity-60 hover:opacity-100")} style={{ borderColor: s.wallpaper === w.id ? "var(--accent)" : "transparent", background: "var(--bg)" }}>
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
                    <button key={v.id} onClick={() => { s.setVideoWallpaper(v.id as VideoWallpaperId); }} className={cn("flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all", s.videoWallpaper === v.id ? "scale-105" : "opacity-60 hover:opacity-100")} style={{ borderColor: s.videoWallpaper === v.id ? "var(--accent)" : "transparent", background: "var(--bg)" }}>
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
                    <button key={p.id} onClick={() => { s.setToolbarPos(p.id); }} className={cn("rounded-lg border py-2 text-xs transition-all", s.toolbarPos === p.id ? "scale-105" : "opacity-60 hover:opacity-100")} style={{ borderColor: s.toolbarPos === p.id ? "var(--accent)" : "var(--border)", background: s.toolbarPos === p.id ? "var(--surface2)" : "transparent", color: s.toolbarPos === p.id ? "var(--accent)" : "var(--text-muted)" }}>
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

          {/* Privacy */}
          {tab === "privacy" && (
            <>
              <Section icon={<Shield className="h-4 w-4" />} title="Tracking Protection">
                <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  Ad and tracker blocking happens at the Scramjet service-worker level. Toggle them on/off here.
                </p>
                <ToggleRow label="Block ads" desc="Refuses requests to known ad domains (doubleclick, googlesyndication, etc.)." checked={s.blockAds} onChange={s.setBlockAds} />
                <ToggleRow label="Block trackers" desc="Blocks analytics beacons (chartbeat, scorecardresearch, quantserve, etc.)." checked={s.blockTrackers} onChange={s.setBlockTrackers} />
                <ToggleRow label="Send Do-Not-Track" desc="Adds the DNT: 1 header to outbound requests." checked={s.doNotTrack} onChange={s.setDoNotTrack} />
                <ToggleRow label="Hide Referrer" desc="Strips Referer headers so the destination site can't see where you came from." checked={s.hideReferrer} onChange={s.setHideReferrer} />
              </Section>
              <Section icon={<Database className="h-4 w-4" />} title="Data">
                <ToggleRow label="Clear data on exit" desc="Wipes localStorage, indexedDB, and caches when you close the tab." checked={s.clearDataOnExit} onChange={s.setClearDataOnExit} />
                <button
                  onClick={() => {
                    if (caches && caches.keys) {
                      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => {
                        toast.success("Service worker caches cleared");
                      });
                    }
                  }}
                  className="mb-2 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:surface2"
                  style={{ borderColor: "var(--border)" }}
                >
                  <Database className="h-4 w-4" /> Clear service worker caches
                </button>
              </Section>
            </>
          )}

          {/* Browser */}
          {tab === "browser" && (
            <>
              <Section icon={<Globe className="h-4 w-4" />} title="New Tab Page">
                <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>What to show when the Browser view first opens.</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: "shortcuts", label: "Shortcuts grid" },
                    { id: "google", label: "Google" },
                    { id: "duckduckgo", label: "DuckDuckGo" },
                    { id: "blank", label: "Blank page" },
                    { id: "custom", label: "Custom URL" },
                  ] as const).map((p) => (
                    <button key={p.id} onClick={() => s.setNewTabPage(p.id)} className={cn("rounded-lg border px-3 py-2 text-xs transition-all", s.newTabPage === p.id ? "scale-105" : "opacity-60 hover:opacity-100")} style={{ borderColor: s.newTabPage === p.id ? "var(--accent)" : "var(--border)" }}>
                      {p.label}
                    </button>
                  ))}
                </div>
                {s.newTabPage === "custom" && (
                  <input
                    value={s.customNewTabUrl}
                    onChange={(e) => s.setCustomNewTabUrl(e.target.value)}
                    placeholder="https://your-start-page.com"
                    className="mt-2 w-full rounded-lg border bg-transparent px-3 py-2 font-mono text-xs outline-none"
                    style={{ borderColor: "var(--border)", color: "var(--text)" }}
                    spellCheck={false}
                  />
                )}
              </Section>
              <Section icon={<Search className="h-4 w-4" />} title="Default Search Engine">
                <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>Used by the address bar when you type a non-URL query.</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: "duckduckgo", label: "DuckDuckGo" },
                    { id: "google", label: "Google" },
                    { id: "bing", label: "Bing" },
                    { id: "startpage", label: "Startpage" },
                    { id: "brave", label: "Brave" },
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
              <Section icon={<Database className="h-4 w-4" />} title="History">
                <ToggleRow label="Save browsing history" desc="Keep a list of URLs you visit so you can use Back / Forward across reloads." checked={s.saveHistory} onChange={s.setSaveHistory} />
              </Section>
            </>
          )}

          {/* Games */}
          {tab === "games" && (
            <>
              <Section icon={<Gamepad2 className="h-4 w-4" />} title="Catalog Source">
                <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>Choose which game catalogs to load. 'All' merges UBG + Cartel.</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: "all", label: "All sources" },
                    { id: "ubg", label: "UBG only" },
                    { id: "cartel", label: "Cartel only" },
                  ] as const).map((g) => (
                    <button key={g.id} onClick={() => s.setGamesSource(g.id)} className={cn("rounded-lg border px-3 py-2 text-xs transition-all", s.gamesSource === g.id ? "scale-105" : "opacity-60 hover:opacity-100")} style={{ borderColor: s.gamesSource === g.id ? "var(--accent)" : "var(--border)" }}>
                      {g.label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                  Catalog: ~750 games from anchor/ubg + 35 from UnblockableMan/Cartel = ~785 games.
                </p>
              </Section>
              <Section icon={<Gamepad2 className="h-4 w-4" />} title="Quick Open">
                <button onClick={() => { setView("games"); onClose(); }} className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:surface2" style={{ borderColor: "var(--border)" }}>
                  <Gamepad2 className="h-4 w-4" /> Open Games
                </button>
              </Section>
            </>
          )}

          {/* Shortcuts */}
          {tab === "shortcuts" && (
            <>
              <Section icon={<Keyboard className="h-4 w-4" />} title="Keyboard Shortcuts">
                <ToggleRow label="Enable keyboard shortcuts" desc="Use hotkeys to switch views, open settings, and more." checked={s.enableKeyboardShortcuts} onChange={s.setEnableKeyboardShortcuts} />
                <div className="mt-3 space-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  <div className="flex justify-between rounded px-2 py-1" style={{ background: "var(--surface2)" }}><span>Go to Home</span><kbd className="font-mono">Alt + H</kbd></div>
                  <div className="flex justify-between rounded px-2 py-1" style={{ background: "var(--surface2)" }}><span>Go to Browser</span><kbd className="font-mono">Alt + B</kbd></div>
                  <div className="flex justify-between rounded px-2 py-1" style={{ background: "var(--surface2)" }}><span>Go to Anime</span><kbd className="font-mono">Alt + A</kbd></div>
                  <div className="flex justify-between rounded px-2 py-1" style={{ background: "var(--surface2)" }}><span>Go to Music</span><kbd className="font-mono">Alt + M</kbd></div>
                  <div className="flex justify-between rounded px-2 py-1" style={{ background: "var(--surface2)" }}><span>Go to Games</span><kbd className="font-mono">Alt + G</kbd></div>
                  <div className="flex justify-between rounded px-2 py-1" style={{ background: "var(--surface2)" }}><span>Open Settings</span><kbd className="font-mono">Alt + S</kbd></div>
                  <div className="flex justify-between rounded px-2 py-1" style={{ background: "var(--surface2)" }}><span>Toggle about:blank</span><kbd className="font-mono">Alt + `</kbd></div>
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
                <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>45+ public wisp servers from zinc + ghostlinkhub + mercuryworkshop. Pick one and test it; the SW auto-tries the rest if a request fails.</p>
                <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
                  {WISP_PRESETS.map((p) => (
                    <button key={p.url} title={p.url} onClick={() => { s.setWispUrl(p.url); setWispTest("idle"); }} className={cn("rounded-lg border px-3 py-1.5 text-left text-xs transition-all truncate", s.wispUrl === p.url ? "border-current" : "opacity-60 hover:opacity-100")} style={{ borderColor: s.wispUrl === p.url ? "var(--accent)" : "var(--border)" }}>
                      <span className="font-medium">{p.label}</span>
                      <span className="ml-2 font-mono" style={{ color: "var(--text-muted)" }}>{p.url}</span>
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
                      <button key={c.label} onClick={() => { s.setCloak(c.title, c.icon); }} className={cn("flex items-center gap-1.5 rounded-lg border px-2 py-2 text-xs transition-all", active ? "border-current" : "opacity-60 hover:opacity-100")} style={{ borderColor: active ? "var(--accent)" : "var(--border)" }}>
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
                    if (confirm("Reset ALL redux settings to defaults? This includes themes, extensions, and proxy config.")) {
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
                <button onClick={() => { s.setSetupDone(true); setView("setup"); onClose(); }} className="w-full rounded-lg border px-3 py-2 text-sm transition-colors hover:surface2" style={{ borderColor: "var(--border)" }}>Open setup guide</button>
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

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="mb-3 flex items-center justify-between gap-3 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--border)" }}>
      <span>
        <div className="font-medium">{label}</div>
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>{desc}</div>
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
    </label>
  );
}
