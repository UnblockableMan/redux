// Search the YouTube Music catalogue via Piped / Invidious instances.
// These send proper CORS headers, so a static site can call them directly.

import { withDataInstances } from "./data-instances";
import type { SearchResults, YTMTrack, YTMArtist, YTMAlbum, YTMPlaylist } from "./types";
import { formatTime } from "@/lib/format";

type Any = Record<string, any>;

function parseDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "";
  return formatTime(seconds);
}

// --- Piped search response → domain types ------------------------------

function mapPipedItem(item: Any): YTMTrack | YTMArtist | YTMAlbum | YTMPlaylist | null {
  if (!item) return null;
  const type = item.type ?? item.kind;
  // Stream = a playable track.
  if (type === "stream") {
    const url = item.url ?? "";
    const videoId = item.videoId ?? url.split("v=")[1] ?? url.split("/").pop() ?? "";
    if (!videoId) return null;
    return {
      videoId,
      title: item.title ?? "Unknown",
      artists: item.uploaderUrl
        ? [
            {
              artistId: (item.uploaderUrl as string).replace("/channel/", "") || null,
              name: (item.uploaderName ?? "Unknown").replace(/ - Topic$/, ""),
            },
          ]
        : [{ artistId: null, name: item.uploaderName ?? "Unknown" }],
      duration: parseDuration(item.duration),
      durationSeconds: item.duration ?? 0,
      thumbnail: item.thumbnail ?? "",
    } as YTMTrack;
  }
  // Channel = an artist.
  if (type === "channel") {
    const url = item.url ?? "";
    const artistId = (url.split("/channel/")[1] ?? "").split("/")[0] ?? item.url ?? "";
    if (!artistId) return null;
    return {
      artistId,
      name: item.name ?? item.title ?? "Unknown",
      thumbnail: item.thumbnail ?? "",
      subscribers: item.subscribers ? `${item.subscribers} subscribers` : undefined,
    } as YTMArtist;
  }
  // Playlist = an album or playlist.
  if (type === "playlist") {
    const url = item.url ?? "";
    const playlistId = (url.split("/playlist?list=")[1] ?? url.split("/")[2] ?? "").split("&")[0];
    if (!playlistId) return null;
    // Piped doesn't distinguish albums from playlists, so we treat them all
    // as playlists. The album page handles browseId starting with "OLAK".
    return {
      playlistId,
      title: item.name ?? item.title ?? "Unknown",
      subtitle: item.uploaderName ?? item.description ?? "Playlist",
      thumbnail: item.thumbnail ?? "",
    } as YTMPlaylist;
  }
  return null;
}

// --- Invidious search response → domain types --------------------------

