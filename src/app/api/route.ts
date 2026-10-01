import { NextResponse } from "next/server";

// Required for `output: "export"` (GitHub Pages / Cloudflare static deploys):
// prerender this route handler at build time instead of running a server.
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ message: "Hello, world!" });
}