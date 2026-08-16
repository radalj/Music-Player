import { formatRecommendationReason } from '@/utils/recommendations';

const t = (key: string) => {
  const messages: Record<string, string> = {
    'home.recommended_reason_genre': 'Because you listen to {genre}',
    'home.recommended_reason_artist': 'Because you listen to this artist',
    'home.recommended_reason_follow': 'From artists you follow',
    'home.recommended_reason_popular': 'Popular on MusicApp',
  };
  return messages[key] || key;
};

describe('formatRecommendationReason', () => {
  it('explains genre-based suggestions with the listened genre', () => {
    expect(formatRecommendationReason(t, 'genre', 'Indie Rock')).toBe(
      'Because you listen to Indie Rock'
    );
  });

  it('falls back to popularity copy when there is no taste signal', () => {
    expect(formatRecommendationReason(t, 'popular')).toBe('Popular on MusicApp');
  });
});
