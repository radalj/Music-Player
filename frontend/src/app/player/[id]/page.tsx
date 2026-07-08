'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import { Player } from '@/components/common/Player';
import { getTrackById } from '@/utils/mockData';
import Link from 'next/link';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';

export default function PlayerPage() {
  const params = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const trackId = params?.id as string;

  const [isClient, setIsClient] = useState(false);
  const [track, setTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!trackId) return;
    const foundTrack = getTrackById(trackId);
    if (foundTrack) {
      setTrack(foundTrack);
    }
  }, [trackId]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  // ✅ Define togglePlay function
  const togglePlay = () => {
    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    } else {
      // Play
      setIsPlaying(true);
      const id = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            clearInterval(id);
            setIntervalId(null);
            return 0;
          }
          return prev + 1;
        });
      }, 100);
      setIntervalId(id);
    }
  };

  if (!isClient) {
    return null;
  }

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
                <span>👂 {track.listeners.toLocaleString()}</span>
                <span>▶️ {track.streams.toLocaleString()}</span>
                <span>⏱️ {Math.floor(track.duration / 60)}:
                  {String(track.duration % 60).padStart(2, '0')}</span>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 bg-primary rounded-full flex items-center justify-center hover:bg-opacity-80 transition"
                >
                  {isPlaying ? (
                    <PauseIcon className="w-7 h-7 text-black" />
                  ) : (
                    <PlayIcon className="w-7 h-7 text-black" />
                  )}
                </button>
              </div>
              {/* Progress bar */}
              <div className="w-full max-w-md mt-4">
                <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-text-secondary mt-1">
                  <span>0:00</span>
                  <span>
                    {Math.floor(track.duration / 60)}:
                    {String(track.duration % 60).padStart(2, '0')}
                  </span>
                </div>
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
                <p className="text-text-secondary">Genre</p>
                <p className="text-white">{track.genre?.join(', ') || 'Various'}</p>
              </div>
              <div>
                <p className="text-text-secondary">Release Date</p>
                <p className="text-white">
                  {new Date(track.releaseDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-text-secondary">Duration</p>
                <p className="text-white">
                  {Math.floor(track.duration / 60)}m {track.duration % 60}s
                </p>
              </div>
              {track.explicit && (
                <div>
                  <p className="text-text-secondary">Explicit</p>
                  <p className="text-red-400">⚠️ Explicit Content</p>
                </div>
              )}
            </div>
            {track.lyrics && (
              <div className="mt-4">
                <p className="text-text-secondary text-sm mb-2">Lyrics</p>
                <pre className="text-text-secondary text-sm whitespace-pre-wrap bg-[#2a2a2a] p-4 rounded-lg">
                  {track.lyrics}
                </pre>
              </div>
            )}
          </div>
        </div>
      </main>
      <Player />
    </div>
  );
}