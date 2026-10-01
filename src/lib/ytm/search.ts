// Search the YouTube Music catalogue via Piped instances.
// Uses YTM-specific filters (music_songs, music_artists, music_albums) so
// results are always YouTube Music content — never general YouTube videos.
//
// Piped sends proper CORS headers, so a static site can call them directly.
// If all Piped instances are unreachable, we fall back to demo content so the
// UI remains functional.

import { withDataInstances } from "./data-instances";
import { demoSearch } from "./demo";
import type { SearchResults, YTMTrack, YTMArtist, YTMAlbum, YTMPlaylist } from "./types";
import { formatTime } from "@/lib/format";

type Any = Record<string, any>;

// --- Piped search response → domain types ------------------------------

function mapPipedSong(item: Any): YTMTrack | null {
  if (!item) return null;
  const url = item.url ?? "";
  const videoId = item.videoId ?? url.split("v=")[1] ?? "";
  if (!videoId) return null;
  return {
    videoId,
    title: item.title ?? "Unknown",
    artists: [
      {
        artistId: (item.uploaderUrl as string)?.replace("/channel/", "") || null,
        name: (item.uploaderName ?? "Unknown").replace(/ - Topic$/, ""),
      },
    ],
    duration: formatTime(item.duration ?? 0),
    durationSeconds: item.duration ?? 0,
    thumbnail: item.thumbnail ?? "",
  };
}

function mapPipedArtist(item: Any): YTMArtist | null {
  if (!item) return null;
  const url = item.url ?? "";
  const artistId = (url.split("/channel/")[1] ?? "").split("/")[0] ?? "";
  if (!artistId) return null;
  return {
    artistId,
    name: item.name ?? item.title ?? "Unknown",
    thumbnail: item.thumbnail ?? "",
    subscribers: item.subscribers ? `${item.subscribers} subscribers` : undefined,
  };
}

function mapPipedAlbum(item: Any): YTMAlbum | null {
  if (!item) return null;
  // Piped's music_albums filter returns playlist-like items with a
  // browseId/playlistId starting with "OLAK" or "MPRD".
  const url = item.url ?? "";
  const playlistId = (url.split("/playlist?list=")[1] ?? "").split("&")[0];
  const albumId = playlistId || item.browseId || "";
  if (!albumId) return null;
  return {
    albumId,
    title: item.name ?? item.title ?? "Unknown",
    year: item.date ?? undefined,
    thumbnail: item.thumbnail ?? "",
  };
}

function mapPipedPlaylist(item: Any): YTMPlaylist | null {
  if (!item) return null;
  const url = item.url ?? "";
  const playlistId = (url.split("/playlist?list=")[1] ?? "").split("&")[0];
  if (!playlistId) return null;
  return {
    playlistId,
    title: item.name ?? item.title ?? "Unknown",
    subtitle: item.uploaderName ?? "Playlist",
    thumbnail: item.thumbnail ?? "",
  };
}

// --- Public API --------------------------------------------------------

export async function search(query: string, signal?: AbortSignal): Promise<SearchResults> {
  if (!query.trim()) {
    return { tracks: [], artists: [], albums: [], playlists: [] };
  }

  try {
    return await withDataInstances(async (inst, sig) => {
      if (inst.kind !== "piped") {
        // Skip Invidious for search — it returns general YouTube, not YTM.
        throw new Error("Invidious does not support YTM search");
      }

      // Fetch songs, artists, and albums in parallel.
      const [songsRes, artistsRes, albumsRes] = await Promise.allSettled([
        fetch(`${inst.url}/search?q=${encodeURIComponent(query)}&filter=music_songs`, { signal: sig }).then((r) => r.json()),
        fetch(`${inst.url}/search?q=${encodeURIComponent(query)}&filter=music_artists`, { signal: sig }).then((r) => r.json()),
        fetch(`${inst.url}/search?q=${encodeURIComponent(query)}&filter=music_albums`, { signal: sig }).then((r) => r.json()),
      ]);

      const tracks: YTMTrack[] = [];
      const artists: YTMArtist[] = [];
      const albums: YTMAlbum[] = [];

      if (songsRes.status === "fulfilled") {
        for (const item of (songsRes.value as Any)?.items ?? []) {
          const t = mapPipedSong(item);
          if (t) tracks.push(t);
        }
      }
      if (artistsRes.status === "fulfilled") {
        for (const item of (artistsRes.value as Any)?.items ?? []) {
          const a = mapPipedArtist(item);
          if (a) artists.push(a);
        }
      }
      if (albumsRes.status === "fulfilled") {
        for (const item of (albumsRes.value as Any)?.items ?? []) {
          const a = mapPipedAlbum(item);
          if (a) albums.push(a);
        }
      }

      if (tracks.length === 0 && artists.length === 0 && albums.length === 0) {
        throw new Error("No results from Piped");
      }

      return {
        tracks: dedupe(tracks, (t) => t.videoId).slice(0, 30),
        artists: dedupe(artists, (a) => a.artistId ?? a.name).slice(0, 12),
        albums: dedupe(albums, (a) => a.albumId).slice(0, 12),
        playlists: [],
        topResult: tracks[0] ?? artists[0] ?? undefined,
      };
    }, signal);
  } catch {
    // All Piped instances failed — fall back to demo content so the UI works.
    return demoSearch(query);
  }
}

function dedupe<T>(arr: T[], key: (x: T) => string): T[] {
  return Array.from(new Map(arr.map((x) => [key(x), x])).values());
}

// Fetch the tracks in a playlist/album by browsing it via Piped.
export async function fetchPlaylistTracks(
  playlistId: string,
  signal?: AbortSignal,
): Promise<YTMTrack[]> {
  return withDataInstances(async (inst, sig) => {
    if (inst.kind !== "piped") throw new Error("Invidious not supported for YTM playlists");
    const res = await fetch(`${inst.url}/playlists/${playlistId}`, { signal: sig });
    if (!res.ok) throw new Error(`piped playlist ${res.status}`);
    const data = (await res.json()) as Any;
    const related = (data?.relatedStreams ?? [])
      .map((s: Any) => mapPipedSong({ ...s, type: "stream" }))
      .filter(Boolean) as YTMTrack[];
    return dedupe(related, (t) => t.videoId);
  }, signal);
}
