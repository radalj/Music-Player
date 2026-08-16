'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import Player from '@/components/common/Player';
import { getTrackById } from '@/utils/mockData';
import { api } from '@/services/api';
import { usePlayer } from '@/context/PlayerContext';
import { mediaUrl } from '@/utils/media';
import { canViewArtistStats } from '@/utils/roles';
import Link from 'next/link';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

export default function PlayerPage() {
  const params = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { currentTrack, isPlaying, setIsPlaying, setCurrentTrack } = usePlayer();
  const trackId = params?.id as string;

  const [isClient, setIsClient] = useState(false);
  const [track, setTrack] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch track and register stream play
  useEffect(() => {
    if (!trackId) return;

    const loadTrack = async () => {
      let fetchedTrack = null;
      try {
        const res = await api.get(`/music/tracks/${trackId}/`).catch(() => null);
        if (res?.data) {
          const tData = res.data;
          fetchedTrack = {
            id: tData.id.toString(),
            title: tData.title,
            artist: { id: tData.artist?.id?.toString() || '1', name: tData.artist?.display_name || 'Artist' },
            coverImage: mediaUrl(tData.cover_image) || tData.cover_image || '/images/default-track.jpg',
            duration: tData.duration || 180,
            listeners: tData.listeners || 0,
            streams: tData.streams || 0,
            audioUrl: mediaUrl(tData.audio_file) || tData.audio_file || '',
            lyrics: tData.lyrics || '',
            album: tData.album ? { id: tData.album.id.toString(), title: tData.album.title } : undefined,
            releaseDate: tData.release_date || new Date().toISOString(),
          };
        }
      } catch (e) {}

      if (!fetchedTrack) {
        fetchedTrack = getTrackById(trackId);
      }

      setTrack(fetchedTrack);
      if (fetchedTrack) {
        setCurrentTrack({
          id: fetchedTrack.id,
          title: fetchedTrack.title,
          artist: fetchedTrack.artist,
          coverImage: fetchedTrack.coverImage,
          duration: fetchedTrack.duration,
          album: fetchedTrack.album,
          listeners: fetchedTrack.listeners || 0,
          streams: fetchedTrack.streams || 0,
          audioUrl: fetchedTrack.audioUrl,
          lyrics: fetchedTrack.lyrics || '',
        });
      }

      // Register play stream with Backend API
      try {
        const playRes = await api.post(`/music/tracks/${trackId}/play/`).catch((err: any) => {
          if (err.response?.status === 429) {
            toast.error('Daily stream limit reached! Upgrade your plan for unlimited streaming.');
          }
          return null;
        });
        if (playRes?.data && fetchedTrack) {
          setTrack((prev: any) =>
            prev ? { ...prev, streams: playRes.data.streams, listeners: playRes.data.listeners } : prev
          );
        }
      } catch (e) {}
    };

    loadTrack();
  }, [trackId]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  if (!isClient) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">{t('player.login_required') || 'Please login'}</p>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">{t('player.track_not_found') || 'Track not found'}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-4xl mx-auto p-6">
          {/* Player Controls */}
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 mb-6">
            <div className="flex flex-col items-center">
              <div className="w-48 h-48 bg-gray-700 rounded-lg overflow-hidden mb-4">
                <img
                  src={track.coverImage}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-2xl font-bold text-white">{track.title}</h1>
              <Link
                href={`/artist/${track.artist.id}`}
                className="text-primary hover:underline text-lg"
              >
                {track.artist.name}
              </Link>
              {track.album && (
                <Link
                  href={`/album/${track.album.id}`}
                  className="text-text-secondary hover:text-primary transition text-sm"
                >
                  {track.album.title}
                </Link>
              )}
              <div className="flex items-center gap-4 mt-4 text-text-secondary text-sm">
                {canViewArtistStats(user?.subscriptionType, user?.role) && (
                  <>
                    <span data-testid="track-gold-listeners">👂 {(track.listeners || 0).toLocaleString()}</span>
                    <span data-testid="track-gold-streams">▶️ {(track.streams || 0).toLocaleString()}</span>
                  </>
                )}
                <span>⏱️ {Math.floor((track.duration || 180) / 60)}:
                  {String((track.duration || 180) % 60).padStart(2, '0')}</span>
              </div>

              <div className="flex items-center gap-4 mt-6">
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 bg-primary rounded-full flex items-center justify-center hover:bg-green-400 transition cursor-pointer"
                >
                  {isPlaying && currentTrack?.id === String(track.id) ? (
                    <PauseIcon className="w-7 h-7 text-black" />
                  ) : (
                    <PlayIcon className="w-7 h-7 text-black" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Track Info */}
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-bold text-white mb-4">About this track</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-secondary">Title</p>
                <p className="text-white">{track.title}</p>
              </div>
              <div>
                <p className="text-text-secondary">Artist</p>
                <Link
                  href={`/artist/${track.artist.id}`}
                  className="text-primary hover:underline"
                >
                  {track.artist.name}
                </Link>
              </div>
              {track.album && (
                <div>
                  <p className="text-text-secondary">Album</p>
                  <Link
                    href={`/album/${track.album.id}`}
                    className="text-primary hover:underline"
                  >
                    {track.album.title}
                  </Link>
                </div>
              )}
              <div>
                <p className="text-text-secondary">Release Date</p>
                <p className="text-white">
                  {new Date(track.releaseDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-text-secondary">Duration</p>
                <p className="text-white">
                  {Math.floor((track.duration || 180) / 60)}m {(track.duration || 180) % 60}s
                </p>
              </div>
            </div>
            {track.lyrics ? (
              <div className="mt-4">
                <p className="text-text-secondary text-sm mb-2">{t('player.lyrics') || 'Lyrics'}</p>
                <pre className="text-text-secondary text-sm whitespace-pre-wrap bg-[#2a2a2a] p-4 rounded-lg" data-testid="track-lyrics">
                  {track.lyrics}
                </pre>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-text-secondary text-sm mb-2">{t('player.lyrics') || 'Lyrics'}</p>
                <p className="text-text-secondary text-sm" data-testid="track-lyrics">
                  {t('player.no_lyrics') || 'No lyrics available for this track.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Player />
    </div>
  );
}