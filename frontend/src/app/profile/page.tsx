'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import Player from '@/components/common/Player';
import Image from 'next/image';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { CheckBadgeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { mediaUrl } from '@/utils/media';
import { api } from '@/services/api';
import { canViewArtistStats } from '@/utils/roles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

// ---------- Helper Functions ----------
const formatDate = (date: string | Date | undefined): string => {
  if (!date) return '';
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ---------- Helper for authenticated fetch ----------
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token') || 
                (() => {
                  const user = localStorage.getItem('user');
                  if (user) {
                    try {
                      const parsed = JSON.parse(user);
                      return parsed.access || null;
                    } catch {}
                  }
                  return null;
                })();

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
  return response.json();
};

// ---------- Artist Profile Component ----------
function ArtistProfileContent({
  user,
  isPending,
  albums,
  tracks,
  onFollowToggle,
  followersCount,
  isFollowing,
}: {
  user: any;
  isPending: boolean;
  albums: any[];
  tracks: any[];
  onFollowToggle: () => void;
  followersCount: number;
  isFollowing: boolean;
}) {
  const { user: authUser } = useAuth();
  const { t } = useLanguage();
  const isOwnProfile = String(authUser?.id) === String(user.id);

  const artistData = {
    bio: user.bio || 'No bio available.',
    verified: user.verified || false,
    totalListeners: user.total_listeners || 0,
    totalStreams: user.total_streams || 0,
  };

  return (
    <div className="space-y-6">
      {isPending && (
        <div className="bg-red-600/20 border border-red-600/30 rounded-xl p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">{t('profile.pending_title')}</p>
            <p className="text-text-secondary text-sm">{t('profile.pending_desc')}</p>
          </div>
        </div>
      )}

      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-primary to-green-700 flex items-center justify-center text-4xl font-bold text-black flex-shrink-0">
              {user.profile_image ? (
                <Image
                  src={mediaUrl(user.profile_image) || user.profile_image}
                  alt={user.display_name}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user.display_name?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
          </div>

          <div className="flex-1 text-center md:text-right">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <h1 className="text-2xl font-bold text-white">{user.display_name}</h1>
              {artistData.verified ? (
                <span className="inline-flex items-center gap-1 text-blue-400 text-sm font-medium">
                  <CheckBadgeIcon className="w-5 h-5 text-blue-400" />
                  {t('profile.verified_artist')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-yellow-400 text-sm font-medium">
                  ⏳ {t('profile.pending_verification')}
                </span>
              )}
              <span className="text-sm text-text-secondary">🎤 {t('profile.artist')}</span>
            </div>

            <p className="text-text-secondary text-sm mt-2">{artistData.bio}</p>

            <div className="flex gap-6 mt-3">
              <div>
                <span className="text-white font-bold">{followersCount}</span>
                <span className="text-text-secondary text-sm ml-1">{t('profile.followers')}</span>
              </div>
              <div>
                <span className="text-white font-bold">{artistData.totalListeners.toLocaleString()}</span>
                <span className="text-text-secondary text-sm ml-1">{t('profile.listeners')}</span>
              </div>
              <div>
                <span className="text-white font-bold">{artistData.totalStreams.toLocaleString()}</span>
                <span className="text-text-secondary text-sm ml-1">{t('profile.total_streams')}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            <button
              onClick={onFollowToggle}
              className={`px-6 py-2 rounded-full font-medium transition ${
                isFollowing
                  ? 'bg-[#2a2a2a] text-white border border-gray-600 hover:bg-[#333]'
                  : 'bg-primary text-black hover:bg-green-400'
              }`}
            >
              {isFollowing ? t('profile.unfollow') : t('profile.follow')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4">💿 {t('profile.albums')}</h2>
          {albums.length === 0 ? (
            <p className="text-text-secondary text-sm">{t('profile.no_albums')}</p>
          ) : (
            <div className="space-y-3">
              {albums.map((album) => (
                <Link key={album.id} href={`/album/${album.id}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#2a2a2a] transition">
                  <div className="w-12 h-12 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                    <img src={album.cover_image} alt={album.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{album.title}</p>
                    <p className="text-text-secondary text-sm truncate">{album.genre?.join(', ') || 'No genre'}</p>
                    <p className="text-text-secondary text-xs">{album.tracks?.length || 0} {t('profile.tracks_count')}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4">🎵 {t('profile.tracks')}</h2>
          {tracks.length === 0 ? (
            <p className="text-text-secondary text-sm">{t('profile.no_tracks')}</p>
          ) : (
            <div className="space-y-2">
              {tracks.slice(0, 10).map((track, index) => (
                <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#2a2a2a] transition">
                  <span className="text-text-secondary text-sm w-6 text-center font-mono">{index + 1}</span>
                  <div className="w-10 h-10 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                    <img src={track.cover_image} alt={track.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{track.title}</p>
                    <p className="text-text-secondary text-xs">{track.album?.title || t('profile.single')}</p>
                  </div>
                  <div className="text-text-secondary text-xs font-mono">{formatDuration(track.duration)}</div>
                  <div className="text-text-secondary text-xs">👂 {track.listeners?.toLocaleString() || 0}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(isOwnProfile || canViewArtistStats(authUser?.subscriptionType || authUser?.subscription_type, authUser?.role)) && (
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4">📊 {t('profile.gold_analytics')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#2a2a2a] p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{artistData.totalListeners.toLocaleString()}</p>
              <p className="text-text-secondary text-sm">{t('profile.total_listeners')}</p>
            </div>
            <div className="bg-[#2a2a2a] p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{artistData.totalStreams.toLocaleString()}</p>
              <p className="text-text-secondary text-sm">{t('profile.total_streams')}</p>
            </div>
            <div className="bg-[#2a2a2a] p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{followersCount}</p>
              <p className="text-text-secondary text-sm">{t('profile.followers')}</p>
            </div>
            <div className="bg-[#2a2a2a] p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{tracks.length}</p>
              <p className="text-text-secondary text-sm">{t('profile.tracks_released')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Main Profile Page ----------
export default function ProfilePage() {
  const { user: authUser, logout, updateUser } = useAuth();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [localUser, setLocalUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const [editData, setEditData] = useState({
    displayName: '',
    username: '',
    email: '',
    birthDate: '',
    gender: '',
    bio: '',
  });
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  // ---------- تابع دریافت توکن ----------
  const getToken = () => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        return parsed.access || null;
      } catch {}
    }
    return null;
  };

  // ---------- بارگذاری داده‌ها ----------
  useEffect(() => {
    if (!authUser) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) throw new Error('No token');

        // 1. دریافت پروفایل
        const profileRes = await fetch(`${API_URL}/users/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!profileRes.ok) throw new Error('Failed to load profile');
        const userData = await profileRes.json();
        setLocalUser(userData);
        setEditData({
          displayName: userData.display_name || '',
          username: userData.username || '',
          email: userData.email || '',
          birthDate: formatDate(userData.birth_date),
          gender: userData.gender || '',
          bio: userData.bio || '',
        });

        // 2. دریافت اشتراک
        try {
          const subRes = await fetch(`${API_URL}/subscriptions/my-subscription/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (subRes.ok) {
            const subData = await subRes.json();
            setSubscription(subData);
          }
        } catch {}

        // 3. اگر هنرمند است، آلبوم‌ها و آهنگ‌ها را دریافت کن
        if (userData.role === 'artist' || userData.role === 'pending_artist') {
          const [albumsRes, tracksRes] = await Promise.all([
            fetch(`${API_URL}/music/albums/?artist=${userData.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_URL}/music/tracks/?artist=${userData.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          if (albumsRes.ok) {
            const data = await albumsRes.json();
            setAlbums(data.results || data || []);
          }
          if (tracksRes.ok) {
            const data = await tracksRes.json();
            setTracks(data.results || data || []);
          }
        }

        // 4. اطلاعات فالو (اگر کاربر دیگر باشد)
        if (authUser.id !== userData.id) {
          // فرض کنید endpointی برای دریافت وضعیت فالو وجود دارد
          try {
            const followRes = await fetch(`${API_URL}/users/${userData.id}/follow-status/`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (followRes.ok) {
              const data = await followRes.json();
              setFollowersCount(data.followers_count || 0);
              setIsFollowing(data.is_following || false);
            }
          } catch {}
        } else {
          // خودش
          setFollowersCount(userData.followers_count || 0);
          setIsFollowing(false);
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [authUser]);

  // ---------- دنبال کردن / لغو دنبال کردن ----------
  const handleFollowToggle = async () => {
    if (!localUser || String(authUser?.id) === String(localUser.id)) {
      toast.error(t('profile.self_follow_error'));
      return;
    }
    try {
      const token = getToken();
      if (!token) throw new Error('No token');

      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`${API_URL}/users/${localUser.id}/follow/`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed');
      }

      const data = await res.json();
      const nextCount = Number(data.followers_count);
      if (isFollowing) {
        setFollowersCount((prev) => Number.isFinite(nextCount) ? nextCount : Math.max(0, prev - 1));
        setIsFollowing(false);
        toast.success(t('profile.unfollowed'));
      } else {
        setFollowersCount((prev) => Number.isFinite(nextCount) ? nextCount : prev + 1);
        setIsFollowing(true);
        toast.success(t('profile.followed'));
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update follow status');
    }
  };

  const handlePhotoSelect = (file: File | null) => {
    const planName = (
      subscription?.plan?.name ||
      localUser?.subscription_type ||
      authUser?.subscriptionType ||
      'free'
    ).toLowerCase();
    if (planName === 'free') {
      toast.error(t('profile.photo_not_allowed'));
      return;
    }
    setProfileFile(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview('');
    }
  };

  // ---------- ویرایش پروفایل ----------
  const handleSaveEdit = async () => {
    if (!localUser) {
      toast.error(t('profile.user_data_unavailable'));
      return;
    }
    try {
      let updated;
      if (profileFile) {
        const formData = new FormData();
        formData.append('display_name', editData.displayName);
        formData.append('email', editData.email);
        if (editData.birthDate) formData.append('birth_date', editData.birthDate);
        if (editData.gender) formData.append('gender', editData.gender);
        formData.append('bio', editData.bio || '');
        formData.append('profile_image', profileFile);
        const res = await api.patch('/users/profile/', formData);
        updated = res.data;
      } else {
        const res = await api.patch('/users/profile/', {
          display_name: editData.displayName,
          email: editData.email,
          birth_date: editData.birthDate || null,
          gender: editData.gender || null,
          bio: editData.bio || '',
        });
        updated = res.data;
      }
      setLocalUser(updated);
      updateUser({
        ...updated,
        profileImage: updated.profile_image,
        profile_image: updated.profile_image,
      });
      setProfileFile(null);
      setPhotoPreview('');
      toast.success(t('profile.update_success'));
      setIsEditing(false);
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.response?.data?.error || error.message;
      toast.error(msg || 'Failed to update profile');
    }
  };

  // ---------- خروج ----------
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // ---------- در حال بارگذاری ----------
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

  if (!localUser) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">{t('profile.login_required')}</p>
      </div>
    );
  }

  // ---------- هنرمند ----------
  if (localUser.role === 'pending_artist' || localUser.role === 'artist') {
    const isPending = localUser.role === 'pending_artist';
    const isOwnArtist = String(authUser?.id) === String(localUser.id);
    const artistPlan = (
      subscription?.plan?.name ||
      localUser.subscription_type ||
      authUser?.subscriptionType ||
      'free'
    ).toLowerCase();
    const artistCanUpload = artistPlan === 'silver' || artistPlan === 'gold';
    return (
      <div className="flex h-screen bg-dark">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-28">
          <div className="max-w-5xl mx-auto p-6">
            {isOwnArtist && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setIsEditing(true)}
                  data-testid="edit-profile"
                  className="px-6 py-2 rounded-full font-medium bg-[#2a2a2a] text-white border border-gray-600 hover:bg-[#333] transition"
                >
                  ✏️ {t('profile.edit_profile')}
                </button>
              </div>
            )}
            {isEditing && isOwnArtist && (
              <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-4">✏️ {t('profile.edit_information')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-text-secondary text-sm font-medium mb-1">{t('profile.profile_photo')}</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      data-testid="profile-photo-input"
                      disabled={!artistCanUpload}
                      onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)}
                      className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-1 file:text-black disabled:opacity-50"
                    />
                    {!artistCanUpload && (
                      <p className="text-yellow-400 text-xs mt-1">{t('profile.photo_not_allowed')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-1">{t('profile.display_name')}</label>
                    <input
                      type="text"
                      value={editData.displayName}
                      onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                      className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-1">{t('profile.email')}</label>
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-text-secondary text-sm font-medium mb-1">{t('profile.bio')}</label>
                    <textarea
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      rows={3}
                      className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none"
                    />
                  </div>
                  <div className="flex gap-3 md:col-span-2">
                    <button onClick={handleSaveEdit} className="px-6 py-2 bg-primary text-black font-bold rounded-full hover:bg-green-400 transition">
                      💾 {t('profile.save_changes')}
                    </button>
                    <button onClick={() => setIsEditing(false)} className="px-6 py-2 bg-[#2a2a2a] text-white border border-gray-600 rounded-full hover:bg-[#333] transition">
                      ❌ {t('profile.cancel')}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <ArtistProfileContent
              user={localUser}
              isPending={isPending}
              albums={albums}
              tracks={tracks}
              onFollowToggle={handleFollowToggle}
              followersCount={followersCount}
              isFollowing={isFollowing}
            />
          </div>
        </main>
        <Player />
      </div>
    );
  }

  // ---------- شنونده / ادمین / پشتیبان ----------
  const getSubscriptionLabel = (type: string) => {
    const map: Record<string, { labelKey: string; color: string; icon: string }> = {
      gold: { labelKey: 'subscription.gold', color: 'text-yellow-400', icon: '⭐' },
      silver: { labelKey: 'subscription.silver', color: 'text-gray-300', icon: '🥈' },
      free: { labelKey: 'subscription.free', color: 'text-text-secondary', icon: '🎵' },
    };
    return map[type] || map.free;
  };

  const planName = (
    subscription?.plan?.name ||
    localUser.subscription_type ||
    authUser?.subscriptionType ||
    'free'
  ).toLowerCase();
  const subInfo = localUser.role === 'listener' ? getSubscriptionLabel(planName) : null;
  const isOwnProfile = String(authUser?.id) === String(localUser.id);
  const canUploadPhoto = planName === 'silver' || planName === 'gold';
  const avatarSrc = photoPreview || mediaUrl(localUser.profile_image);

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-primary to-green-700 flex items-center justify-center text-4xl font-bold text-black flex-shrink-0">
                  {avatarSrc ? (
                    <Image
                      src={avatarSrc}
                      alt={localUser.display_name}
                      width={112}
                      height={112}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{localUser.display_name?.[0]?.toUpperCase() || '?'}</span>
                  )}
                </div>
                {subInfo && (
                  <div className="absolute -bottom-1 -right-1 bg-[#1a1a1a] rounded-full p-1 border border-gray-700">
                    <span className="text-lg">{subInfo.icon}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 text-center md:text-right">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h1 className="text-2xl font-bold text-white">{localUser.display_name}</h1>
                  {subInfo && (
                    <span className={`text-sm font-medium ${subInfo.color}`}>
                      {subInfo.icon} {t(subInfo.labelKey)}
                    </span>
                  )}
                </div>
                <p className="text-text-secondary text-sm mt-1">@{localUser.username}</p>
                <p className="text-text-secondary text-sm">{localUser.email}</p>

                <div className="flex gap-6 mt-3">
                  <div>
                    <span className="text-white font-bold">{followersCount}</span>
                    <span className="text-text-secondary text-sm ml-1">{t('profile.followers')}</span>
                  </div>
                  <div>
                    <span className="text-white font-bold">{localUser.following_count || 0}</span>
                    <span className="text-text-secondary text-sm ml-1">{t('profile.following')}</span>
                  </div>
                  <div>
                    <span className="text-white font-bold">{localUser.daily_streams || 0}</span>
                    <span className="text-text-secondary text-sm ml-1">{t('profile.daily_streams')}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-auto">
                {!isOwnProfile && (
                  <button
                    onClick={handleFollowToggle}
                    className={`px-6 py-2 rounded-full font-medium transition ${
                      isFollowing
                        ? 'bg-[#2a2a2a] text-white border border-gray-600 hover:bg-[#333]'
                        : 'bg-primary text-black hover:bg-green-400'
                    }`}
                  >
                    {isFollowing ? t('profile.unfollow') : t('profile.follow')}
                  </button>
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditing(true)}
                    data-testid="edit-profile"
                    className="px-6 py-2 rounded-full font-medium bg-[#2a2a2a] text-white border border-gray-600 hover:bg-[#333] transition"
                  >
                    ✏️ {t('profile.edit_profile')}
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 rounded-full font-medium bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition"
                >
                  🚪 {t('profile.logout')}
                </button>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">✏️ {t('profile.edit_information')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-text-secondary text-sm font-medium mb-1">{t('profile.profile_photo')}</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    data-testid="profile-photo-input"
                    disabled={!canUploadPhoto}
                    onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)}
                    className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-1 file:text-black disabled:opacity-50"
                  />
                  {!canUploadPhoto && (
                    <p className="text-yellow-400 text-xs mt-1">{t('profile.photo_not_allowed')}</p>
                  )}
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">{t('profile.display_name')}</label>
                  <input
                    type="text"
                    value={editData.displayName}
                    onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                    className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">{t('profile.username')}</label>
                  <input
                    type="text"
                    value={editData.username}
                    className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 opacity-60"
                    disabled
                  />
                  <p className="text-text-secondary text-xs mt-1">{t('profile.username_cannot_change')}</p>
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">{t('profile.email')}</label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">{t('profile.birth_date')}</label>
                  <input
                    type="date"
                    value={editData.birthDate}
                    onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                    className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">{t('profile.gender')}</label>
                  <select
                    value={editData.gender}
                    onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                    className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                  >
                    <option value="">{t('profile.prefer_not_say')}</option>
                    <option value="male">{t('profile.male')}</option>
                    <option value="female">{t('profile.female')}</option>
                    <option value="non-binary">{t('profile.non_binary')}</option>
                    <option value="other">{t('profile.other')}</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-text-secondary text-sm font-medium mb-1">{t('profile.bio')}</label>
                  <textarea
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    rows={3}
                    className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                  />
                </div>
                <div className="flex items-end gap-3 md:col-span-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-6 py-2 bg-primary text-black font-bold rounded-full hover:bg-green-400 transition"
                  >
                    💾 {t('profile.save_changes')}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 bg-[#2a2a2a] text-white border border-gray-600 rounded-full hover:bg-[#333] transition"
                  >
                    ❌ {t('profile.cancel')}
                  </button>
                </div>
              </div>
              {planName === 'free' && (
                <div className="mt-4 p-3 bg-yellow-600/10 border border-yellow-600/30 rounded-lg text-sm text-yellow-400">
                  ⚠️ {t('profile.free_limitation')}
                </div>
              )}
            </div>
          )}

          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">📊 {t('profile.activity_stats')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#2a2a2a] p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{followersCount}</p>
                <p className="text-text-secondary text-sm">{t('profile.followers')}</p>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{localUser.following_count || 0}</p>
                <p className="text-text-secondary text-sm">{t('profile.following')}</p>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{localUser.daily_streams || 0}</p>
                <p className="text-text-secondary text-sm">{t('profile.daily_streams')}</p>
              </div>
              {localUser.role === 'listener' && (
                <div className="bg-[#2a2a2a] p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">
                    {subscription?.plan?.name === 'gold' || planName === 'gold' ? '∞' : '🎵'}
                  </p>
                  <p className="text-text-secondary text-sm">{t('profile.subscription')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Player />
    </div>
  );
}