"use client";

import { useState } from "react";
import { Wrench, ExternalLink, BookOpen, Lock, Lightbulb, ChevronDown, ChevronRight } from "lucide-react";
import { useNav } from "@/store/nav";
import { toast } from "sonner";

// Study cheats — open in Browser view via Scramjet proxy.
interface Cheat {
  name: string;
  platform: string;
  url: string;
  icon: string;
  desc: string;
}

const STUDY_CHEATS: Cheat[] = [
  {
    name: "Blooket",
    platform: "blooket",
    url: "https://studyoutlaws.com/dashboard?platform=blooket",
    icon: "https://www.blooket.com/favicon.ico",
    desc: "Auto-answer, token farmer, host control, and more for Blooket games.",
  },
  {
    name: "Waygrounds",
    platform: "waygrounds",
    url: "https://studyoutlaws.com/dashboard?platform=wayground",
    icon: "https://waygrounds.com/favicon.ico",
    desc: "Cheats for the Waygrounds platform.",
  },
  {
    name: "Kahoot",
    platform: "kahoot",
    url: "https://studyoutlaws.com/dashboard?platform=kahoot",
    icon: "https://kahoot.com/favicon.ico",
    desc: "Auto-answer, spam bots, hidden answer reveal for Kahoot quizzes.",
  },
  {
    name: "Delta Math",
    platform: "deltamath",
    url: "https://studyoutlaws.com/dashboard?platform=deltamath",
    icon: "https://deltamath.com/favicon.ico",
    desc: "Auto-solver + show work for Delta Math problem sets.",
  },
  {
    name: "Membean",
    platform: "membean",
    url: "https://studyoutlaws.com/dashboard?platform=membean",
    icon: "https://www.membean.com/favicon.ico",
    desc: "Auto-answer + word-reveal for Membean vocabulary sessions.",
  },
];

const UNLOCK_STEPS_CHROME = [
  { step: "Open Chrome and click your profile picture in the top-right corner.", detail: "It's the circular icon next to the three-dot menu." },
  { step: "Click \"Sync is on\" or \"Sync\" in the dropdown.", detail: "A small popup will appear showing your sync status." },
  { step: "Click \"Manage what you sync\" or \"Customize sync\".", detail: "This opens the sync customization panel." },
  { step: "Toggle OFF every category: Apps, Bookmarks, History, Passwords, Settings, Themes, Wi-Fi networks, etc.", detail: "Or just toggle the top \"Sync everything\" switch to OFF — that kills all of them at once." },
  { step: "Click \"Turn off\" to confirm.", detail: "Sync is now disabled. Your school admin can no longer see your browsing." },
  { step: "Restart your computer.", detail: "Fully shut down (not sleep/restart). This ensures any cached sync state is flushed and the school's MDM profile doesn't auto-re-enable sync on next boot." },
];

const UNLOCK_STEPS_OS = [
  { step: "Open your computer's Settings app.", detail: "Windows: Start menu → Settings. macOS: Apple menu → System Settings." },
  { step: "Navigate to Accounts (Win) or Apple ID / Internet Accounts (Mac).", detail: "Look for any \"Work or school\" account listed." },
  { step: "Find the \"Sync\" or \"Connected accounts\" section.", detail: "On Windows it's under Accounts → Access work or school. On Mac it's under Internet Accounts." },
  { step: "For each connected account, click it and select \"Disconnect\" or \"Stop sync\".", detail: "This severs the link between your local account and the school's domain controller." },
  { step: "Restart your computer.", detail: "A full restart — not sleep. If you have admin rights, you may also want to remove the school's MDM profile." },
];

