// Fallback content shown when live Piped/Invidious instances are unreachable.
// These are real YouTube Music video IDs — playback depends on the streaming
// instances being up, but the UI (cards, track rows, player) is fully usable
// even without a live connection.

import type { YTMTrack, HomeSection } from "./types";

const T = (videoId: string, title: string, artist: string, duration: string): YTMTrack => ({
  videoId,
  title,
  artists: [{ artistId: null, name: artist }],
  duration,
  durationSeconds: duration
    .split(":")
    .reduce((a, p) => a * 60 + Number(p), 0),
  thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
});

export const DEMO_TRACKS: YTMTrack[] = [
  T("dQw4w9WgXcQ", "Never Gonna Give You Up", "Rick Astley", "3:33"),
  T("kJQP7kiw5Fk", "Despacito", "Luis Fonsi", "4:42"),
  T("9bZkp7q19f0", "Gangnam Style", "PSY", "4:13"),
  T("fJ9rUzIMcZQ", "Bohemian Rhapsody", "Queen", "5:59"),
  T("ZbZSe6N_BXs", "Pharrell Williams - Happy", "Pharrell Williams", "3:53"),
  T("OPf0YbXqDm0", "Mark Ronson - Uptown Funk", "Mark Ronson", "4:31"),
  T("YQHsXMglC9A", "Adele - Hello", "Adele", "6:07"),
  T("JGwWNGJdvx8", "Ed Sheeran - Shape of You", "Ed Sheeran", "3:54"),
  T("RgKAFK5djSk", "Wiz Khalifa - See You Again", "Wiz Khalifa", "3:57"),
  T("CevxZvSJLk8", "Katy Perry - Roar", "Katy Perry", "3:43"),
  T("09R8_2nJtjg", "Maroon 5 - Sugar", "Maroon 5", "5:01"),
  T("60ItHLz5WEA", "Alan Walker - Faded", "Alan Walker", "3:32"),
];

export const DEMO_HOME_SECTIONS: HomeSection[] = [
  {
    title: "Quick picks",
    items: DEMO_TRACKS.slice(0, 6),
  },
  {
    title: "Popular right now",
    items: DEMO_TRACKS.slice(6),
  },
];
