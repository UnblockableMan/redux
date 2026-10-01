import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "abroad OS — a web desktop",
  description:
    "abroad OS is a static, client-side web desktop. Window manager, dock, apps, and a built-in music player — no backend, no account.",
  keywords: ["abroad", "web OS", "desktop", "music player", "Cloudflare Pages"],
  authors: [{ name: "abroad" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "abroad OS — a web desktop",
    description:
      "A static web desktop environment with a built-in YouTube Music player.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Inline script to mark as booted=false on first load so the boot screen shows.
const bootScript = `
(function() {
  try {
    var raw = localStorage.getItem('abroad-os-settings');
    if (raw) {
      var parsed = JSON.parse(raw);
      // If already booted in a prior session, skip boot screen on reload.
      if (parsed?.state?.booted) {
        document.documentElement.setAttribute('data-booted', '1');
      }
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground overflow-hidden`}
      >
        {children}
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
