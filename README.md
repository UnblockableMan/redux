# abroad

A static, client-side YouTube Music player that deploys to GitHub Pages as-is.

Search, stream, queue, and build your own library — no backend, no account, no
API keys. Audio is delivered through public Piped / Invidious mirrors with
automatic instance failover.

## Features

- **Search** — tracks, artists, albums, and playlists from YouTube Music
- **Home** — trending content carousel
- **Player bar** — play / pause, prev / next, seek, volume, shuffle, repeat
  (off / all / one)
- **Queue** — view, drag-to-reorder, remove, jump
- **Full-screen Now Playing** — blurred artwork backdrop, gradient aurora
- **Library** — liked songs, recently played, and user playlists, all persisted
  in `localStorage`
- **Track context menu** — add to playlist, add to queue, go to album / artist
- **Album & artist pages** — full track listings, related albums
- **Keyboard shortcuts** — space, arrows, M / S / R / Q, Escape
- **Responsive** — desktop sidebar + mobile bottom nav with expandable
  mini-player
- **Toast-based error handling** — graceful instance failover with user feedback

## Design

Dark theme with Apple-Music flair: glassmorphism panels, gradient backdrops,
blurred artwork, rounded cards, and smooth animations. The wordmark is
**abroad**.

## Tech Stack

- **Framework:** Next.js 16 (App Router, static export)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui primitives
- **State:** Zustand (player + library) with `localStorage` persistence
- **Drag & drop:** @dnd-kit (queue reordering)
- **Data:** YouTube Music via a custom browser-native InnerTube client +
  Piped / Invidius REST APIs
- **Audio:** HTML5 `<audio>` element, fed by Piped / Invidious stream URLs

## Deploy to GitHub Pages

The app is configured for static export. Two environment variables control the
build:

| Variable | Purpose | Example |
|---|---|---|
| `NEXT_PUBLIC_STATIC_EXPORT` | Set to `1` to enable `output: "export"` | `1` |
| `NEXT_PUBLIC_BASE_PATH` | The repo sub-path (for project pages) | `/abroad` |

### Option A — GitHub Actions (recommended)

1. Push the repo to GitHub.
2. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build:gh
        env:
          NEXT_PUBLIC_STATIC_EXPORT: "1"
          NEXT_PUBLIC_BASE_PATH: /abroad
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./out
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

3. In **Settings → Pages**, set **Source** to **GitHub Actions**.
4. Update `NEXT_PUBLIC_BASE_PATH` to match your repo name (e.g. `/abroad`).
   For a user/organization page (`user.github.io`), leave it empty.

### Option B — local build + `gh-pages` branch

```bash
# 1. Install
npm install

# 2. Build static export (set the base path to your repo name)
NEXT_PUBLIC_STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/abroad npm run build

# 3. Push the ./out folder to the gh-pages branch
npx gh-pages -d out
```

Then in **Settings → Pages**, set **Source** to the `gh-pages` branch.

### Local development

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. No environment variables are needed for dev.

## How streaming works

abroad does **not** host or proxy any audio. When you play a track:

1. The track's YouTube video ID is resolved from search / browse results.
2. The app queries a pool of public **Piped** API instances for a direct audio
   stream URL (`/streams/{id}`).
3. If all Piped instances fail, it falls back to **Invidious** instances
   (`/api/v1/videos/{id}`).
4. As a last resort, it tries the YouTube InnerTube `player` endpoint (often
   blocked for music content).
5. Failed instances are temporarily skipped (60-second backoff) so subsequent
   requests try healthy mirrors first.

The same failover strategy is used for search and home data — Piped and
Invidious both send proper CORS headers, so a static site can call them
directly from the browser.

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Play / pause |
| `→` | Next track |
| `←` | Previous track (or restart if >3s in) |
| `↑` / `↓` | Volume up / down |
| `Shift+→` / `Shift+←` | Seek ±10s |
| `M` | Mute toggle |
| `S` | Shuffle toggle |
| `R` | Repeat cycle (off → all → one) |
| `Q` | Toggle queue |
| `Esc` | Close Now Playing / queue / go back |

## Credits

- **[vivi-music](https://github.com/vivizzz007/vivi-music)** — reference
  implementation for search and stream extraction. The architecture of
  abroad's data layer (Piped-first failover, client-side InnerTube) is heavily
  inspired by vivi-music.
- **[youtubei.js](https://github.com/LuanRT/YouTube.js)** — the definitive
  InnerTube / YouTube.js library. abroad ships a from-scratch, browser-native
  InnerTube client (no Node polyfills needed) but follows the same protocol and
  client-context conventions documented by youtubei.js.
- **[Piped](https://github.com/TeamPiped/Piped)** and
  **[Invidious](https://github.com/iv-org/invidious)** — the open-source
  alternative front-ends whose public instances power search, browse, and
  streaming.
- **[shadcn/ui](https://ui.shadcn.com/)** — UI component primitives.
- **[Lucide](https://lucide.dev/)** — icon set.

## Streaming disclaimer

abroad is a client-side music player UI. It does not host, store, or transmit
any audio content. All audio is fetched directly from public Piped and
Invidious mirrors by the user's browser. The availability and legality of
these mirrors varies by jurisdiction and over time — the app simply tries
each known instance in order until one responds.

abroad is not affiliated with YouTube, Google, or YouTube Music. It is an
independent project for educational purposes. Users are responsible for
complying with their local laws and YouTube's Terms of Service when using
this software. If any rights holder or mirror operator wishes to be removed
from the instance lists, please open an issue and the entry will be
removed promptly.

## License

MIT
