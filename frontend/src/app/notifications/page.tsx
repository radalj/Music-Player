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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

const getToken = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const parsed = JSON.parse(user);
      return parsed.access || null;
    } catch {}
  }
  return null;
};

const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${url}`, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
};

interface Notification {
  id: string;
  recipient?: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  notification_type?: string;
  link?: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isClient, setIsClient] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadNotifications = async () => {
      try {
        setLoading(true);
        const data = await authFetch('/notifications/notifications/');
        const items = Array.isArray(data) ? data : data.results || [];
        setNotifications(items);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await authFetch(`/notifications/notifications/${id}/mark_read/`, { method: 'PATCH' });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      toast.success(t('notifications.marked_read'));
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await authFetch(`/notifications/notifications/${id}/`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success(t('notifications.deleted'));
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete notification');
    }
  };

  const markAllAsRead = async () => {
    if (notifications.length === 0) {
      toast(t('notifications.no_notifications_to_mark'));
      return;
    }
    try {
      await authFetch('/notifications/notifications/mark_all_read/', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success(t('notifications.all_marked_read'));
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark all as read');
    }
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

  if (!isClient) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">{t('notifications.login_required')}</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-4xl mx-auto p-6">
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

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
              <div className="text-5xl mb-4">📭</div>
              <h2 className="text-xl font-semibold text-white mb-2">{t('notifications.empty_title')}</h2>
              <p className="text-text-secondary">{t('notifications.empty_desc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 transition hover:border-gray-700 ${
                    !notification.is_read ? 'bg-[#1e2a3a] border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!notification.is_read && (
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className={`font-medium text-white ${!notification.is_read ? 'text-white' : 'text-text-secondary'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-text-secondary whitespace-nowrap">
                          {formatTime(notification.created_at)}
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
                      {!notification.is_read && (
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