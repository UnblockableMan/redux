# canc3r

`canc3r` is a static games, apps, movies, and browser hub. It uses a black-and-white default theme and keeps the upstream theme selector for other color schemes.

## Run locally

Serve the repository root with any static web server:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open <http://localhost:8000>. This is for local development only. The app uses service workers and browser APIs, so use `http://localhost` or HTTPS rather than opening `index.html` directly.

## Deployment

This is a static site. The included `Caddyfile` serves the repository root on port `81`; run Caddy from the repository root. It denies access to local configuration, database, and user-data paths. Other hosts must support the full asset set (about 2.8 GB, with individual files up to about 70 MB). GitHub Pages' 1 GB site limit is too small, so this fork does not include a Pages deployment workflow.

## Fork notice

This project is derived from [x8rr/cherri](https://github.com/x8rr/cherri), originally created by x8r and the Cherri contributors. Its original code remains under the GNU Affero General Public License version 3; see [LICENSE](./LICENSE).

The visual theme is adapted from [mynamescrax/aetheris](https://github.com/mynamescrax/aetheris), also licensed under AGPL-3.0. The respective upstream projects retain credit for their original work.

Changes in this fork:

- Replaced the previous app with the Cherri static site.
- Rebranded the interface as canc3r.
- Made the default palette monochrome and adapted Aetheris's dark grid styling.
- Added an original static `logo.svg` and updated site icon references.
- Removed Cherri's external visitor analytics.
- Kept the full game catalogue; deployment requires a static host with sufficient site and per-file limits.
