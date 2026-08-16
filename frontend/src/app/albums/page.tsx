'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import Player from '@/components/common/Player';
import { mockAlbums, mockTracks } from '@/utils/mockData';
import { api } from '@/services/api';
import { mediaUrl } from '@/utils/media';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';

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
  audioUrl: string;
  lyrics?: string;
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

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function AlbumsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'listeners' | 'date'>('date');
  const [allAlbums, setAllAlbums] = useState<Album[]>(mockAlbums);
  const [allTracks, setAllTracks] = useState<Track[]>(mockTracks);
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>(mockAlbums);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>(mockTracks);
  const [showTrackMenu, setShowTrackMenu] = useState<string | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch real albums and tracks from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [albRes, trkRes, plRes] = await Promise.all([
          api.get('/music/albums/').catch(() => null),
          api.get('/music/tracks/').catch(() => null),
          api.get('/playlists/playlists/').catch(() => null),
        ]);

        if (albRes?.data) {
          const rawAlb = Array.isArray(albRes.data) ? albRes.data : albRes.data.results || [];
          if (rawAlb.length > 0) {
            const formattedAlbums: Album[] = rawAlb.map((a: any) => ({
              id: a.id.toString(),
              title: a.title,
              artist: { id: a.artist?.id?.toString() || '1', name: a.artist?.display_name || a.artist_name || 'Artist' },
              coverImage: a.cover_image || '/images/default-album.jpg',
              releaseDate: new Date(a.release_date || Date.now()),
              genre: [a.genre || 'Pop'],
              tracks: (a.tracks || []).map((tItem: any) => ({
                id: tItem.id.toString(),
                title: tItem.title,
                artist: { id: tItem.artist?.id?.toString() || '1', name: tItem.artist?.display_name || 'Artist' },
                coverImage: tItem.cover_image || a.cover_image || '/images/default-track.jpg',
                duration: tItem.duration || 180,
                listeners: tItem.listeners || 0,
                streams: tItem.streams || 0,
                releaseDate: new Date(),
                audioUrl: mediaUrl(tItem.audio_file) || tItem.audio_file || '',
                lyrics: tItem.lyrics || '',
              })),
            }));
            setAllAlbums(formattedAlbums);
          }
        }

        if (trkRes?.data) {
          const rawTrk = Array.isArray(trkRes.data) ? trkRes.data : trkRes.data.results || [];
          if (rawTrk.length > 0) {
            const formattedTracks: Track[] = rawTrk.map((tItem: any) => ({
              id: tItem.id.toString(),
              title: tItem.title,
              artist: { id: tItem.artist?.id?.toString() || '1', name: tItem.artist?.display_name || 'Artist' },
              coverImage: tItem.cover_image || '/images/default-track.jpg',
              duration: tItem.duration || 180,
              album: tItem.album ? { id: tItem.album.id.toString(), title: tItem.album.title } : undefined,
              listeners: tItem.listeners || 0,
              streams: tItem.streams || 0,
              releaseDate: new Date(),
              audioUrl: mediaUrl(tItem.audio_file) || tItem.audio_file || '',
              lyrics: tItem.lyrics || '',
            }));
            setAllTracks(formattedTracks);
          }
        }

        if (plRes?.data) {
          const rawPl = Array.isArray(plRes.data) ? plRes.data : plRes.data.results || [];
          if (rawPl.length > 0) {
            setUserPlaylists(
              rawPl.map((p: any) => ({
                id: p.id.toString(),
                name: p.name,
                tracks: p.tracks || [],
                createdAt: p.created_at || new Date().toISOString(),
              }))
            );
          }
        }
      } catch (e) {
        console.error('API load error on albums page:', e);
      }
    };

    fetchData();
  }, []);

  // Apply search and filters
  useEffect(() => {
    let albums = allAlbums;
    let tracks = allTracks;

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

    if (sortBy === 'listeners') {
      albums = [...albums].sort((a, b) => b.tracks.reduce((sum, t) => sum + t.listeners, 0) - a.tracks.reduce((sum, t) => sum + t.listeners, 0));
      tracks = [...tracks].sort((a, b) => b.listeners - a.listeners);
    } else {
      albums = [...albums].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
      tracks = [...tracks].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    }

    setFilteredAlbums(albums);
    setFilteredTracks(tracks);
  }, [searchQuery, sortBy, allAlbums, allTracks]);

  const handleAddToPlaylist = async (trackId: string, playlistId: string) => {
    if (!user) {
      toast.error(t('albums.login_required'));
      return;
    }
    try {
      const parsedTrackId = parseInt(trackId, 10);
      await api.post(`/playlists/${playlistId}/add_track/`, { track_id: isNaN(parsedTrackId) ? trackId : parsedTrackId });
      toast.success(t('albums.added_to_playlist', { title: 'Track' }));
      setShowTrackMenu(null);
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || e.response?.data?.detail || 'Failed to add track to playlist';
      toast.error(errorMsg);
    }
  };

  if (!isClient) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">{t('albums.login_required')}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-white">{t('albums.title')}</h1>
          </div>

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

          {filteredAlbums.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold text-white mb-4">{t('albums.albums_section')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredAlbums.map((album) => (
                  <div
                    key={album.id}
                    className="bg-[#1a1a1a] rounded-lg p-3 hover:bg-[#242424] transition border border-gray-800 hover:border-gray-600"
                  >
                    <Link href={`/album/${album.id}`} className="block">
                      <div className="w-full aspect-square bg-gray-700 rounded-md overflow-hidden mb-2">
                        <img
                          src={album.coverImage}
                          alt={album.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-white font-medium truncate text-sm">{album.title}</p>
                    </Link>
                    <Link
                      href={`/artist/${album.artist.id}`}
                      className="text-text-secondary text-xs hover:text-primary transition truncate block"
                      data-testid="album-artist-link"
                    >
                      {album.artist.name}
                    </Link>
                    <p className="text-text-secondary text-xs mt-1">
                      {album.tracks.length} {t('albums.tracks_count')} • {new Date(album.releaseDate).getFullYear()}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {filteredTracks.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('albums.tracks_section')}</h2>
              <div className="space-y-2">
                {filteredTracks.map((track) => (
                  <div
                    key={track.id}
                    className="bg-[#1a1a1a] rounded-lg p-3 hover:bg-[#242424] transition border border-gray-800 hover:border-gray-600 flex items-center gap-4"
                  >
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

                    <div className="hidden sm:flex items-center gap-4 text-text-secondary text-xs">
                      <span>👂 {track.listeners.toLocaleString()}</span>
                      <span>▶️ {track.streams.toLocaleString()}</span>
                    </div>

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
                                href="/playlists"
                                className="block text-primary mt-1 hover:underline"
                              >
                                {t('albums.create_playlist')} →
                              </Link>
                            </div>
                          ) : (
                            userPlaylists.map((playlist) => (
                              <button
                                key={playlist.id}
                                onClick={() => handleAddToPlaylist(track.id, playlist.id)}
                                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-[#333] transition flex items-center justify-between"
                              >
                                <span>{playlist.name}</span>
                                <PlusIcon className="w-4 h-4 text-text-secondary" />
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

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