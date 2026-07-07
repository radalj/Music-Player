'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import { Player } from '@/components/common/Player';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MusicalNoteIcon,
  PhotoIcon,
  DocumentArrowUpIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// ---------- Types ----------
interface Track {
  id: string;
  title: string;
  artist: string;
  coverImage?: string;
  duration?: number;
  genre?: string;
  releaseYear?: number;
  collaborators?: string[];
  audioFile?: string; // mock
  type: 'single' | 'album';
  albumTitle?: string;
  listeners: number;
  streams: number;
  revenue: number;
  createdAt: string;
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

  // Form state for new track
  const [formData, setFormData] = useState({
    title: '',
    type: 'single' as 'single' | 'album',
    albumTitle: '',
    genre: '',
    releaseYear: new Date().getFullYear(),
    collaborators: '',
    coverImage: '',
  });

  // Load tracks
  useEffect(() => {
    if (user) {
      setTracks(loadTracks(user.id));
    } else {
      setTracks([]);
    }
  }, [user]);

  // Save tracks
  useEffect(() => {
    if (user) {
      saveTracks(user.id, tracks);
    }
  }, [tracks, user]);

  // ---------- Handlers ----------
  const handleCreate = () => {
    if (!formData.title.trim()) {
      toast.error(t('artist_dashboard.title_required'));
      return;
    }
    if (formData.type === 'album' && !formData.albumTitle.trim()) {
      toast.error(t('artist_dashboard.album_title_required'));
      return;
    }

    const newTrack: Track = {
      id: generateId(),
      title: formData.title.trim(),
      artist: user?.displayName || 'Artist',
      coverImage: formData.coverImage || '/images/default-cover.jpg',
      genre: formData.genre || 'Uncategorized',
      releaseYear: formData.releaseYear || new Date().getFullYear(),
      collaborators: formData.collaborators ? formData.collaborators.split(',').map(s => s.trim()) : [],
      type: formData.type,
      albumTitle: formData.type === 'album' ? formData.albumTitle.trim() : undefined,
      audioFile: '/audio/mock.mp3',
      listeners: 0,
      streams: 0,
      revenue: 0,
      createdAt: new Date().toISOString(),
    };

    setTracks(prev => [newTrack, ...prev]);
    resetForm();
    setIsCreating(false);
    toast.success(t('artist_dashboard.published'));
  };

  const handleDelete = (id: string) => {
    if (confirm(t('artist_dashboard.delete_confirm'))) {
      setTracks(prev => prev.filter(t => t.id !== id));
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
    });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    if (!formData.title.trim()) {
      toast.error(t('artist_dashboard.title_required'));
      return;
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
            }
          : t
      )
    );
    setEditingId(null);
    resetForm();
    toast.success(t('artist_dashboard.updated'));
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
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  // ---------- Render ----------
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

  // Total stats
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
                <div className="md:col-span-2">
                  <label className="block text-text-secondary text-sm font-medium mb-1">
                    {t('artist_dashboard.cover_image_url')}
                  </label>
                  <input
                    type="text"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                    placeholder="/images/cover.jpg"
                  />
                  <p className="text-text-secondary text-xs mt-1">{t('artist_dashboard.cover_image_hint')}</p>
                </div>
                <div className="md:col-span-2 flex gap-3">
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
                  <div className="flex gap-1 flex-shrink-0">
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