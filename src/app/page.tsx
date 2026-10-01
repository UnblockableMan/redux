"use client";

import { useEffect } from "react";
import { useOSSettings } from "@/store/os-settings";
import { BootScreen } from "@/components/os/BootScreen";
import { Desktop } from "@/components/os/Desktop";
import { TopBar } from "@/components/os/TopBar";
import { Dock } from "@/components/os/Dock";
import { WindowManager } from "@/components/os/WindowManager";
import { PlayerAudio } from "@/components/player/PlayerAudio";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { ACCENTS } from "@/store/os-settings";

export default function Page() {
  const { booted, accent, reducedMotion } = useOSSettings();
  useKeyboardShortcuts();

  // Apply the accent color as a CSS variable on the root.
  useEffect(() => {
    const a = ACCENTS.find((x) => x.id === accent) ?? ACCENTS[0];
    // Override the theme's primary color with the OS accent selection.
    document.documentElement.style.setProperty("--primary", a.color);
    document.documentElement.style.setProperty("--ring", a.color);
    document.documentElement.style.setProperty("--sidebar-primary", a.color);
    document.documentElement.style.setProperty("--sidebar-ring", a.color);
    document.documentElement.setAttribute("data-accent", accent);
  }, [accent]);

  // Apply reduced-motion class.
  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reducedMotion);
  }, [reducedMotion]);

  if (!booted) return <BootScreen />;

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <Desktop />
      <TopBar />
      <WindowManager />
      <Dock />

      {/* The music player's audio engine lives at the OS root so audio
          keeps playing even when the music window is closed. */}
      <PlayerAudio />
    </div>
  );
}
