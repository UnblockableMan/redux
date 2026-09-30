// Lightweight browser-native InnerTube client for YouTube Music.
//
// YouTube's InnerTube API does NOT send CORS headers, so direct browser
// requests are blocked. We route every request through a pool of public CORS
// proxies with automatic failover. The Piped/Invidious streaming layer (see
// stream.ts) already supports CORS natively, so streaming is unaffected.
//
// Inspired by youtubei.js and vivi-music — written from scratch as plain
// fetch() calls so it runs anywhere (including static GitHub Pages builds).

const INNERTUBE_BASE = "https://www.youtube.com/youtubei/v1";

const CLIENT_CONTEXT = {
  client: {
    clientName: "WEB_REMIX",
    clientVersion: "1.20241106.01.00",
    hl: "en",
    gl: "US",
  },
} as const;

const API_KEY = "AIzaSyC9XL3SjAcxT0l4iXw5Jj7o0bHvWqKm1k";

// CORS proxies that forward arbitrary URLs. We try each in order until one
// succeeds, and remember failures so we skip bad proxies for a while.
// Each proxy wraps the target URL differently — see the `wrap` functions.
interface CorsProxy {
  name: string;
  wrap: (url: string) => string;
}

const CORS_PROXIES: CorsProxy[] = [
  { name: "corsproxy.io", wrap: (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}` },
  { name: "allorigins", wrap: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}` },
  { name: "cors.eu.org", wrap: (u) => `https://cors.eu.org/${u}` },
  { name: "proxy.cors.sh", wrap: (u) => `https://proxy.cors.sh/${u}` },
  { name: "thingproxy", wrap: (u) => `https://thingproxy.freeboard.io/fetch/${u}` },
];

const failedProxies = new Map<string, number>();
const PROXY_BACKOFF_MS = 90_000;

function healthyProxies(): CorsProxy[] {
  const now = Date.now();
  return CORS_PROXIES.filter((p) => (failedProxies.get(p.name) ?? 0) < now);
}

let lastRequestAt = 0;
const MIN_INTERVAL_MS = 80;

async function throttle() {
  const now = Date.now();
  const wait = lastRequestAt + MIN_INTERVAL_MS - now;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

async function fetchViaProxy(
  proxy: CorsProxy,
  url: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<Response> {
  const proxiedUrl = proxy.wrap(url);
  return fetch(proxiedUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
}

async function innertube<T extends Record<string, unknown>>(
  endpoint: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  await throttle();
  const targetUrl = `${INNERTUBE_BASE}/${endpoint}?key=${API_KEY}&prettyPrint=false`;
  const payload = { ...CLIENT_CONTEXT, ...body };

  const proxies = healthyProxies();
  if (proxies.length === 0) {
    // All proxies recently failed — try the first one anyway after clearing state.
    failedProxies.clear();
  }

  let lastErr: unknown = null;
  for (const proxy of healthyProxies()) {
    try {
      const res = await fetchViaProxy(proxy, targetUrl, payload, signal);
      if (!res.ok) {
        throw new Error(`Proxy ${proxy.name} returned ${res.status}`);
      }
      const json = (await res.json()) as T;
      return json;
    } catch (err) {
      if ((err as Error)?.name === "AbortError") throw err;
      lastErr = err;
      failedProxies.set(proxy.name, Date.now() + PROXY_BACKOFF_MS);
      // Try the next proxy.
    }
  }

  throw new Error(
    `All CORS proxies failed for ${endpoint}. ${(lastErr as Error)?.message ?? ""}`.trim(),
  );
}

export { innertube, CLIENT_CONTEXT, API_KEY, INNERTUBE_BASE, CORS_PROXIES };
