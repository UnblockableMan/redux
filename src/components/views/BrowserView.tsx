"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Home, Lock, ExternalLink, AlertCircle } from "lucide-react";
import { useSettings } from "@/store/settings";
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

function toReduxUrl(url: string): string {
  return url.replace(/^https?:\/\//, "redux://");
}

function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!u) return "";
  u = u.replace(/^redux:\/\//, "https://");
  if (!/^https?:\/\//.test(u)) {
    if (/^[\w-]+(\.[\w-]+)+/.test(u)) u = "https://" + u;
    else u = "https://duckduckgo.com/?q=" + encodeURIComponent(u);
  }
  return u;
}

export function BrowserView() {
  const { wispUrl, unlockAchievement } = useSettings();
  const [input, setInput] = useState("");
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [idx, setIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

        // Register the service worker.
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.register(basePath + "sw.js", { scope: basePath });
          await navigator.serviceWorker.ready;

          const sendConfig = () => {
            const sw = reg.active || navigator.serviceWorker.controller;
            if (sw) sw.postMessage({ type: "config", wispurl: wispUrl });
          };
          sendConfig();
          setTimeout(sendConfig, 500);
          setTimeout(sendConfig, 1500);
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
            setInput(toReduxUrl(e.url));
          }
        });

        frameRef.current = frame;
        if (!cancelled) {
          setReady(true);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Scramjet init failed");
          toast.error("Proxy setup failed", { description: err?.message });
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
      const url = normalizeUrl(raw);
      if (!url || !frameRef.current) return;
      setLoading(true);
      unlockAchievement("first-browse");
      const newHist = [...history.slice(0, idx + 1), url];
      setHistory(newHist);
      setIdx(newHist.length - 1);
      setInput(toReduxUrl(url));
      setCurrentUrl(url);
      frameRef.current.go(url);
    },
    [history, idx, unlockAchievement],
  );

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
  const goHome = () => navigate("https://duckduckgo.com");
  const openExternal = () => { if (currentUrl) window.open(currentUrl, "_blank"); };

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
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="redux://search or enter address" className="flex-1 bg-transparent text-sm outline-none" spellCheck={false} />
          {loading && <div className="h-4 w-4 spin-slow rounded-full border-2" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />}
        </form>
        {currentUrl && <button onClick={openExternal} className="rounded-lg p-1.5 transition-colors hover:surface2" aria-label="Open in new tab"><ExternalLink className="h-4 w-4" /></button>}
      </div>

      {/* Status */}
      {!ready && (
        <div className="flex items-center gap-2 border-b px-3 py-1.5 text-xs" style={{ borderColor: "var(--border)", color: error ? "#ef4444" : "var(--text-muted)" }}>
          {error ? <><AlertCircle className="h-3 w-3" /> {error}</> : <><div className="h-3 w-3 spin-slow rounded-full border" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /> Starting Scramjet proxy…</>}
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
        <span className="truncate">{currentUrl ? toReduxUrl(currentUrl) : "Ready"}</span>
        <span>Scramjet: {ready ? "active" : error ? "error" : "starting…"}</span>
      </div>
    </div>
  );
}

function StartPage({ onNavigate }: { onNavigate: (url: string) => void }) {
  const shortcuts = [
    { name: "Google", url: "https://google.com", emoji: "🔍" },
    { name: "YouTube", url: "https://youtube.com", emoji: "📺" },
    { name: "Reddit", url: "https://reddit.com", emoji: "👽" },
    { name: "Wikipedia", url: "https://wikipedia.org", emoji: "📚" },
    { name: "GitHub", url: "https://github.com", emoji: "🐙" },
    { name: "Twitter", url: "https://twitter.com", emoji: "🐦" },
    { name: "Discord", url: "https://discord.com", emoji: "💬" },
    { name: "Twitch", url: "https://twitch.tv", emoji: "🎮" },
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center p-8" style={{ background: "var(--bg)" }}>
      <img src="/logo.svg" alt="redux" className="mb-4 h-12 w-12" />
      <h1 className="mb-1 text-2xl font-bold">redux browser</h1>
      <p className="mb-8 text-sm" style={{ color: "var(--text-muted)" }}>Browse the web through Scramjet. redux:// all the way.</p>
      <div className="grid grid-cols-4 gap-3">
        {shortcuts.map((s) => (
          <button key={s.name} onClick={() => onNavigate(s.url)} className="flex flex-col items-center gap-2 rounded-xl border p-4 transition-all hover:scale-105" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <span className="text-2xl">{s.emoji}</span>
            <span className="text-xs">{s.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
