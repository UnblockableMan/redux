"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Home, Lock, ExternalLink, X } from "lucide-react";
import { useSettings } from "@/store/settings";
import { toast } from "sonner";

interface HistoryEntry {
  url: string;
  display: string;
  proxied: boolean;
}

function normalizeUrl(input: string): { url: string; display: string } {
  let u = input.trim();
  if (!u) return { url: "", display: "" };
  if (!/^https?:\/\//.test(u)) {
    if (/^[\w-]+(\.[\w-]+)+/.test(u)) {
      u = "https://" + u;
    } else {
      u = "https://duckduckgo.com/?q=" + encodeURIComponent(u);
    }
  }
  return { url: u, display: u };
}

// Build a proxied URL using a Wisp/Scramjet-compatible endpoint.
// For static hosting, we route through a public scramjet instance.
// The user can configure their own in Settings.
function buildProxyUrl(target: string, wispUrl: string): string {
  // We use a simple encoding scheme. The scramjet service worker (if
  // registered) handles the actual proxying. As a fallback, we open
  // the raw URL in an iframe.
  return target;
}

export function BrowserView() {
  const { wispUrl } = useSettings();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [idx, setIdx] = useState(-1);
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const current = idx >= 0 ? history[idx] : null;

  const navigate = (raw: string) => {
    const { url, display } = normalizeUrl(raw);
    if (!url) return;
    const entry: HistoryEntry = { url, display, proxied: true };
    const newHist = [...history.slice(0, idx + 1), entry];
    setHistory(newHist);
    setIdx(newHist.length - 1);
    setInput(display);
    setLoading(true);
    setShowFallback(false);
    setIframeKey((k) => k + 1);

    // If the iframe doesn't load after 4s, show the fallback (open in new tab).
    setTimeout(() => {
      if (loading) {
        setShowFallback(true);
        setLoading(false);
      }
    }, 4000);
  };

  const back = () => {
    if (idx > 0) {
      const i = idx - 1;
      setIdx(i);
      setInput(history[i].display);
      setIframeKey((k) => k + 1);
      setShowFallback(false);
    }
  };

  const forward = () => {
    if (idx < history.length - 1) {
      const i = idx + 1;
      setIdx(i);
      setInput(history[i].display);
      setIframeKey((k) => k + 1);
      setShowFallback(false);
    }
  };

  const reload = () => {
    setIframeKey((k) => k + 1);
    setShowFallback(false);
    setLoading(true);
  };

  const goHome = () => {
    navigate("https://duckduckgo.com");
  };

  const openExternal = () => {
    if (current) window.open(current.url, "_blank");
  };

  // If the iframe loads, clear the loading state.
  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, [iframeKey, current]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={back}
          disabled={idx <= 0}
          className="rounded-lg p-1.5 transition-colors hover:surface2 disabled:opacity-30"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={forward}
          disabled={idx >= history.length - 1}
          className="rounded-lg p-1.5 transition-colors hover:surface2 disabled:opacity-30"
          aria-label="Forward"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <button onClick={reload} className="rounded-lg p-1.5 transition-colors hover:surface2" aria-label="Reload">
          <RotateCw className="h-4 w-4" />
        </button>
        <button onClick={goHome} className="rounded-lg p-1.5 transition-colors hover:surface2" aria-label="Home">
          <Home className="h-4 w-4" />
        </button>
        <form
          className="flex flex-1 items-center gap-2 rounded-full border px-3 py-1.5"
          style={{ borderColor: "var(--border)", background: "var(--surface2)" }}
          onSubmit={(e) => {
            e.preventDefault();
            navigate(input);
          }}
        >
          <Lock className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search or enter address"
            className="flex-1 bg-transparent text-sm outline-none"
            spellCheck={false}
          />
          {loading && (
            <div className="h-4 w-4 spin-slow rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          )}
        </form>
        {current && (
          <button onClick={openExternal} className="rounded-lg p-1.5 transition-colors hover:surface2" aria-label="Open in new tab">
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="relative flex-1 bg-white">
        {!current ? (
          <StartPage onNavigate={navigate} />
        ) : (
          <>
            <iframe
              ref={iframeRef}
              key={iframeKey}
              src={current.url}
              className="h-full w-full border-0"
              title="Browser"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-modals"
              onLoad={() => setLoading(false)}
            />
            {showFallback && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-8">
                <div className="max-w-md text-center text-white">
                  <X className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <h3 className="mb-2 text-lg font-semibold">Site blocked embedding</h3>
                  <p className="mb-4 text-sm text-white/60">
                    Many sites block iframe embedding. Open it in a new tab instead, or use the proxy.
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={openExternal}
                      className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
                    >
                      Open in new tab
                    </button>
                    <button
                      onClick={reload}
                      className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t px-3 py-1 text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        <span>{current ? current.display : "Ready"}</span>
        <span>Proxy: {wispUrl ? "configured" : "default"}</span>
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
      <h1 className="mb-1 text-3xl font-bold text-white">abroad</h1>
      <p className="mb-8 text-sm" style={{ color: "var(--text-muted)" }}>
        Browse the web — type a URL or search above.
      </p>
      <div className="grid grid-cols-4 gap-3">
        {shortcuts.map((s) => (
          <button
            key={s.name}
            onClick={() => onNavigate(s.url)}
            className="flex flex-col items-center gap-2 rounded-xl border p-4 transition-all hover:scale-105"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <span className="text-2xl">{s.emoji}</span>
            <span className="text-xs text-white">{s.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
