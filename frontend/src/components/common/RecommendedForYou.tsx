'use client';

import { formatRecommendationReason } from '@/utils/recommendations';

interface RecommendedTrack {
  id: string;
  title: string;
  coverImage: string;
  artist?: { name?: string };
  duration: number;
  reasonCode?: string;
  reasonGenre?: string | null;
}

interface RecommendedForYouProps {
  tracks: RecommendedTrack[];
  onPlay: (trackId: string) => void;
  formatDuration: (seconds: number) => string;
  t: (key: string) => string;
}

export function RecommendedForYou({ tracks, onPlay, formatDuration, t }: RecommendedForYouProps) {
  if (!tracks.length) return null;

  return (
    <section className="mb-10" data-testid="recommended-tracks">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">✨ {t('home.recommended')}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {tracks.map((track) => (
          <button
            type="button"
            key={track.id}
            onClick={() => onPlay(track.id)}
            className="bg-[#1a1a1a] rounded-lg p-3 hover:bg-[#242424] transition border border-gray-800 text-left"
            data-testid="recommended-track-card"
          >
            <div className="w-full aspect-square bg-gray-700 rounded-md overflow-hidden mb-2">
              <img src={track.coverImage} alt={track.title} className="w-full h-full object-cover" />
            </div>
            <p className="text-white font-medium truncate text-sm">{track.title}</p>
            <p className="text-text-secondary text-xs truncate">{track.artist?.name || 'Artist'}</p>
            <p className="text-primary text-xs mt-1 truncate">
              {formatRecommendationReason(t, track.reasonCode, track.reasonGenre)}
            </p>
            <p className="text-text-secondary text-xs mt-1 font-mono">{formatDuration(track.duration)}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
