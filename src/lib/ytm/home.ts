// Home / trending content via Piped / Invidious.

import { withDataInstances } from "./data-instances";
import type { HomeSection, YTMTrack, YTMArtist } from "./types";
import { formatTime } from "@/lib/format";

type Any = Record<string, any>;

export async function fetchHome(signal?: AbortSignal): Promise<HomeSection[]> {
  return withDataInstances(async (inst, sig) => {
    if (inst.kind === "piped") {
      const res = await fetch(`${inst.url}/trending?region=US`, { signal: sig });
      if (!res.ok) throw new Error(`piped trending ${res.status}`);
      const data = (await res.json()) as Any[];
      const tracks: YTMTrack[] = data
        .filter((d) => d.url || d.videoId)
        .map((d) => {
          const url = d.url ?? "";
          const videoId = d.videoId ?? url.split("v=")[1] ?? "";
          return {
            videoId,
            title: d.title ?? "Unknown",
            artists: [
              {
                artistId: (d.uploaderUrl ?? "").replace("/channel/", "") || null,
                name: (d.uploaderName ?? "Unknown").replace(/ - Topic$/, ""),
              },
            ],
            duration: formatTime(d.duration ?? 0),
            durationSeconds: d.duration ?? 0,
            thumbnail: d.thumbnail ?? "",
          } as YTMTrack;
        })
        .filter((t) => t.videoId);
      return [
        { title: "Trending now", items: tracks.slice(0, 18) },
        { title: "More trending", items: tracks.slice(18, 36) },
      ].filter((s) => s.items.length > 0);
    }

    // Invidious
    const res = await fetch(`${inst.url}/api/v1/trending?region=US`, { signal: sig });
    if (!res.ok) throw new Error(`invidious trending ${res.status}`);
    const data = (await res.json()) as Any[];
    const tracks: YTMTrack[] = data
      .filter((d) => d.videoId)
      .map((d) => {
        const thumbs = d.videoThumbnails ?? [];
        const thumb = thumbs.sort((a: Any, b: Any) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? "";
        return {
          videoId: d.videoId,
          title: d.title ?? "Unknown",
          artists: [
            {
              artistId: d.authorId ?? null,
              name: (d.author ?? "Unknown").replace(/ - Topic$/, ""),
            },
          ],
          duration: formatTime(d.lengthSeconds ?? 0),
          durationSeconds: d.lengthSeconds ?? 0,
          thumbnail: thumb,
        } as YTMTrack;
      });
    // Build a "spotlight" section of artist cards from the unique authors.
    const artistMap = new Map<string, YTMArtist>();
    for (const t of tracks) {
      const a = t.artists[0];
      if (a?.artistId && !artistMap.has(a.artistId)) {
        artistMap.set(a.artistId, {
          artistId: a.artistId,
          name: a.name,
          thumbnail: t.thumbnail,
        });
      }
    }
    return [
      { title: "Trending now", items: tracks.slice(0, 18) },
      { title: "Artists to watch", items: Array.from(artistMap.values()).slice(0, 12) },
    ].filter((s) => s.items.length > 0);
  }, signal);
}
