// Resolve a YouTube videoId to a playable audio stream URL.
// Strategy (in order):
//   1) Piped instances — return pre-resolved stream URLs via /streams/{id}
//   2) Invidious instances — return adaptive formats via /api/v1/videos/{id}
//   3) InnerTube player endpoint — last resort, often blocked for music
//
// Each step fails over automatically and the user sees a toast on failure.

import { innertube } from "./innertube";
import { healthyInstances, markFailed } from "./instances";

export interface ResolvedStream {
  url: string;
  mimeType: string;
  source: string; // instance URL or "innertube"
}

type Any = Record<string, any>;

async function tryPiped(
  instanceUrl: string,
  videoId: string,
  signal: AbortSignal,
): Promise<ResolvedStream | null> {
  try {
    const res = await fetch(`${instanceUrl}/streams/${videoId}`, { signal });
    if (!res.ok) throw new Error(`piped ${res.status}`);
    const data = (await res.json()) as Any;
    // Piped exposes "audioStreams" sorted by bitrate. Pick the lowest-opus
    // stream first (smaller, faster start) then fall back to m4a.
    const streams: Any[] = data?.audioStreams ?? [];
    if (!streams.length) throw new Error("no audio streams");
    const opus = streams.filter((s) => s.mimeType?.includes("opus"));
    const m4a = streams.filter((s) => s.mimeType?.includes("mp4"));
    const pick = opus.sort((a, b) => (a.bitrate ?? 0) - (b.bitrate ?? 0))[0] ?? m4a[0] ?? streams[0];
    if (!pick?.url) throw new Error("no stream url");
    return { url: pick.url, mimeType: pick.mimeType ?? "audio/webm", source: instanceUrl };
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    markFailed(instanceUrl);
    return null;
  }
}

async function tryInvidious(
  instanceUrl: string,
  videoId: string,
  signal: AbortSignal,
): Promise<ResolvedStream | null> {
  try {
    const res = await fetch(`${instanceUrl}/api/v1/videos/${videoId}`, { signal });
    if (!res.ok) throw new Error(`invidious ${res.status}`);
    const data = (await res.json()) as Any;
    const adaptive: Any[] = data?.adaptiveFormats ?? [];
    const audio = adaptive.filter((f) => (f.type ?? "").startsWith("audio"));
    if (!audio.length) throw new Error("no audio formats");
    const opus = audio.filter((s) => (s.type ?? "").includes("opus"));
    const m4a = audio.filter((s) => (s.type ?? "").includes("mp4"));
    const pick = opus.sort((a, b) => (a.bitrate ?? 0) - (b.bitrate ?? 0))[0] ?? m4a[0] ?? audio[0];
    if (!pick?.url) throw new Error("no stream url");
    return {
      url: pick.url,
      mimeType: pick.type ?? "audio/webm",
      source: instanceUrl,
    };
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    markFailed(instanceUrl);
    return null;
  }
}

async function tryInnertube(videoId: string, signal: AbortSignal): Promise<ResolvedStream | null> {
  try {
    const res = await innertube<Any>(
      "player",
      { videoId, playbackContext: { contentPlaybackContext: { signatureTimestamp: 0 } } },
      signal,
    );
    const adaptive: Any[] = res?.streamingData?.adaptiveFormats ?? [];
    const audio = adaptive.filter((f) => (f.mimeType ?? "").startsWith("audio"));
    if (!audio.length) return null;
    const pick = audio.sort((a, b) => (a.bitrate ?? 0) - (b.bitrate ?? 0))[0];
    if (!pick?.url) return null;
    return { url: pick.url, mimeType: pick.mimeType, source: "innertube" };
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    return null;
  }
}

export async function resolveStream(videoId: string, signal?: AbortSignal): Promise<ResolvedStream> {
  const controller = new AbortController();
  if (signal) {
    signal.addEventListener("abort", () => controller.abort());
  }
  const innerSignal = controller.signal;

  // 1) Piped
  for (const inst of healthyInstances()) {
    if (inst.kind !== "piped") continue;
    const s = await tryPiped(inst.url, videoId, innerSignal);
    if (s) return s;
  }
  // 2) Invidious
  for (const inst of healthyInstances()) {
    if (inst.kind !== "invidious") continue;
    const s = await tryInvidious(inst.url, videoId, innerSignal);
    if (s) return s;
  }
  // 3) InnerTube (last resort)
  const inner = await tryInnertube(videoId, innerSignal);
  if (inner) return inner;

  throw new Error(
    "All streaming sources failed. The video may be region-locked or all mirror instances are down.",
  );
}
