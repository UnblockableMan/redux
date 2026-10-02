// Scramjet service worker — proxies requests through a Wisp transport.
// Based on the staticsjv2 template (https://github.com/Destroyed12121/staticsjv2).

const ADBLOCK = {
    blocked: [
        "googlevideo.com/videoplayback","youtube.com/get_video_info","youtube.com/api/stats/ads",
        "youtube.com/pagead","youtube.com/api/stats","youtube.com/get_midroll","youtube.com/ptracking",
        "youtube.com/youtubei/v1/player","youtube.com/s/player","youtube.com/api/timedtext",
        "facebook.com/ads","facebook.com/tr","fbcdn.net/ads","graph.facebook.com/ads",
        "graph.facebook.com/pixel","ads-api.twitter.com","analytics.twitter.com","twitter.com/i/ads",
        "ads.yahoo.com","advertising.com","adtechus.com","amazon-adsystem.com","adnxs.com",
        "doubleclick.net","googlesyndication.com","googleadservices.com","rubiconproject.com",
        "pubmatic.com","criteo.com","openx.net","taboola.com","outbrain.com","moatads.com",
        "casalemedia.com","unityads.unity3d.com","/ads/","/adserver/","/banner/","/promo/",
        "/tracking/","/beacon/","/metrics/","adsafeprotected.com","chartbeat.com",
        "scorecardresearch.com","quantserve.com","krxd.net","demdex.net"
    ]
};

function isAdBlocked(url) {
    const urlStr = url.toString();
    for (const pattern of ADBLOCK.blocked) {
        const regexPattern = pattern.replace(/\*/g,'.*').replace(/\./g,'\\.').replace(/\?/g,'\\?');
        if (new RegExp('^' + regexPattern + '$', 'i').test(urlStr)) return true;
    }
    return false;
}

const swPath = self.location.pathname;
const basePath = swPath.substring(0, swPath.lastIndexOf('/') + 1);
self.basePath = self.basePath || basePath;

self.$scramjet = {
    files: {
        wasm: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.wasm.wasm",
        sync: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.sync.js",
    }
};

importScripts("https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.all.js");
importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux/dist/index.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker({
    prefix: basePath + "scramjet/"
});

// SW version — bump this on every sw.js change so browsers pick up the
// new version immediately (the install event fires when the file changes).
const SW_VERSION = "redux-v4.2-bareclient";

self.addEventListener('install', (event) => {
    console.log(`[sw] installing ${SW_VERSION}`);
    self.skipWaiting();
});
self.addEventListener('activate', (event) => {
    console.log(`[sw] activating ${SW_VERSION}`);
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // Clear all old caches so stale responses don't get served.
            caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))),
        ])
    );
});

