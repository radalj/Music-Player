export function canUseSubscriptions(role?: string | null): boolean {
  return role !== 'artist' && role !== 'admin' && role !== 'supporter';
}

export function isSupportStaff(role?: string | null): boolean {
  return role === 'admin' || role === 'supporter';
}

export function canManageAdminSettings(role?: string | null): boolean {
  return role === 'admin';
}

export function canViewArtistStats(
  plan?: string | null,
  role?: string | null
): boolean {
  if (role === 'admin') return true;
  return plan === 'silver' || plan === 'gold';
}
