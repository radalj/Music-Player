'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import Player from '@/components/common/Player';
import { api } from '@/services/api';
import { mediaUrl } from '@/utils/media';
import toast from 'react-hot-toast';

export default function PublicUserPage() {
  const params = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const userId = params?.id as string;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    api
      .get(`/users/${userId}/`)
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleFollow = async () => {
    if (!profile) return;
    const wasFollowing = Boolean(profile.is_following);
    try {
      const res = wasFollowing
        ? await api.delete(`/users/${profile.id}/follow/`)
        : await api.post(`/users/${profile.id}/follow/`);
      const nextCount = Number(res.data?.followers_count);
      const current = Number(profile.followers_count || 0);
      setProfile({
        ...profile,
        is_following: !wasFollowing,
        followers_count: Number.isFinite(nextCount)
          ? nextCount
          : Math.max(0, current + (wasFollowing ? -1 : 1)),
      });
      toast.success(wasFollowing ? t('profile.unfollowed') : t('profile.followed'));
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Follow failed');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-dark">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        </main>
        <Player />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen bg-dark">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center text-white">{t('users.not_found')}</main>
        <Player />
      </div>
    );
  }

  const isSelf = String(user?.id) === String(profile.id);
  const avatar = mediaUrl(profile.profile_image);

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-3xl mx-auto p-6">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-primary to-green-700 flex items-center justify-center text-4xl font-bold text-black">
              {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : (profile.display_name || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-white">{profile.display_name}</h1>
              <p className="text-text-secondary">@{profile.username} · {profile.role}</p>
              {profile.bio && <p className="text-text-secondary mt-3">{profile.bio}</p>}
              <div className="flex gap-6 mt-4 justify-center md:justify-start">
                <span className="text-white font-bold">{profile.followers_count || 0} <span className="text-text-secondary font-normal">{t('profile.followers')}</span></span>
                <span className="text-white font-bold">{profile.following_count || 0} <span className="text-text-secondary font-normal">{t('profile.following')}</span></span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {!isSelf && (
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-full font-medium ${profile.is_following ? 'bg-[#2a2a2a] text-white border border-gray-600' : 'bg-primary text-black'}`}
                >
                  {profile.is_following ? t('profile.unfollow') : t('profile.follow')}
                </button>
              )}
              {profile.role === 'artist' && (
                <Link href={`/artist/${profile.id}`} className="px-6 py-2 rounded-full font-medium bg-[#2a2a2a] text-white border border-gray-600 text-center">
                  {t('users.view_works')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
      <Player />
    </div>
  );
}
