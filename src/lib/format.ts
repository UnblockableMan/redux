// Small shared helpers used across the player UI.

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function artistsLabel(artists: { name: string }[]): string {
  if (!artists.length) return "Unknown artist";
  return artists.map((a) => a.name).join(", ");
}

// Extract a vivid color from a thumbnail URL for gradient backdrops.
// YouTube thumbnail URLs contain the video id, so we hash it for a stable hue.
export function hueFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) % 360;
  }
  return h;
}

// Higher-res thumbnail for the same video id.
export function hiResThumb(url: string): string {
  if (!url) return "";
  // ytimg serves hqdefault/maxresdefault by changing the path segment.
  return url
    .replace(/=w\d+-h\d+.*/, "=w800-h800-l90")
    .replace(/default\.jpg$/, "mqdefault.jpg")
    .replace(/hqdefault\.jpg$/, "hqdefault.jpg");
}
