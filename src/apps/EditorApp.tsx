"use client";

import { useState, useEffect } from "react";
import { Save, FileText } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "abroad-os-notepad";

export function EditorApp() {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setText(stored);
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, text);
    setSaved(true);
    toast.success("Saved", { description: "Document saved to local storage." });
  };

  const onChange = (v: string) => {
    setText(v);
    setSaved(false);
  };

  // Auto-save on unmount.
  useEffect(() => {
    return () => {
      localStorage.setItem(STORAGE_KEY, text);
    };
  }, [text]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>untitled.txt</span>
          {!saved && <span className="text-amber-400">●</span>}
        </div>
        <button
          onClick={save}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          <Save className="h-3.5 w-3.5" /> Save
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 resize-none bg-background p-4 font-mono text-sm leading-relaxed outline-none"
        placeholder="Start typing…"
        spellCheck={false}
      />
      <div className="flex items-center justify-between border-t border-white/10 px-3 py-1.5 text-xs text-muted-foreground">
        <span>{wordCount} words · {charCount} chars</span>
        <span>{saved ? "Saved" : "Unsaved changes"}</span>
      </div>
    </div>
  );
}
