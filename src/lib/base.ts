// Resolve an asset path against the deploy base (GitHub Pages project subpath).
// `/logo.svg` alone 404s when the site lives at /redux/ — this fixes that.

export function getBasePath(): string {
  if (typeof window === "undefined") return "/";
  const p = window.location.pathname.replace(/[^/]*$/, "");
  return p.endsWith("/") ? p : p + "/";
}

export function withBase(path: string): string {
  return getBasePath() + path.replace(/^\//, "");
}
