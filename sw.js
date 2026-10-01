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

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

let wispConfig = { wispurl: null, autoswitch: true };
let resolveConfigReady;
const configReadyPromise = new Promise(resolve => resolveConfigReady = resolve);

self.addEventListener("message", ({ data }) => {
    if (data.type === "config") {
        if (data.wispurl) wispConfig.wispurl = data.wispurl;
        if (typeof data.autoswitch !== 'undefined') wispConfig.autoswitch = data.autoswitch;
        if (wispConfig.wispurl && resolveConfigReady) { resolveConfigReady(); resolveConfigReady = null; }
    }
});

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

        if (!scramjet.client) {
            const connection = new BareMux.BareMuxConnection(basePath + "bareworker.js");
            await connection.setTransport(
                "https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs",
                [{ wisp: wispConfig.wispurl }]
            );
            scramjet.client = connection;
        }

        return await scramjet.client.fetch(e.url, {
            method: e.method,
            body: e.body,
            headers: e.requestHeaders,
            credentials: "include",
            mode: e.mode === "cors" ? e.mode : "same-origin",
            cache: e.cache,
            redirect: "manual",
            duplex: "half",
        });
    })();
});
