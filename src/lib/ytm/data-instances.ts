// Public Piped + Invidious instances used for SEARCH and HOME data.
// These are separate from the streaming instances because some instances
// expose a great API but are flaky for streaming, and vice-versa.
//
// Both Piped and Invidious send proper CORS headers, so we can call them
// directly from a static GitHub Pages site — no proxy needed.

export interface DataInstance {
  url: string;
  kind: "piped" | "invidious";
}

// A generous pool — we try each in order until one works, then cache the
// winner so subsequent requests are fast.
export const PIPED_DATA_INSTANCES: DataInstance[] = [
  { url: "https://pipedapi.kavin.rocks", kind: "piped" },
  { url: "https://pipedapi.adminforge.de", kind: "piped" },
  { url: "https://api.piped.yt", kind: "piped" },
  { url: "https://pipedapi.leptons.xyz", kind: "piped" },
  { url: "https://pipedapi.r4fo.com", kind: "piped" },
  { url: "https://pipedapi.nosebs.ru", kind: "piped" },
  { url: "https://pipedapi.ducks.party", kind: "piped" },
  { url: "https://pipedapi.reallyaweso.me", kind: "piped" },
];

export const INVIDIOUS_DATA_INSTANCES: DataInstance[] = [
  { url: "https://invidious.fdn.fr", kind: "invidious" },
  { url: "https://yewtu.be", kind: "invidious" },
  { url: "https://invidious.nerdvpn.de", kind: "invidious" },
  { url: "https://inv.nadeko.net", kind: "invidious" },
  { url: "https://invidious.perennialte.ch", kind: "invidious" },
  { url: "https://iv.ggtyler.dev", kind: "invidious" },
];

export const ALL_DATA_INSTANCES: DataInstance[] = [
  ...PIPED_DATA_INSTANCES,
  ...INVIDIOUS_DATA_INSTANCES,
];

// Failed-instance bookkeeping (shared with the stream layer).
const failedUntil = new Map<string, number>();
const FAIL_BACKOFF_MS = 60_000;

export function markDataFailed(url: string) {
  failedUntil.set(url, Date.now() + FAIL_BACKOFF_MS);
}

export function healthyDataInstances(): DataInstance[] {
  const now = Date.now();
  return ALL_DATA_INSTANCES.filter((i) => (failedUntil.get(i.url) ?? 0) < now);
}

// Remember the last instance that worked so we try it first next time.
let preferredInstance: DataInstance | null = null;

export function getPreferredInstance(): DataInstance | null {
  return preferredInstance;
}

export function setPreferredInstance(inst: DataInstance) {
  preferredInstance = inst;
}

/**
 * Try each healthy instance in order until one returns a successful response.
 * Caches the winner as the preferred instance for subsequent calls.
 *
 * Each individual attempt is capped at `perInstanceTimeoutMs` so that a
 * hanging instance doesn't block the whole chain.
 */
export async function withDataInstances<T>(
  fn: (inst: DataInstance, signal: AbortSignal) => Promise<T>,
  signal?: AbortSignal,
  perInstanceTimeoutMs = 5000,
): Promise<T> {
  // Try the preferred instance first (if still healthy).
  const preferred = preferredInstance;
  const candidates = healthyDataInstances();
  const ordered = preferred
    ? [preferred, ...candidates.filter((c) => c.url !== preferred.url)]
    : candidates;

  let lastErr: unknown = null;
  for (const inst of ordered) {
    // Per-instance controller so a timeout only aborts this attempt.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), perInstanceTimeoutMs);
    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }
    try {
      const result = await fn(inst, controller.signal);
      clearTimeout(timeout);
      setPreferredInstance(inst);
      return result;
    } catch (err) {
      clearTimeout(timeout);
      if ((err as Error)?.name === "AbortError" && signal?.aborted) {
        throw err;
      }
      lastErr = err;
      markDataFailed(inst.url);
      // Continue to next instance.
    }
  }

  throw new Error(
    `All data instances failed. ${(lastErr as Error)?.message ?? ""}`.trim(),
  );
}
