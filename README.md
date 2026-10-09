# canc3r

`canc3r` is a static games, apps, movies, and browser hub. It uses a black-and-white default theme and keeps the upstream theme selector for other color schemes.

## Run locally

Serve the repository root with any static web server:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open <http://localhost:8000>. This is for local development only. The app uses service workers and browser APIs, so use `http://localhost` or HTTPS rather than opening `index.html` directly.

## Deployment

This is a static site. The included `Caddyfile` serves the repository root on port `81`; run Caddy from the repository root. It denies access to local configuration, database, and user-data paths.

Cloudflare Pages deploys automatically on pushes to `main` through `.github/workflows/cloudflare-pages.yml`. Create a Pages project once (default name `redux`, production branch `main`), then set the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets. The token needs permission to create and deploy Pages projects. Set the `CLOUDFLARE_PAGES_PROJECT` repository variable to use a different project name. You can also run `python3 scripts/build_cloudflare_pages.py` followed by `npx wrangler@4 pages deploy dist --project-name=redux`.

The Pages build omits files larger than Cloudflare's 25 MiB per-file limit; these oversized game assets must be hosted separately (for example, in R2) to be available on the Pages deployment. The current source tree contains six such assets. The build also excludes local configuration, dependencies, and private data directories.

## Fork notice

This project includes code originally created by x8r and contributors. That source remains under the GNU Affero General Public License version 3; see [LICENSE](./LICENSE).

The visual theme is adapted from [mynamescrax/aetheris](https://github.com/mynamescrax/aetheris), also licensed under AGPL-3.0. The respective upstream projects retain credit for their original work.

Changes in this fork:

- Replaced the previous app with the canc3r static site.
- Rebranded the interface as canc3r.
- Made the default palette monochrome and adapted Aetheris's dark grid styling.
- Added a linked `logo.svg` and updated site icon references.
- Removed the upstream project's external visitor analytics.
- Kept the full game catalogue in the source; Cloudflare Pages omits six game assets that exceed its per-file limit.
