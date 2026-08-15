import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/common/EmptyState';

describe('EmptyState Component', () => {
  it('renders title and description correctly', () => {
    render(<EmptyState title="No Playlists" description="You have not created any playlists yet." />);
    expect(screen.getByText('No Playlists')).toBeInTheDocument();
    expect(screen.getByText('You have not created any playlists yet.')).toBeInTheDocument();
  });

  it('renders optional action button when provided', () => {
    const handleAction = jest.fn();
    render(
      <EmptyState
        title="Empty Notifications"
        description="No notifications available."
        actionLabel="Create Playlist"
        onAction={handleAction}
      />
    );
    const button = screen.getByText('Create Playlist');
    expect(button).toBeInTheDocument();
  });
});
