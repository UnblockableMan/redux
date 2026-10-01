"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Home, Lock, ExternalLink, X, AlertCircle, Puzzle } from "lucide-react";
import { useSettings } from "@/store/settings";
import { toast } from "sonner";

// Scramjet is loaded from the Mercury Workshop CDN.
const SCRAMJET_URL = "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet/dist/scramjet.min.js";

declare global {
  interface Window {
    ScramjetController?: any;
    scramjet?: any;
  }
}

interface HistoryEntry {
  url: string;       // real https:// URL
  display: string;   // redux:// display URL
  proxied: string;   // scramjet-encoded URL for iframe
}

function toReduxUrl(url: string): string {
  return url.replace(/^https?:\/\//, "redux://");
}

function fromReduxUrl(url: string): string {
  return url.replace(/^redux:\/\//, "https://");
}

function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!u) return "";
  // Accept redux:// prefix
  u = u.replace(/^redux:\/\//, "https://");
  if (!/^https?:\/\//.test(u)) {
    if (/^[\w-]+(\.[\w-]+)+/.test(u)) u = "https://" + u;
    else u = "https://duckduckgo.com/?q=" + encodeURIComponent(u);
  }
  return u;
}

export function BrowserView() {
  const { wispUrl } = useSettings();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [idx, setIdx] = useState(-1);
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [scramjetReady, setScramjetReady] = useState(false);
  const [scramjetError, setScramjetError] = useState<string | null>(null);

  // Load and initialize Scramjet.
  useEffect(() => {
    let cancelled = false;

    const initScramjet = async () => {
      try {
        // Load the Scramjet library if not already loaded.
        if (!window.ScramjetController) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = SCRAMJET_URL;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Scramjet library"));
            document.head.appendChild(script);
          });
        }

        if (cancelled) return;

        // Configure Scramjet with the Wisp URL.
        const config = {
          wisp: {
            url: wispUrl,
          },
          rtc: {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          },
        };

        // Register the Scramjet service worker.
        if (window.ScramjetController) {
          await window.ScramjetController.init(config);
          if (!cancelled) {
            setScramjetReady(true);
            setScramjetError(null);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setScramjetError(err?.message || "Scramjet init failed");
          toast.error("Proxy setup failed", { description: err?.message });
        }
      }
    };

    initScramjet();
    return () => { cancelled = true; };
  }, [wispUrl]);

  const encodeUrl = useCallback((url: string): string => {
    if (scramjetReady && window.ScramjetController?.encodeUrl) {
      try {
        return window.ScramjetController.encodeUrl(url);
      } catch {
        return url;
      }
    }
    // Fallback: load directly (may be blocked by X-Frame-Options)
    return url;
  }, [scramjetReady]);

  const current = idx >= 0 ? history[idx] : null;

  const navigate = (raw: string) => {
    const url = normalizeUrl(raw);
    if (!url) return;
    const proxied = encodeUrl(url);
    const entry: HistoryEntry = { url, display: toReduxUrl(url), proxied };
    const newHist = [...history.slice(0, idx + 1), entry];
    setHistory(newHist);
    setIdx(newHist.length - 1);
    setInput(toReduxUrl(url));
    setLoading(true);
    setIframeKey((k) => k + 1);
  };

  const back = () => {
    if (idx > 0) {
      const i = idx - 1;
      setIdx(i);
      setInput(history[i].display);
      setIframeKey((k) => k + 1);
    }
  };
  const forward = () => {
    if (idx < history.length - 1) {
      const i = idx + 1;
      setIdx(i);
      setInput(history[i].display);
      setIframeKey((k) => k + 1);
    }
  };
  const reload = () => { setIframeKey((k) => k + 1); setLoading(true); };
  const goHome = () => navigate("https://duckduckgo.com");
  const openExternal = () => { if (current) window.open(current.url, "_blank"); };

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => setLoading(false), 6000);
    return () => clearTimeout(timer);
  }, [iframeKey, current]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: "var(--border)" }}>
        <button onClick={back} disabled={idx <= 0} className="rounded-lg p-1.5 transition-colors hover:surface2 disabled:opacity-30" aria-label="Back"><ArrowLeft className="h-4 w-4" /></button>
        <button onClick={forward} disabled={idx >= history.length - 1} className="rounded-lg p-1.5 transition-colors hover:surface2 disabled:opacity-30" aria-label="Forward"><ArrowRight className="h-4 w-4" /></button>
        <button onClick={reload} className="rounded-lg p-1.5 transition-colors hover:surface2" aria-label="Reload"><RotateCw className="h-4 w-4" /></button>
        <button onClick={goHome} className="rounded-lg p-1.5 transition-colors hover:surface2" aria-label="Home"><Home className="h-4 w-4" /></button>
        <form className="flex flex-1 items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: "var(--border)", background: "var(--surface2)" }} onSubmit={(e) => { e.preventDefault(); navigate(input); }}>
          <Lock className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="redux://search or enter address" className="flex-1 bg-transparent text-sm outline-none" spellCheck={false} />
          {loading && <div className="h-4 w-4 spin-slow rounded-full border-2" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />}
        </form>
        {current && <button onClick={openExternal} className="rounded-lg p-1.5 transition-colors hover:surface2" aria-label="Open in new tab"><ExternalLink className="h-4 w-4" /></button>}
      </div>

      {/* Status bar */}
      {!scramjetReady && (
        <div className="flex items-center gap-2 border-b px-3 py-1.5 text-xs" style={{ borderColor: "var(--border)", color: scramjetError ? "#ef4444" : "var(--text-muted)" }}>
          {scramjetError ? <><AlertCircle className="h-3 w-3" /> Proxy: {scramjetError}. Direct mode.</> : <><div className="h-3 w-3 spin-slow rounded-full border" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /> Starting Scramjet proxy…</>}
        </div>
      )}

      {/* Content */}
      <div className="relative flex-1" style={{ background: "#fff" }}>
        {!current ? (
          <StartPage onNavigate={navigate} />
        ) : (
          <iframe
            key={iframeKey}
            src={current.proxied}
            className="h-full w-full border-0"
            title="Browser"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-modals allow-downloads"
            onLoad={() => setLoading(false)}
            allow="fullscreen; autoplay; encrypted-media; picture-in-picture; geolocation"
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-3 py-1 text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        <span className="truncate">{current ? current.display : "Ready"}</span>
        <span>Scramjet: {scramjetReady ? "active" : scramjetError ? "fallback" : "starting…"}</span>
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