export function ToolsView() {
  const setView = useNav((s) => s.setView);
  const [expanded, setExpanded] = useState<"chrome" | "os" | null>("chrome");

  const openCheat = (c: Cheat) => {
    setView("browser");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("redux-browser-init", { detail: c.url }));
    }, 50);
    toast.info(`Loading ${c.name} cheats`, { description: c.desc });
  };

  return (
    <div className="fade-in p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Wrench className="h-6 w-6" style={{ color: "var(--accent)" }} />
        <div>
          <h1 className="text-2xl font-bold">Tools</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Computer unlock guides + study cheats (Blooket, Kahoot, Delta Math, Membean, Waygrounds).
          </p>
        </div>
      </div>

      {/* Computer Unlock guides */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4" style={{ color: "var(--accent)" }} />
          <h2 className="text-lg font-semibold">Unlock Your Computer</h2>
        </div>
        <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
          School-issued Chromebooks and managed accounts often have sync forced on, which lets your admin
          see your tabs, history, and passwords. Here's how to disable it. Use at your own risk — make sure
          you know what your school's policy is.
        </p>

        {/* Chrome sync unlock */}
        <div className="mb-4 rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => setExpanded(expanded === "chrome" ? null : "chrome")}
            className="flex w-full items-center justify-between p-4 text-left transition-colors hover:surface2"
            style={{ background: "var(--surface)" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌐</span>
              <div>
                <div className="font-medium">Method 1: Disable Chrome sync (recommended)</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Turn off all sync categories in Chrome, then restart.
                </div>
              </div>
            </div>
            {expanded === "chrome" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {expanded === "chrome" && (
            <div className="p-4" style={{ background: "var(--bg)" }}>
              <ol className="space-y-3">
                {UNLOCK_STEPS_CHROME.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold" style={{ background: "var(--accent)", color: "var(--bg)" }}>{i + 1}</span>
                    <div>
                      <div className="text-sm font-medium">{s.step}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.detail}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-4 rounded-lg border p-3 text-xs" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
                <Lightbulb className="inline h-3.5 w-3.5 mr-1" style={{ color: "var(--accent)" }} />
                <strong>Tip:</strong> If your school blocks the sync settings page, you can also sign out of
                your Chrome profile entirely (Settings → You and Google → Turn off sync → Sign out). After
                that, browse in Incognito or as a guest to leave no local trace.
              </div>
            </div>
          )}
        </div>

        {/* OS-level sync unlock */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => setExpanded(expanded === "os" ? null : "os")}
            className="flex w-full items-center justify-between p-4 text-left transition-colors hover:surface2"
            style={{ background: "var(--surface)" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚙️</span>
              <div>
                <div className="font-medium">Method 2: Disable OS-level sync (Windows/Mac)</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Disconnect work or school accounts from your system settings.
                </div>
              </div>
            </div>
            {expanded === "os" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {expanded === "os" && (
            <div className="p-4" style={{ background: "var(--bg)" }}>
              <ol className="space-y-3">
                {UNLOCK_STEPS_OS.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold" style={{ background: "var(--accent)", color: "var(--bg)" }}>{i + 1}</span>
                    <div>
                      <div className="text-sm font-medium">{s.step}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.detail}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </section>

      {/* Study cheats */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4" style={{ color: "var(--accent)" }} />
          <h2 className="text-lg font-semibold">Study Cheats</h2>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>via studyoutlaws.com</span>
        </div>
        <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
          Each cheat dashboard opens in the proxy browser. Cheats work for live quizzes — they auto-answer
          questions, reveal hidden options, farm tokens, and more.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STUDY_CHEATS.map((c) => (
            <button
              key={c.platform}
              onClick={() => openCheat(c)}
              className="group surface flex items-center gap-3 rounded-xl border p-4 text-left transition-all hover:scale-[1.02]"
              style={{ borderColor: "var(--border)" }}
              title={c.desc}
            >
              <img
                src={c.icon}
                alt=""
                className="h-10 w-10 flex-none rounded-lg object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{c.name}</div>
                <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{c.desc}</div>
              </div>
              <ExternalLink className="h-4 w-4 flex-none opacity-50 transition-opacity group-hover:opacity-100" style={{ color: "var(--accent)" }} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
