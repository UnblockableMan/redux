// Curated list of public Piped and Invidious instances.
// We try each in order until one returns a usable audio stream URL.
// Source: https://github.com/TeamPiped/Piped-Instances + https://api.invidious.io
// (kept static so the app has zero backend dependencies).

export interface StreamInstance {
  url: string;
  kind: "piped" | "invidious";
  region?: string;
}

// A small, healthy set. Order matters — we try top-to-bottom.
export const PIPED_INSTANCES: StreamInstance[] = [
  { url: "https://pipedapi.kavin.rocks", kind: "piped" },
  { url: "https://pipedapi.adminforge.de", kind: "piped" },
  { url: "https://api.piped.yt", kind: "piped" },
  { url: "https://pipedapi.leptons.xyz", kind: "piped" },
  { url: "https://pipedapi.r4fo.com", kind: "piped" },
  { url: "https://pipedapi.nosebs.ru", kind: "piped" },
  { url: "https://pipedapi.ducks.party", kind: "piped" },
];

export const INVIDIOUS_INSTANCES: StreamInstance[] = [
  { url: "https://invidious.fdn.fr", kind: "invidious" },
  { url: "https://yewtu.be", kind: "invidious" },
  { url: "https://invidious.nerdvpn.de", kind: "invidious" },
  { url: "https://inv.nadeko.net", kind: "invidious" },
  { url: "https://invidious.perennialte.ch", kind: "invidious" },
  { url: "https://iv.ggtyler.dev", kind: "invidious" },
];

// Combined ordered list: piped first (usually returns direct stream URLs),
// then invidious as fallback.
export const ALL_INSTANCES: StreamInstance[] = [
  ...PIPED_INSTANCES,
  ...INVIDIOUS_INSTANCES,
];

// Remember which instances have recently failed so we skip them for a while.
const failedUntil = new Map<string, number>();
const FAIL_BACKOFF_MS = 60_000; // skip a failed instance for 1 minute

export function markFailed(url: string) {
  failedUntil.set(url, Date.now() + FAIL_BACKOFF_MS);
}

export function healthyInstances(): StreamInstance[] {
  const now = Date.now();
  return ALL_INSTANCES.filter((i) => (failedUntil.get(i.url) ?? 0) < now);
}

export function resetHealth() {
  failedUntil.clear();
}
