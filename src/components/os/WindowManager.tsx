"use client";

import { useWindows } from "@/store/windows";
import { WindowFrame } from "./WindowFrame";
import { MusicApp } from "@/apps/MusicApp";
import { TerminalApp } from "@/apps/TerminalApp";
import { FilesApp } from "@/apps/FilesApp";
import { BrowserApp } from "@/apps/BrowserApp";
import { EditorApp } from "@/apps/EditorApp";
import { CalculatorApp } from "@/apps/CalculatorApp";
import { SettingsApp } from "@/apps/SettingsApp";
import { AboutApp } from "@/apps/AboutApp";

const APP_COMPONENTS: Record<string, () => JSX.Element> = {
  music: MusicApp,
  terminal: TerminalApp,
  files: FilesApp,
  browser: BrowserApp,
  editor: EditorApp,
  calculator: CalculatorApp,
  settings: SettingsApp,
  about: AboutApp,
};

export function WindowManager() {
  const windows = useWindows((s) => s.windows);

  return (
    <>
      {windows.map((win) => {
        const Comp = APP_COMPONENTS[win.appId];
        if (!Comp) return null;
        return (
          <WindowFrame key={win.id} win={win}>
            <Comp />
          </WindowFrame>
        );
      })}
    </>
  );
}
