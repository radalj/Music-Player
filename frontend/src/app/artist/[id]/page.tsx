'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import { Player } from '@/components/common/Player';
import {
  getArtistById,
  getAlbumsByArtistId,
  getTracksByArtistId,
} from '@/utils/mockData';
import Link from 'next/link';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

export default function ArtistPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const artistId = params?.id as string;

  // ✅ Fix hydration mismatch
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
    const foundArtist = getArtistById(artistId);
    if (foundArtist) {
      setArtist(foundArtist);
      setAlbums(getAlbumsByArtistId(artistId));
      setTracks(getTracksByArtistId(artistId));
      setFollowersCount(foundArtist.totalListeners || 0);
    }
  }, [artistId]);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    setFollowersCount(isFollowing ? followersCount - 1 : followersCount + 1);
  };

  // ✅ Show nothing on server, then render on client
  if (!isClient) {
    return null;
  }

  // ✅ Check user only after client-side hydration
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
                  <span>👂 {followersCount.toLocaleString()} listeners</span>
                  <span>▶️ {artist.totalStreams?.toLocaleString() || 0} streams</span>
                  <span>💿 {albums.length} albums</span>
                  <span>🎵 {tracks.length} tracks</span>
                </div>
                {artist.socialLinks && (
                  <div className="flex gap-3 mt-3">
                    {artist.socialLinks.instagram && (
                      <a
                        href={`https://instagram.com/${artist.socialLinks.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-white transition"
                      >
                        <span className="text-lg">📷</span>
                      </a>
                    )}
                    {artist.socialLinks.twitter && (
                      <a
                        href={`https://twitter.com/${artist.socialLinks.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-white transition"
                      >
                        <span className="text-lg">🐦</span>
                      </a>
                    )}
                    {artist.socialLinks.soundcloud && (
                      <a
                        href={`https://soundcloud.com/${artist.socialLinks.soundcloud}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-white transition"
                      >
                        <span className="text-lg">🎧</span>
                      </a>
                    )}
                    {artist.socialLinks.spotify && (
                      <a
                        href={`https://open.spotify.com/artist/${artist.socialLinks.spotify}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-white transition"
                      >
                        <span className="text-lg">🔊</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Albums Section */}
          {albums.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">💿 Albums</h2>
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
                      {album.tracks.length} tracks • {new Date(album.releaseDate).getFullYear()}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Tracks Section */}
          {tracks.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-4">🎵 Popular Tracks</h2>
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
                      👂 {track.listeners.toLocaleString()}
                    </div>
                    <div className="text-text-secondary text-xs font-mono">
                      {Math.floor(track.duration / 60)}:
                      {String(track.duration % 60).padStart(2, '0')}
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