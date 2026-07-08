'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import Player from '@/components/common/Player';
import { PlusIcon, PencilIcon, TrashIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';

// ---------- Types ----------
interface Track {
  id: string;
  title: string;
  artist: {
    id: string;
    name: string;
  };
  coverImage?: string;
  duration?: number;
}

interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: string;
}

// ---------- Helper ----------
const generateId = () => Math.random().toString(36).substring(2, 10);

// Load playlists from localStorage
const loadPlaylists = (userId?: string): Playlist[] => {
  if (typeof window === 'undefined') return [];
  if (!userId) return [];
  const key = `playlists_${userId}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading playlists:', error);
  }
  return [];
};

// ---------- Main Page ----------
export default function PlaylistsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [playlists, setPlaylists] = useState<Playlist[]>(() =>
    loadPlaylists(user?.id)
  );

  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Reload when user changes
  useEffect(() => {
    if (user) {
      setPlaylists(loadPlaylists(user.id));
    } else {
      setPlaylists([]);
    }
  }, [user]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!user) return;
    const key = `playlists_${user.id}`;
    try {
      localStorage.setItem(key, JSON.stringify(playlists));
    } catch (error) {
      console.error('Error saving playlists:', error);
    }
  }, [playlists, user]);

  // ---------- Subscription limits ----------
  const getMaxPlaylists = (): number => {
    if (!user) return 6;
    switch (user.subscriptionType) {
      case 'gold': return Infinity;
      case 'silver': return 100;
      default: return 6;
    }
  };

  const maxPlaylists = getMaxPlaylists();
  const canCreate = playlists.length < maxPlaylists;

  // ---------- CRUD ----------
  const handleCreate = () => {
    if (!canCreate) {
      const limitMsg = maxPlaylists === Infinity ? t('playlists.unlimited') : maxPlaylists.toString();
      toast.error(t('playlists.limit_reached', { limit: limitMsg }));
      return;
    }
    if (!newPlaylistName.trim()) {
      toast.error(t('playlists.name_empty'));
      return;
    }
    const newPlaylist: Playlist = {
      id: generateId(),
      name: newPlaylistName.trim(),
      tracks: [],
      createdAt: new Date().toISOString(),
    };
    setPlaylists(prev => [...prev, newPlaylist]);
    setNewPlaylistName('');
    setIsCreating(false);
    toast.success(t('playlists.created', { name: newPlaylistName.trim() }));
  };

  const handleDelete = (id: string) => {
    if (confirm(t('playlists.delete_confirm'))) {
      setPlaylists(prev => prev.filter(p => p.id !== id));
      toast.success(t('playlists.deleted'));
    }
  };

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      toast.error(t('playlists.name_empty'));
      return;
    }
    setPlaylists(prev =>
      prev.map(p => (p.id === id ? { ...p, name: editName.trim() } : p))
    );
    setEditingId(null);
    setEditName('');
    toast.success(t('playlists.renamed'));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleAddTracks = (playlistId: string) => {
    window.location.href = `/albums?addToPlaylist=${playlistId}`;
  };

  // ---------- Render ----------
  if (!user) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">{t('playlists.login_required')}</p>
      </div>
    );
  }

  const limitDisplay = maxPlaylists === Infinity ? '∞' : `${playlists.length} / ${maxPlaylists}`;

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">{t('playlists.title')}</h1>
            <div className="flex items-center gap-3">
              <span className="text-text-secondary text-sm">{limitDisplay}</span>
              <button
                onClick={() => setIsCreating(true)}
                disabled={!canCreate}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                  canCreate
                    ? 'bg-primary text-black hover:bg-opacity-80'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <PlusIcon className="w-4 h-4" />
                {t('playlists.new_playlist')}
              </button>
            </div>
          </div>

          {/* Create Form */}
          {isCreating && (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder={t('playlists.name_placeholder')}
                className="flex-1 p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-primary text-black font-medium rounded hover:bg-opacity-80 transition"
                >
                  {t('playlists.create')}
                </button>
                <button
                  onClick={() => { setIsCreating(false); setNewPlaylistName(''); }}
                  className="px-4 py-2 bg-[#2a2a2a] text-white border border-gray-600 rounded hover:bg-[#333] transition"
                >
                  {t('playlists.cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {playlists.length === 0 && !isCreating && (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
              <div className="text-5xl mb-4">🎶</div>
              <h2 className="text-xl font-semibold text-white mb-2">{t('playlists.empty_title')}</h2>
              <p className="text-text-secondary mb-6">{t('playlists.empty_desc')}</p>
              <button
                onClick={() => setIsCreating(true)}
                className="px-6 py-3 bg-primary text-black font-medium rounded-full hover:bg-opacity-80 transition"
              >
                {t('playlists.create_first')}
              </button>
            </div>
          )}

          {/* Playlist Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition"
              >
                <div className="flex items-start justify-between">
                  {editingId === playlist.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 p-2 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition text-sm"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(playlist.id)}
                      />
                      <button
                        onClick={() => handleSaveEdit(playlist.id)}
                        className="px-3 py-1 bg-primary text-black text-xs font-medium rounded hover:bg-opacity-80 transition"
                      >
                        {t('playlists.save')}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 bg-[#2a2a2a] text-white border border-gray-600 text-xs rounded hover:bg-[#333] transition"
                      >
                        {t('playlists.cancel')}
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-white font-medium text-lg truncate">{playlist.name}</h3>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleStartEdit(playlist.id, playlist.name)}
                          className="p-1.5 text-text-secondary hover:text-white transition rounded"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(playlist.id)}
                          className="p-1.5 text-text-secondary hover:text-red-400 transition rounded"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Tracks list */}
                <div className="mt-3 space-y-1">
                  {playlist.tracks.length === 0 ? (
                    <p className="text-text-secondary text-sm">{t('playlists.no_tracks')}</p>
                  ) : (
                    playlist.tracks.map((track) => (
                      <div key={track.id} className="flex items-center gap-2 text-text-secondary text-sm">
                        <MusicalNoteIcon className="w-3 h-3" />
                        <span>{track.title}</span>
                        <span className="text-xs text-text-secondary/70">
                          — {track.artist.name}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Add tracks button */}
                <button
                  onClick={() => handleAddTracks(playlist.id)}
                  className="mt-3 w-full py-2 border border-dashed border-gray-600 rounded-lg text-text-secondary text-sm hover:text-white hover:border-gray-400 transition"
                >
                  {t('playlists.add_tracks')}
                </button>
              </div>
            ))}
          </div>

          {/* Limit reached message */}
          {!canCreate && playlists.length > 0 && (
            <p className="mt-4 text-yellow-400 text-sm text-center">
              {t('playlists.limit_message')}
            </p>
          )}
        </div>
      </main>
      <Player />
    </div>
  );
}