"use client";

import { useEffect, useRef } from "react";
import { useNav } from "@/store/nav";
import { useSettings } from "@/store/settings";
import { toast } from "sonner";

/**
 * Global keyboard shortcuts for redux.
 *
 *   Alt + H           Go to Home
 *   Alt + B           Go to Browser
 *   Alt + A           Go to Anime
 *   Alt + M           Go to Music
 *   Alt + G           Go to Games
 *   Alt + E           Go to Extensions
 *   Alt + F           Go to Forms
 *   Alt + S           Open Settings panel (CustomEvent 'redux-open-settings')
 *   Alt + `           Open in about:blank (CustomEvent 'redux-about-blank')
 *   Esc  Esc  Esc     Toggle panic mode (disguise as fake Google Docs page)
 *   /                 Focus the home search bar (ignored when typing in an input)
 *
 * Shortcuts are ignored when focus is in an input, textarea, contenteditable,
 * or select element so typing a search query isn't hijacked.
 *
 * Panic mode is also exposed as a CustomEvent ('redux-panic-toggle') so the
 * toolbar panic button can trigger the same handler.
 */
export function useKeyboardShortcuts() {
  const setView = useNav((s) => s.setView);
  const enableKeyboardShortcuts = useSettings((s) => s.enableKeyboardShortcuts);
  const setPanicMode = useSettings((s) => s.setPanicMode);
  const panicMode = useSettings((s) => s.panicMode);
  // Esc triple-tap detection.
  const escPresses = useRef<number[]>([]);

  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handler = (e: KeyboardEvent) => {
      // Panic mode toggle: triple-Esc. Works even when typing in inputs so
      // you can panic from anywhere (e.g. mid-search).
      if (e.key === "Escape") {
        const now = Date.now();
        escPresses.current = escPresses.current.filter((t) => now - t < 700);
        escPresses.current.push(now);
        if (escPresses.current.length >= 3) {
          escPresses.current = [];
          setPanicMode(!panicMode);
          toast.success(panicMode ? "Panic off — welcome back" : "Panic on — disguised", {
            description: panicMode ? undefined : "Press Esc × 3 again to restore redux.",
          });
          return;
        }
      }

      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        if (
          tag === "input" ||
          tag === "textarea" ||
          target.isContentEditable ||
          tag === "select"
        ) {
          return;
        }
      }

      // Alt-modified shortcuts: view navigation + actions.
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const k = e.key.toLowerCase();
        const viewMap: Record<string, Parameters<typeof setView>[0]> = {
          h: "home",
          b: "browser",
          a: "anime",
          m: "music",
          g: "games",
          e: "extensions",
          f: "forms",
        };
        if (viewMap[k]) {
          e.preventDefault();
          setView(viewMap[k]);
          return;
        }
        if (k === "s") {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("redux-open-settings"));
          return;
        }
        if (k === "`") {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("redux-about-blank"));
          return;
        }
      }

      // `/` focuses the home search bar — but only when not in an input.
      if (e.key === "/" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setView("home");
        // Focus after the view swaps.
        setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>(".opium-search-bar input");
          input?.focus();
        }, 100);
      }
    };

    // Listen for external panic toggles (from the toolbar button).
    const panicHandler = () => {
      setPanicMode(!useSettings.getState().panicMode);
    };
    window.addEventListener("redux-panic-toggle", panicHandler);

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("redux-panic-toggle", panicHandler);
    };
  }, [setView, enableKeyboardShortcuts, setPanicMode, panicMode]);
}
