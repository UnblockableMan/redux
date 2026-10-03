import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], style: ["normal", "italic"], weight: ["400", "500", "600", "700"] });

// Build-time basePath so static-export assets (favicon) resolve on subpath hosts.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "redux V10",
  description: "redux V10 static web proxy hub games music browser anime cloud gaming inspired by opium",
  icons: { icon: `${BASE_PATH}/logo.svg` },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

// Scripts that must load before the app — Scramjet proxy dependencies + chat.
const headScripts = `
<script src="https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.all.js" defer></script>
<script type="module">
  import * as BareMux from "https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux/dist/index.mjs";
  window.BareMux = BareMux;
</script>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
<link rel="preconnect" href="https://megaplay.buzz" crossorigin />
<link rel="preconnect" href="https://fetch.nexabloom.top" crossorigin />
<link rel="preconnect" href="https://graphql.anilist.co" crossorigin />
`;

// Chat widget — widgetbot Crate. Loads after the page so the rest of the
// app boots first. The Crate button appears in the bottom-right corner.
const chatScript = `
<script src="https://cdn.jsdelivr.net/npm/@widgetbot/crate@3" async defer></script>
<script>
  window.addEventListener('load', function () {
    if (typeof Crate === 'undefined') {
      // Retry once the script has had a moment to load.
      setTimeout(arguments.callee, 500);
      return;
    }
    new Crate({ server: '1554247947649028188' });
  });
</script>
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head dangerouslySetInnerHTML={{ __html: headScripts }} />
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}>
        {children}
        <Toaster />
        <SonnerToaster />
        <div dangerouslySetInnerHTML={{ __html: chatScript }} />
      </body>
    </html>
  );
}
