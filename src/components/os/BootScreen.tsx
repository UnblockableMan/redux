"use client";

import { useEffect, useState } from "react";
import { useOSSettings } from "@/store/os-settings";

export function BootScreen() {
  const setBooted = useOSSettings((s) => s.setBooted);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          setTimeout(() => setBooted(true), 300);
          return 100;
        }
        return p + 4;
      });
    }, 60);
    return () => clearInterval(id);
  }, [setBooted]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#e8332a]/20" />
          <img src="/logo.svg" alt="abroad" className="relative h-20 w-20" />
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold tracking-tight text-white">abroad</div>
          <div className="text-xs uppercase tracking-[0.3em] text-white/40">OS</div>
        </div>
        {/* Progress bar */}
        <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#e8332a] transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-[11px] text-white/30">Starting up…</div>
      </div>
    </div>
  );
}
