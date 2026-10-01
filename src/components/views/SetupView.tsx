"use client";

import { useState } from "react";
import { Check, Copy, Terminal, Cloud, Server, BookOpen } from "lucide-react";
import { useSettings } from "@/store/settings";
import { useNav } from "@/store/nav";
import { toast } from "sonner";

const STEPS = [
  {
    title: "Clone the repo",
    icon: Terminal,
    code: `git clone https://github.com/yourname/abroad.git
cd abroad
npm install`,
  },
  {
    title: "Set up a Wisp server (for the proxy browser)",
    icon: Server,
    desc: "The Browser app needs a Wisp endpoint to proxy traffic. You can run your own or use a public one.",
    code: `# Using the official Wisp server (Node.js)
npx @mercuryworkshop/wisp-server

# Or deploy to a free service like Render/Railway
# See: https://github.com/MercuryWorkshop/wisp-server`,
  },
  {
    title: "Configure your Wisp URL",
    icon: Server,
    desc: "Open Settings (gear icon in the tool belt) and paste your Wisp URL. Default is a public endpoint — replace it with your own for reliability.",
  },
  {
    title: "Build for production",
    icon: Cloud,
    code: `# Static build — outputs to ./out
npm run build:cf

# The ./out folder is fully static. Deploy it anywhere.`,
  },
  {
    title: "Deploy to Cloudflare Pages",
    icon: Cloud,
    desc: "Push to GitHub, then connect the repo to Cloudflare Pages.",
    code: `# Cloudflare Pages settings:
#   Build command:    npm run build:cf
#   Build output:     out
#   Node version:     20

# Or use the CLI:
npx wrangler pages deploy out --project-name abroad`,
  },
  {
    title: "Done!",
    icon: Check,
    desc: "Your proxy hub is live. Open it, browse, play games, stream music. Everything runs in the browser — no server to maintain (except Wisp for the proxy).",
  },
];

export function SetupView() {
  const { setupDone, setSetupDone, wispUrl } = useSettings();
  const setView = useNav((s) => s.setView);
  const [copied, setCopied] = useState<number | null>(null);

  const copy = (code: string, i: number) => {
    navigator.clipboard.writeText(code);
    setCopied(i);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fade-in mx-auto max-w-3xl p-6 lg:p-10">
      <div className="mb-8 flex items-center gap-3">
        <BookOpen className="h-6 w-6" style={{ color: "var(--accent)" }} />
        <div>
          <h1 className="text-2xl font-bold">Setup Guide</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Get abroad running in under 5 minutes.
          </p>
        </div>
      </div>

      {/* Current config */}
      <div className="mb-8 rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="mb-1 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Current Wisp endpoint
        </div>
        <code className="block truncate font-mono text-sm" style={{ color: "var(--accent)" }}>
          {wispUrl}
        </code>
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          Change this in Settings → Proxy.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="surface rounded-xl border p-5" style={{ borderColor: "var(--border)" }}>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-sm font-bold" style={{ background: "var(--surface2)", color: "var(--accent)" }}>
                  {i + 1}
                </div>
                <Icon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                <h3 className="font-semibold">{step.title}</h3>
              </div>
              {step.desc && (
                <p className="mb-3 ml-11 text-sm" style={{ color: "var(--text-muted)" }}>
                  {step.desc}
                </p>
              )}
              {step.code && (
                <div className="ml-11 overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                  <div className="flex items-center justify-between border-b px-3 py-1.5" style={{ borderColor: "var(--border)" }}>
                    <span className="font-mono text-[10px] uppercase" style={{ color: "var(--text-muted)" }}>bash</span>
                    <button
                      onClick={() => copy(step.code!, i)}
                      className="flex items-center gap-1 text-[10px] transition-colors hover:text-current"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {copied === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied === i ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed" style={{ color: "var(--text)" }}>
                    <code>{step.code}</code>
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Complete button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => {
            setSetupDone(true);
            setView("home");
            toast.success("Setup complete!");
          }}
          className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
          style={{ background: "var(--accent)", color: "var(--bg)" }}
        >
          <Check className="h-4 w-4" /> Mark as complete
        </button>
      </div>
    </div>
  );
}
