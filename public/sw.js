// Scramjet service worker for proxying web requests through a Wisp transport.
// This is a minimal implementation — it intercepts requests to /proxy/ and
// routes them through the configured Wisp endpoint using Bare-like encoding.
//
// For production use, bundle the full @mercuryworkshop/scramjet package.
// This minimal SW handles the basic proxy flow for the Browser app.

const SW_VERSION = "1.0.0";
const PROXY_PREFIX = "/proxy/";

// Wisp frames
const WISP_CONNECT = 0x01;
const WISP_DATA = 0x02;
const WISP_CLOSE = 0x04;
const WISP_PING = 0x10;
const WISP_PONG = 0x11;

interface Conn {
  ws: WebSocket;
  streamId: number;
  controller: ReadableStreamDefaultController;
  buffer: Uint8Array[];
  closed: boolean;
}

const connections = new Map<number, Conn>();
let nextStreamId = 1;
let wispSocket: WebSocket | null = null;
let pendingRequests: ((ws: WebSocket) => void)[] = [];

async function getWispSocket(wispUrl: string): Promise<WebSocket> {
  if (wispSocket && wispSocket.readyState === WebSocket.OPEN) {
    return wispSocket;
  }
  if (wispSocket && wispSocket.readyState === WebSocket.CONNECTING) {
    return new Promise((resolve) => {
      pendingRequests.push(resolve);
    });
  }

  wispSocket = new WebSocket(wispUrl);
  wispSocket.binaryType = "arraybuffer";

  return new Promise((resolve, reject) => {
    if (!wispSocket) return reject(new Error("no socket"));
    wispSocket.onopen = () => {
      resolve(wispSocket);
      pendingRequests.forEach((r) => r(wispSocket!));
      pendingRequests = [];
    };
    wispSocket.onerror = () => {
      reject(new Error("Wisp connection failed"));
      pendingRequests = [];
    };
    wispSocket.onmessage = (e) => handleWispMessage(e.data);
    wispSocket.onclose = () => {
      wispSocket = null;
      connections.forEach((c) => {
        if (!c.closed) {
          c.controller.error(new Error("Wisp disconnected"));
          c.closed = true;
        }
      });
      connections.clear();
    };
  });
}

function handleWispMessage(data: ArrayBuffer) {
  const view = new DataView(data);
  const msgType = view.getUint8(0);

  switch (msgType) {
    case WISP_DATA: {
      const streamId = view.getUint32(1, true);
      const conn = connections.get(streamId);
      if (!conn || conn.closed) return;
      const payload = new Uint8Array(data, 5);
      conn.controller.enqueue(payload);
      break;
    }
    case WISP_CLOSE: {
      const streamId = view.getUint32(1, true);
      const conn = connections.get(streamId);
      if (conn && !conn.closed) {
        conn.closed = true;
        try { conn.controller.close(); } catch {}
        connections.delete(streamId);
      }
      break;
    }
  }
}

function writeString(view: DataView, offset: number, str: string): number {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
  return offset + str.length;
}

