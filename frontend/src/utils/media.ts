const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

const FRONTEND_PUBLIC_PREFIXES = ['/audio/', '/images/', '/next/', '/_next/'];

export function mediaUrl(path?: string | null): string {
  if (!path) return '';
  if (
    path.startsWith('blob:') ||
    path.startsWith('data:') ||
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }
  if (FRONTEND_PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return path;
  }
  const origin = API_URL.replace(/\/api\/?$/, '');
  let normalized = path.startsWith('/') ? path : `/${path}`;
  if (
    !normalized.startsWith('/media/') &&
    (normalized.startsWith('/tracks/') ||
      normalized.startsWith('/covers/') ||
      normalized.startsWith('/albums/') ||
      normalized.startsWith('/profiles/'))
  ) {
    normalized = `/media${normalized}`;
  } else if (!normalized.startsWith('/media/') && /^(tracks|covers|albums|profiles)\//.test(path)) {
    normalized = `/media/${path}`;
  }
  return `${origin}${normalized}`;
}

export function audioSrc(path?: string | null): string {
  if (!path) return '';
  return mediaUrl(path);
}
