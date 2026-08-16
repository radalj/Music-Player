'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import Player from '@/components/common/Player';
import { usePlayer } from '@/context/PlayerContext';
import { api } from '@/services/api';
import { mediaUrl } from '@/utils/media';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Track {
  id: string;
  title: string;
  artist: string;
  coverImage?: string;
  audioUrl?: string;
  duration?: number;
  genre?: string;
  releaseYear?: number;
  lyrics?: string;
  type: 'single' | 'album';
  albumTitle?: string;
  listeners: number;
  streams: number;
  createdAt?: string;
}

const emptyForm = {
  title: '',
  type: 'single' as 'single' | 'album',
  albumTitle: '',
  genre: '',
  releaseYear: new Date().getFullYear(),
  lyrics: '',
  coverPreview: '',
  audioFileName: '',
};

function mapApiTrack(item: any): Track {
  return {
    id: String(item.id),
    title: item.title,
    artist: item.artist?.display_name || item.artist?.username || 'Artist',
    coverImage: mediaUrl(item.cover_image) || item.cover_image || '',
    audioUrl: mediaUrl(item.audio_file) || item.audio_file || '',
    duration: item.duration || 0,
    genre: item.genre || '',
    releaseYear: item.release_year || undefined,
    lyrics: item.lyrics || '',
    type: item.is_single === false ? 'album' : 'single',
    listeners: item.listeners || 0,
    streams: item.streams || 0,
    createdAt: item.created_at,
  };
}

function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement('audio');
    const url = URL.createObjectURL(file);
    el.preload = 'metadata';
    el.onloadedmetadata = () => {
      const value = Math.round(el.duration);
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(value) && value > 0 ? value : 0);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    el.src = url;
  });
}

