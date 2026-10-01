import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "redux.",
  description: "static web proxy hub — games, music, browser, anime, extensions.",
  icons: { icon: "/logo.svg" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

// Scripts that must load before the app — Scramjet proxy dependencies.
const headScripts = `
<script src="https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.all.js" defer></script>
<script type="module">
  import * as BareMux from "https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux/dist/index.mjs";
  window.BareMux = BareMux;
</script>
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head dangerouslySetInnerHTML={{ __html: headScripts }} />
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
