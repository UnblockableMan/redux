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
  title: "abroad — a music player",
  description:
    "abroad is a static, client-side YouTube Music player. Search, stream, queue and build your own library — no backend, no account.",
  keywords: ["abroad", "music player", "YouTube Music", "static", "GitHub Pages"],
  authors: [{ name: "abroad" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "abroad — a music player",
    description:
      "Static, client-side YouTube Music player with glassmorphism UI and YouTube IFrame playback.",
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

// Inline script to apply the saved theme before hydration (prevents flash).
const themeScript = `
(function() {
  try {
    var raw = localStorage.getItem('abroad-theme');
    var theme = 'dark';
    if (raw) {
      var parsed = JSON.parse(raw);
      theme = parsed?.state?.theme || 'dark';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
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
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
