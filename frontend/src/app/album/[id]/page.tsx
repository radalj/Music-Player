'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import { Player } from '@/components/common/Player';
import { getAlbumById, getTracksByAlbumId } from '@/utils/mockData';
import Link from 'next/link';

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const albumId = params?.id as string;

  const [isClient, setIsClient] = useState(false);
  const [album, setAlbum] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!albumId) return;
    const foundAlbum = getAlbumById(albumId);
    if (foundAlbum) {
      setAlbum(foundAlbum);
      setTracks(getTracksByAlbumId(albumId));
    }
  }, [albumId]);

  if (!isClient) {
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">{t('album.login_required') || 'Please login'}</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">{t('album.not_found') || 'Album not found'}</p>
      </div>
    );
  }

  const totalDuration = tracks.reduce((sum, track) => sum + track.duration, 0);
  const totalListeners = tracks.reduce((sum, track) => sum + track.listeners, 0);

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-4xl mx-auto p-6">
          {/* Album Header */}
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-48 h-48 flex-shrink-0 bg-gray-700 rounded-lg overflow-hidden">
                <img
                  src={album.coverImage}
                  alt={album.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{album.title}</h1>
                <Link
                  href={`/artist/${album.artist.id}`}
                  className="text-primary hover:underline text-lg"
                >
                  {album.artist.name}
                </Link>
                <div className="flex flex-wrap gap-4 mt-2 text-text-secondary text-sm">
                  <span>{album.genre?.join(', ') || 'Various'}</span>
                  <span>•</span>
                  <span>{new Date(album.releaseDate).getFullYear()}</span>
                  <span>•</span>
                  <span>{tracks.length} tracks</span>
                  <span>•</span>
                  <span>👂 {totalListeners.toLocaleString()} listeners</span>
                </div>
                {album.description && (
                  <p className="text-text-secondary text-sm mt-3">{album.description}</p>
                )}
                {album.label && (
                  <p className="text-text-secondary text-xs mt-1">Label: {album.label}</p>
                )}
              </div>
            </div>
          </div>

          {/* Track List */}
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
            <div className="divide-y divide-gray-800">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center gap-4 p-3 hover:bg-[#242424] transition cursor-pointer"
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
                    <Link
                      href={`/artist/${track.artist.id}`}
                      className="text-text-secondary text-sm hover:text-primary transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {track.artist.name}
                    </Link>
                  </div>
                  <div className="text-text-secondary text-sm hidden sm:block">
                    👂 {track.listeners.toLocaleString()}
                  </div>
                  <div className="text-text-secondary text-sm font-mono">
                    {Math.floor(track.duration / 60)}:
                    {String(track.duration % 60).padStart(2, '0')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Album Stats */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3 text-center">
              <p className="text-text-secondary text-xs">Total Duration</p>
              <p className="text-white font-bold">
                {Math.floor(totalDuration / 60)}m {totalDuration % 60}s
              </p>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3 text-center">
              <p className="text-text-secondary text-xs">Total Streams</p>
              <p className="text-white font-bold">
                {tracks.reduce((sum, t) => sum + t.streams, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3 text-center">
              <p className="text-text-secondary text-xs">Total Listeners</p>
              <p className="text-white font-bold">{totalListeners.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </main>
      <Player />
    </div>
  );
}