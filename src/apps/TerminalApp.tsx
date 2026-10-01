"use client";

import { useEffect, useRef, useState } from "react";
import { useWindows } from "@/store/windows";
import { useOSSettings } from "@/store/os-settings";

interface Line {
  type: "input" | "output" | "error";
  text: string;
}

const BANNER = `abroad OS — Terminal v1.0
Type 'help' for available commands.`;

export function TerminalApp() {
  const [lines, setLines] = useState<Line[]>([
    { type: "output", text: BANNER },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { windows, open } = useWindows();
  const settings = useOSSettings();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const run = (cmd: string): string => {
    const [name, ...args] = cmd.trim().split(/\s+/);
    switch (name) {
      case "help":
        return `Available commands:
  help          Show this help
  ls            List open windows
  apps          List available apps
  open <app>    Open an app (music, files, browser, editor, calculator, settings, about)
  echo <text>   Print text
  date          Show current date/time
  whoami        Show current user
  clear         Clear the screen
  neofetch      System info`;
      case "ls":
        if (!windows.length) return "(no windows open)";
        return windows.map((w) => `${w.appId}\t${w.title}`).join("\n");
      case "apps":
        return "music  files  terminal  browser  editor  calculator  settings  about";
      case "open": {
        const app = args[0];
        const valid = ["music", "files", "terminal", "browser", "editor", "calculator", "settings", "about"];
        if (!app) return "usage: open <app>";
        if (!valid.includes(app)) return `unknown app: ${app}. Try: ${valid.join(", ")}`;
        const names: Record<string, string> = {
          music: "abroad", files: "Files", terminal: "Terminal", browser: "Browser",
          editor: "Editor", calculator: "Calculator", settings: "Settings", about: "About",
        };
        open(app, names[app]);
        return `opened ${app}`;
      }
      case "echo":
        return args.join(" ");
      case "date":
        return new Date().toString();
      case "whoami":
        return "guest";
      case "clear":
        setLines([]);
        return "";
      case "neofetch":
        return `       _____           
      /     \\           guest@abroad
     | () () |          ----------
      \\  ^  /           OS: abroad OS 1.0
       |||||            Shell: websh 1.0
       |||||            Theme: ${settings.accent}
                       Wallpaper: ${settings.wallpaper}`;
      case "":
        return "";
      default:
        return `websh: command not found: ${name}`;
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input;
    setLines((l) => [...l, { type: "input", text: cmd }]);
    if (cmd.trim()) {
      setHistory((h) => [...h, cmd]);
      const out = run(cmd);
      if (out) setLines((l) => [...l, { type: out.startsWith("websh:") ? "error" : "output", text: out }]);
    }
    setInput("");
    setHistIdx(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const idx = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(idx);
      setInput(history[idx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx === -1) return;
      const idx = histIdx + 1;
      if (idx >= history.length) {
        setHistIdx(-1);
        setInput("");
      } else {
        setHistIdx(idx);
        setInput(history[idx]);
      }
    }
  };

  return (
    <div
      className="flex h-full flex-col bg-[#0a0a0f] font-mono text-[13px] text-green-400"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3">
        {lines.map((line, i) => (
          <div
            key={i}
            className={
              line.type === "input"
                ? "whitespace-pre-wrap text-white"
                : line.type === "error"
                  ? "whitespace-pre-wrap text-red-400"
                  : "whitespace-pre-wrap text-green-400/90"
            }
          >
            {line.type === "input" ? (
              <><span className="text-cyan-400">guest@abroad</span>:<span className="text-purple-400">~</span>$ {line.text}</>
            ) : (
              line.text
            )}
          </div>
        ))}
        <form onSubmit={submit} className="flex items-center">
          <span className="text-cyan-400">guest@abroad</span>
          <span className="text-white">:</span>
          <span className="text-purple-400">~</span>
          <span className="text-white">$ </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent text-white outline-none"
            spellCheck={false}
            autoComplete="off"
          />
        </form>
      </div>
    </div>
  );
}
