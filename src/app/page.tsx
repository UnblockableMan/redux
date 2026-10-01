"use client";

import { useEffect } from "react";
import { useNav } from "@/store/nav";
import { useSettings } from "@/store/settings";
import { ToolBar } from "@/components/ToolBar";
import { ThemeApplier } from "@/components/ThemeApplier";
import { HomeView } from "@/components/views/HomeView";
import { GamesView } from "@/components/views/GamesView";
import { MusicView } from "@/components/views/MusicView";
import { BrowserView } from "@/components/views/BrowserView";
import { AnimeView } from "@/components/views/AnimeView";
import { ExtensionsView } from "@/components/views/ExtensionsView";
import { SetupView } from "@/components/views/SetupView";

export default function Page() {
  const view = useNav((s) => s.view);
  const toolbarPos = useSettings((s) => s.toolbarPos);

  useEffect(() => {
    const el = document.getElementById("main-scroll");
    if (el) el.scrollTo({ top: 0 });
  }, [view]);

  // Apply padding based on toolbar position so content isn't hidden.
  const paddingStyle: React.CSSProperties = {
    ...(toolbarPos === "top" && { paddingTop: "5rem" }),
    ...(toolbarPos === "bottom" && { paddingBottom: "5rem" }),
    ...(toolbarPos === "left" && { paddingLeft: "5rem" }),
    ...(toolbarPos === "right" && { paddingRight: "5rem" }),
  };

  return (
    <>
      <ThemeApplier />
      <div className="flex h-dvh w-full overflow-hidden" style={{ background: "var(--bg)" }}>
        <main id="main-scroll" className="flex-1 overflow-y-auto" style={paddingStyle}>
          {view === "home" && <HomeView />}
          {view === "games" && <GamesView />}
          {view === "music" && <MusicView />}
          {view === "browser" && <BrowserView />}
          {view === "anime" && <AnimeView />}
          {view === "extensions" && <ExtensionsView />}
          {view === "setup" && <SetupView />}
        </main>
      </div>
      <ToolBar />
    </>
  );
}
