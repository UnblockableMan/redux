"use client";

import { useEffect, useState } from "react";
import { Volume2, Wifi, BatteryFull } from "lucide-react";
import { useOSSettings } from "@/store/os-settings";

export function TopBar() {
  const [time, setTime] = useState(new Date());
  const accent = useOSSettings((s) => s.accent);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const dateStr = time.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="fixed top-0 left-0 right-0 z-[9000] flex h-7 items-center justify-between border-b border-white/10 bg-black/30 px-3 text-xs text-white/90 backdrop-blur-2xl">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-semibold">
          <img src="/logo.svg" alt="" className="h-3.5 w-3.5" />
          <span style={{ color: "var(--accent)" }}>abroad</span>
          <span className="text-white/40">OS</span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-white/70">
        <Volume2 className="h-3.5 w-3.5" />
        <Wifi className="h-3.5 w-3.5" />
        <BatteryFull className="h-3.5 w-3.5" />
        <span className="text-white/90">{dateStr}</span>
        <span className="font-medium text-white/90 tabular-nums">{timeStr}</span>
      </div>
    </div>
  );
}
