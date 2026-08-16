'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import Player from '@/components/common/Player';
import { api } from '@/services/api';
import {
  BellIcon,
  GlobeAltIcon,
  CreditCardIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Settings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}

const defaultSettings: Settings = {
  notificationsEnabled: true,
  soundEnabled: true,
};

const getStorageKey = (userId: string) => `settings_${userId}`;

const loadSettings = (userId: string): Settings => {
  if (typeof window === 'undefined') return defaultSettings;
  const key = getStorageKey(userId);
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }
  return defaultSettings;
};

const saveSettings = (userId: string, settings: Settings) => {
  if (typeof window === 'undefined') return;
  const key = getStorageKey(userId);
  try {
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
};

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [settings, setSettings] = useState<Settings>(() => {
    if (user) {
      return loadSettings(user.id);
    }
    return defaultSettings;
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (user) {
      setSettings(loadSettings(user.id));
    } else {
      setSettings(defaultSettings);
    }
  }, [user, isMounted]);

  useEffect(() => {
    if (user) {
      saveSettings(user.id, settings);
    }
  }, [settings, user]);

  const handleToggle = (key: keyof Settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success(`${key} ${value ? 'enabled' : 'disabled'}`);
  };

  const handleLanguageChange = (lang: 'en' | 'fa') => {
    setLanguage(lang);
    toast.success(`Language changed to ${lang === 'en' ? 'English' : 'Persian'}`);
  };

  const handleUpgrade = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/subscriptions';
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm.');
      return;
    }
    setIsDeleting(true);
    try {
      await api.delete('/users/profile/');
    } catch {
      // still wipe local session if backend already removed the user
    }
    if (user) {
      const keysToRemove = [
        `settings_${user.id}`,
        `playlists_${user.id}`,
        `notifications_initialized_${user.id}`,
        'user',
        'followed_artists',
        'artist_followers',
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      logout();
      toast.success('Account deleted successfully.');
      window.location.href = '/login';
    }
    setIsDeleting(false);
  };

  if (!isMounted) {
    return (
      <div className="flex h-screen bg-dark">
        <main className="flex-1 flex items-center justify-center pb-28">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">{t('settings.login_required') || 'Please login to access settings.'}</p>
      </div>
    );
  }

  const subLabels: Record<string, { label: string; color: string; icon: string }> = {
    free: { label: t('subscription.free') || 'Free', color: 'text-gray-400', icon: '🎵' },
    silver: { label: t('subscription.silver') || 'Silver', color: 'text-gray-300', icon: '🥈' },
    gold: { label: t('subscription.gold') || 'Gold', color: 'text-yellow-400', icon: '⭐' },
  };
  const subInfo = subLabels[user.subscriptionType] || subLabels.free;

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-3xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-white mb-6">{t('settings.title')}</h1>

          <div className="space-y-6">
            <section className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BellIcon className="w-5 h-5 text-primary" />
                {t('settings.notifications_section')}
              </h2>
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-text-secondary">{t('settings.enable_notifications')}</span>
                <button
                  onClick={() => handleToggle('notificationsEnabled', !settings.notificationsEnabled)}
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.notificationsEnabled ? 'bg-primary' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.notificationsEnabled ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-text-secondary">{t('settings.sound_for_notifications')}</span>
                <button
                  onClick={() => handleToggle('soundEnabled', !settings.soundEnabled)}
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.soundEnabled ? 'bg-primary' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.soundEnabled ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>
            </section>

            <section className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">🔊 {t('settings.sound_section') || 'System sound'}</h2>
              <div className="flex items-center justify-between py-2">
                <span className="text-text-secondary">{t('settings.system_volume') || 'Player volume'}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue={70}
                  data-testid="settings-volume"
                  onChange={(e) => {
                    localStorage.setItem('system_volume', e.target.value);
                    toast.success(`Volume: ${e.target.value}%`);
                  }}
                  className="w-40 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </section>

            <section className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <GlobeAltIcon className="w-5 h-5 text-primary" />
                {t('settings.language_section')}
              </h2>
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    language === 'en'
                      ? 'bg-primary text-white'
                      : 'bg-[#2a2a2a] text-text-secondary hover:bg-[#333]'
                  }`}
                >
                  🇬🇧 English
                </button>
                <button
                  onClick={() => handleLanguageChange('fa')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    language === 'fa'
                      ? 'bg-primary text-white'
                      : 'bg-[#2a2a2a] text-text-secondary hover:bg-[#333]'
                  }`}
                >
                  🇮🇷 فارسی
                </button>
              </div>
            </section>

            {user.role === 'listener' && (
              <section className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5 text-primary" />
                  {t('settings.subscription_section')}
                </h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">{t('settings.current_plan')}</p>
                    <p className={`text-2xl font-bold ${subInfo.color}`}>
                      {subInfo.icon && `${subInfo.icon} `}
                      {subInfo.label}
                    </p>
                  </div>
                  <button
                    onClick={handleUpgrade}
                    className="px-6 py-2 bg-primary text-black font-bold rounded-full hover:bg-green-400 transition"
                  >
                    {user.subscriptionType === 'gold' ? t('settings.manage') : t('settings.upgrade')}
                  </button>
                </div>
                {user.subscriptionType !== 'gold' && (
                  <p className="mt-2 text-text-secondary text-sm">
                    {t('settings.upgrade_message')}
                  </p>
                )}
              </section>
            )}

            <section className="bg-[#1a1a1a] border border-red-800/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                <TrashIcon className="w-5 h-5" />
                {t('settings.delete_account_section')}
              </h2>
              <p className="text-text-secondary text-sm mb-4">
                {t('settings.delete_confirm_message')}
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-6 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-full hover:bg-red-600/30 transition"
              >
                {t('settings.delete_button')}
              </button>
            </section>
          </div>
        </div>
      </main>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full border border-gray-800 p-6">
            <h3 className="text-xl font-bold text-white mb-4">{t('settings.delete_modal_title')}</h3>
            <p className="text-text-secondary text-sm mb-2">
              {t('settings.delete_modal_message')}
            </p>
            <p className="text-text-secondary text-sm mb-4">
              {t('settings.delete_modal_confirm_instruction')}
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={t('settings.delete_modal_placeholder')}
              className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-red-500 outline-none transition mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className={`flex-1 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 transition ${
                  isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isDeleting ? t('settings.deleting') : t('settings.delete_permanently')}
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                className="flex-1 py-2 bg-[#2a2a2a] text-white border border-gray-600 rounded hover:bg-[#333] transition"
              >
                {t('settings.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <Player />
    </div>
  );
}