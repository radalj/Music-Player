import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecommendedForYou } from '@/components/common/RecommendedForYou';

const t = (key: string) => {
  const messages: Record<string, string> = {
    'home.recommended': 'Recommended for you',
    'home.recommended_reason_genre': 'Because you listen to {genre}',
    'home.recommended_reason_artist': 'Because you listen to this artist',
    'home.recommended_reason_follow': 'From artists you follow',
    'home.recommended_reason_popular': 'Popular on MusicApp',
  };
  return messages[key] || key;
};

describe('RecommendedForYou', () => {
  it('renders suggested tracks with a taste-based reason and plays on click', async () => {
    const onPlay = jest.fn();
    render(
      <RecommendedForYou
        tracks={[
          {
            id: '12',
            title: 'Harbor Lights',
            coverImage: '/images/default-track.jpg',
            artist: { name: 'The Midnight Waves' },
            duration: 242,
            reasonCode: 'genre',
            reasonGenre: 'Indie Rock',
          },
        ]}
        onPlay={onPlay}
        formatDuration={(seconds) => `${Math.floor(seconds / 60)}:00`}
        t={t}
      />
    );

    expect(screen.getByTestId('recommended-tracks')).toBeInTheDocument();
    expect(screen.getByText('Harbor Lights')).toBeInTheDocument();
    expect(screen.getByText('Because you listen to Indie Rock')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('recommended-track-card'));
    expect(onPlay).toHaveBeenCalledWith('12');
  });
});
