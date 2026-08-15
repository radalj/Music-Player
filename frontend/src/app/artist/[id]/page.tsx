'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import Player from '@/components/common/Player';
import {
  getArtistById,
  getAlbumsByArtistId,
  getTracksByArtistId,
} from '@/utils/mockData';
import { api } from '@/services/api';
import Link from 'next/link';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

export default function ArtistPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const artistId = params?.id as string;

  const [isClient, setIsClient] = useState(false);
  const [artist, setArtist] = useState<any>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!artistId) return;

    const fetchArtistData = async () => {
      let foundArtist = null;
      let foundAlbums: any[] = [];
      let foundTracks: any[] = [];

      try {
        const [userRes, albumsRes, tracksRes] = await Promise.all([
          api.get(`/users/${artistId}/`).catch(() => null),
          api.get(`/music/albums/?artist_id=${artistId}`).catch(() => null),
          api.get(`/music/tracks/?artist_id=${artistId}`).catch(() => null),
        ]);

        if (userRes?.data) {
          const u = userRes.data;
          foundArtist = {
            id: u.id.toString(),
            name: u.display_name || u.username,
            bio: u.bio || 'Artist on Music Player',
            verified: u.verified || u.role === 'artist',
            profileImage: u.profile_image || null,
            totalListeners: u.total_listeners || u.followers_count || 0,
            totalStreams: u.total_streams || 0,
          };
        }

        if (albumsRes?.data) {
          const rawA = Array.isArray(albumsRes.data) ? albumsRes.data : albumsRes.data.results || [];
          foundAlbums = rawA.map((a: any) => ({
            id: a.id.toString(),
            title: a.title,
            coverImage: a.cover_image || '/images/default-album.jpg',
            releaseDate: a.release_date || new Date().toISOString(),
            tracks: a.tracks || [],
          }));
        }

        if (tracksRes?.data) {
          const rawT = Array.isArray(tracksRes.data) ? tracksRes.data : tracksRes.data.results || [];
          foundTracks = rawT.map((tr: any) => ({
            id: tr.id.toString(),
            title: tr.title,
            artist: { id: artistId, name: foundArtist?.name || 'Artist' },
            album: tr.album ? { id: tr.album.id.toString(), title: tr.album.title } : null,
            coverImage: tr.cover_image || '/images/default-track.jpg',
            duration: tr.duration || 180,
            listeners: tr.listeners || 0,
            streams: tr.streams || 0,
          }));
        }
      } catch (e) {}

      if (!foundArtist) {
        foundArtist = getArtistById(artistId);
        foundAlbums = getAlbumsByArtistId(artistId);
        foundTracks = getTracksByArtistId(artistId);
      }

      setArtist(foundArtist);
      setAlbums(foundAlbums);
      setTracks(foundTracks);
      setFollowersCount(foundArtist?.totalListeners || 0);
    };

    fetchArtistData();
  }, [artistId]);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    setFollowersCount(isFollowing ? followersCount - 1 : followersCount + 1);
  };

  if (!isClient) {
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">{t('artist.login_required') || 'Please login'}</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">{t('artist.not_found') || 'Artist not found'}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-4xl mx-auto p-6">
          {/* Artist Header */}
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary to-green-700 flex items-center justify-center text-4xl font-bold text-black flex-shrink-0">
                {artist.profileImage ? (
                  <img
                    src={artist.profileImage}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{artist.name?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-white">{artist.name}</h1>
                  {artist.verified && (
                    <span className="inline-flex items-center gap-1 text-blue-400 text-sm font-medium">
                      <CheckBadgeIcon className="w-5 h-5" />
                      Verified
                    </span>
                  )}
                  <button
                    onClick={handleFollow}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition ${
                      isFollowing
                        ? 'bg-[#2a2a2a] text-white border border-gray-600'
                        : 'bg-primary text-black hover:bg-opacity-80'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
                <p className="text-text-secondary text-sm mt-1">{artist.bio}</p>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-text-secondary">
                  <span>👂 {followersCount.toLocaleString()} {t('artist.listeners') || 'listeners'}</span>
                  <span>▶️ {artist.totalStreams?.toLocaleString() || 0} {t('artist.streams') || 'streams'}</span>
                  <span>💿 {albums.length} {t('artist.albums') || 'albums'}</span>
                  <span>🎵 {tracks.length} {t('artist.tracks') || 'tracks'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Albums Section */}
          {albums.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">💿 {t('artist.albums') || 'Albums'}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {albums.map((album) => (
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
                    <p className="text-text-secondary text-xs">
                      {album.tracks?.length || 0} tracks • {new Date(album.releaseDate).getFullYear()}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Tracks Section */}
          {tracks.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-4">🎵 {t('artist.popular_tracks') || 'Popular Tracks'}</h2>
              <div className="space-y-2">
                {tracks.slice(0, 10).map((track, index) => (
                  <div
                    key={track.id}
                    className="bg-[#1a1a1a] rounded-lg p-3 hover:bg-[#242424] transition border border-gray-800 flex items-center gap-4 cursor-pointer"
                    onClick={() => router.push(`/player/${track.id}`)}
                  >
                    <span className="text-text-secondary text-sm w-6 text-center font-mono">
                      {index + 1}
                    </span>
                    <div className="w-10 h-10 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                      <img
                        src={track.coverImage}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{track.title}</p>
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span>{track.artist.name}</span>
                        {track.album && (
                          <>
                            <span>•</span>
                            <Link
                              href={`/album/${track.album.id}`}
                              className="hover:text-primary transition"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {track.album.title}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-text-secondary text-xs hidden sm:block">
                      👂 {(track.listeners || 0).toLocaleString()}
                    </div>
                    <div className="text-text-secondary text-xs font-mono">
                      {Math.floor((track.duration || 180) / 60)}:
                      {String((track.duration || 180) % 60).padStart(2, '0')}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Player />
    </div>
  );
}