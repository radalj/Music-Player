'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  HomeIcon,
  UserIcon,
  MusicalNoteIcon,
  QueueListIcon,
  Cog6ToothIcon,
  BellIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  UserIcon as UserIconSolid,
  MusicalNoteIcon as MusicalNoteIconSolid,
  QueueListIcon as QueueListIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  BellIcon as BellIconSolid,
} from '@heroicons/react/24/solid';

export const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  const navItems = [
    { icon: HomeIcon, iconSolid: HomeIconSolid, label: 'Home', href: '/home' },
    { icon: UserIcon, iconSolid: UserIconSolid, label: 'Profile', href: '/profile' },
    { icon: QueueListIcon, iconSolid: QueueListIconSolid, label: 'Playlists', href: '/playlist' },
    { icon: MusicalNoteIcon, iconSolid: MusicalNoteIconSolid, label: 'Albums & Songs', href: '/albums' },
    { icon: BellIcon, iconSolid: BellIconSolid, label: 'Notifications', href: '/notifications' },
    { icon: Cog6ToothIcon, iconSolid: Cog6ToothIconSolid, label: 'Settings', href: '/settings' },
  ];

  // Add admin/artist dashboard if applicable
  const extraItems = [];
  if (user?.role === 'artist' || user?.role === 'admin') {
    extraItems.push({
      icon: ChartBarIcon,
      iconSolid: ChartBarIcon,
      label: 'Artist Dashboard',
      href: '/artist-dashboard',
    });
  }
  if (user?.role === 'supporter' || user?.role === 'admin') {
    extraItems.push({
      icon: ChartBarIcon,
      iconSolid: ChartBarIcon,
      label: 'Admin Dashboard',
      href: '/admin/dashboard',
    });
  }

  const allItems = [...navItems, ...extraItems];

  return (
    <aside className="w-64 bg-[#0a0a0a] p-4 flex flex-col border-r border-gray-800 flex-shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="text-2xl font-bold text-primary mb-8 flex items-center gap-2">
        <span>🎵</span> MusicApp
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {allItems.map((item) => {
          const Icon = isActive(item.href) ? item.iconSolid : item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                isActive(item.href)
                  ? 'bg-[#1a1a1a] text-white'
                  : 'text-text-secondary hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive(item.href) ? 'text-primary' : ''}`} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Area (clickable to Profile page) */}
      <div className="pt-4 border-t border-gray-800">
        <Link
          href="/profile"
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1a1a] transition cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-green-700 flex items-center justify-center text-black font-bold text-lg">
            {user?.displayName?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.displayName || 'Guest'}</p>
            <p className="text-text-secondary text-xs capitalize">
              {user?.subscriptionType || 'Free'} Plan
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
};