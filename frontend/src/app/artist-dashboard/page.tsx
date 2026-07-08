'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import Player from '@/components/common/Player';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

// ---------- IndexedDB Helpers ----------
const DB_NAME = 'MusicPlayerDB';
const STORE_NAME = 'audioFiles';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveAudioToDB = async (id: string, data: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id, data });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getAudioFromDB = async (id: string): Promise<string | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result?.data || null);
    request.onerror = () => reject(request.error);
  });
};

// ---------- Types ----------
interface Track {
  id: string;
  title: string;
  artist: string;
  coverImage?: string;
  audioFile?: string; // Base64
  duration?: number;
  genre?: string;
  releaseYear?: number;
  collaborators?: string[];
  type: 'single' | 'album';
  albumTitle?: string;
  listeners: number;
  streams: number;
  revenue: number;
  createdAt: string;
  audioUrl?: string; // برای سازگاری با PlayerPage
}

// ---------- Helper ----------
const generateId = () => Math.random().toString(36).substring(2, 10);

const loadTracks = (userId?: string): Track[] => {
  if (typeof window === 'undefined' || !userId) return [];
  const key = `artist_tracks_${userId}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading tracks:', e);
  }
  return [];
};

const saveTracks = (userId: string, tracks: Track[]) => {
  if (typeof window === 'undefined') return;
  const key = `artist_tracks_${userId}`;
  localStorage.setItem(key, JSON.stringify(tracks));
};

// ---------- Main Component ----------
export default function ArtistDashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'single' as 'single' | 'album',
    albumTitle: '',
    genre: '',
    releaseYear: new Date().getFullYear(),
    collaborators: '',
    coverImage: '',
    audioFile: '', // Base64
    audioFileName: '',
  });

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // ---------- Load tracks ----------
  useEffect(() => {
    if (!user) {
      setTracks([]);
      setIsLoading(false);
      return;
    }

    const loadAll = async () => {
      const metaTracks = loadTracks(user.id);
      const fullTracks = await Promise.all(
        metaTracks.map(async (meta) => {
          const audioData = await getAudioFromDB(meta.id);
          return { ...meta, audioUrl: audioData || undefined };
        })
      );
      setTracks(fullTracks);
      setIsLoading(false);
    };

    loadAll();
  }, [user]);

  // ---------- Save tracks ----------
  useEffect(() => {
    if (user && !isLoading) {
      saveTracks(user.id, tracks);
    }
  }, [tracks, user, isLoading]);

  // ---------- Handlers ----------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'coverImage' | 'audioFile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        const result = ev.target.result as string;
        if (field === 'coverImage') {
          setFormData(prev => ({ ...prev, coverImage: result }));
        } else {
          setFormData(prev => ({
            ...prev,
            audioFile: result,
            audioFileName: file.name,
          }));
          toast.success(`Audio file "${file.name}" loaded (${(file.size / 1024).toFixed(0)} KB)`);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error(t('artist_dashboard.title_required'));
      return;
    }
    if (formData.type === 'album' && !formData.albumTitle.trim()) {
      toast.error(t('artist_dashboard.album_title_required'));
      return;
    }
    if (!formData.audioFile) {
      toast.error('Please select an audio file.');
      return;
    }

    const newTrack: Track = {
      id: generateId(),
      title: formData.title.trim(),
      artist: user?.displayName || 'Artist',
      coverImage: formData.coverImage || '/images/default-cover.jpg',
      audioFile: formData.audioFile,
      audioUrl: formData.audioFile, // برای سازگاری
      genre: formData.genre || 'Uncategorized',
      releaseYear: formData.releaseYear || new Date().getFullYear(),
      collaborators: formData.collaborators ? formData.collaborators.split(',').map(s => s.trim()) : [],
      type: formData.type,
      albumTitle: formData.type === 'album' ? formData.albumTitle.trim() : undefined,
      listeners: 0,
      streams: 0,
      revenue: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveAudioToDB(newTrack.id, formData.audioFile);
    } catch (error) {
      console.error('Failed to save audio:', error);
      toast.error('Could not store audio file.');
      return;
    }

    setTracks(prev => [newTrack, ...prev]);
    resetForm();
    setIsCreating(false);
    toast.success(t('artist_dashboard.published') + ' 🎵');
    // رفرش برای به‌روزرسانی پلیر و صف
    setTimeout(() => window.location.reload(), 300);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('artist_dashboard.delete_confirm'))) {
      setTracks(prev => prev.filter(t => t.id !== id));
      // حذف از IndexedDB
      const db = await openDB();
      const tx = db.transaction('audioFiles', 'readwrite');
      const store = tx.objectStore('audioFiles');
      store.delete(id);
      toast.success(t('artist_dashboard.deleted'));
    }
  };

  const handleEdit = (track: Track) => {
    setEditingId(track.id);
    setFormData({
      title: track.title,
      type: track.type,
      albumTitle: track.albumTitle || '',
      genre: track.genre || '',
      releaseYear: track.releaseYear || new Date().getFullYear(),
      collaborators: track.collaborators?.join(', ') || '',
      coverImage: track.coverImage || '',
      audioFile: track.audioUrl || track.audioFile || '',
      audioFileName: '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!formData.title.trim()) {
      toast.error(t('artist_dashboard.title_required'));
      return;
    }
    if (!formData.audioFile) {
      toast.error('Please select an audio file.');
      return;
    }

    // اگر فایل جدید است، در IndexedDB ذخیره کن
    if (formData.audioFile.startsWith('data:audio')) {
      try {
        await saveAudioToDB(editingId, formData.audioFile);
      } catch (error) {
        console.error('Failed to save audio:', error);
        toast.error('Could not store audio file.');
        return;
      }
    }

    setTracks(prev =>
      prev.map(t =>
        t.id === editingId
          ? {
              ...t,
              title: formData.title.trim(),
              genre: formData.genre || 'Uncategorized',
              releaseYear: formData.releaseYear || new Date().getFullYear(),
              collaborators: formData.collaborators ? formData.collaborators.split(',').map(s => s.trim()) : [],
              type: formData.type,
              albumTitle: formData.type === 'album' ? formData.albumTitle.trim() : undefined,
              coverImage: formData.coverImage || t.coverImage,
              audioUrl: formData.audioFile || t.audioUrl,
              audioFile: formData.audioFile || t.audioFile,
            }
          : t
      )
    );
    setEditingId(null);
    resetForm();
    toast.success(t('artist_dashboard.updated'));
    setTimeout(() => window.location.reload(), 300);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'single',
      albumTitle: '',
      genre: '',
      releaseYear: new Date().getFullYear(),
      collaborators: '',
      coverImage: '',
      audioFile: '',
      audioFileName: '',
    });
    if (audioInputRef.current) audioInputRef.current.value = '';
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  // ---------- Render ----------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">{t('artist_dashboard.login_required')}</p>
      </div>
    );
  }

  if (user.role !== 'artist') {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">{t('artist_dashboard.access_denied')}</p>
      </div>
    );
  }

  const totalListeners = tracks.reduce((sum, t) => sum + t.listeners, 0);
  const totalStreams = tracks.reduce((sum, t) => sum + t.streams, 0);
  const totalRevenue = tracks.reduce((sum, t) => sum + t.revenue, 0);

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-5xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">{t('artist_dashboard.title')}</h1>
            <button
              onClick={() => { setIsCreating(true); resetForm(); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-medium rounded-full hover:bg-opacity-80 transition"
            >
              <PlusIcon className="w-5 h-5" />
              {t('artist_dashboard.new_release')}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-text-secondary text-sm">{t('artist_dashboard.total_listeners')}</p>
              <p className="text-2xl font-bold text-white">{totalListeners.toLocaleString()}</p>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-text-secondary text-sm">{t('artist_dashboard.total_streams')}</p>
              <p className="text-2xl font-bold text-white">{totalStreams.toLocaleString()}</p>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-text-secondary text-sm">{t('artist_dashboard.total_revenue')}</p>
              <p className="text-2xl font-bold text-green-400">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>

          {/* Create / Edit Form */}
          {(isCreating || editingId) && (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                {editingId ? t('artist_dashboard.edit_release') : t('artist_dashboard.new_release')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">
                    {t('artist_dashboard.track_title')} *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                    placeholder={t('artist_dashboard.track_title_placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">
                    {t('artist_dashboard.release_type')}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'single' | 'album' })}
                    className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                  >
                    <option value="single">{t('artist_dashboard.single')}</option>
                    <option value="album">{t('artist_dashboard.album')}</option>
                  </select>
                </div>
                {formData.type === 'album' && (
                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-1">
                      {t('artist_dashboard.album_title')} *
                    </label>
                    <input
                      type="text"
                      value={formData.albumTitle}
                      onChange={(e) => setFormData({ ...formData, albumTitle: e.target.value })}
                      className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                      placeholder={t('artist_dashboard.album_title_placeholder')}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">
                    {t('artist_dashboard.genre')}
                  </label>
                  <input
                    type="text"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                    placeholder="Pop, Rock, etc."
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">
                    {t('artist_dashboard.release_year')}
                  </label>
                  <input
                    type="number"
                    value={formData.releaseYear}
                    onChange={(e) => setFormData({ ...formData, releaseYear: parseInt(e.target.value) || 2024 })}
                    className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">
                    {t('artist_dashboard.collaborators')}
                  </label>
                  <input
                    type="text"
                    value={formData.collaborators}
                    onChange={(e) => setFormData({ ...formData, collaborators: e.target.value })}
                    className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                    placeholder="Artist1, Artist2"
                  />
                </div>
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">
                    {t('artist_dashboard.cover_image')}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'coverImage')}
                      className="hidden"
                      id="cover-upload"
                    />
                    <label
                      htmlFor="cover-upload"
                      className="cursor-pointer px-4 py-2 bg-[#2a2a2a] text-text-secondary border border-gray-600 rounded hover:bg-[#333] transition text-sm"
                    >
                      Choose Image
                    </label>
                    {formData.coverImage && (
                      <span className="text-text-secondary text-xs truncate max-w-[150px]">
                        Image selected
                      </span>
                    )}
                  </div>
                  {formData.coverImage && (
                    <div className="mt-2 w-20 h-20 rounded-md overflow-hidden border border-gray-700">
                      <img src={formData.coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">
                    {t('artist_dashboard.audio_file')} *
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleFileChange(e, 'audioFile')}
                      className="hidden"
                      id="audio-upload"
                    />
                    <label
                      htmlFor="audio-upload"
                      className="cursor-pointer px-4 py-2 bg-[#2a2a2a] text-text-secondary border border-gray-600 rounded hover:bg-[#333] transition text-sm"
                    >
                      Choose Audio
                    </label>
                    {formData.audioFileName && (
                      <span className="text-text-secondary text-xs truncate max-w-[150px]">
                        {formData.audioFileName}
                      </span>
                    )}
                  </div>
                  <p className="text-text-secondary text-xs mt-1">
                    Supported: MP3, WAV, FLAC
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={editingId ? handleSaveEdit : handleCreate}
                  className="px-6 py-2 bg-primary text-black font-medium rounded-full hover:bg-opacity-80 transition"
                >
                  {editingId ? t('artist_dashboard.save_changes') : t('artist_dashboard.publish')}
                </button>
                <button
                  onClick={() => { setIsCreating(false); setEditingId(null); resetForm(); }}
                  className="px-6 py-2 bg-[#2a2a2a] text-white border border-gray-600 rounded-full hover:bg-[#333] transition"
                >
                  {t('artist_dashboard.cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Track List */}
          <div className="space-y-3">
            {tracks.length === 0 && !isCreating && (
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
                <div className="text-5xl mb-4">🎵</div>
                <h2 className="text-xl font-semibold text-white mb-2">{t('artist_dashboard.no_tracks')}</h2>
                <p className="text-text-secondary">{t('artist_dashboard.no_tracks_desc')}</p>
              </div>
            )}
            {tracks.map((track) => (
              <div
                key={track.id}
                className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                    <img src={track.coverImage} alt={track.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-medium text-lg">{track.title}</h3>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {track.type === 'album' ? 'Album' : 'Single'}
                      </span>
                      {track.albumTitle && (
                        <span className="text-text-secondary text-xs">— {track.albumTitle}</span>
                      )}
                    </div>
                    <p className="text-text-secondary text-sm">
                      {track.genre} • {track.releaseYear}
                    </p>
                    {track.collaborators && track.collaborators.length > 0 && (
                      <p className="text-text-secondary text-xs">
                        {t('artist_dashboard.with')} {track.collaborators.join(', ')}
                      </p>
                    )}
                    <div className="flex gap-4 mt-1 text-xs text-text-secondary">
                      <span>👂 {track.listeners.toLocaleString()}</span>
                      <span>▶️ {track.streams.toLocaleString()}</span>
                      <span className="text-green-400">💰 ${track.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 items-center">
                    {/* ✅ دکمه پلی که به صفحه پخش آهنگ می‌برد */}
                    <Link
                      href={`/player/${track.id}`}
                      className="p-1.5 text-primary hover:text-primary/80 transition rounded-full bg-primary/10 hover:bg-primary/20"
                      title="Play track"
                    >
                      <PlayIcon className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleEdit(track)}
                      className="p-1.5 text-text-secondary hover:text-white transition rounded"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(track.id)}
                      className="p-1.5 text-text-secondary hover:text-red-400 transition rounded"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Player />
    </div>
  );
}