// Album and artist pages via Piped / Invidious.

import { withDataInstances } from "./data-instances";
import type { YTMAlbum, YTMArtist, YTMTrack } from "./types";
import { formatTime } from "@/lib/format";

type Any = Record<string, any>;

function bestThumb(thumbs: Any[] | undefined): string {
  if (!Array.isArray(thumbs) || !thumbs.length) return "";
  return [...thumbs].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? "";
}

export async function fetchAlbum(
  albumId: string,
  signal?: AbortSignal,
): Promise<{ album: YTMAlbum; tracks: YTMTrack[] }> {
  return withDataInstances(async (inst, sig) => {
    if (inst.kind === "piped") {
      const res = await fetch(`${inst.url}/playlists/${albumId}`, { signal: sig });
      if (!res.ok) throw new Error(`piped album ${res.status}`);
      const data = (await res.json()) as Any;
      const tracks: YTMTrack[] = (data?.relatedStreams ?? [])
        .map((s: Any, i: number) => {
          const url = s.url ?? "";
          const videoId = s.videoId ?? url.split("v=")[1] ?? "";
          if (!videoId) return null;
          return {
            videoId,
            title: s.title ?? `Track ${i + 1}`,
            artists: [
              {
                artistId: (s.uploaderUrl ?? "").replace("/channel/", "") || null,
                name: (s.uploaderName ?? data?.name ?? "Unknown").replace(/ - Topic$/, ""),
              },
            ],
            album: { albumId, title: data?.name ?? "Album" },
            duration: formatTime(s.duration ?? 0),
            durationSeconds: s.duration ?? 0,
            thumbnail: s.thumbnail ?? data?.thumbnailUrl ?? "",
          } as YTMTrack;
        })
        .filter(Boolean) as YTMTrack[];
      return {
        album: {
          albumId,
          title: data?.name ?? "Album",
          thumbnail: data?.thumbnailUrl ?? "",
          trackCount: tracks.length,
        },
        tracks,
      };
    }
    // Invidious
    const res = await fetch(`${inst.url}/api/v1/playlists/${albumId}`, { signal: sig });
    if (!res.ok) throw new Error(`invidious album ${res.status}`);
    const data = (await res.json()) as Any;
    const tracks: YTMTrack[] = (data?.videos ?? [])
      .map((v: Any, i: number) => {
        if (!v.videoId) return null;
        return {
          videoId: v.videoId,
          title: v.title ?? `Track ${i + 1}`,
          artists: [
            {
              artistId: data.authorId ?? null,
              name: (data.title ?? "Unknown").replace(/ - Topic$/, ""),
            },
          ],
          album: { albumId, title: data.title ?? "Album" },
          duration: formatTime(v.lengthSeconds ?? 0),
          durationSeconds: v.lengthSeconds ?? 0,
          thumbnail: bestThumb(v.videoThumbnails) ?? bestThumb(data.playlistThumbnails) ?? "",
        } as YTMTrack;
      })
      .filter(Boolean) as YTMTrack[];
    return {
      album: {
        albumId,
        title: data?.title ?? "Album",
        thumbnail: bestThumb(data?.playlistThumbnails) ?? "",
        trackCount: tracks.length,
      },
      tracks,
    };
  }, signal);
}

export async function fetchArtist(
  artistId: string,
  signal?: AbortSignal,
): Promise<YTMArtist & { topTracks: YTMTrack[]; albums: YTMAlbum[]; singles: YTMAlbum[] }> {
  return withDataInstances(async (inst, sig) => {
    if (inst.kind === "piped") {
      const res = await fetch(`${inst.url}/channel/${artistId}`, { signal: sig });
      if (!res.ok) throw new Error(`piped artist ${res.status}`);
      const data = (await res.json()) as Any;
      const name = (data?.name ?? "Artist").replace(/ - Topic$/, "");
      const thumbnail = data?.avatarUrl ?? "";
      const subscriberCount = data?.subscriberCount;
      const subscribers = subscriberCount ? `${subscriberCount} subscribers` : undefined;

      // Piped returns relatedStreams (videos) on a channel.
      const topTracks: YTMTrack[] = (data?.relatedStreams ?? [])
        .map((s: Any) => {
          const url = s.url ?? "";
          const videoId = s.videoId ?? url.split("v=")[1] ?? "";
          if (!videoId) return null;
          return {
            videoId,
            title: s.title ?? "Unknown",
            artists: [{ artistId, name }],
            duration: formatTime(s.duration ?? 0),
            durationSeconds: s.duration ?? 0,
            thumbnail: s.thumbnail ?? "",
          } as YTMTrack;
        })
        .filter(Boolean) as YTMTrack[];

      // Piped doesn't expose albums separately on channels reliably, so we
      // synthesize a "Popular uploads" section as singles.
      const singles: YTMAlbum[] = [];

      return {
        artistId,
        name,
        thumbnail,
        subscribers,
        description: data?.description?.slice(0, 400) ?? "",
        topTracks: dedupe(topTracks, (t) => t.videoId).slice(0, 15),
        albums: [],
        singles,
      };
    }
    // Invidious
    const res = await fetch(`${inst.url}/api/v1/channels/${artistId}`, { signal: sig });
    if (!res.ok) throw new Error(`invidious artist ${res.status}`);
    const data = (await res.json()) as Any;
    const name = (data?.author ?? "Artist").replace(/ - Topic$/, "");
    const thumbnail = bestThumb(data?.authorThumbnails) ?? "";
    const subscribers = data?.subCount ? `${data.subCount} subscribers` : undefined;

    const topTracks: YTMTrack[] = (data?.latestVideos ?? [])
      .map((v: Any) => {
        if (!v.videoId) return null;
        return {
          videoId: v.videoId,
          title: v.title ?? "Unknown",
          artists: [{ artistId, name }],
          duration: formatTime(v.lengthSeconds ?? 0),
          durationSeconds: v.lengthSeconds ?? 0,
          thumbnail: bestThumb(v.videoThumbnails) ?? "",
        } as YTMTrack;
      })
      .filter(Boolean) as YTMTrack[];

    // Invidious exposes playlists on channels — use them as "albums".
    const albums: YTMAlbum[] = (data?.playlists ?? [])
      .map((p: Any) => {
        if (!p.playlistId) return null;
        return {
          albumId: p.playlistId,
          title: p.title ?? "Album",
          thumbnail: bestThumb(p.playlistThumbnails) ?? "",
          trackCount: p.videoCount,
        } as YTMAlbum;
      })
      .filter(Boolean) as YTMAlbum[];

    return {
      artistId,
      name,
      thumbnail,
      subscribers,
      description: (data?.description ?? "").slice(0, 400),
      topTracks: dedupe(topTracks, (t) => t.videoId).slice(0, 15),
      albums: dedupe(albums, (a) => a.albumId).slice(0, 12),
      singles: [],
    };
  }, signal);
}

function dedupe<T>(arr: T[], key: (x: T) => string): T[] {
  return Array.from(new Map(arr.map((x) => [key(x), x])).values());
}
