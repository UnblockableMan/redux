"use client";

export function AboutApp() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-background p-8 text-center">
      <img src="/logo.svg" alt="abroad" className="h-20 w-20" />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">abroad OS</h1>
        <p className="mt-1 text-sm text-muted-foreground">Version 1.0 · indie web desktop</p>
      </div>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        A static web desktop environment that runs entirely in your browser.
        No backend, no account, no telemetry. Built with Next.js and deployed
        to Cloudflare Pages.
      </p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-white/5 px-4 py-3">
          <div className="text-xs text-muted-foreground">Shell</div>
          <div className="font-medium">websh 1.0</div>
        </div>
        <div className="rounded-lg bg-white/5 px-4 py-3">
          <div className="text-xs text-muted-foreground">FS</div>
          <div className="font-medium">localStorage</div>
        </div>
        <div className="rounded-lg bg-white/5 px-4 py-3">
          <div className="text-xs text-muted-foreground">Apps</div>
          <div className="font-medium">8 built-in</div>
        </div>
        <div className="rounded-lg bg-white/5 px-4 py-3">
          <div className="text-xs text-muted-foreground">Audio</div>
          <div className="font-medium">YT IFrame</div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Music powered by YouTube IFrame API. Inspired by YukiOS, dogeub, and lyra.
      </p>
    </div>
  );
}
