'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import Player from '@/components/common/Player';
import {
  BellIcon,
  CheckCircleIcon,
  TrashIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

// ---------- Types ----------
interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type:
    | 'subscription'
    | 'new_release'
    | 'artist_approval'
    | 'artist_rejection'
    | 'financial'
    | 'ticket'
    | 'verification_request';
  link?: string;
}

// ---------- Helper Functions ----------
const generateId = () => Math.random().toString(36).substring(2, 10);

const loadNotifications = (userId: string): Notification[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      const all = JSON.parse(stored);
      if (Array.isArray(all)) {
        return all.filter((n: Notification) => n.userId === userId);
      }
    }
  } catch (e) {
    console.error('Error loading notifications:', e);
  }
  return [];
};

const saveAllNotifications = (allNotifications: Notification[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('notifications', JSON.stringify(allNotifications));
};

const isInitialized = (userId: string): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`notifications_initialized_${userId}`) === 'true';
};

const setInitialized = (userId: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`notifications_initialized_${userId}`, 'true');
};

// ---------- Mock Data Generator ----------
const generateMockNotifications = (userId: string, role: string): Notification[] => {
  const now = new Date();
  const baseTime = now.getTime();
  const notifications: Notification[] = [];

  if (role === 'listener' || role === 'admin' || role === 'supporter') {
    notifications.push({
      id: generateId(),
      userId,
      title: 'Subscription Expiring Soon',
      message: 'Your free plan will expire in 3 days. Upgrade to continue enjoying premium features.',
      read: false,
      createdAt: new Date(baseTime - 2 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'subscription',
      link: '/settings/subscription',
    });

    notifications.push({
      id: generateId(),
      userId,
      title: 'New Release: "Starlight" by Luna Star',
      message: 'Your followed artist Luna Star has released a new single. Check it out now!',
      read: false,
      createdAt: new Date(baseTime - 5 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'new_release',
      link: '/albums/album2',
    });

    notifications.push({
      id: generateId(),
      userId,
      title: 'New Album: "Dreamscape" by The Midnight Waves',
      message: 'The Midnight Waves have released their new album Dreamscape. Listen now!',
      read: true,
      createdAt: new Date(baseTime - 10 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'new_release',
      link: '/albums/album1',
    });
  }

  if (role === 'artist' || role === 'admin' || role === 'supporter') {
    notifications.push({
      id: generateId(),
      userId,
      title: 'Artist Account Approved',
      message: 'Your artist account has been approved! You can now upload music and manage your profile.',
      read: false,
      createdAt: new Date(baseTime - 1 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'artist_approval',
      link: '/profile',
    });

    notifications.push({
      id: generateId(),
      userId,
      title: 'Monthly Financial Report',
      message: 'Your earnings for this month: $234.56. Streams: 12,450. View full report.',
      read: true,
      createdAt: new Date(baseTime - 15 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'financial',
      link: '/artist-dashboard/financial',
    });
  }

  if (role === 'admin' || role === 'supporter') {
    notifications.push({
      id: generateId(),
      userId,
      title: 'New Support Ticket #123',
      message: 'User john_doe has submitted a new ticket regarding payment issue. Please review.',
      read: false,
      createdAt: new Date(baseTime - 3 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'ticket',
      link: '/admin/tickets/123',
    });

    notifications.push({
      id: generateId(),
      userId,
      title: 'New Artist Verification Request',
      message: 'Artist "Neon Pulse" has requested verification. Review their portfolio now.',
      read: false,
      createdAt: new Date(baseTime - 6 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'verification_request',
      link: '/admin/verification/neon-pulse',
    });
  }

  return notifications;
};

// ---------- Main Component ----------
export default function NotificationsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isClient, setIsClient] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (user) {
      return loadNotifications(user.id);
    }
    return [];
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (user) {
      const initialized = isInitialized(user.id);
      let userNotifs = loadNotifications(user.id);

      if (!initialized) {
        const mock = generateMockNotifications(user.id, user.role);
        const all = JSON.parse(localStorage.getItem('notifications') || '[]');
        const filtered = all.filter((n: Notification) => n.userId !== user.id);
        saveAllNotifications([...filtered, ...mock]);
        setInitialized(user.id);
        userNotifs = mock;
      }

      setNotifications(userNotifs);
    } else {
      setNotifications([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const all = JSON.parse(localStorage.getItem('notifications') || '[]');
    const otherUsers = all.filter((n: Notification) => n.userId !== user.id);
    saveAllNotifications([...otherUsers, ...notifications]);
  }, [notifications, user]);

  // ---------- Handlers ----------
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    toast.success(t('notifications.marked_read'));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success(t('notifications.deleted'));
  };

  const markAllAsRead = () => {
    if (notifications.length === 0) {
      toast(t('notifications.no_notifications_to_mark'));
      return;
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success(t('notifications.all_marked_read'));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.just_now');
    if (diffMins < 60) return `${diffMins}${t('notifications.minutes_ago')}`;
    if (diffHours < 24) return `${diffHours}${t('notifications.hours_ago')}`;
    if (diffDays < 7) return `${diffDays}${t('notifications.days_ago')}`;
    return date.toLocaleDateString();
  };

  if (!isClient) {
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">{t('notifications.login_required')}</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">🔔 {t('notifications.title')}</h1>
              {unreadCount > 0 && (
                <span className="bg-primary text-black text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount} {t('notifications.new')}
                </span>
              )}
            </div>
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                unreadCount > 0
                  ? 'bg-primary text-black hover:bg-opacity-80'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <CheckIcon className="w-4 h-4" />
              {t('notifications.read_all')}
            </button>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
              <div className="text-5xl mb-4">📭</div>
              <h2 className="text-xl font-semibold text-white mb-2">{t('notifications.empty_title')}</h2>
              <p className="text-text-secondary">
                {t('notifications.empty_desc')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 transition hover:border-gray-700 ${
                    !notification.read ? 'bg-[#1e2a3a] border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!notification.read && (
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className={`font-medium text-white ${!notification.read ? 'text-white' : 'text-text-secondary'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-text-secondary whitespace-nowrap">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">{notification.message}</p>
                      {notification.link && (
                        <Link
                          href={notification.link}
                          className="inline-block mt-2 text-primary text-sm hover:underline"
                        >
                          {t('notifications.view_details')} →
                        </Link>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 text-text-secondary hover:text-primary transition rounded"
                          title={t('notifications.mark_as_read_title')}
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1.5 text-text-secondary hover:text-red-400 transition rounded"
                        title={t('notifications.delete_title')}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Player />
    </div>
  );
}