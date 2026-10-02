"use client";

import { useEffect } from "react";
import { useNav } from "@/store/nav";
import { useSettings } from "@/store/settings";
import { ToolBar } from "@/components/ToolBar";
import { ThemeApplier } from "@/components/ThemeApplier";
import { HomeView } from "@/components/views/HomeView";
import { VideoWallpaper } from "@/components/VideoWallpaper";
import { PanicMode } from "@/components/PanicMode";
import { GamesView } from "@/components/views/GamesView";
import { MusicView } from "@/components/views/MusicView";
import { BrowserView } from "@/components/views/BrowserView";
import { AnimeView } from "@/components/views/AnimeView";
import { ExtensionsView } from "@/components/views/ExtensionsView";
import { FormsView } from "@/components/views/FormsView";
import { ToolsView } from "@/components/views/ToolsView";
import { SetupView } from "@/components/views/SetupView";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export default function Page() {
  const view = useNav((s) => s.view);
  const toolbarPos = useSettings((s) => s.toolbarPos);

  // Activate global keyboard shortcuts (Alt+H/B/A/M/G/F/E, Esc×3 panic, /).
  useKeyboardShortcuts();

  useEffect(() => {
    const el = document.getElementById("main-scroll");
    if (el) el.scrollTo({ top: 0 });
  }, [view]);

  const paddingStyle: React.CSSProperties = {
    ...(toolbarPos === "top" && { paddingTop: "5rem" }),
    ...(toolbarPos === "bottom" && { paddingBottom: "5rem" }),
    ...(toolbarPos === "left" && { paddingLeft: "5rem" }),
    ...(toolbarPos === "right" && { paddingRight: "5rem" }),
  };

  return (
    <>
      <ThemeApplier />
      <VideoWallpaper />
      <PanicMode />
      <div className="relative flex h-dvh w-full overflow-hidden" style={{ background: "var(--bg)" }}>
        <div className="pointer-events-none absolute inset-0 z-0" style={{ opacity: 0.88, background: "var(--bg)" }} />
        <main id="main-scroll" className="relative z-10 flex-1 overflow-y-auto" style={paddingStyle}>
          {view === "home" && <HomeView />}
          {view === "games" && <GamesView />}
          {view === "music" && <MusicView />}
          {view === "browser" && <BrowserView />}
          {view === "anime" && <AnimeView />}
          {view === "extensions" && <ExtensionsView />}
          {view === "forms" && <FormsView />}
          {view === "tools" && <ToolsView />}
          {view === "setup" && <SetupView />}
        </main>
      </div>
      <ToolBar />
    </>
  );
}
