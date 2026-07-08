'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import Player from '@/components/common/Player';
import { mockAlbums, mockTracks } from '@/utils/mockData';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';

// ---------- Types ----------
interface Track {
  id: string;
  title: string;
  artist: { id: string; name: string };
  coverImage: string;
  duration: number;
  album?: { id: string; title: string };
  listeners: number;
  streams: number;
  releaseDate: Date;
}

interface Album {
  id: string;
  title: string;
  artist: { id: string; name: string };
  coverImage: string;
  releaseDate: Date;
  genre: string[];
  tracks: Track[];
}

interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: string;
}

// ---------- Helper Functions ----------
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const generateId = () => Math.random().toString(36).substring(2, 10);

const loadPlaylists = (userId?: string): Playlist[] => {
  if (typeof window === 'undefined' || !userId) return [];
  const key = `playlists_${userId}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading playlists:', e);
  }
  return [];
};

const savePlaylists = (userId: string, playlists: Playlist[]) => {
  if (typeof window === 'undefined') return;
  const key = `playlists_${userId}`;
  localStorage.setItem(key, JSON.stringify(playlists));
};

// ---------- Main Component ----------
export default function AlbumsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // ---------- State ----------
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'listeners' | 'date'>('date');
  const [filteredAlbums, setFilteredAlbums] = useState(mockAlbums);
  const [filteredTracks, setFilteredTracks] = useState(mockTracks);
  const [showTrackMenu, setShowTrackMenu] = useState<string | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [isAddingToPlaylist, setIsAddingToPlaylist] = useState<{
    trackId: string;
    playlistId: string;
  } | null>(null);

  // Load user playlists
  useEffect(() => {
    if (user) {
      setUserPlaylists(loadPlaylists(user.id));
    }
  }, [user]);

  // Apply search and filters
  useEffect(() => {
    let albums = mockAlbums;
    let tracks = mockTracks;

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      albums = albums.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.artist.name.toLowerCase().includes(query)
      );
      tracks = tracks.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.artist.name.toLowerCase().includes(query) ||
          (t.album?.title && t.album.title.toLowerCase().includes(query))
      );
    }

    // Sort
    if (sortBy === 'listeners') {
      albums = [...albums].sort((a, b) => b.tracks.reduce((sum, t) => sum + t.listeners, 0) - a.tracks.reduce((sum, t) => sum + t.listeners, 0));
      tracks = [...tracks].sort((a, b) => b.listeners - a.listeners);
    } else {
      albums = [...albums].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
      tracks = [...tracks].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    }

    setFilteredAlbums(albums);
    setFilteredTracks(tracks);
  }, [searchQuery, sortBy]);

  // ---------- Playlist Management ----------
  const getMaxPlaylists = (): number => {
    if (!user) return 6;
    switch (user.subscriptionType) {
      case 'gold':
        return Infinity;
      case 'silver':
        return 100;
      default:
        return 6;
    }
  };

  const handleAddToPlaylist = (trackId: string, playlistId: string) => {
    if (!user) {
      toast.error(t('albums.login_required'));
      return;
    }

    const track = mockTracks.find((t) => t.id === trackId);
    if (!track) {
      toast.error(t('albums.track_not_found'));
      return;
    }

    setIsAddingToPlaylist({ trackId, playlistId });

    const playlists = loadPlaylists(user.id);
    const playlistIndex = playlists.findIndex((p) => p.id === playlistId);
    if (playlistIndex === -1) {
      toast.error(t('albums.playlist_not_found'));
      setIsAddingToPlaylist(null);
      return;
    }

    const existingTrackIds = new Set(playlists[playlistIndex].tracks.map((t) => t.id));
    if (existingTrackIds.has(trackId)) {
      // Remove from playlist
      playlists[playlistIndex].tracks = playlists[playlistIndex].tracks.filter(
        (t) => t.id !== trackId
      );
      savePlaylists(user.id, playlists);
      setUserPlaylists(playlists);
      toast.success(t('albums.removed_from_playlist', { title: track.title }));
    } else {
      // Add to playlist
      if (playlists[playlistIndex].tracks.length >= 50) {
        toast.error(t('albums.playlist_full'));
        setIsAddingToPlaylist(null);
        return;
      }
      playlists[playlistIndex].tracks.push(track);
      savePlaylists(user.id, playlists);
      setUserPlaylists(playlists);
      toast.success(t('albums.added_to_playlist', { title: track.title }));
    }

    setIsAddingToPlaylist(null);
    setShowTrackMenu(null);
  };

  const isTrackInPlaylist = (trackId: string, playlistId: string): boolean => {
    const playlist = userPlaylists.find((p) => p.id === playlistId);
    if (!playlist) return false;
    return playlist.tracks.some((t) => t.id === trackId);
  };

  // ---------- Render ----------
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // or a loading skeleton
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">{t('albums.login_required')}</p>
      </div>
    );
  }

  const maxPlaylists = getMaxPlaylists();

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-white">{t('albums.title')}</h1>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('albums.search_placeholder')}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] rounded-lg text-white border border-gray-700 focus:border-primary outline-none transition"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('date')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  sortBy === 'date'
                    ? 'bg-primary text-black'
                    : 'bg-[#1a1a1a] text-text-secondary hover:bg-[#2a2a2a]'
                }`}
              >
                {t('albums.latest')}
              </button>
              <button
                onClick={() => setSortBy('listeners')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  sortBy === 'listeners'
                    ? 'bg-primary text-black'
                    : 'bg-[#1a1a1a] text-text-secondary hover:bg-[#2a2a2a]'
                }`}
              >
                {t('albums.most_popular')}
              </button>
            </div>
          </div>

          {/* Albums Section */}
          {filteredAlbums.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold text-white mb-4">{t('albums.albums_section')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredAlbums.map((album) => (
                  <Link
                    key={album.id}
                    href={`/album/${album.id}`}
                    className="bg-[#1a1a1a] rounded-lg p-3 hover:bg-[#242424] transition border border-gray-800 hover:border-gray-600 block"
                  >
                    <div className="w-full aspect-square bg-gray-700 rounded-md overflow-hidden mb-2">
                      <img
                        src={album.coverImage}
                        alt={album.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-white font-medium truncate text-sm">{album.title}</p>
                    {/* ✅ FIX: Use span with onClick instead of nested Link */}
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = `/artist/${album.artist.id}`;
                      }}
                      className="text-text-secondary text-xs hover:text-primary transition truncate block cursor-pointer"
                    >
                      {album.artist.name}
                    </span>
                    <p className="text-text-secondary text-xs mt-1">
                      {album.tracks.length} {t('albums.tracks_count')} • {new Date(album.releaseDate).getFullYear()}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Tracks Section */}
          {filteredTracks.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('albums.tracks_section')}</h2>
              <div className="space-y-2">
                {filteredTracks.map((track) => (
                  <div
                    key={track.id}
                    className="bg-[#1a1a1a] rounded-lg p-3 hover:bg-[#242424] transition border border-gray-800 hover:border-gray-600 flex items-center gap-4"
                  >
                    {/* Track Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                        <img
                          src={track.coverImage}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <Link
                            href={`/player/${track.id}`}
                            className="text-white font-medium hover:text-primary transition truncate"
                          >
                            {track.title}
                          </Link>
                          <span className="text-text-secondary text-xs">
                            • {formatDuration(track.duration)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 text-xs">
                          <span
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.location.href = `/artist/${track.artist.id}`;
                            }}
                            className="text-text-secondary hover:text-primary transition cursor-pointer"
                          >
                            {track.artist.name}
                          </span>
                          {track.album && (
                            <>
                              <span className="text-text-secondary">•</span>
                              <Link
                                href={`/album/${track.album.id}`}
                                className="text-text-secondary hover:text-primary transition"
                              >
                                {track.album.title}
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-4 text-text-secondary text-xs">
                      <span>👂 {track.listeners.toLocaleString()}</span>
                      <span>▶️ {track.streams.toLocaleString()}</span>
                    </div>

                    {/* Playlist Menu */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowTrackMenu(showTrackMenu === track.id ? null : track.id)
                        }
                        className="p-1.5 text-text-secondary hover:text-white transition rounded"
                      >
                        <PlusIcon className="w-5 h-5" />
                      </button>

                      {showTrackMenu === track.id && (
                        <div className="absolute right-0 top-full mt-1 w-56 bg-[#2a2a2a] border border-gray-700 rounded-lg shadow-lg z-20 py-2">
                          <div className="px-3 py-1 text-xs text-text-secondary border-b border-gray-700">
                            {t('albums.add_to_playlist')}
                          </div>
                          {userPlaylists.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-text-secondary">
                              {t('albums.no_playlists')}
                              <Link
                                href="/playlist"
                                className="block text-primary mt-1 hover:underline"
                              >
                                {t('albums.create_playlist')} →
                              </Link>
                            </div>
                          ) : (
                            userPlaylists.map((playlist) => {
                              const isInPlaylist = isTrackInPlaylist(track.id, playlist.id);
                              return (
                                <button
                                  key={playlist.id}
                                  onClick={() => handleAddToPlaylist(track.id, playlist.id)}
                                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-[#333] transition flex items-center justify-between"
                                >
                                  <span>{playlist.name}</span>
                                  {isInPlaylist ? (
                                    <CheckIcon className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <PlusIcon className="w-4 h-4 text-text-secondary" />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {filteredAlbums.length === 0 && filteredTracks.length === 0 && (
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-12 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold text-white mb-2">{t('albums.no_results')}</h2>
              <p className="text-text-secondary">{t('albums.no_results_desc')}</p>
            </div>
          )}
        </div>
      </main>
      <Player />
    </div>
  );
}