"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Home, Lock, ExternalLink, AlertCircle, Star, Terminal, Bookmark } from "lucide-react";
import { useSettings } from "@/store/settings";
import { withBase } from "@/lib/base";
import { toast } from "sonner";

declare global {
  interface Window {
    $scramjetLoadController?: () => { ScramjetController: any; ScramjetFrame: any };
    BareMux?: any;
  }
}

const DEFAULT_WISP = "wss://wisp.mercurywork.shop:443";

function getBasePath() {
  const p = location.pathname.replace(/[^/]*$/, "");
  return p.endsWith("/") ? p : p + "/";
}

function toDisplayUrl(url: string): string {
  // Just show the plain URL — no redux:// prefix (user requested removal).
  return url;
}

const SEARCH_ENGINES: Record<string, string> = {
  duckduckgo: "https://duckduckgo.com/?q=",
  google: "https://www.google.com/search?q=",
  bing: "https://www.bing.com/search?q=",
  // startpage uses ?query= for GET searches.
  startpage: "https://www.startpage.com/sp/search?query=",
  brave: "https://search.brave.com/search?q=",
};

function normalizeUrl(input: string, engine: string = "duckduckgo"): string {
  let u = input.trim();
  if (!u) return "";
  u = u.replace(/^redux:\/\//, "https://");
  if (!/^https?:\/\//.test(u)) {
    if (/^[\w-]+(\.[\w-]+)+/.test(u)) u = "https://" + u;
    else {
      const base = SEARCH_ENGINES[engine] || SEARCH_ENGINES.duckduckgo;
      // startpage uses POST-style ?query= — handle GET param differently.
      u = base + encodeURIComponent(u);
    }
  }
  return u;
}

export function BrowserView() {
  const { wispUrl, searchEngine } = useSettings();
  const [input, setInput] = useState("");
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [idx, setIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bookmarks — persisted to localStorage. Star button toggles current URL.
  const [bookmarks, setBookmarks] = useState<{ url: string; title: string; added: number }[]>([]);
  // Dev tools panel — shows the JSON view of the current frame's state.
  const [showDevTools, setShowDevTools] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const frameHostRef = useRef<HTMLDivElement | null>(null);
  const scramjetRef = useRef<any>(null);
  const frameRef = useRef<any>(null);

  // Initialize Scramjet.
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // Wait for the global to be available (script is defer-loaded).
        let tries = 0;
        while (!window.$scramjetLoadController && tries < 50) {
          await new Promise((r) => setTimeout(r, 100));
          tries++;
        }
        if (!window.$scramjetLoadController) throw new Error("Scramjet library not loaded");

        const basePath = getBasePath();
        const { ScramjetController } = window.$scramjetLoadController();

        const controller = new ScramjetController({
          prefix: basePath + "scramjet/",
          files: {
            wasm: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.wasm.wasm",
            all: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.all.js",
            sync: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.sync.js",
          },
        });

        try {
          await controller.init();
        } catch (err: any) {
          // Clear IndexedDB on schema mismatch and retry.
          if (err?.message?.includes("IDBDatabase") || err?.message?.includes("object stores")) {
            for (const db of ["scramjet-data", "scrambase", "ScramjetData"]) {
              indexedDB.deleteDatabase(db);
            }
            await controller.init();
          } else {
            throw err;
          }
        }

        if (cancelled) return;

        // Register the service worker first.
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.register(basePath + "sw.js", { scope: basePath });
          await navigator.serviceWorker.ready;

          // Helper: post the config message to whichever SW is in charge.
          const sendConfig = () => {
            const sw = reg.active || navigator.serviceWorker.controller;
            if (sw) sw.postMessage({ type: "config", wispurl: wispUrl });
          };
          sendConfig();
          setTimeout(sendConfig, 500);
          setTimeout(sendConfig, 1500);
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            setTimeout(sendConfig, 100);
          });
          navigator.serviceWorker.addEventListener("message", (ev) => {
            const data = ev.data || {};
            if (data.type === "wisp-fallback" && data.url) {
              toast.info("Wisp fallback in use", {
                description: `Connected via ${data.url} (default was unreachable).`,
              });
            }
          });
        }

        // CRITICAL FIX (the white-screen bug):
        // Set up the BareMux transport in the MAIN THREAD before creating
        // the Scramjet frame. The SW's BareClient (which has .fetch())
        // uses the shared transport that was set here. Both the main
        // thread and the SW share the same SharedWorker (bareworker.js).
        //
        // Pattern mirrors staticsjv2's getSharedConnection():
        //   1. new BareMuxConnection(bareworker.js)
        //   2. await setTransport(epoxy-transport, [{ wisp: wispUrl }])
        //   3. THEN createFrame() and frame.go(url)
        if (window.BareMux?.BareMuxConnection) {
          try {
            const conn = new window.BareMux.BareMuxConnection(basePath + "bareworker.js");
            await conn.setTransport(
              "https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs",
              [{ wisp: wispUrl }],
            );
            // Keep a reference so the connection isn't GC'd. The SW
            // will create its own BareClient to fetch via this transport.
            (scramjetRef.current as any) = controller;
            (scramjetRef.current as any)._bareMuxConnection = conn;
          } catch (err: any) {
            console.warn("BareMux transport setup failed:", err?.message);
            // Not fatal — the SW fallback chain will try on first request.
          }
        }

        scramjetRef.current = controller;

        // Create a proxy frame.
        const frame = controller.createFrame();
        frameHostRef.current?.appendChild(frame.frame);
        frame.frame.style.width = "100%";
        frame.frame.style.height = "100%";
        frame.frame.style.border = "none";

        frame.addEventListener("urlchange", (e: any) => {
          if (e.url) {
            setCurrentUrl(e.url);
            setInput(toDisplayUrl(e.url));
          }
        });

        frameRef.current = frame;
        if (!cancelled) {
          setReady(true);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          const msg = err?.message || "Scramjet init failed";
          setError(`${msg} — if this persists, try a different wisp server in Settings → Proxy`);
          toast.error("Proxy setup failed", { description: `${msg}. Tip: try another wisp server in Settings → Proxy.` });
        }
      }
    };

    init();
    return () => {
      cancelled = true;
      if (frameRef.current?.frame?.parentNode) {
        frameRef.current.frame.parentNode.removeChild(frameRef.current.frame);
      }
    };
  }, [wispUrl]);

  const navigate = useCallback(
    (raw: string) => {
      const url = normalizeUrl(raw, searchEngine);
      if (!url || !frameRef.current) return;
      setLoading(true);
      const newHist = [...history.slice(0, idx + 1), url];
      setHistory(newHist);
      setIdx(newHist.length - 1);
      setInput(toDisplayUrl(url));
      setCurrentUrl(url);
      frameRef.current.go(url);
    },
    [history, idx, searchEngine],
  );

  // Listen for "redux-browser-init" CustomEvents from the Home view (or any
  // other view that wants to hand off a URL to the browser). This lets the
  // home page's shortcut tiles / search bar drive the Browser view directly.
  useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent).detail as string;
      if (typeof detail === "string" && detail.trim()) {
        // Wait until the frame is ready, then navigate.
        const tryNav = (tries = 0) => {
          if (frameRef.current) {
            navigate(detail);
          } else if (tries < 20) {
            setTimeout(() => tryNav(tries + 1), 100);
          }
        };
        tryNav();
      }
    };
    window.addEventListener("redux-browser-init", handler);
    return () => window.removeEventListener("redux-browser-init", handler);
  }, [navigate]);

  const back = () => {
    if (idx > 0 && frameRef.current) {
      const i = idx - 1;
      setIdx(i);
      frameRef.current.go(history[i]);
    }
  };
  const forward = () => {
    if (idx < history.length - 1 && frameRef.current) {
      const i = idx + 1;
      setIdx(i);
      frameRef.current.go(history[i]);
    }
  };
  const reload = () => frameRef.current?.reload();
  const goHome = () => navigate(SEARCH_ENGINES[searchEngine] || SEARCH_ENGINES.duckduckgo);
  const openExternal = () => { if (currentUrl) window.open(currentUrl, "_blank"); };

  // Bookmarks: load from localStorage on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("redux-browser-bookmarks");
      if (raw) setBookmarks(JSON.parse(raw));
    } catch {}
  }, []);

  const saveBookmarks = (list: { url: string; title: string; added: number }[]) => {
    setBookmarks(list);
    try { localStorage.setItem("redux-browser-bookmarks", JSON.stringify(list)); } catch {}
  };

  const isBookmarked = currentUrl ? bookmarks.some((b) => b.url === currentUrl) : false;

  const toggleBookmark = () => {
    if (!currentUrl) return;
    const title = input.replace(/^redux:\/\//, "") || currentUrl;
    if (isBookmarked) {
      saveBookmarks(bookmarks.filter((b) => b.url !== currentUrl));
      toast.success("Bookmark removed");
    } else {
      saveBookmarks([...bookmarks, { url: currentUrl, title, added: Date.now() }]);
      toast.success("Bookmark added", { description: title });
    }
  };

  const openBookmark = (url: string) => {
    setShowBookmarks(false);
    navigate(url);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: "var(--border)" }}>
        <button onClick={back} disabled={idx <= 0} className="rounded-lg p-1.5 transition-colors hover:surface2 disabled:opacity-30" aria-label="Back"><ArrowLeft className="h-4 w-4" /></button>
        <button onClick={forward} disabled={idx >= history.length - 1} className="rounded-lg p-1.5 transition-colors hover:surface2 disabled:opacity-30" aria-label="Forward"><ArrowRight className="h-4 w-4" /></button>
        <button onClick={reload} disabled={!currentUrl} className="rounded-lg p-1.5 transition-colors hover:surface2 disabled:opacity-30" aria-label="Reload"><RotateCw className="h-4 w-4" /></button>
        <button onClick={goHome} className="rounded-lg p-1.5 transition-colors hover:surface2" aria-label="Home"><Home className="h-4 w-4" /></button>
        <form className="flex flex-1 items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: "var(--border)", background: "var(--surface2)" }} onSubmit={(e) => { e.preventDefault(); navigate(input); }}>
          <Lock className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="search or enter address" className="flex-1 bg-transparent text-sm outline-none" spellCheck={false} />
          {loading && <div className="h-4 w-4 spin-slow rounded-full border-2" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />}
        </form>
        {currentUrl && (
          <button
            onClick={toggleBookmark}
            className="rounded-lg p-1.5 transition-colors hover:surface2"
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            style={isBookmarked ? { color: "#fbbf24" } : undefined}
          >
            <Star className="h-4 w-4" style={isBookmarked ? { fill: "currentColor" } : undefined} />
          </button>
        )}
        {/* Bookmarks dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowBookmarks((v) => !v)}
            className="rounded-lg p-1.5 transition-colors hover:surface2"
            aria-label="Bookmarks"
            title="Bookmarks"
          >
            <Bookmark className="h-4 w-4" style={{ color: bookmarks.length > 0 ? "var(--accent)" : "var(--text-muted)" }} />
          </button>
          {showBookmarks && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowBookmarks(false)} />
              <div
                className="absolute right-0 top-full z-20 mt-1 w-72 max-h-80 overflow-y-auto rounded-lg border shadow-2xl"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="border-b px-3 py-2 text-xs font-medium" style={{ borderColor: "var(--border)" }}>
                  Bookmarks ({bookmarks.length})
                </div>
                {bookmarks.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                    No bookmarks yet. Click the star to add one.
                  </div>
                ) : (
                  bookmarks.map((b) => (
                    <button
                      key={b.url + b.added}
                      onClick={() => openBookmark(b.url)}
                      className="block w-full px-3 py-2 text-left text-xs transition-colors hover:surface2"
                      style={{ color: "var(--text)" }}
                      title={b.url}
                    >
                      <div className="truncate font-medium">{b.title}</div>
                      <div className="truncate text-[10px]" style={{ color: "var(--text-muted)" }}>{b.url}</div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
        {/* Dev tools toggle */}
        <button
          onClick={() => setShowDevTools((v) => !v)}
          className="rounded-lg p-1.5 transition-colors hover:surface2"
          aria-label="Dev tools"
          title="Dev tools (browser state inspector)"
          style={showDevTools ? { background: "var(--accent)", color: "var(--bg)" } : undefined}
        >
          <Terminal className="h-4 w-4" />
        </button>
        {currentUrl && <button onClick={openExternal} className="rounded-lg p-1.5 transition-colors hover:surface2" aria-label="Open in new tab"><ExternalLink className="h-4 w-4" /></button>}
      </div>

      {/* Status — branded redux loading bar. Replaces the bland "Starting
          Scramjet proxy…" text with a styled status row showing the redux
          wordmark + the current step (proxy boot, wisp test, etc.). */}
      {!ready && (
        <div className="border-b px-3 py-2 text-xs" style={{ borderColor: "var(--border)", background: "var(--surface)", color: error ? "#ef4444" : "var(--text-muted)" }}>
          <div className="flex items-center gap-2">
            {error ? (
              <>
                <AlertCircle className="h-3.5 w-3.5 flex-none" />
                <span className="truncate">{error}</span>
              </>
            ) : (
              <>
                <div className="h-3 w-3 spin-slow rounded-full border-2 flex-none" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
                <span className="font-mono" style={{ color: "var(--accent)" }}>redux</span>
                <span>booting scramjet + wisp transport…</span>
              </>
            )}
          </div>
          {!error && (
            <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--accent) 20%, transparent)" }}>
              <div className="h-full w-1/3 spin-slow" style={{ background: "var(--accent)", animation: "redux-progress 1.6s ease-in-out infinite" }} />
            </div>
          )}
          <style>{`@keyframes redux-progress { 0%{transform:translateX(-100%)} 50%{transform:translateX(150%)} 100%{transform:translateX(-100%)} }`}</style>
        </div>
      )}

      {/* Frame host */}
      <div className="relative flex-1" style={{ background: "#fff" }}>
        {!currentUrl ? (
          <StartPage onNavigate={navigate} />
        ) : null}
        <div ref={frameHostRef} className="absolute inset-0" style={{ display: currentUrl ? "block" : "none" }} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-3 py-1 text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        <span className="truncate">{currentUrl ? toDisplayUrl(currentUrl) : "Ready"}</span>
        <span>Scramjet: {ready ? "active" : error ? "error" : "starting…"} · Bookmarks: {bookmarks.length}</span>
      </div>

      {/* Dev tools panel — slides up from the bottom when toggled */}
      {showDevTools && (
        <div className="border-t" style={{ borderColor: "var(--border)", background: "var(--surface)", maxHeight: "40%" }}>
          <div className="flex items-center justify-between border-b px-3 py-1.5 text-xs" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 font-mono">
              <Terminal className="h-3 w-3" style={{ color: "var(--accent)" }} />
              <span style={{ color: "var(--text-muted)" }}>redux dev tools</span>
            </div>
            <button onClick={() => setShowDevTools(false)} className="rounded px-2 py-0.5 text-[10px] hover:surface2">close</button>
          </div>
          <div className="overflow-auto p-3 font-mono text-[11px]" style={{ color: "var(--text)" }}>
            <div><span style={{ color: "var(--text-muted)" }}>current_url:</span> {currentUrl || "(none)"}</div>
            <div><span style={{ color: "var(--text-muted)" }}>redux_url:</span> {currentUrl ? toDisplayUrl(currentUrl) : "(none)"}</div>
            <div><span style={{ color: "var(--text-muted)" }}>history_idx:</span> {idx} / {history.length - 1}</div>
            <div><span style={{ color: "var(--text-muted)" }}>history_stack:</span> [{history.slice(Math.max(0, idx - 3), idx + 4).map((h, i) => `"${h.slice(0, 30)}"`).join(", ")}{history.length > 7 ? ", ..." : ""}]</div>
            <div><span style={{ color: "var(--text-muted)" }}>wisp_url:</span> {wispUrl}</div>
            <div><span style={{ color: "var(--text-muted)" }}>scramjet_ready:</span> {ready ? "true" : "false"}</div>
            <div><span style={{ color: "var(--text-muted)" }}>scramjet_error:</span> {error || "(none)"}</div>
            <div><span style={{ color: "var(--text-muted)" }}>search_engine:</span> {searchEngine}</div>
            <div><span style={{ color: "var(--text-muted)" }}>bookmarks_count:</span> {bookmarks.length}</div>
            <div className="mt-2" style={{ color: "var(--text-muted)" }}>
              tip: open the real browser devtools with <kbd className="rounded px-1" style={{ background: "var(--surface2)" }}>F12</kbd> or <kbd className="rounded px-1" style={{ background: "var(--surface2)" }}>Ctrl+Shift+I</kbd>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StartPage({ onNavigate }: { onNavigate: (url: string) => void }) {
  const searchEngine = useSettings((s) => s.searchEngine);
  const [query, setQuery] = useState("");
  const engineLabel: Record<string, string> = {
    duckduckgo: "DuckDuckGo",
    google: "Google",
    bing: "Bing",
    startpage: "Startpage",
    brave: "Brave",
  };
  const shortcuts = [
    { name: "Google", url: "https://google.com", icon: "https://www.google.com/favicon.ico" },
    { name: "YouTube", url: "https://youtube.com", icon: "https://www.youtube.com/s/desktop/favicon.ico" },
    { name: "Reddit", url: "https://reddit.com", icon: "https://www.redditstatic.com/favicon.ico" },
    { name: "Wikipedia", url: "https://wikipedia.org", icon: "https://en.wikipedia.org/static/favicon/wikipedia.ico" },
    { name: "GitHub", url: "https://github.com", icon: "https://github.githubassets.com/favicons/favicon.svg" },
    { name: "X (Twitter)", url: "https://twitter.com", icon: "https://abs.twimg.com/favicons/twitter.2.ico" },
    { name: "Discord", url: "https://discord.com", icon: "https://discord.com/assets/favicon.ico" },
    { name: "Twitch", url: "https://twitch.tv", icon: "https://assets.help.twitch.tv/article/img/favicon.ico" },
    { name: "Spotify", url: "https://open.spotify.com", icon: "https://open.spotify.com/favicon.ico" },
    { name: "Netflix", url: "https://netflix.com", icon: "https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2023.ico" },
    { name: "Amazon", url: "https://amazon.com", icon: "https://www.amazon.com/favicon.ico" },
    { name: "ChatGPT", url: "https://chat.openai.com", icon: "https://chat.openai.com/favicon.ico" },
  ];
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // If the user typed something URL-like, treat as URL; else search.
    onNavigate(query.trim());
    setQuery("");
  };
  return (
    <div className="flex h-full flex-col items-center justify-center p-8" style={{ background: "var(--bg)" }}>
      <img src={withBase("logo.svg")} alt="redux" className="mb-4 h-12 w-12" />
      <h1 className="mb-1 text-2xl font-bold">redux browser</h1>
      <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>Browse the web through Scramjet.</p>
      <form onSubmit={submit} className="mb-8 w-full max-w-xl">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${engineLabel[searchEngine] || "the web"} or enter address…`}
          className="w-full rounded-full border bg-transparent px-5 py-3 text-sm outline-none"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          autoFocus
          spellCheck={false}
        />
      </form>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
        {shortcuts.map((s) => (
          <button key={s.name} onClick={() => onNavigate(s.url)} className="flex flex-col items-center gap-2 rounded-xl border p-3 transition-all hover:scale-105 sm:p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }} title={s.name}>
            <img src={s.icon} alt="" className="h-7 w-7 rounded-sm" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <span className="truncate text-xs">{s.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