// Known public wisp servers. The first one in the array is the user-configured
// default; the rest are tried in order if the active transport reports an
// "All clients returned an invalid MessagePort" failure (typically caused by
// the wisp server being unreachable or refusing the connection on a school
// network). This is the same kind of fallback chain Lyra uses.
// Servers sourced from:
//   - https://github.com/0800WebDev/zinc (PeteZah's huge list)
//   - https://github.com/VortexInnovations-cyber/ghostlinkhub
//   - https://github.com/Destroyed12121/staticsjv2 (Scramjet's reference impl)
//   - plus the original mercurywork default
const FALLBACK_WISP_SERVERS = [
    "wss://wisp.mercurywork.shop:443",
    "wss://wisps.proxiflux.dev:443",
    "wss://comet.librey.tech:443",
    "wss://wisp.loclin-cf.lol:443",
    "wss://wisp-proxy.dragonuno.vercel.app:443",
    "wss://wispg0.gettoast.in:443",
    "wss://anyspeed.mercurywork.shop:443",
    // From zinc (PeteZah's catalog):
    "wss://petezahgames.com/wisp/",
    "wss://bare-server.fly.dev/wisp/",
    "wss://businessschool.cc/wisp/",
    "wss://crypto-college.cc/wisp/",
    "wss://fulcrumtheatreinc.com/wisp/",
    "wss://gointospace.app/wisp/",
    "wss://homework--spmspy0800.replit.app/wisp/",
    "wss://homeworkhelp.cc/wisp/",
    "wss://info.hotelsunrisegrand.com/wisp/",
    "wss://info.shop1stoponline.com/wisp/",
    "wss://info.videnom.com/wisp/",
    "wss://lunar.asirargentina.com.ar/w/",
    "wss://lunar.colegioitalocomposto.cl/w/",
    "wss://lunar.globalscholarpress.com/w/",
    "wss://lunar.kkmsilvia.com/w/",
    "wss://lunaron.top/w/",
    "wss://pgis-wisp-2.onrender.com/",
    "wss://pgis-wisp-3.onrender.com/",
    "wss://pgis-wisp-4.onrender.com/",
    "wss://pgis-wisp.bonto.run/",
    "wss://pgis-wisp.getvoroa.com/",
    "wss://pgis-wisp.joytree.site/",
    "wss://pgis-wisp.onrender.com/",
    "wss://places.vjason.com/wisp/",
    "wss://sciencenews.cc/wisp/",
    "wss://sciencepark.cc/wisp/",
    "wss://space.asirargentina.com.ar/wisp/",
    "wss://space.colegioitalocomposto.cl/wisp/",
    "wss://space.kkmsilvia.com/wisp/",
    "wss://studyhub.asirargentina.com.ar/wisp/",
    "wss://studyhub.colegioitalocomposto.cl/wisp/",
    "wss://studyhub.hadtea.com/wisp/",
    "wss://studyhub.kkmsilvia.com/wisp/",
    "wss://triplet.bumon.ar/wisp/",
    "wss://tungtung.asirargentina.com.ar/wisp/",
    "wss://tungtung.best/wisp/",
    "wss://tungtung.kkmsilvia.com/wisp/",
    "wss://3658729.ritebooks.com/wisp/",
    // From ghostlinkhub:
    "wss://admin.proxy.hydrovolter.com/scramjet/wisp/",
    "wss://glseries.net/wisp/",
    "wss://scram.owoellen.rocks/wisp/",
    "wss://wispserver.dev/wisp/",
    // Batch 2 — additional public wisps from various proxy communities:
    "wss://wisp1.figgyc.dev:443",
    "wss://wisp2.figgyc.dev:443",
    "wss://wisp.r_comm.onrender.com/",
    "wss://wisp.tammustech.workers.dev/",
    "wss://wisp.jclp.workers.dev/",
    "wss://wisp.luoa.ray-0.workers.dev/",
    "wss://wisp.nichind.workers.dev/",
    "wss://wisp.aeroplane.workers.dev/",
    "wss://scramjet-wisp.rasendo.workers.dev/",
    "wss://wisp.duffythehacker.workers.dev/",
    "wss://wisp.belowaverage.dev/",
    "wss://wispc.figgyc.dev/",
    "wss://wisp.kirthik.workers.dev/",
    "wss://wisp.bagel.addHandler.workers.dev/",
    "wss://wisp-fast.mercurywork.shop:443",
];

let wispConfig = { wispurl: null, autoswitch: true };
let resolveConfigReady;
const configReadyPromise = new Promise(resolve => resolveConfigReady = resolve);

// Connection state — used to retry the next fallback after a MessagePort error.
let currentTransport = null;
let currentTransportUrl = null;
let lastErrorWasMessagePort = false;

self.addEventListener("message", ({ data }) => {
    if (data.type === "config") {
        if (data.wispurl) wispConfig.wispurl = data.wispurl;
        if (typeof data.autoswitch !== 'undefined') wispConfig.autoswitch = data.autoswitch;
        if (wispConfig.wispurl && resolveConfigReady) { resolveConfigReady(); resolveConfigReady = null; }
    }
    if (data.type === "get-status") {
        // Allow the page to query SW status for diagnostics.
        const clients = self.clients;
        (async () => {
            const allClients = await clients.matchAll({ includeUncontrolled: true });
            for (const c of allClients) {
                c.postMessage({
                    type: "status",
                    wispUrl: wispConfig.wispurl,
                    transportUrl: currentTransportUrl,
                    hadMessagePortError: lastErrorWasMessagePort,
                });
            }
        })();
    }
});

