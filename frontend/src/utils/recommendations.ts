export function formatRecommendationReason(
  t: (key: string) => string,
  reasonCode?: string,
  reasonGenre?: string | null,
) {
  if (reasonCode === 'genre' && reasonGenre) {
    return t('home.recommended_reason_genre').replace('{genre}', reasonGenre);
  }
  if (reasonCode === 'artist') {
    return t('home.recommended_reason_artist');
  }
  if (reasonCode === 'follow') {
    return t('home.recommended_reason_follow');
  }
  return t('home.recommended_reason_popular');
}
