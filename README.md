# abroad

A static web proxy hub — games, music, browser, and anime in one place. Charcoal aesthetic, side tool belt, no backend, no corporate slop.

Inspired by [Lyra](https://github.com/gayq/lyra), [aetheris](https://github.com/mynamescrax/aetheris), and [Cartel/ReduX](https://github.com/UnblockableMan/Cartel).

## Features

- **Games** — 25+ HTML5 games aggregated from open sources (2048, Tetris, Chess, Minecraft 2D, Flappy Bird, and more). Playable in-browser.
- **Music** — YouTube Music player with search, library, playlists, and full-screen Now Playing. Audio via YouTube IFrame API.
- **Browser** — Web browser with Wisp/Scramjet proxy support. URL bar, history, shortcuts.
- **Anime** — Placeholder for your own anime source. Point it at any streaming site.
- **Settings** — 5 themes (Charcoal, Midnight, Blood, Matrix, Paper), proxy config, tab cloak (Google/Drive/Classroom/Gmail/Docs), setup status.
- **Setup Guide** — Step-by-step self-hosting instructions.

## Design

- **Charcoal black** background with grey/white text
- **Side tool belt** — vertical icon dock on the left (Home, Games, Music, Browser, Anime, Settings)
- **Settings panel** slides in from the right corner
- Clean, minimal, indie aesthetic — no corporate gradients or stock UI

## Stack

- Next.js 16 (static export) · TypeScript · Tailwind CSS 4
- Zustand for state · YouTube IFrame API for audio
- Deployable to Cloudflare Pages, GitHub Pages, Netlify, or any static host

## Self-hosting

### Quick start

```bash
git clone https://github.com/yourname/abroad.git
cd abroad
npm install
npm run dev
```

### Build for production

```bash
# Static build → ./out folder
npm run build:cf
```

### Deploy to Cloudflare Pages

1. Push to GitHub
2. Connect repo to Cloudflare Pages
3. Settings:
   - **Build command:** `npm run build:cf`
   - **Build output:** `out`
   - **Node version:** 20
4. Deploy

Or use the CLI:

```bash
npx wrangler pages deploy out --project-name abroad
```

### Wisp proxy (for the Browser app)

The Browser app uses a Wisp endpoint to proxy traffic. The default points to a public endpoint — for reliability, run your own:

```bash
npx @mercuryworkshop/wisp-server
```

Then paste your Wisp URL into Settings → Proxy.

## Credits

- [Lyra](https://github.com/gayq/lyra) — game aggregation approach, aesthetic inspiration
- [aetheris](https://github.com/mynamescrax/aetheris) — app structure
- [Cartel/ReduX](https://github.com/UnblockableMan/Cartel) — static proxy approach
- [Mercury Workshop](https://github.com/mercuryworkshop/) — Wisp server, Scramjet
- [gn-math](https://github.com/gn-math/gn-math.github.io/) — game source
- [youtubei.js](https://github.com/LuanRT/YouTube.js) — InnerTube API reference

## License

MIT
