// Fallback content shown when live Piped instances are unreachable.
// These are real YouTube Music video IDs — playback works via the YouTube
// IFrame API even when the data APIs are down.

import type { YTMTrack, HomeSection, SearchResults } from "./types";

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
  T("ZbZSe6N_BXs", "Happy", "Pharrell Williams", "3:53"),
  T("OPf0YbXqDm0", "Uptown Funk", "Mark Ronson", "4:31"),
  T("YQHsXMglC9A", "Hello", "Adele", "6:07"),
  T("JGwWNGJdvx8", "Shape of You", "Ed Sheeran", "3:54"),
  T("RgKAFK5djSk", "See You Again", "Wiz Khalifa", "3:57"),
  T("CevxZvSJLk8", "Roar", "Katy Perry", "3:43"),
  T("09R8_2nJtjg", "Sugar", "Maroon 5", "5:01"),
  T("60ItHLz5WEA", "Faded", "Alan Walker", "3:32"),
  T("2vjPBrBU-TM", "Sandstorm", "Darude", "3:46"),
  T("papuvlVeZg8", "Tremor", "Dimitri Vegas & Like Mike", "4:58"),
  T("tVj0ZTS4WF4", "The Nights", "Avicii", "2:57"),
  T("gCJ3K-m4nQ4", "Wake Me Up", "Avicii", "4:07"),
  T("60nZcLI8ejE", "Lean On", "Major Lazer", "2:55"),
  T("pt8VYOfr5To", "Familiar", "Agnes", "3:32"),
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

// Simple demo search: match query against the demo tracks by title/artist.
export function demoSearch(query: string): SearchResults {
  const q = query.toLowerCase();
  const matches = DEMO_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.artists.some((a) => a.name.toLowerCase().includes(q)),
  );
  return {
    tracks: matches,
    artists: [],
    albums: [],
    playlists: [],
    topResult: matches[0],
  };
}
