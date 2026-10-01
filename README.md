<div align="center">

# redux

**a static web proxy hub** · games · music · browser · anime · extensions

</div>

---

## what is redux?

redux is a fully static, GitHub-Pages-deployable web proxy hub. It bundles
Scramjet + BareMux + Wisp so you can browse the open web from inside a single
tab, with extra apps layered on top — a games library, a Spotify player, an
anime catalog with built-in streaming, an extensions manager, and more.

Everything ships as plain HTML/JS — no server runtime required. Drop the
`out/` folder onto any static host (GitHub Pages, Netlify, Cloudflare Pages,
a thumb drive) and you're done.

## features

### browse
- **Scramjet proxy** — full-service web proxy with Wisp transport fallbacks.
  If your network blocks the default Wisp server, the service worker
  automatically retries a chain of public fallbacks and tells the page which
  one is active.
- **AdBlock built into the SW** — request-level blocking for the usual
  tracking/ads suspects (doubleclick, googlesyndication, facebook pixel,
  moatads, …).
- **about:blank launcher** — pop the whole app into a blank window with no
  URL bar, leaves no trace in tab history.
- **Tab cloak** — disguise the tab as Google, Classroom, Drive, Gmail, etc.

### games
- ~750 HTML5 games from the `anchor/ubg` catalog.
- Favorites + search + one-click `about:blank` pop-out.
- jsDelivr-served `.html` files are re-typed as `text/html` via a Blob URL
  so they actually run instead of rendering as source.

### music
- Full-page Spotify web player powered by `viroda1/anchor/app-spotify.html`.
- Loaded through jsDelivr (which serves the file with `text/plain` + an
  `X-Frame-Options: deny` header), so we fetch it client-side and re-wrap
  as a `text/html` Blob URL — the iframe then renders the full player
  edge-to-edge instead of a tiny square embed.

### anime
- Catalog search powered by the **AniList GraphQL API** (so things like
  Evangelion, Frieren, and every other anime are actually findable — not
  just the 50 most recent uploads).
- Streaming via the **AniKoto** host (`megaplay.buzz` embeds).
- **No sandbox on the player iframe** — the host explicitly refuses to
  render under sandboxing ("Sandboxed our player is not allowed"). Removing
  the `sandbox` attribute is the fix.
- **Episode picker** inline in the player — jump to any episode without
  leaving the player view.
- **Skip Intro** button (+90s heuristic) — surfaces during the opening
  segment.
- **Auto-play next** card at the end of each episode.
- SUB/DUB toggle, prefers-dub setting.
- Same metadata pipeline as Lyra: AniList for catalog/posters, AniKoto for
  episodes/embed URLs.

### extensions
- Curated **starter extensions**: uBlock Origin, AdBlock, Dark Reader,
  Privacy Badger, HTTPS Everywhere, Decentraleyes. One-click install or
  "Install all".
- Import from Chrome Web Store URL, from `.crx`/`.zip`/`.js` file, or
  from arbitrary URL.

### themes & wallpapers
- 33 themes (jet, midnight, matrix, ocean, blood, rose, amber, grey,
  pastelgreen, lotussky, blvd2, bluedoo, redscar, yelloh, blackout,
  colorfill, spermont, rainy, whiteout, greyout, blackandyellow,
  searingcold, invert, **plus 10 new ones**: aurora, sakura, cyberpunk,
  vaporwave, forest, sunset, lavender, crimson, mint, cobalt).
- 10 CSS wallpapers (grid, dots, aurora, waves, mountains, gradients,
  noise, stars, …).
- 9 video wallpapers sourced from `cineosweb.github.io` — served through
  jsDelivr so the browser gets `content-type: video/mp4` and proper CORS
  (raw.githubusercontent serves them as `application/octet-stream` with
  `default-src 'none'; sandbox` CSP, which silently breaks `<video>`).

### achievements
- 16 unlockable achievements for the fun of it.

## settings (everything is local)

| Section        | What it controls                                                |
| -------------- | --------------------------------------------------------------- |
| Appearance     | Theme, wallpaper, video wallpaper, toolbar position            |
| Playback       | Auto-skip intro, auto-play next, prefer-dub, search engine, quality |
| Proxy          | Wisp endpoint + presets + test-connection probe                 |
| Cloak          | Tab disguise + about:blank launcher                             |
| Extensions     | Installed extensions + starter pack                              |
| Achievements   | Progress tracker                                                |
| More           | Quick links, cache clear, reset settings, about                 |

All settings persist to `localStorage` under `redux-settings`. No account,
no telemetry, no server.

## tech stack

- **Next.js 16** (static export) + **React 19** + **TypeScript**
- **Zustand** for state
- **Tailwind CSS** + **shadcn/ui** for components
- **Scramjet** + **BareMux** + **Wisp** for proxying
- **AniList GraphQL** + **AniKoto API** for anime
- **jsDelivr CDN** as a CORS-friendly GitHub mirror

## deploy

```bash
npm install
npm run build
# the out/ folder is the static site — push to gh-pages or any static host
```

For GitHub Pages, set the `NEXT_PUBLIC_BASE_PATH` env var to your subpath
(e.g. `/redux`) so the Scramjet prefix resolves correctly.

## credits

- **Scramjet / BareMux / Wisp** — [@mercuryworkshop](https://github.com/mercuryworkshop)
  and [@Destroyed12121](https://github.com/Destroyed12121/Staticsj)
- **AniKoto API** — public anime metadata + embed pipeline
- **AniList** — public GraphQL anime catalog
- **Lyra** ([gayq/lyra](https://github.com/gayq/lyra)) — inspiration for
  the AniList + AniKoto metadata pipeline, identity resolution, and the
  episode-picker UX
- **anchor** ([viroda1/anchor](https://github.com/viroda1/anchor)) —
  the Spotify web player HTML
- **cineosweb** — looping video wallpapers

## license

Personal/educational use. Don't resell. Be excellent to each other.
