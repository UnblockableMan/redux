// Helpers to walk YouTube Music's nested InnerTube responses.
// InnerTube is deeply nested, so small helper functions keep the code readable.

import type {
  YTMTrack,
  YTMArtist,
  YTMAlbum,
  YTMPlaylist,
} from "./types";

type Any = Record<string, any>;

export function runList(obj: Any): Any[] {
  if (!obj) return [];
  // Items can live under different keys depending on the surface.
  const holder =
    obj.contents ??
    obj.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content ??
    obj.contents?.sectionListRenderer?.contents ??
    obj.contents?.tabbedSearchResultsRenderer?.tabs ??
    [];
  return Array.isArray(holder) ? holder : [];
}

export function flattenRuns(obj: Any): string {
  const runs = obj?.runs ?? obj?.text?.runs ?? [];
  return runs.map((r: Any) => r.text ?? "").join("");
}

export function pickThumb(obj: Any): string {
  if (!obj) return "";
  const t =
    obj.thumbnail ??
    obj.thumbnails ??
    obj?.musicThumbnailRenderer?.thumbnail ??
    obj?.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail ??
    obj?.croppedSquareThumbnailRenderer?.thumbnail;
  const arr = t?.thumbnails ?? t?.musicThumbnailRenderer?.thumbnail?.thumbnails;
  if (Array.isArray(arr) && arr.length) {
    // Pick the highest-res variant available.
    return [...arr].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0].url;
  }
  return "";
}

// Parse a "musicResponsiveListItemRenderer" (the row format used everywhere).
export function parseListItem(item: Any): YTMTrack | YTMArtist | YTMAlbum | YTMPlaylist | null {
  const r = item?.musicResponsiveListItemRenderer;
  if (!r) return null;

  const overlay = r?.overlay?.musicItemThumbnailOverlayRenderer?.content
    ?.musicPlayButtonRenderer?.playNavigationEndpoint;
  const watchEndpoint = overlay?.watchEndpoint ?? overlay?.watchPlaylistEndpoint;

  // Walk the flex columns for textual metadata.
  const cols = (r.flexColumns ?? [])
    .map((c: Any) => c.musicResponsiveListItemFlexColumnRenderer)
    .filter(Boolean);
  const titleText = flattenRuns(cols[0]?.text);
  const subtitleRuns = (cols[1]?.text?.runs ?? []) as Any[];

  // Build a map of label -> text from the subtitle (e.g. "Artist", "Album", "Duration").
  const meta: Record<string, string> = {};
  for (let i = 0; i < subtitleRuns.length; i += 2) {
    const label = subtitleRuns[i]?.text;
    const value = subtitleRuns[i + 1]?.text;
    if (label && value && label.endsWith("•")) {
      meta[label.slice(0, -1).trim().toLowerCase()] = value.trim();
    }
  }
  // Also keep a flat list for fallback.
  const subtitleFlat = subtitleRuns.map((x: Any) => x.text).join("").trim();

  // Navigation endpoints reveal the entity type.
  const titleEndpoint =
    cols[0]?.text?.runs?.[0]?.navigationEndpoint ??
    r?.navigationEndpoint ??
    watchEndpoint;

  const videoId = watchEndpoint?.videoId ?? r?.videoId;
  const playlistId =
    titleEndpoint?.browseEndpoint?.browseId ??
    titleEndpoint?.watchPlaylistEndpoint?.playlistId ??
    watchEndpoint?.playlistId;
  const browseId = titleEndpoint?.browseEndpoint?.browseId;

  // Determine duration.
  let duration = "";
  let durationSeconds = 0;
  for (let i = subtitleRuns.length - 1; i >= 0; i--) {
    const t = subtitleRuns[i]?.text ?? "";
    if (/^\d+:\d{2}(:\d{2})?$/.test(t.trim())) {
      duration = t.trim();
      const parts = duration.split(":").map(Number);
      durationSeconds = parts.reduce((acc, p) => acc * 60 + p, 0);
      break;
    }
  }

  const thumb = pickThumb(r) || pickThumb(r?.thumbnail) || "";

  // --- Track ---
  if (videoId) {
    const artists: YTMArtist[] = [];
    for (let i = 0; i < subtitleRuns.length; i++) {
      const run = subtitleRuns[i];
      const nav = run?.navigationEndpoint?.browseEndpoint;
      if (nav && nav.browseId?.startsWith("UC")) {
        artists.push({
          artistId: nav.browseId,
          name: run.text ?? "",
        });
      }
    }
    // Try to find album from a separate run.
    let album: YTMAlbum | undefined;
    for (const run of subtitleRuns) {
      const nav = run?.navigationEndpoint?.browseEndpoint;
      if (nav?.browseId?.startsWith("MPRD")) {
        album = { albumId: nav.browseId, title: run.text ?? "" };
        break;
      }
    }
    return {
      videoId,
      title: titleText,
      artists,
      album,
      duration,
      durationSeconds,
      thumbnail: thumb,
      isExplicit: !!r?.badges?.some((b: Any) =>
        b?.musicInlineBadgeRenderer?.icon?.iconType === "MUSIC_EXPLICIT_BADGE",
      ),
    };
  }

  // --- Artist ---
  if (browseId?.startsWith("UC")) {
    const subscribers = subtitleFlat.split("•").pop()?.trim() ?? "";
    return {
      artistId: browseId,
      name: titleText,
      thumbnail: thumb,
      subscribers,
    };
  }

  // --- Album ---
  if (browseId?.startsWith("MPRD") || (playlistId?.startsWith("OLAK") ?? false)) {
    const year = subtitleFlat.split("•").pop()?.trim();
    return {
      albumId: browseId ?? playlistId,
      title: titleText,
      year,
      thumbnail: thumb,
    };
  }

  // --- Playlist ---
  if (playlistId?.startsWith("VL") || playlistId?.startsWith("PL") || playlistId?.startsWith("RD")) {
    return {
      playlistId: playlistId.replace(/^VL/, ""),
      title: titleText,
      subtitle: subtitleFlat,
      thumbnail: thumb,
    };
  }

  return null;
}

export function parseList(items: Any[]) {
  const out: (YTMTrack | YTMArtist | YTMAlbum | YTMPlaylist)[] = [];
  for (const item of items) {
    // Some surfaces wrap items in a "musicResponsiveListItemRenderer".
    const candidate = item?.musicResponsiveListItemRenderer ?? item;
    const parsed = parseListItem({ musicResponsiveListItemRenderer: candidate });
    if (parsed) out.push(parsed);
  }
  return out;
}

// Parse the "musicCarouselShelfRenderer" / "musicShelfRenderer" sections on Home.
export function parseSection(section: Any) {
  const shelf =
    section?.musicCarouselShelfRenderer ?? section?.musicShelfRenderer;
  if (!shelf) return null;
  const header =
    shelf?.header?.musicCarouselShelfBasicHeaderRenderer ??
    shelf?.header?.musicSectionHeaderRenderer;
  const title = flattenRuns(header?.title) || "Home";
  const rawItems = shelf?.contents ?? [];
  const items = parseList(rawItems);
  return { title, items };
}
