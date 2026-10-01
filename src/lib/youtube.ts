// YouTube IFrame API loader.
// The IFrame API is the most reliable way to play YouTube audio in a browser —
// it always works (no CORS, no flaky third-party instances), and YouTube Music
// video IDs are standard YouTube video IDs that play perfectly through it.

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

export function loadYouTubeAPI(): Promise<void> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    // Already loaded (e.g. hot reload).
    if (window.YT?.Player) {
      resolve();
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    tag.onerror = () => {
      apiPromise = null; // allow retry
      reject(new Error("Failed to load YouTube IFrame API"));
    };
    document.head.appendChild(tag);
    // Safety timeout.
    setTimeout(() => {
      if (!window.YT?.Player) {
        apiPromise = null;
        reject(new Error("YouTube IFrame API timed out"));
      }
    }, 12000);
  });
  return apiPromise;
}