async function proxyFetch(
  wispUrl: string,
  method: string,
  url: string,
  headers: Record<string, string>,
  body: Uint8Array | null,
): Promise<{ status: number; headers: Record<string, string>; body: ReadableStream<Uint8Array> }> {
  const ws = await getWispSocket(wispUrl);
  const streamId = nextStreamId++;

  const urlObj = new URL(url);
  const host = urlObj.hostname;
  const port = urlObj.port || (urlObj.protocol === "https:" ? "443" : "80");
  const pathAndQuery = urlObj.pathname + urlObj.search;

  // Build the CONNECT frame for Wisp (TCP connect to host:port).
  const hostBytes = new TextEncoder().encode(host);
  const connectFrame = new ArrayBuffer(4 + 1 + 1 + 2 + 1 + hostBytes.length + 1 + 4);
  const cv = new DataView(connectFrame);
  let off = 0;
  cv.setUint32(off, streamId, true); off += 4;
  cv.setUint8(off, WISP_CONNECT); off += 1;
  cv.setUint8(off, 1); off += 1; // TCP
  cv.setUint16(off, parseInt(port), true); off += 2;
  cv.setUint8(off, hostBytes.length); off += 1;
  for (let i = 0; i < hostBytes.length; i++) { cv.setUint8(off, hostBytes[i]); off++; }
  cv.setUint8(off, 0); off += 1; // no initial data
  ws.send(connectFrame);

  // Build the HTTP/1.1 request.
  let reqStr = `${method} ${pathAndQuery} HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n`;
  for (const [k, v] of Object.entries(headers)) {
    reqStr += `${k}: ${v}\r\n`;
  }
  reqStr += "\r\n";

  const reqBytes = new TextEncoder().encode(reqStr);
  const fullReq = body ? new Uint8Array(reqBytes.length + body.length) : reqBytes;
  if (body) { fullReq.set(reqBytes, 0); fullReq.set(body, reqBytes.length); }

  // Send as WISP_DATA frame.
  const dataFrame = new ArrayBuffer(4 + 1 + fullReq.length);
  const dv = new DataView(dataFrame);
  let doff = 0;
  dv.setUint32(doff, streamId, true); doff += 4;
  dv.setUint8(doff, WISP_DATA); doff += 1;
  new Uint8Array(dataFrame, doff).set(fullReq);
  ws.send(dataFrame);

  // Read response from the stream.
  const { readable, controller } = new ReadableStream<Uint8Array>({
    start(c) {
      connections.set(streamId, { ws, streamId, controller: c as any, buffer: [], closed: false });
    },
    cancel() {
      const closeFrame = new ArrayBuffer(4 + 1);
      const cv2 = new DataView(closeFrame);
      cv2.setUint32(0, streamId, true);
      cv2.setUint8(4, WISP_CLOSE);
      ws.send(closeFrame);
      connections.delete(streamId);
    },
  });

  // Parse HTTP response from the stream.
  const reader = readable.getReader();
  const chunks: Uint8Array[] = [];
  let totalLen = 0;
  let headerEnd = -1;
  let headerBytes: Uint8Array | null = null;

  while (headerEnd === -1) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLen += value.length;
    const combined = new Uint8Array(totalLen);
    let off = 0;
    for (const c of chunks) { combined.set(c, off); off += c.length; }
    const text = new TextDecoder().decode(combined);
    const idx = text.indexOf("\r\n\r\n");
    if (idx !== -1) {
      headerEnd = idx;
      headerBytes = combined;
    }
  }

  if (!headerBytes) {
    throw new Error("No response headers received");
  }

  const headerText = new TextDecoder().decode(headerBytes.slice(0, headerEnd));
  const lines = headerText.split("\r\n");
  const statusLine = lines[0];
  const statusMatch = statusLine.match(/HTTP\/1\.[01] (\d+)/);
  const status = statusMatch ? parseInt(statusMatch[1]) : 0;

  const respHeaders: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    const colon = lines[i].indexOf(":");
    if (colon > 0) {
      const key = lines[i].slice(0, colon).trim().toLowerCase();
      const val = lines[i].slice(colon + 1).trim();
      respHeaders[key] = val;
    }
  }

  // Remaining bytes after headers are the body start.
  const bodyStart = headerEnd + 4;
  const remaining = headerBytes.slice(bodyStart);

  const bodyStream = new ReadableStream<Uint8Array>({
    start(c) {
      if (remaining.length > 0) c.enqueue(remaining);
      // Continue reading from the original stream.
      (async () => {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) { c.close(); break; }
          c.enqueue(value!);
        }
      })();
    },
  });

  return { status, headers: respHeaders, body: bodyStream };
}

self.addEventListener("fetch", (event: FetchEvent) => {
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith(PROXY_PREFIX)) return;

  const targetUrl = decodeURIComponent(url.pathname.slice(PROXY_PREFIX.length)) + url.search;
  const wispUrl = url.searchParams.get("__wisp") || "";

  event.respondWith(
    (async () => {
      if (!wispUrl) {
        return new Response("No Wisp URL configured", { status: 500 });
      }
      try {
        const reqHeaders: Record<string, string> = {};
        event.request.headers.forEach((v, k) => {
          if (k !== "host") reqHeaders[k] = v;
        });
        const body = event.request.method !== "GET" && event.request.method !== "HEAD"
          ? new Uint8Array(await event.request.arrayBuffer())
          : null;
        const { status, headers, body: respBody } = await proxyFetch(
          wispUrl,
          event.request.method,
          targetUrl,
          reqHeaders,
          body,
        );
        const respInit: ResponseInit = {
          status,
          headers: Object.entries(headers)
            .filter(([k]) => !["transfer-encoding", "content-encoding", "content-length"].includes(k))
            .map(([k, v]) => [k, v]),
        };
        return new Response(respBody, respInit);
      } catch (err: any) {
        return new Response(`Proxy error: ${err?.message || err}`, { status: 502 });
      }
    })(),
  );
});

self.addEventListener("install", () => {
  (self as any).skipWaiting();
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil((self as any).clients.claim());
});

export {};
