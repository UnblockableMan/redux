// Library store: liked songs, recently played, user playlists.
// Persisted to localStorage so the static site has zero backend.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { YTMTrack, Playlist } from "@/lib/ytm/types";

interface LibraryState {
  liked: Record<string, YTMTrack>; // videoId -> track
  recentlyPlayed: YTMTrack[]; // most recent first, capped at 50
  playlists: Playlist[];
  playlistTracks: Record<string, Record<string, YTMTrack>>; // playlistId -> videoId -> track

  toggleLike: (track: YTMTrack) => void;
  isLiked: (videoId: string) => boolean;
  addRecentlyPlayed: (track: YTMTrack) => void;

  createPlaylist: (name: string) => string;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, track: YTMTrack) => void;
  removeFromPlaylist: (playlistId: string, videoId: string) => void;
  reorderPlaylist: (playlistId: string, from: number, to: number) => void;
  getPlaylistTracks: (playlistId: string) => YTMTrack[];
}

function genId() {
  return "pl_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      liked: {},
      recentlyPlayed: [],
      playlists: [],
      playlistTracks: {},

      toggleLike: (track) =>
        set((s) => {
          const liked = { ...s.liked };
          if (liked[track.videoId]) {
            delete liked[track.videoId];
          } else {
            liked[track.videoId] = track;
          }
          return { liked };
        }),

      isLiked: (videoId) => !!get().liked[videoId],

      addRecentlyPlayed: (track) =>
        set((s) => {
          const filtered = s.recentlyPlayed.filter((t) => t.videoId !== track.videoId);
          return { recentlyPlayed: [track, ...filtered].slice(0, 50) };
        }),

      createPlaylist: (name) => {
        const id = genId();
        set((s) => ({
          playlists: [
            ...s.playlists,
            { id, name: name || "New Playlist", createdAt: Date.now(), trackIds: [] },
          ],
          playlistTracks: { ...s.playlistTracks, [id]: {} },
        }));
        return id;
      },

      renamePlaylist: (id, name) =>
        set((s) => ({
          playlists: s.playlists.map((p) => (p.id === id ? { ...p, name } : p)),
        })),

      deletePlaylist: (id) =>
        set((s) => {
          const playlists = s.playlists.filter((p) => p.id !== id);
          const playlistTracks = { ...s.playlistTracks };
          delete playlistTracks[id];
          return { playlists, playlistTracks };
        }),

      addToPlaylist: (playlistId, track) =>
        set((s) => {
          const playlist = s.playlists.find((p) => p.id === playlistId);
          if (!playlist) return s;
          if (playlist.trackIds.includes(track.videoId)) return s;
          return {
            playlists: s.playlists.map((p) =>
              p.id === playlistId
                ? { ...p, trackIds: [...p.trackIds, track.videoId] }
                : p,
            ),
            playlistTracks: {
              ...s.playlistTracks,
              [playlistId]: {
                ...(s.playlistTracks[playlistId] ?? {}),
                [track.videoId]: track,
              },
            },
          };
        }),

      removeFromPlaylist: (playlistId, videoId) =>
        set((s) => {
          const tracks = { ...(s.playlistTracks[playlistId] ?? {}) };
          delete tracks[videoId];
          return {
            playlists: s.playlists.map((p) =>
              p.id === playlistId
                ? { ...p, trackIds: p.trackIds.filter((id) => id !== videoId) }
                : p,
            ),
            playlistTracks: { ...s.playlistTracks, [playlistId]: tracks },
          };
        }),

      reorderPlaylist: (playlistId, from, to) =>
        set((s) => ({
          playlists: s.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            const ids = [...p.trackIds];
            const [moved] = ids.splice(from, 1);
            ids.splice(to, 0, moved);
            return { ...p, trackIds: ids };
          }),
        })),

      getPlaylistTracks: (playlistId) => {
        const playlist = get().playlists.find((p) => p.id === playlistId);
        const tracks = get().playlistTracks[playlistId] ?? {};
        if (!playlist) return [];
        return playlist.trackIds.map((id) => tracks[id]).filter(Boolean);
      },
    }),
    {
      name: "abroad-library",
      // Only persist data, not methods (methods are auto-stripped by zustand).
      partialize: (s) => ({
        liked: s.liked,
        recentlyPlayed: s.recentlyPlayed,
        playlists: s.playlists,
        playlistTracks: s.playlistTracks,
      }),
    },
  ),
);