export default function ArtistDashboardPage() {
  const { user, isReady } = useAuth();
  const { t } = useLanguage();
  const { playTrack } = usePlayer();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const audioFileRef = useRef<File | null>(null);
  const coverFileRef = useRef<File | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const loadTracks = async () => {
    if (!isReady) return;
    if (!user) {
      setTracks([]);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get('/music/tracks/', { params: { artist: user.id } });
      const raw = Array.isArray(res.data) ? res.data : res.data.results || [];
      setTracks(raw.map(mapApiTrack));
    } catch {
      toast.error('Failed to load your tracks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTracks();
  }, [isReady, user?.id]);

  const resetForm = () => {
    setFormData({ ...emptyForm, releaseYear: new Date().getFullYear() });
    audioFileRef.current = null;
    coverFileRef.current = null;
    if (audioInputRef.current) audioInputRef.current.value = '';
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'coverImage' | 'audioFile') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (field === 'coverImage') {
      coverFileRef.current = file;
      setFormData((prev) => ({ ...prev, coverPreview: URL.createObjectURL(file) }));
    } else {
      audioFileRef.current = file;
      setFormData((prev) => ({ ...prev, audioFileName: file.name }));
      toast.success(`Audio file "${file.name}" ready (${(file.size / 1024).toFixed(0)} KB)`);
    }
  };

  const buildFormData = async (requireAudio: boolean) => {
    if (!formData.title.trim()) {
      toast.error(t('artist_dashboard.title_required'));
      return null;
    }
    if (formData.type === 'album' && !formData.albumTitle.trim()) {
      toast.error(t('artist_dashboard.album_title_required'));
      return null;
    }
    if (requireAudio && !audioFileRef.current) {
      toast.error('Please select an audio file.');
      return null;
    }

    const payload = new FormData();
    payload.append('title', formData.title.trim());
    payload.append('genre', formData.genre || '');
    payload.append('lyrics', formData.lyrics || '');
    payload.append('is_single', formData.type === 'single' ? 'true' : 'false');
    if (formData.releaseYear) payload.append('release_year', String(formData.releaseYear));
    if (audioFileRef.current) {
      payload.append('audio_file', audioFileRef.current);
      const duration = await readAudioDuration(audioFileRef.current);
      payload.append('duration', String(duration || 0));
    }
    if (coverFileRef.current) {
      payload.append('cover_image', coverFileRef.current);
    }
    return payload;
  };

  const handleCreate = async () => {
    const payload = await buildFormData(true);
    if (!payload) return;
    setSaving(true);
    try {
      const res = await api.post('/music/tracks/', payload);
      const created = mapApiTrack(res.data);
      if (formData.type === 'album') {
        await api.post('/music/albums/', {
          title: formData.albumTitle.trim(),
          release_date: `${formData.releaseYear || new Date().getFullYear()}-01-01`,
          genre: formData.genre || '',
          track_ids: [Number(created.id)],
        });
        created.albumTitle = formData.albumTitle.trim();
        created.type = 'album';
      }
      setTracks((prev) => [created, ...prev]);
      resetForm();
      setIsCreating(false);
      toast.success(t('artist_dashboard.published') + ' 🎵');
      if (created.audioUrl) {
        playTrack({
          id: created.id,
          title: created.title,
          artist: { id: String(user?.id || ''), name: created.artist },
          coverImage: created.coverImage || '',
          duration: created.duration || 0,
          listeners: created.listeners,
          streams: created.streams,
          audioUrl: created.audioUrl,
          lyrics: created.lyrics || '',
        });
      }
    } catch (error: any) {
      const data = error.response?.data;
      const msg =
        data?.audio_file?.[0] ||
        data?.title?.[0] ||
        data?.detail ||
        data?.error ||
        'Failed to publish track';
      toast.error(String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const payload = await buildFormData(false);
    if (!payload) return;
    setSaving(true);
    try {
      const res = await api.patch(`/music/tracks/${editingId}/`, payload);
      const updated = mapApiTrack(res.data);
      setTracks((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      setEditingId(null);
      resetForm();
      toast.success(t('artist_dashboard.updated'));
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update track');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('artist_dashboard.delete_confirm'))) return;
    try {
      await api.delete(`/music/tracks/${id}/`);
      setTracks((prev) => prev.filter((item) => item.id !== id));
      toast.success(t('artist_dashboard.deleted'));
    } catch {
      toast.error('Failed to delete track');
    }
  };

  const handleEdit = (track: Track) => {
    setEditingId(track.id);
    setIsCreating(false);
    audioFileRef.current = null;
    coverFileRef.current = null;
    setFormData({
      title: track.title,
      type: track.type,
      albumTitle: track.albumTitle || '',
      genre: track.genre || '',
      releaseYear: track.releaseYear || new Date().getFullYear(),
      lyrics: track.lyrics || '',
      coverPreview: track.coverImage || '',
      audioFileName: track.audioUrl ? 'Current audio file' : '',
    });
  };

  const handlePlay = (track: Track) => {
    if (!track.audioUrl) {
      toast.error('This track has no audio file.');
      return;
    }
    playTrack({
      id: track.id,
      title: track.title,
      artist: { id: String(user?.id || ''), name: track.artist },
      coverImage: track.coverImage || '',
      duration: track.duration || 0,
      listeners: track.listeners,
      streams: track.streams,
      audioUrl: track.audioUrl,
      lyrics: track.lyrics || '',
    });
  };

  if (!isReady || isLoading) {
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

  const totalListeners = tracks.reduce((sum, item) => sum + item.listeners, 0);
  const totalStreams = tracks.reduce((sum, item) => sum + item.streams, 0);

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-5xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">{t('artist_dashboard.title')}</h1>
            <button
              onClick={() => {
                setIsCreating(true);
                setEditingId(null);
                resetForm();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-medium rounded-full hover:bg-green-400 transition"
              data-testid="artist-new-release"
            >
              <PlusIcon className="w-5 h-5" />
              {t('artist_dashboard.new_release')}
            </button>
          </div>

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
              <p className="text-text-secondary text-sm">{t('artist_dashboard.tracks') || 'Tracks'}</p>
              <p className="text-2xl font-bold text-white">{tracks.length}</p>
            </div>
          </div>

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
                    data-testid="artist-track-title"
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
                      data-testid="artist-album-title"
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
              </div>

              <div className="mt-4">
                <label className="block text-text-secondary text-sm font-medium mb-1">
                  {t('artist_dashboard.lyrics')}
                </label>
                <textarea
                  value={formData.lyrics}
                  onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                  rows={6}
                  className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                  placeholder={t('artist_dashboard.lyrics_placeholder')}
                  data-testid="track-lyrics-input"
                />
                <p className="text-text-secondary text-xs mt-1">{t('artist_dashboard.lyrics_hint')}</p>
              </div>

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
                    {formData.coverPreview && (
                      <span className="text-text-secondary text-xs truncate max-w-[150px]">Image selected</span>
                    )}
                  </div>
                  {formData.coverPreview && (
                    <div className="mt-2 w-20 h-20 rounded-md overflow-hidden border border-gray-700">
                      <img src={formData.coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">
                    {t('artist_dashboard.audio_file')} {editingId ? '' : '*'}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/mpeg,audio/wav,audio/flac,audio/*"
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
                  <p className="text-text-secondary text-xs mt-1">Supported: MP3, WAV, FLAC</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={editingId ? handleSaveEdit : handleCreate}
                  disabled={saving}
                  data-testid="artist-publish"
                  className="px-6 py-2 bg-primary text-black font-medium rounded-full hover:bg-green-400 transition disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? t('artist_dashboard.save_changes')
                      : t('artist_dashboard.publish')}
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-[#2a2a2a] text-white border border-gray-600 rounded-full hover:bg-[#333] transition"
                >
                  {t('artist_dashboard.cancel')}
                </button>
              </div>
            </div>
          )}

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
                    {track.coverImage ? (
                      <img src={track.coverImage} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🎵</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-medium text-lg">{track.title}</h3>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {track.type === 'album' ? 'Album' : 'Single'}
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm">
                      {track.albumTitle ? `${track.albumTitle} • ` : ''}
                      {track.genre || 'Uncategorized'} {track.releaseYear ? `• ${track.releaseYear}` : ''}
                    </p>
                    {track.lyrics ? (
                      <p className="text-text-secondary text-xs mt-1 truncate">{track.lyrics}</p>
                    ) : null}
                    <div className="flex gap-4 mt-1 text-xs text-text-secondary">
                      <span>👂 {track.listeners.toLocaleString()}</span>
                      <span>▶️ {track.streams.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => handlePlay(track)}
                      className="p-1.5 text-primary hover:text-primary/80 transition rounded-full bg-primary/10 hover:bg-primary/20"
                      title="Play track"
                    >
                      <PlayIcon className="w-5 h-5" />
                    </button>
                    <Link
                      href={`/player/${track.id}`}
                      className="p-1.5 text-text-secondary hover:text-white transition rounded"
                      title="Open player page"
                    >
                      ↗
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