function mapInvidiousItem(item: Any): YTMTrack | YTMArtist | YTMAlbum | YTMPlaylist | null {
  if (!item) return null;
  const type = item.type;
  if (type === "video") {
    if (!item.videoId) return null;
    const thumbs = item.videoThumbnails ?? [];
    const thumb = thumbs.sort((a: Any, b: Any) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? "";
    return {
      videoId: item.videoId,
      title: item.title ?? "Unknown",
      artists: [
        {
          artistId: item.authorId ?? null,
          name: (item.author ?? "Unknown").replace(/ - Topic$/, ""),
        },
      ],
      duration: parseDuration(item.lengthSeconds),
      durationSeconds: item.lengthSeconds ?? 0,
      thumbnail: thumb,
    } as YTMTrack;
  }
  if (type === "channel") {
    if (!item.authorId) return null;
    const thumbs = item.authorThumbnails ?? [];
    const thumb = thumbs[thumbs.length - 1]?.url ?? "";
    return {
      artistId: item.authorId,
      name: item.author ?? "Unknown",
      thumbnail: thumb,
      subscribers: item.subCount ? `${item.subCount} subscribers` : undefined,
    } as YTMArtist;
  }
  if (type === "playlist") {
    if (!item.playlistId) return null;
    const thumbs = item.playlistThumbnails ?? item.thumbnails ?? [];
    const thumb = thumbs[0]?.url ?? "";
    return {
      playlistId: item.playlistId,
      title: item.title ?? "Unknown",
      subtitle: item.videoCount ? `${item.videoCount} videos` : "Playlist",
      thumbnail: thumb,
    } as YTMPlaylist;
  }
  return null;
}

// --- Public API --------------------------------------------------------

export async function search(query: string, signal?: AbortSignal): Promise<SearchResults> {
  if (!query.trim()) {
    return { tracks: [], artists: [], albums: [], playlists: [] };
  }

  return withDataInstances(async (inst, sig) => {
    if (inst.kind === "piped") {
      // Piped supports a music-specific filter which surfaces songs, albums,
      // artists and playlists in a single request.
      const url = `${inst.url}/search?q=${encodeURIComponent(query)}&filter=music_songs`;
      const res = await fetch(url, { signal: sig });
      if (!res.ok) throw new Error(`piped search ${res.status}`);
      const data = (await res.json()) as Any;
      const items = (data?.items ?? []).map(mapPipedItem).filter(Boolean);

      // Also fetch music_albums + music_artists in parallel for richer results.
      try {
        const [albumsRes, artistsRes] = await Promise.all([
          fetch(`${inst.url}/search?q=${encodeURIComponent(query)}&filter=music_albums`, { signal: sig }).then((r) => r.json()).catch(() => null),
          fetch(`${inst.url}/search?q=${encodeURIComponent(query)}&filter=music_artists`, { signal: sig }).then((r) => r.json()).catch(() => null),
        ]);
        const albumItems = ((albumsRes as Any)?.items ?? []).map(mapPipedItem).filter(Boolean);
        const artistItems = ((artistsRes as Any)?.items ?? []).map(mapPipedItem).filter(Boolean);
        items.push(...albumItems, ...artistItems);
      } catch {
        // Non-fatal — the songs response is enough.
      }

      return categorize(items as any[]);
    }

    // Invidious
    const url = `${inst.url}/api/v1/search?q=${encodeURIComponent(query)}&type=all`;
    const res = await fetch(url, { signal: sig });
    if (!res.ok) throw new Error(`invidious search ${res.status}`);
    const data = (await res.json()) as Any[];
    const items = data.map(mapInvidiousItem).filter(Boolean);
    return categorize(items as any[]);
  }, signal);
}

function categorize(items: (YTMTrack | YTMArtist | YTMAlbum | YTMPlaylist)[]): SearchResults {
  const tracks: YTMTrack[] = [];
  const artists: YTMArtist[] = [];
  const albums: YTMAlbum[] = [];
  const playlists: YTMPlaylist[] = [];
  for (const item of items) {
    if ((item as any).videoId) tracks.push(item as YTMTrack);
    else if ((item as any).artistId && !(item as any).playlistId) artists.push(item as YTMArtist);
    else if ((item as any).playlistId) playlists.push(item as YTMPlaylist);
  }
  return {
    tracks: dedupe(tracks, (t) => t.videoId).slice(0, 30),
    artists: dedupe(artists, (a) => a.artistId ?? a.name).slice(0, 12),
    albums: dedupe(albums, (a) => a.albumId).slice(0, 12),
    playlists: dedupe(playlists, (p) => p.playlistId).slice(0, 12),
    topResult: tracks[0] ?? artists[0] ?? undefined,
  };
}

function dedupe<T>(arr: T[], key: (x: T) => string): T[] {
  return Array.from(new Map(arr.map((x) => [key(x), x])).values());
}

// Fetch the tracks in a playlist/album by browsing it via Piped/Invidious.
export async function fetchPlaylistTracks(
  playlistId: string,
  signal?: AbortSignal,
): Promise<YTMTrack[]> {
  return withDataInstances(async (inst, sig) => {
    if (inst.kind === "piped") {
      const res = await fetch(`${inst.url}/playlists/${playlistId}`, { signal: sig });
      if (!res.ok) throw new Error(`piped playlist ${res.status}`);
      const data = (await res.json()) as Any;
      const related = (data?.relatedStreams ?? []).map((s: Any) => mapPipedItem({ ...s, type: "stream" })).filter(Boolean) as YTMTrack[];
      return dedupe(related, (t) => t.videoId);
    }
    // Invidious
    const res = await fetch(`${inst.url}/api/v1/playlists/${playlistId}`, { signal: sig });
    if (!res.ok) throw new Error(`invidious playlist ${res.status}`);
    const data = (await res.json()) as Any;
    const videos = (data?.videos ?? []).map((v: Any) =>
      mapInvidiousItem({ ...v, type: "video", authorId: data.authorId, author: data.title }),
    ).filter(Boolean) as YTMTrack[];
    return dedupe(videos, (t) => t.videoId);
  }, signal);
}
