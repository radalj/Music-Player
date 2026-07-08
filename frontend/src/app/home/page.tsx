'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import Player from '@/components/common/Player';
import { mockPlaylists, mockAlbums, mockTracks } from '@/utils/mockData';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  
  const [isClient, setIsClient] = useState(false);
  const [recentPlaylists, setRecentPlaylists] = useState(mockPlaylists.slice(0, 3));
  const [latestAlbums, setLatestAlbums] = useState(mockAlbums.slice(0, 4));
  const [popularTracks, setPopularTracks] = useState(mockTracks.slice(0, 5));
  const [isGoldUser, setIsGoldUser] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      setIsGoldUser(user.subscriptionType === 'gold');
      setIsPending(user.role === 'pending_artist');
    }
  }, [user, router]);

  if (!isClient) return null;
  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar />

      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-6xl mx-auto p-6">
          {/* ===== Pending Approval Banner ===== */}
          {isPending && (
            <div className="mb-6 bg-yellow-600/20 border border-yellow-600/30 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <p className="text-yellow-400 font-medium">{t('home.pending_title')}</p>
                  <p className="text-text-secondary text-sm">
                    {t('home.pending_desc')}
                  </p>
                </div>
              </div>
              <Link href="/profile" className="text-primary text-sm hover:underline whitespace-nowrap">
                {t('home.pending_link')} →
              </Link>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-8 bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-primary to-green-700 flex items-center justify-center text-2xl font-bold text-black flex-shrink-0">
                {user?.profileImage ? (
                  <Image
                    src={user.profileImage}
                    alt={user.displayName || 'User'}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user?.displayName?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {user?.displayName || 'User'}
                </h1>
                <p className="text-text-secondary text-sm">
                  {isPending && `⏳ ${t('home.pending_badge')}`}
                  {user?.role === 'artist' && `🎤 ${t('home.artist_badge')}`}
                  {user?.role === 'listener' && `🎧 ${t('home.listener_badge')}`}
                  {user?.role === 'admin' && `🛠️ ${t('home.admin_badge')}`}
                  {user?.role === 'supporter' && `🛡️ ${t('home.supporter_badge')}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user.role === 'listener' && (
                <span className="text-text-secondary text-sm hidden sm:inline">
                  {user?.subscriptionType === 'gold' && `⭐ ${t('home.gold_badge')}`}
                  {user?.subscriptionType === 'silver' && `🥈 ${t('home.silver_badge')}`}
                  {user?.subscriptionType === 'free' && `🎵 ${t('home.free_badge')}`}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-md hover:bg-red-600/30 transition text-sm"
              >
                {t('home.logout')}
              </button>
            </div>
          </div>

          {/* ===== Content Section ===== */}
          {isPending ? (
            /* ----- Pending Artist: Show limited content ----- */
            <>
              <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-8 text-center">
                <p className="text-text-secondary text-lg">🎵 {t('home.welcome')}</p>
                <p className="text-text-secondary text-sm mt-2">
                  {t('home.pending_welcome_desc')}
                </p>
              </div>

              <section className="mt-10">
                <h2 className="text-xl font-bold text-white mb-4">🔥 {t('home.popular_tracks')}</h2>
                <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
                  <div className="divide-y divide-gray-800">
                    {popularTracks.slice(0, 3).map((track, index) => (
                      <div key={track.id} className="flex items-center gap-4 p-3 hover:bg-[#242424] transition cursor-pointer">
                        <span className="text-text-secondary text-sm w-6 text-center font-mono">{index + 1}</span>
                        <div className="w-10 h-10 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                          <img src={track.coverImage} alt={track.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium truncate">{track.title}</p>
                          <p className="text-text-secondary text-sm truncate">{track.artist.name}</p>
                        </div>
                        <div className="text-text-secondary text-sm font-mono">{formatDuration(track.duration)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          ) : (
            /* ----- Regular User / Verified Artist: Show all content ----- */
            <>
              {/* Gold Early Access */}
              {isGoldUser && (
                <div className="mb-8 bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 border border-yellow-600/30 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">⭐</span>
                    <h2 className="text-lg font-bold text-white">{t('home.gold_title')}</h2>
                  </div>
                  <p className="text-text-secondary text-sm mb-3">
                    {t('home.gold_desc')}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {mockTracks.slice(0, 3).map((track) => (
                      <div
                        key={track.id}
                        className="bg-[#2a2a2a] p-3 rounded-lg flex items-center gap-3 hover:bg-[#333] transition cursor-pointer flex-1 min-w-[150px]"
                      >
                        <div className="w-12 h-12 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                          <img src={track.coverImage} alt={track.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm font-medium truncate">{track.title}</p>
                          <p className="text-text-secondary text-xs truncate">{track.artist.name}</p>
                        </div>
                        <span className="text-yellow-400 text-xs">{t('home.gold_new_badge')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Playlists */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">🎵 {t('home.recent_playlists')}</h2>
                  <Link href="/playlist" className="text-primary text-sm hover:underline">{t('home.view_all')}</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentPlaylists.map((playlist) => (
                    <div key={playlist.id} className="bg-[#1a1a1a] rounded-lg p-4 hover:bg-[#242424] transition cursor-pointer border border-gray-800">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                          <img src={playlist.coverImage || '/images/default-playlist.jpg'} alt={playlist.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium truncate">{playlist.name}</p>
                          <p className="text-text-secondary text-sm truncate">{playlist.creator.displayName}</p>
                          <p className="text-text-secondary text-xs">{playlist.tracks.length} {t('home.tracks_count')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Latest Albums */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">💿 {t('home.latest_albums')}</h2>
                  <Link href="/albums" className="text-primary text-sm hover:underline">{t('home.view_all')}</Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {latestAlbums.map((album) => (
                    <div key={album.id} className="bg-[#1a1a1a] rounded-lg p-3 hover:bg-[#242424] transition cursor-pointer border border-gray-800">
                      <div className="w-full aspect-square bg-gray-700 rounded-md overflow-hidden mb-2">
                        <img src={album.coverImage} alt={album.title} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-white font-medium truncate text-sm">{album.title}</p>
                      <p className="text-text-secondary text-xs truncate">{album.artist.name}</p>
                      <p className="text-text-secondary text-xs">{album.tracks.length} {t('home.tracks_count')}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Popular Tracks */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">🔥 {t('home.popular_tracks')}</h2>
                  <Link href="/albums" className="text-primary text-sm hover:underline">{t('home.view_all')}</Link>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
                  <div className="divide-y divide-gray-800">
                    {popularTracks.map((track, index) => (
                      <div key={track.id} className="flex items-center gap-4 p-3 hover:bg-[#242424] transition cursor-pointer">
                        <span className="text-text-secondary text-sm w-6 text-center font-mono">{index + 1}</span>
                        <div className="w-10 h-10 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                          <img src={track.coverImage} alt={track.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium truncate">{track.title}</p>
                          <p className="text-text-secondary text-sm truncate">{track.artist.name}</p>
                        </div>
                        <div className="text-text-secondary text-sm hidden sm:block">{track.album?.title || t('home.single')}</div>
                        <div className="text-text-secondary text-sm font-mono">{formatDuration(track.duration)}</div>
                        <div className="text-text-secondary text-sm hidden md:block">👂 {track.listeners.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <Player />
    </div>
  );
}