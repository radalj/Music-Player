export function canUseSubscriptions(role?: string | null): boolean {
  return role !== 'artist' && role !== 'admin';
}
