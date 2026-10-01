"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Home, Lock, Globe } from "lucide-react";

export function BrowserApp() {
  const [url, setUrl] = useState("https://duckduckgo.com");
  const [inputUrl, setInputUrl] = useState("https://duckduckgo.com");
  const [history, setHistory] = useState<string[]>(["https://duckduckgo.com"]);
  const [idx, setIdx] = useState(0);
  const [key, setKey] = useState(0);

  const navigate = (u: string) => {
    let target = u.trim();
    if (!target) return;
    if (!/^https?:\/\//.test(target)) {
      // If it looks like a domain, prepend https://, else search.
      if (/^[\w-]+(\.[\w-]+)+/.test(target)) {
        target = "https://" + target;
      } else {
        target = "https://duckduckgo.com/?q=" + encodeURIComponent(target);
      }
    }
    const newHist = [...history.slice(0, idx + 1), target];
    setHistory(newHist);
    setIdx(newHist.length - 1);
    setUrl(target);
    setInputUrl(target);
    setKey((k) => k + 1);
  };

  const back = () => {
    if (idx > 0) {
      const i = idx - 1;
      setIdx(i);
      setUrl(history[i]);
      setInputUrl(history[i]);
      setKey((k) => k + 1);
    }
  };

  const forward = () => {
    if (idx < history.length - 1) {
      const i = idx + 1;
      setIdx(i);
      setUrl(history[i]);
      setInputUrl(history[i]);
      setKey((k) => k + 1);
    }
  };

  const reload = () => setKey((k) => k + 1);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <button onClick={back} disabled={idx === 0} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground disabled:opacity-30">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button onClick={forward} disabled={idx === history.length - 1} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground disabled:opacity-30">
          <ArrowRight className="h-4 w-4" />
        </button>
        <button onClick={reload} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground">
          <RotateCw className="h-4 w-4" />
        </button>
        <button onClick={() => navigate("https://duckduckgo.com")} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground">
          <Home className="h-4 w-4" />
        </button>
        <form
          className="flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(inputUrl);
          }}
        >
          <Lock className="h-3 w-3 text-green-400" />
          <input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder="Search or enter address"
            spellCheck={false}
          />
        </form>
      </div>

      {/* Content */}
      <div className="relative flex-1 bg-white">
        <iframe
          key={key}
          src={url}
          className="h-full w-full border-0"
          title="Browser"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
        {/* Fallback overlay if iframe is blocked */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white opacity-0 transition-opacity hover:opacity-100">
          <div className="text-center text-sm text-gray-500">
            If this page doesn't load, the site may block embedding.
          </div>
        </div>
      </div>
    </div>
  );
}
