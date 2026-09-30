import type { NextConfig } from "next";

// For GitHub Pages deployment:
//   1) Set NEXT_PUBLIC_BASE_PATH to "/<repo-name>" (e.g. "/abroad")
//   2) Set NEXT_PUBLIC_STATIC_EXPORT=1
//   3) Run: bun run build:gh  (or npm run build:gh)
//   4) Push the contents of ./out to the gh-pages branch
const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : "standalone",
  basePath,
  // Generate trailing slashes so GitHub Pages serves folder/index.html
  trailingSlash: isStaticExport,
  images: {
    // GitHub Pages static export cannot run the Next.js image optimizer.
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Dev preview lints on save; production builds skip the lint step so
    // GitHub Pages deploys are not blocked by style warnings.
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins: ["*.space-z.ai", "*.chatglm.cn"],
  reactStrictMode: false,
};

export default nextConfig;
