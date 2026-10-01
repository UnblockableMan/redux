"use client";

import { X, Palette, Server, Eye, Info } from "lucide-react";
import { useSettings, THEMES, type ThemeId } from "@/store/settings";
import { useNav } from "@/store/nav";
import { cn } from "@/lib/utils";

const CLOAK_PRESETS = [
  { title: "", icon: "", label: "None" },
  { title: "Google", icon: "https://google.com/favicon.ico", label: "Google" },
  { title: "My Drive - Google Drive", icon: "https://drive.google.com/favicon.ico", label: "Drive" },
  { title: "Classes", icon: "https://classroom.google.com/favicon.ico", label: "Classroom" },
  { title: "Gmail", icon: "https://mail.google.com/favicon.ico", label: "Gmail" },
  { title: "docs.google.com", icon: "https://docs.google.com/favicon.ico", label: "Docs" },
];

export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, wispUrl, cloakTitle, cloakIcon, setupDone, setTheme, setWispUrl, setCloak, setSetupDone } = useSettings();
  const setView = useNav((s) => s.setView);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/60 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed right-0 top-0 z-[61] flex h-full w-full max-w-sm flex-col border-l transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:surface2" aria-label="Close">
            <X className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <Section icon={<Palette className="h-4 w-4" />} title="Theme">
            <div className="grid grid-cols-5 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as ThemeId)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all",
                    theme === t.id ? "scale-105" : "opacity-60 hover:opacity-100",
                  )}
                  style={{ borderColor: theme === t.id ? t.accent : "transparent", background: t.bg }}
                  title={t.label}
                >
                  <div className="flex gap-1">
                    <span className="h-4 w-4 rounded" style={{ background: t.text }} />
                    <span className="h-4 w-4 rounded" style={{ background: t.accent }} />
                  </div>
                  <span className="text-[10px]" style={{ color: t.text }}>{t.label}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section icon={<Server className="h-4 w-4" />} title="Proxy (Wisp)">
            <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Wisp endpoint for the Browser app (Scramjet transport). Replace with your own for reliability.
            </p>
            <input
              value={wispUrl}
              onChange={(e) => setWispUrl(e.target.value)}
              placeholder="wss://your-wisp-server:443"
              className="w-full rounded-lg border bg-transparent px-3 py-2 font-mono text-xs outline-none"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
              spellCheck={false}
            />
          </Section>

          <Section icon={<Eye className="h-4 w-4" />} title="Tab Cloak">
            <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>Disguise this tab.</p>
            <div className="grid grid-cols-3 gap-2">
              {CLOAK_PRESETS.map((c) => {
                const active = cloakTitle === c.title;
                return (
                  <button
                    key={c.label}
                    onClick={() => setCloak(c.title, c.icon)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-2 py-2 text-xs transition-all",
                      active ? "border-current" : "opacity-60 hover:opacity-100",
                    )}
                    style={{ borderColor: active ? "var(--accent)" : "var(--border)" }}
                  >
                    {c.icon ? <img src={c.icon} alt="" className="h-4 w-4" /> : <span className="h-4 w-4" />}
                    <span className="truncate">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section icon={<Info className="h-4 w-4" />} title="Setup">
            <button
              onClick={() => { setSetupDone(true); setView("setup"); onClose(); }}
              className="w-full rounded-lg border px-3 py-2 text-sm transition-colors hover:surface2"
              style={{ borderColor: "var(--border)" }}
            >
              Open setup guide
            </button>
            <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Status: {setupDone ? "Completed" : "Not completed"}
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
        {icon}{title}
      </div>
      {children}
    </section>
  );
}