// Build the fallback chain: user-configured wisp first (if set), then the
// remaining defaults. We de-dupe so the user's choice isn't tried twice.
function buildWispChain() {
    const chain = [];
    if (wispConfig.wispurl) chain.push(wispConfig.wispurl);
    for (const w of FALLBACK_WISP_SERVERS) {
        if (!chain.includes(w)) chain.push(w);
    }
    return chain;
}

async function setTransportForUrl(wispUrl) {
    if (!self.BareMux) {
        throw new Error("BareMux not loaded in SW context");
    }
    // Re-create the connection each time so a stale worker doesn't keep
    // holding a broken MessagePort. This is the fix for "All clients
    // returned an invalid MessagePort" — usually caused by a stale
    // BareMuxConnection whose underlying SharedWorker died.
    const connection = new BareMux.BareMuxConnection(basePath + "bareworker.js");
    await connection.setTransport(
        "https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs",
        [{ wisp: wispUrl }]
    );
    currentTransport = connection;
    currentTransportUrl = wispUrl;
    lastErrorWasMessagePort = false;
    return connection;
}

self.addEventListener("fetch", (event) => {
    event.respondWith((async () => {
        if (isAdBlocked(event.request.url)) {
            return new Response(new ArrayBuffer(0), { status: 204 });
        }
        await scramjet.loadConfig();
        if (scramjet.route(event)) {
            return scramjet.fetch(event);
        }
        return fetch(event.request);
    })());
});

scramjet.addEventListener("request", async (e) => {
    e.response = (async () => {
        await configReadyPromise;
        if (!wispConfig.wispurl) return new Response("Wisp URL not configured", { status: 500 });

        // If we already have a working transport, try it first.
        let connection = currentTransport;
        if (!connection) {
            connection = await setTransportForUrl(wispConfig.wispurl);
        }

        // IMPORTANT: use BareClient (which has .fetch()), NOT the
        // BareMuxConnection directly. BareMuxConnection only has
        // getTransport/setTransport/setRemoteTransport — it does NOT
        // have a .fetch() method. BareClient uses the shared transport
        // that was set via setTransport() on the BareMuxConnection.
        // Both share the same underlying SharedWorker (bareworker.js).
        const tryFetch = async () => {
            if (!self.BareMux?.BareClient) {
                throw new Error("BareClient not loaded in SW context");
            }
            const client = new BareMux.BareClient();
            return await client.fetch(e.url, {
                method: e.method,
                body: e.body,
                headers: e.requestHeaders,
                credentials: "include",
                mode: e.mode === "cors" ? e.mode : "same-origin",
                cache: e.cache,
                redirect: "manual",
                duplex: "half",
            });
        };

        try {
            return await tryFetch();
        } catch (err) {
            const msg = String(err?.message || err || "");
            // The "invalid MessagePort" failure happens when the underlying
            // SharedWorker can't postMessage. Retry with fallbacks.
            if (/MessagePort|invalid|transport|connection|network|fetch|BareClient/i.test(msg)) {
                lastErrorWasMessagePort = /MessagePort|invalid/i.test(msg);
                const chain = buildWispChain().filter((u) => u !== currentTransportUrl);
                for (const candidate of chain) {
                    try {
                        await setTransportForUrl(candidate);
                        const res = await tryFetch();
                        // It worked — promote this transport.
                        currentTransportUrl = candidate;
                        // Notify the page so it can update the UI.
                        const clients = await self.clients.matchAll({ includeUncontrolled: true });
                        for (const c of clients) {
                            c.postMessage({ type: "wisp-fallback", url: candidate });
                        }
                        return res;
                    } catch (nextErr) {
                        // Try the next fallback.
                        continue;
                    }
                }
                // All fallbacks failed — surface the original error.
                throw err;
            }
            throw err;
        }
    })();
});
