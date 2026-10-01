"use client";

import { useState, useRef } from "react";
import { Puzzle, Trash2, Plus, Globe, Upload, ExternalLink, ShieldCheck, Download } from "lucide-react";
import { useSettings, type ExtDef, STARTER_EXTENSIONS } from "@/store/settings";
import { toast } from "sonner";

export function ExtensionsView() {
  const { extensions, addExtension, removeExtension } = useSettings();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const addFromUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !name.trim()) {
      toast.error("Name and URL required");
      return;
    }
    const ext: ExtDef = {
      id: `ext_${Date.now()}`,
      name: name.trim(),
      icon: "🧩",
      url: url.trim(),
      enabled: true,
    };
    addExtension(ext);
    toast.success("Extension added", { description: name });
    setUrl("");
    setName("");
  };

  const addFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Create a blob URL for the extension file
    const blobUrl = URL.createObjectURL(file);
    const ext: ExtDef = {
      id: `ext_${Date.now()}`,
      name: file.name.replace(/\.(crx|zip|js)$/i, ""),
      icon: "📁",
      url: blobUrl,
      enabled: true,
    };
    addExtension(ext);
    toast.success("Extension loaded", { description: file.name });
    if (fileRef.current) fileRef.current.value = "";
  };

  const addFromWebStore = () => {
    const storeUrl = prompt("Paste the Chrome Web Store extension URL:");
    if (!storeUrl) return;
    // Extract extension ID from the URL
    const match = storeUrl.match(/([a-z]{32})/i);
    if (!match) {
      toast.error("Invalid Web Store URL", { description: "Could not find extension ID" });
      return;
    }
    const extId = match[1];
    const ext: ExtDef = {
      id: `ext_${Date.now()}`,
      name: `Web Store: ${extId.slice(0, 8)}…`,
      icon: "🌐",
      url: `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=120.0&acceptformat=crx2,crx3&x=id%3D${extId}%26uc`,
      enabled: true,
    };
    addExtension(ext);
    toast.success("Extension added from Web Store");
  };

  return (
    <div className="fade-in p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Puzzle className="h-6 w-6" style={{ color: "var(--accent)" }} />
        <div>
          <h1 className="text-2xl font-bold">Extensions</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Import Chrome extensions from the Web Store or files.
          </p>
        </div>
      </div>

      {/* Add extension */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {/* From Web Store */}
        <button onClick={addFromWebStore} className="surface flex flex-col items-center gap-2 rounded-xl border p-5 text-center transition-all hover:scale-[1.02]" style={{ borderColor: "var(--border)" }}>
          <Globe className="h-8 w-8" style={{ color: "var(--accent)" }} />
          <div className="text-sm font-medium">From Web Store</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>Paste a Chrome Web Store URL</div>
        </button>

        {/* From file */}
        <label className="surface flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-5 text-center transition-all hover:scale-[1.02]" style={{ borderColor: "var(--border)" }}>
          <Upload className="h-8 w-8" style={{ color: "var(--accent)" }} />
          <div className="text-sm font-medium">From File</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>.crx, .zip, or .js</div>
          <input ref={fileRef} type="file" accept=".crx,.zip,.js" onChange={addFromFile} className="hidden" />
        </label>

        {/* From URL */}
        <form onSubmit={addFromUrl} className="surface flex flex-col gap-2 rounded-xl border p-5" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5" style={{ color: "var(--accent)" }} />
            <span className="text-sm font-medium">From URL</span>
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Extension name" className="rounded-lg border bg-transparent px-3 py-1.5 text-xs outline-none" style={{ borderColor: "var(--border)" }} />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="rounded-lg border bg-transparent px-3 py-1.5 text-xs outline-none" style={{ borderColor: "var(--border)" }} />
          <button type="submit" className="rounded-lg py-1.5 text-xs font-medium" style={{ background: "var(--accent)", color: "var(--bg)" }}>Add</button>
        </form>
      </div>

      {/* Starter extensions — pre-bundled popular privacy/ad-blocking picks */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" style={{ color: "var(--accent)" }} />
          <h2 className="text-lg font-semibold">Starter Extensions</h2>
        </div>
        <p className="mb-3 text-sm" style={{ color: "var(--text-muted)" }}>
          Curated essentials — ad-blockers, dark mode, privacy. One click each, or grab them all.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {STARTER_EXTENSIONS.map((ext) => {
            const installed = extensions.some((e) => e.id === ext.id || (e.url && e.url.includes(ext.id.split("-")[1] || "~~~")));
            return (
              <button
                key={ext.id}
                onClick={() => {
                  if (installed) {
                    toast.info("Already added", { description: ext.name });
                    return;
                  }
                  addExtension({ ...ext, id: `ext_${Date.now()}_${ext.id}` });
                  toast.success("Extension added", { description: ext.name });
                }}
                className="surface flex items-center gap-3 rounded-xl border p-3 text-left transition-all hover:scale-[1.02]"
                style={{ borderColor: installed ? "var(--accent)" : "var(--border)", opacity: installed ? 0.6 : 1 }}
              >
                <span className="text-2xl">{ext.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{ext.name}</div>
                  <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{installed ? "Installed" : "Click to install"}</div>
                </div>
                <Plus className="h-4 w-4 flex-none" style={{ color: installed ? "var(--text-muted)" : "var(--accent)" }} />
              </button>
            );
          })}
        </div>
        <button
          onClick={() => {
            const installedUrls = new Set(extensions.map((e) => e.url));
            let added = 0;
            for (const ext of STARTER_EXTENSIONS) {
              if (!installedUrls.has(ext.url)) {
                addExtension({ ...ext, id: `ext_${Date.now()}_${ext.id}_${Math.random().toString(36).slice(2, 6)}` });
                added++;
              }
            }
            if (added > 0) {
              toast.success(`Installed ${added} starter extension${added === 1 ? "" : "s"}`);
            } else {
              toast.info("All starter extensions are already installed");
            }
          }}
          className="mt-3 flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:surface2"
          style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
        >
          <Download className="h-4 w-4" /> Install all starter extensions
        </button>
      </div>

      {/* Installed extensions */}
      <h2 className="mb-3 text-lg font-semibold">Installed ({extensions.length})</h2>
      {extensions.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          No extensions installed yet.
        </p>
      ) : (
        <div className="space-y-2">
          {extensions.map((ext) => (
            <div key={ext.id} className="surface flex items-center gap-3 rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
              <span className="text-2xl">{ext.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{ext.name}</div>
                <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{ext.url.slice(0, 60)}</div>
              </div>
              <a href={ext.url} target="_blank" rel="noopener" className="rounded-lg p-1.5 transition-colors hover:surface2" aria-label="Open">
                <ExternalLink className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              </a>
              <button onClick={() => removeExtension(ext.id)} className="rounded-lg p-1.5 transition-colors hover:surface2" aria-label="Remove">
                <Trash2 className="h-4 w-4" style={{ color: "#ef4444" }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
