import type { NextConfig } from "next";

// abroad OS — static export for Cloudflare Pages (or GitHub Pages, Netlify, etc.)
//
// For Cloudflare Pages:
//   Build command:   npm run build:cf
//   Build output:    out
//
// The build produces a fully static ./out directory. No server, no edge
// functions — just HTML/CSS/JS that runs entirely in the browser.
const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : "standalone",
  basePath,
  // Trailing slashes so static hosts serve folder/index.html
  trailingSlash: isStaticExport,
  images: {
    // Static export cannot run the Next.js image optimizer.
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins: ["*.space-z.ai", "*.chatglm.cn", "*.pages.dev"],
  reactStrictMode: false,
};

export default nextConfig;
