"use client";

import { useEffect, useState } from "react";
import { FileText, Folder, Music, Image as ImageIcon, ArrowLeft, Home, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface FileEntry {
  name: string;
  type: "file" | "folder";
  content?: string;
  icon?: "text" | "music" | "image";
}

// A toy virtual filesystem stored in localStorage.
const FS_KEY = "abroad-os-fs";

function loadFS(): Record<string, FileEntry[]> {
  try {
    const raw = localStorage.getItem(FS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Seed with defaults.
  const seed: Record<string, FileEntry[]> = {
    "/": [
      { name: "Documents", type: "folder" },
      { name: "Music", type: "folder" },
      { name: "Pictures", type: "folder" },
      { name: "readme.txt", type: "file", content: "Welcome to abroad OS!\n\nThis is a virtual filesystem stored in your browser.", icon: "text" },
    ],
    "/Documents": [
      { name: "notes.txt", type: "file", content: "Things to do:\n- Ship abroad OS\n- Add more apps\n- Make it pretty", icon: "text" },
      { name: "ideas.txt", type: "file", content: "A web OS that feels indie, not corporate.", icon: "text" },
    ],
    "/Music": [
      { name: "playlist.m3u", type: "file", content: "#EXTM3U\n# A playlist", icon: "music" },
    ],
    "/Pictures": [
      { name: "wallpaper.png", type: "file", content: "(binary data)", icon: "image" },
    ],
  };
  localStorage.setItem(FS_KEY, JSON.stringify(seed));
  return seed;
}

function saveFS(fs: Record<string, FileEntry[]>) {
  localStorage.setItem(FS_KEY, JSON.stringify(fs));
}

export function FilesApp() {
  const [fs, setFs] = useState<Record<string, FileEntry[]>>({});
  const [path, setPath] = useState("/");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setFs(loadFS());
  }, []);

  const entries = fs[path] ?? [];

  const navigate = (name: string) => {
    const newPath = path === "/" ? `/${name}` : `${path}/${name}`;
    setPath(newPath);
    setSelected(null);
  };

  const goUp = () => {
    if (path === "/") return;
    const parts = path.split("/").filter(Boolean);
    parts.pop();
    setPath("/" + parts.join("/"));
    setSelected(null);
  };

  const openFile = (entry: FileEntry) => {
    if (entry.type === "folder") {
      navigate(entry.name);
    } else {
      toast.info(entry.name, { description: entry.content?.slice(0, 100) ?? "(empty)" });
    }
  };

  const newFolder = () => {
    const name = prompt("Folder name:");
    if (!name) return;
    const updated = { ...fs, [path]: [...entries, { name, type: "folder" }] };
    setFs(updated);
    saveFS(updated);
  };

  const newFile = () => {
    const name = prompt("File name:", "untitled.txt");
    if (!name) return;
    const entry: FileEntry = { name, type: "file", content: "", icon: "text" };
    const updated = { ...fs, [path]: [...entries, entry] };
    setFs(updated);
    saveFS(updated);
  };

  const deleteEntry = (name: string) => {
    const updated = { ...fs, [path]: entries.filter((e) => e.name !== name) };
    setFs(updated);
    saveFS(updated);
    setSelected(null);
  };

  const breadcrumb = ["/", ...path.split("/").filter(Boolean)];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <button
          onClick={() => setPath("/")}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
          title="Home"
        >
          <Home className="h-4 w-4" />
        </button>
        <button
          onClick={goUp}
          disabled={path === "/"}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground disabled:opacity-30"
          title="Up"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 truncate text-sm text-muted-foreground">
          {breadcrumb.map((b, i) => (
            <span key={i}>
              {i > 0 && " / "}
              <span className={i === breadcrumb.length - 1 ? "text-foreground" : ""}>
                {b === "/" ? "Home" : b}
              </span>
            </span>
          ))}
        </div>
        <button onClick={newFile} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground" title="New file">
          <Plus className="h-4 w-4" />
        </button>
        <button onClick={newFolder} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground" title="New folder">
          <Folder className="h-4 w-4" />
        </button>
      </div>

      {/* File grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {entries.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">This folder is empty.</div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
            {entries.map((entry) => {
              const Icon =
                entry.type === "folder"
                  ? Folder
                  : entry.icon === "music"
                    ? Music
                    : entry.icon === "image"
                      ? ImageIcon
                      : FileText;
              return (
                <button
                  key={entry.name}
                  onClick={() => setSelected(entry.name)}
                  onDoubleClick={() => openFile(entry)}
                  className={`group flex flex-col items-center gap-1.5 rounded-lg p-3 transition-colors ${
                    selected === entry.name ? "bg-primary/20" : "hover:bg-white/5"
                  }`}
                >
                  <Icon
                    className={`h-10 w-10 ${
                      entry.type === "folder" ? "text-amber-400" : "text-muted-foreground"
                    }`}
                  />
                  <span className="w-full truncate text-center text-xs">{entry.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Status bar */}
      {selected && (
        <div className="flex items-center justify-between border-t border-white/10 px-3 py-1.5 text-xs text-muted-foreground">
          <span>{selected}</span>
          <button
            onClick={() => deleteEntry(selected)}
            className="flex items-center gap-1 rounded px-2 py-1 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
