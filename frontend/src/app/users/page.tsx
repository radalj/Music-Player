'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import Player from '@/components/common/Player';
import { api } from '@/services/api';
import { mediaUrl } from '@/utils/media';
import toast from 'react-hot-toast';

interface PublicUser {
  id: number | string;
  username: string;
  display_name: string;
  email?: string;
  role: string;
  profile_image?: string | null;
  bio?: string;
  verified?: boolean;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
  subscription_type?: string;
}

export default function UsersPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsers = async (query = search, selectedRole = role) => {
    try {
      setLoading(true);
      const res = await api.get('/users/', {
        params: {
          ...(query.trim() ? { search: query.trim() } : {}),
          ...(selectedRole ? { role: selectedRole } : {}),
        },
      });
      const raw = Array.isArray(res.data) ? res.data : res.data.results || [];
      setUsers(raw);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadUsers('', '');
  }, [user?.id]);

  const handleFollow = async (target: PublicUser) => {
    try {
      if (target.is_following) {
        await api.delete(`/users/${target.id}/follow/`);
        toast.success(t('profile.unfollowed'));
      } else {
        await api.post(`/users/${target.id}/follow/`);
        toast.success(t('profile.followed'));
      }
      setUsers((prev) =>
        prev.map((item) =>
          String(item.id) === String(target.id)
            ? {
                ...item,
                is_following: !item.is_following,
                followers_count: Math.max(0, (item.followers_count || 0) + (item.is_following ? -1 : 1)),
              }
            : item
        )
      );
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.detail || 'Follow failed');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">{t('users.login_required')}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-5xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-white mb-2">{t('users.title')}</h1>
          <p className="text-text-secondary mb-6">{t('users.subtitle')}</p>

          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
              placeholder={t('users.search_placeholder')}
              data-testid="users-search"
              className="flex-1 p-3 bg-[#1a1a1a] rounded-xl text-white border border-gray-800 focus:border-primary outline-none"
            />
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                loadUsers(search, e.target.value);
              }}
              className="p-3 bg-[#1a1a1a] rounded-xl text-white border border-gray-800"
            >
              <option value="">{t('users.all_roles')}</option>
              <option value="listener">{t('users.listeners')}</option>
              <option value="artist">{t('users.artists')}</option>
              <option value="admin">{t('users.admins')}</option>
            </select>
            <button
              onClick={() => loadUsers()}
              className="px-5 py-3 bg-primary text-black font-bold rounded-xl hover:bg-green-400 transition"
            >
              {t('users.search')}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-10 text-center text-text-secondary">
              {t('users.empty')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map((item) => (
                <div key={item.id} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-primary to-green-700 flex items-center justify-center text-black font-bold text-xl flex-shrink-0">
                    {item.profile_image ? (
                      <img src={mediaUrl(item.profile_image) || item.profile_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (item.display_name || item.username || '?')[0].toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={item.role === 'artist' ? `/artist/${item.id}` : `/users/${item.id}`} className="text-white font-medium hover:text-primary truncate block">
                      {item.display_name || item.username}
                    </Link>
                    <p className="text-text-secondary text-sm truncate">@{item.username} · {item.role}</p>
                    <p className="text-text-secondary text-xs mt-1">
                      {item.followers_count || 0} {t('profile.followers')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFollow(item)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      item.is_following
                        ? 'bg-[#2a2a2a] text-white border border-gray-600'
                        : 'bg-primary text-black hover:bg-green-400'
                    }`}
                  >
                    {item.is_following ? t('profile.unfollow') : t('profile.follow')}
                  </button>
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
