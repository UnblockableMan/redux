// YouTube Music data types
// These map the InnerTube API responses into clean domain models.

export interface YTMTrack {
  videoId: string;
  title: string;
  artists: YTMArtist[];
  album?: YTMAlbum;
  duration: string; // "3:45"
  durationSeconds: number;
  thumbnail: string;
  isExplicit?: boolean;
}

export interface YTMArtist {
  artistId: string | null;
  name: string;
  thumbnail?: string;
  subscribers?: string;
  description?: string;
}

export interface YTMAlbum {
  albumId: string;
  title: string;
  year?: string;
  thumbnail?: string;
  trackCount?: number;
}

export interface YTMPlaylist {
  playlistId: string;
  title: string;
  thumbnail: string;
  subtitle: string;
  trackCount?: number;
}

export interface HomeSection {
  title: string;
  items: HomeItem[];
}

export type HomeItem = YTMTrack | YTMAlbum | YTMArtist | YTMPlaylist;

export interface SearchResults {
  tracks: YTMTrack[];
  artists: YTMArtist[];
  albums: YTMAlbum[];
  playlists: YTMPlaylist[];
  topResult?: YTMTrack | YTMArtist | YTMAlbum;
}

export type RepeatMode = "off" | "all" | "one";

export interface Playlist {
  id: string;
  name: string;
  createdAt: number;
  trackIds: string[]; // ordered list of videoIds
}
