'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import Player from '@/components/common/Player';
import { RecommendedForYou } from '@/components/common/RecommendedForYou';
import { mockPlaylists, mockAlbums, mockTracks } from '@/utils/mockData';
import { api } from '@/services/api';
import { mediaUrl } from '@/utils/media';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, isReady } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  const [recentPlaylists, setRecentPlaylists] = useState<any[]>(mockPlaylists.slice(0, 3));
  const [latestAlbums, setLatestAlbums] = useState<any[]>(mockAlbums.slice(0, 4));
  const [popularTracks, setPopularTracks] = useState<any[]>(mockTracks.slice(0, 5));
  const [recommendedTracks, setRecommendedTracks] = useState<any[]>([]);
  const [isGoldUser, setIsGoldUser] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    setIsGoldUser(user.subscriptionType === 'gold');
    setIsPending(user.role === 'pending_artist');

    const fetchData = async () => {
      try {
        const [plRes, albRes, trkRes, recRes] = await Promise.all([
          api.get('/playlists/playlists/').catch(() => null),
          api.get('/music/albums/').catch(() => null),
          api.get('/music/tracks/').catch(() => null),
          api.get('/music/tracks/recommendations/').catch(() => null),
        ]);

          if (plRes?.data) {
            const rawPl = Array.isArray(plRes.data) ? plRes.data : plRes.data.results || [];
            if (rawPl.length > 0) {
              setRecentPlaylists(
                rawPl.slice(0, 3).map((p: any) => ({
                  id: p.id.toString(),
                  name: p.name,
                  coverImage: p.cover_image || '/images/default-playlist.jpg',
                  creator: { displayName: p.creator_name || 'User' },
                  tracks: p.tracks || [],
                }))
              );
            }
          }

          if (albRes?.data) {
            const rawAlb = Array.isArray(albRes.data) ? albRes.data : albRes.data.results || [];
            if (rawAlb.length > 0) {
              setLatestAlbums(
                rawAlb.slice(0, 4).map((a: any) => ({
                  id: a.id.toString(),
                  title: a.title,
                  coverImage: a.cover_image || '/images/default-album.jpg',
                  artist: { name: a.artist?.display_name || a.artist_name || 'Artist' },
                  tracks: a.tracks || [],
                }))
              );
            }
          }

          if (trkRes?.data) {
            const rawTrk = Array.isArray(trkRes.data) ? trkRes.data : trkRes.data.results || [];
            if (rawTrk.length > 0) {
              setPopularTracks(
                rawTrk.slice(0, 5).map((t: any) => ({
                  id: t.id.toString(),
                  title: t.title,
                  coverImage: t.cover_image || '/images/default-track.jpg',
                  artist: { name: t.artist?.display_name || 'Artist' },
                  album: t.album ? { title: t.album.title } : undefined,
                  duration: t.duration || 180,
                  listeners: t.listeners || 0,
                }))
              );
            }
          }

          if (recRes?.data) {
            const rawRec = Array.isArray(recRes.data) ? recRes.data : recRes.data.results || [];
            if (rawRec.length > 0) {
              setRecommendedTracks(
                rawRec.slice(0, 8).map((item: any) => ({
                  id: item.id.toString(),
                  title: item.title,
                  coverImage: item.cover_image || '/images/default-track.jpg',
                  artist: { name: item.artist?.display_name || 'Artist' },
                  duration: item.duration || 180,
                  reasonCode: item.reason_code,
                  reasonGenre: item.reason_genre,
                }))
              );
            }
          }
        } catch (e) {
          console.error('API load error on home page:', e);
        }
      };

      fetchData();
  }, [user, router, isReady]);

  const handlePlayTrack = (trackId: string) => {
    router.push(`/player/${trackId}`);
  };

  if (!isClient || !isReady) return null;
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
                    src={mediaUrl(user.profileImage) || user.profileImage}
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
                      <div
                        key={track.id}
                        onClick={() => handlePlayTrack(track.id)}
                        className="flex items-center gap-4 p-3 hover:bg-[#242424] transition cursor-pointer"
                      >
                        <span className="text-text-secondary text-sm w-6 text-center font-mono">{index + 1}</span>
                        <div className="w-10 h-10 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                          <img src={track.coverImage} alt={track.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium truncate">{track.title}</p>
                          <p className="text-text-secondary text-sm truncate">{track.artist?.name || 'Artist'}</p>
                        </div>
                        <div className="text-text-secondary text-sm font-mono">{formatDuration(track.duration)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          ) : (
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
                    {popularTracks.slice(0, 3).map((track) => (
                      <div
                        key={track.id}
                        onClick={() => handlePlayTrack(track.id)}
                        className="bg-[#2a2a2a] p-3 rounded-lg flex items-center gap-3 hover:bg-[#333] transition cursor-pointer flex-1 min-w-[150px]"
                      >
                        <div className="w-12 h-12 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                          <img src={track.coverImage} alt={track.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm font-medium truncate">{track.title}</p>
                          <p className="text-text-secondary text-xs truncate">{track.artist?.name || 'Artist'}</p>
                        </div>
                        <span className="text-yellow-400 text-xs">{t('home.gold_new_badge')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended for you */}
              <RecommendedForYou
                tracks={recommendedTracks}
                onPlay={handlePlayTrack}
                formatDuration={formatDuration}
                t={t}
              />

              {/* Recent Playlists */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">🎵 {t('home.recent_playlists')}</h2>
                  <Link href="/playlists" className="text-primary text-sm hover:underline">{t('home.view_all')}</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentPlaylists.map((playlist) => (
                    <Link href="/playlists" key={playlist.id} className="bg-[#1a1a1a] rounded-lg p-4 hover:bg-[#242424] transition cursor-pointer border border-gray-800">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                          <img src={playlist.coverImage || '/images/default-playlist.jpg'} alt={playlist.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium truncate">{playlist.name}</p>
                          <p className="text-text-secondary text-sm truncate">{playlist.creator?.displayName || 'User'}</p>
                          <p className="text-text-secondary text-xs">{playlist.tracks?.length || 0} {t('home.tracks_count')}</p>
                        </div>
                      </div>
                    </Link>
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
                    <Link key={album.id} href={`/album/${album.id}`} className="bg-[#1a1a1a] rounded-lg p-3 hover:bg-[#242424] transition cursor-pointer border border-gray-800">
                      <div className="w-full aspect-square bg-gray-700 rounded-md overflow-hidden mb-2">
                        <img src={album.coverImage} alt={album.title} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-white font-medium truncate text-sm">{album.title}</p>
                      <p className="text-text-secondary text-xs truncate">{album.artist?.name || 'Artist'}</p>
                    </Link>
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
                      <div
                        key={track.id}
                        onClick={() => handlePlayTrack(track.id)}
                        className="flex items-center gap-4 p-3 hover:bg-[#242424] transition cursor-pointer"
                      >
                        <span className="text-text-secondary text-sm w-6 text-center font-mono">{index + 1}</span>
                        <div className="w-10 h-10 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                          <img src={track.coverImage} alt={track.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium truncate">{track.title}</p>
                          <p className="text-text-secondary text-sm truncate">{track.artist?.name || 'Artist'}</p>
                        </div>
                        <div className="text-text-secondary text-sm hidden sm:block">{track.album?.title || t('home.single')}</div>
                        <div className="text-text-secondary text-sm font-mono">{formatDuration(track.duration)}</div>
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