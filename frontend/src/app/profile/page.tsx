'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/common/Sidebar';
import Player from '@/components/common/Player';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { mockAlbums, mockTracks } from '@/utils/mockData';
import Link from 'next/link';
import { CheckBadgeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

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

const getSubscriptionLabel = (type: string) => {
  const map: Record<string, { label: string; color: string; icon: string }> = {
    gold: { label: 'Gold', color: 'text-yellow-400', icon: '⭐' },
    silver: { label: 'Silver', color: 'text-gray-300', icon: '🥈' },
    free: { label: 'Free', color: 'text-text-secondary', icon: '🎵' },
  };
  return map[type] || map.free;
};

// ---------- Artist Profile Component ----------
function ArtistProfileContent({ user, isPending }: { user: any; isPending: boolean }) {
  const artistId = user.id;

  const getFollowStatus = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const followed = JSON.parse(localStorage.getItem('followed_artists') || '[]');
      return followed.includes(artistId);
    } catch {
      return false;
    }
  };

  const getFollowersCount = (): number => {
    if (typeof window === 'undefined') return user?.followers || 0;
    try {
      const data = JSON.parse(localStorage.getItem('artist_followers') || '{}');
      return data[artistId] ?? user?.followers ?? 0;
    } catch {
      return user?.followers || 0;
    }
  };

  const [isFollowing, setIsFollowing] = useState(getFollowStatus());
  const [followersCount, setFollowersCount] = useState(getFollowersCount());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const followed = JSON.parse(localStorage.getItem('followed_artists') || '[]');
    if (isFollowing && !followed.includes(artistId)) {
      followed.push(artistId);
    } else if (!isFollowing && followed.includes(artistId)) {
      const index = followed.indexOf(artistId);
      if (index > -1) followed.splice(index, 1);
    }
    localStorage.setItem('followed_artists', JSON.stringify(followed));

    const data = JSON.parse(localStorage.getItem('artist_followers') || '{}');
    data[artistId] = followersCount;
    localStorage.setItem('artist_followers', JSON.stringify(data));
  }, [isFollowing, followersCount, artistId]);

  const artistData = {
    bio: 'Indie rock band from California, bringing nostalgic vibes with modern twists.',
    verified: !isPending,
    totalListeners: 45200,
    totalStreams: 1245000,
    albums: mockAlbums.filter(album => album.artist.id === user.id || album.artist.name === user.displayName),
    tracks: mockTracks.filter(track => track.artist.id === user.id || track.artist.name === user.displayName),
  };

  const handleFollow = () => {
    if (isFollowing) {
      setFollowersCount(prev => Math.max(0, prev - 1));
      setIsFollowing(false);
      toast.success('Unfollowed artist');
    } else {
      setFollowersCount(prev => prev + 1);
      setIsFollowing(true);
      toast.success('Following artist');
    }
  };

  return (
    <div className="space-y-6">
      {isPending && (
        <div className="bg-red-600/20 border border-red-600/30 rounded-xl p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">Your artist account is pending approval</p>
            <p className="text-text-secondary text-sm">
              You will be notified via email once approved. Some features are limited until then.
            </p>
          </div>
        </div>
      )}

      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-primary to-green-700 flex items-center justify-center text-4xl font-bold text-black flex-shrink-0">
              {user.profileImage ? (
                <Image src={user.profileImage} alt={user.displayName} width={112} height={112} className="w-full h-full object-cover" />
              ) : (
                <span>{user.displayName?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
          </div>

          <div className="flex-1 text-center md:text-right">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <h1 className="text-2xl font-bold text-white">{user.displayName}</h1>
              {artistData.verified ? (
                <span className="inline-flex items-center gap-1 text-blue-400 text-sm font-medium">
                  <CheckBadgeIcon className="w-5 h-5 text-blue-400" />
                  Verified Artist
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-yellow-400 text-sm font-medium">
                  ⏳ Pending Verification
                </span>
              )}
              <span className="text-sm text-text-secondary">🎤 Artist</span>
            </div>

            <p className="text-text-secondary text-sm mt-2">{artistData.bio}</p>

            <div className="flex gap-6 mt-3">
              <div>
                <span className="text-white font-bold">{followersCount}</span>
                <span className="text-text-secondary text-sm ml-1">Followers</span>
              </div>
              <div>
                <span className="text-white font-bold">{artistData.totalListeners.toLocaleString()}</span>
                <span className="text-text-secondary text-sm ml-1">Listeners</span>
              </div>
              <div>
                <span className="text-white font-bold">{artistData.totalStreams.toLocaleString()}</span>
                <span className="text-text-secondary text-sm ml-1">Total Streams</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            <button
              onClick={handleFollow}
              className={`px-6 py-2 rounded-full font-medium transition ${
                isFollowing
                  ? 'bg-[#2a2a2a] text-white border border-gray-600 hover:bg-[#333]'
                  : 'bg-primary text-black hover:bg-opacity-80'
              }`}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4">💿 Albums</h2>
          {artistData.albums.length === 0 ? (
            <p className="text-text-secondary text-sm">No albums released yet.</p>
          ) : (
            <div className="space-y-3">
              {artistData.albums.map((album) => (
                <Link key={album.id} href={`/album/${album.id}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#2a2a2a] transition">
                  <div className="w-12 h-12 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                    <img src={album.coverImage} alt={album.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{album.title}</p>
                    <p className="text-text-secondary text-sm truncate">{album.genre.join(', ')}</p>
                    <p className="text-text-secondary text-xs">{album.tracks.length} tracks</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4">🎵 Tracks</h2>
          {artistData.tracks.length === 0 ? (
            <p className="text-text-secondary text-sm">No tracks released yet.</p>
          ) : (
            <div className="space-y-2">
              {artistData.tracks.map((track, index) => (
                <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#2a2a2a] transition">
                  <span className="text-text-secondary text-sm w-6 text-center font-mono">{index + 1}</span>
                  <div className="w-10 h-10 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                    <img src={track.coverImage} alt={track.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{track.title}</p>
                    <p className="text-text-secondary text-xs">{track.album?.title || 'Single'}</p>
                  </div>
                  <div className="text-text-secondary text-xs font-mono">{formatDuration(track.duration)}</div>
                  <div className="text-text-secondary text-xs">👂 {track.listeners.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {user.subscriptionType === 'gold' && (
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4">📊 Gold Analytics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#2a2a2a] p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{artistData.totalListeners.toLocaleString()}</p>
              <p className="text-text-secondary text-sm">Total Listeners</p>
            </div>
            <div className="bg-[#2a2a2a] p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{artistData.totalStreams.toLocaleString()}</p>
              <p className="text-text-secondary text-sm">Total Streams</p>
            </div>
            <div className="bg-[#2a2a2a] p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{followersCount}</p>
              <p className="text-text-secondary text-sm">Followers</p>
            </div>
            <div className="bg-[#2a2a2a] p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{artistData.tracks.length}</p>
              <p className="text-text-secondary text-sm">Tracks Released</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Main Profile Page ----------
export default function ProfilePage() {
  const { user: authUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // ✅ اصلاح: انتقال state به داخل تابع و استفاده از any
  const [localUser, setLocalUser] = useState<any>(authUser);

  useEffect(() => {
    if (authUser) {
      setLocalUser(authUser);
    }
  }, [authUser]);

  // ---------- Follow state for listener ----------
  const userId = localUser?.id || '';

  const getFollowStatus = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const followed = JSON.parse(localStorage.getItem('followed_artists') || '[]');
      return followed.includes(userId);
    } catch {
      return false;
    }
  };

  const getFollowersCount = (): number => {
    if (typeof window === 'undefined') return localUser?.followers || 0;
    try {
      const data = JSON.parse(localStorage.getItem('artist_followers') || '{}');
      return data[userId] ?? localUser?.followers ?? 0;
    } catch {
      return localUser?.followers || 0;
    }
  };

  const [isFollowing, setIsFollowing] = useState(getFollowStatus());
  const [followersCount, setFollowersCount] = useState(getFollowersCount());

  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;
    const followed = JSON.parse(localStorage.getItem('followed_artists') || '[]');
    if (isFollowing && !followed.includes(userId)) {
      followed.push(userId);
    } else if (!isFollowing && followed.includes(userId)) {
      const index = followed.indexOf(userId);
      if (index > -1) followed.splice(index, 1);
    }
    localStorage.setItem('followed_artists', JSON.stringify(followed));

    const data = JSON.parse(localStorage.getItem('artist_followers') || '{}');
    data[userId] = followersCount;
    localStorage.setItem('artist_followers', JSON.stringify(data));
  }, [isFollowing, followersCount, userId]);

  // ---------- Edit form data ----------
  const [editData, setEditData] = useState({
    displayName: localUser?.displayName || '',
    username: localUser?.username || '',
    email: localUser?.email || '',
    birthDate: formatDate(localUser?.birthDate),
    gender: localUser?.gender || '',
  });

  useEffect(() => {
    if (localUser) {
      setEditData({
        displayName: localUser.displayName || '',
        username: localUser.username || '',
        email: localUser.email || '',
        birthDate: formatDate(localUser.birthDate),
        gender: localUser.gender || '',
      });
    }
  }, [localUser]);

  if (!localUser) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">Please login</p>
      </div>
    );
  }

  // ---------- ARTIST (pending or verified) ----------
  if (localUser.role === 'pending_artist' || localUser.role === 'artist') {
    const isPending = localUser.role === 'pending_artist';
    return (
      <div className="flex h-screen bg-dark">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-28">
          <div className="max-w-5xl mx-auto p-6">
            <ArtistProfileContent user={localUser} isPending={isPending} />
          </div>
        </main>
        <Player />
      </div>
    );
  }

  // ---------- LISTENER (or admin, supporter) ----------
  const subInfo = getSubscriptionLabel(localUser.subscriptionType);

  const handleFollow = () => {
    if (isFollowing) {
      setFollowersCount(prev => Math.max(0, prev - 1));
      setIsFollowing(false);
      toast.success('Unfollowed');
    } else {
      setFollowersCount(prev => prev + 1);
      setIsFollowing(true);
      toast.success('Followed');
    }
  };

  // ✅ اصلاح: مدیریت صحیح خطا و استفاده از let
  const handleSaveEdit = () => {
    if (!localUser) {
      toast.error('User data not available');
      return;
    }

    const updatedUser = {
      ...localUser,
      displayName: editData.displayName,
      email: editData.email,
      birthDate: editData.birthDate,
      gender: editData.gender,
    };

    setLocalUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    try {
      let registered = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      if (!Array.isArray(registered)) {
        registered = [];
      }
      const index = registered.findIndex((u: any) => u.id === updatedUser.id);
      if (index !== -1) {
        registered[index] = updatedUser;
        localStorage.setItem('registeredUsers', JSON.stringify(registered));
      }
    } catch (error) {
      const registered = [updatedUser];
      localStorage.setItem('registeredUsers', JSON.stringify(registered));
    }

    toast.success('Profile updated successfully');
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditData({
      displayName: localUser?.displayName || '',
      username: localUser?.username || '',
      email: localUser?.email || '',
      birthDate: formatDate(localUser?.birthDate),
      gender: localUser?.gender || '',
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-primary to-green-700 flex items-center justify-center text-4xl font-bold text-black flex-shrink-0">
                  {localUser.profileImage ? (
                    <Image src={localUser.profileImage} alt={localUser.displayName} width={112} height={112} className="w-full h-full object-cover" />
                  ) : (
                    <span>{localUser.displayName?.[0]?.toUpperCase() || '?'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#1a1a1a] rounded-full p-1 border border-gray-700">
                  <span className="text-lg">{subInfo.icon}</span>
                </div>
              </div>

              <div className="flex-1 text-center md:text-right">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h1 className="text-2xl font-bold text-white">{localUser.displayName}</h1>
                  <span className={`text-sm font-medium ${subInfo.color}`}>
                    {subInfo.icon} {subInfo.label}
                  </span>
                </div>
                <p className="text-text-secondary text-sm mt-1">@{localUser.username}</p>
                <p className="text-text-secondary text-sm">{localUser.email}</p>

                <div className="flex gap-6 mt-3">
                  <div>
                    <span className="text-white font-bold">{followersCount}</span>
                    <span className="text-text-secondary text-sm ml-1">Followers</span>
                  </div>
                  <div>
                    <span className="text-white font-bold">{localUser.following}</span>
                    <span className="text-text-secondary text-sm ml-1">Following</span>
                  </div>
                  <div>
                    <span className="text-white font-bold">{localUser.dailyStreams}</span>
                    <span className="text-text-secondary text-sm ml-1">Daily Streams</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-auto">
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-full font-medium transition ${
                    isFollowing
                      ? 'bg-[#2a2a2a] text-white border border-gray-600 hover:bg-[#333]'
                      : 'bg-primary text-black hover:bg-opacity-80'
                  }`}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 rounded-full font-medium bg-[#2a2a2a] text-white border border-gray-600 hover:bg-[#333] transition"
                >
                  ✏️ Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 rounded-full font-medium bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">✏️ Edit Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">Display Name</label>
                  <input type="text" value={editData.displayName} onChange={(e) => setEditData({ ...editData, displayName: e.target.value })} className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition" />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">Username</label>
                  <input type="text" value={editData.username} className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 opacity-60" disabled />
                  <p className="text-text-secondary text-xs mt-1">Username cannot be changed</p>
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">Email</label>
                  <input type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition" />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">Birth Date</label>
                  <input type="date" value={editData.birthDate} onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })} className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition" />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">Gender</label>
                  <select value={editData.gender} onChange={(e) => setEditData({ ...editData, gender: e.target.value })} className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition">
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex items-end gap-3 md:col-span-2">
                  <button onClick={handleSaveEdit} className="px-6 py-2 bg-primary text-black font-bold rounded-full hover:bg-opacity-80 transition">💾 Save Changes</button>
                  <button onClick={handleCancelEdit} className="px-6 py-2 bg-[#2a2a2a] text-white border border-gray-600 rounded-full hover:bg-[#333] transition">❌ Cancel</button>
                </div>
              </div>
              {localUser.subscriptionType === 'free' && (
                <div className="mt-4 p-3 bg-yellow-600/10 border border-yellow-600/30 rounded-lg text-sm text-yellow-400">
                  ⚠️ Free users cannot change profile picture. Upgrade to Gold or Silver in Settings.
                </div>
              )}
            </div>
          )}

          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">📊 Activity Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#2a2a2a] p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{followersCount}</p>
                <p className="text-text-secondary text-sm">Followers</p>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{localUser.following}</p>
                <p className="text-text-secondary text-sm">Following</p>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{localUser.dailyStreams}</p>
                <p className="text-text-secondary text-sm">Daily Streams</p>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{localUser.subscriptionType === 'gold' ? '∞' : '🎵'}</p>
                <p className="text-text-secondary text-sm">Subscription</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Player />
    </div>
  );
}