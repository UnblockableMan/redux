"use client";

// Optional looping video background (sources: cineosweb.github.io / custom URL).
// Renders behind all UI; dims itself so themes stay readable.

import { useEffect, useMemo, useRef } from "react";
import { useSettings, VIDEO_WALLPAPERS } from "@/store/settings";

export function VideoWallpaper() {
  const videoWallpaper = useSettings((s) => s.videoWallpaper);
  const customVideoUrl = useSettings((s) => s.customVideoUrl);
  const ref = useRef<HTMLVideoElement | null>(null);

  const url = useMemo(() => {
    if (videoWallpaper === "none") return "";
    if (videoWallpaper === "custom") return customVideoUrl.trim();
    return VIDEO_WALLPAPERS.find((v) => v.id === videoWallpaper)?.url || "";
  }, [videoWallpaper, customVideoUrl]);

  useEffect(() => {
    // Autoplay policies: ensure muted + play attempt on mount/change.
    const el = ref.current;
    if (el) el.play().catch(() => {});
  }, [url]);

  if (!url) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <video
        ref={ref}
        key={url}
        src={url}
        className="h-full w-full object-cover"
        style={{ opacity: 0.32 }}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.25)" }} />
    </div>
  );
}
