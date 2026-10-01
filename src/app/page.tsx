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
import { SetupView } from "@/components/views/SetupView";
import { PlayerAudio } from "@/components/player/PlayerAudio";

export default function Page() {
  const view = useNav((s) => s.view);

  useEffect(() => {
    const el = document.getElementById("main-scroll");
    if (el) el.scrollTo({ top: 0 });
  }, [view]);

  return (
    <>
      <ThemeApplier />
      <div className="flex h-dvh w-full overflow-hidden" style={{ background: "var(--bg)" }}>
        <main id="main-scroll" className="flex-1 overflow-y-auto pt-20">
          {view === "home" && <HomeView />}
          {view === "games" && <GamesView />}
          {view === "music" && <MusicView />}
          {view === "browser" && <BrowserView />}
          {view === "anime" && <AnimeView />}
          {view === "setup" && <SetupView />}
        </main>
      </div>
      <ToolBar />
      <PlayerAudio />
    </>
  );
}
