import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Player from '@/components/common/Player';

const mockUser = {
  id: 'user1',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  subscriptionType: 'gold',
  role: 'listener',
  followers: 10,
  following: 5,
  dailyStreams: 20,
};

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    login: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: true,
  }),
}));

jest.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({
    t: () => '',
    language: 'en',
    setLanguage: jest.fn(),
  }),
}));

describe('Player', () => {
  const playMock = jest.fn().mockResolvedValue(undefined);
  const pauseMock = jest.fn();
  const loadMock = jest.fn();

  beforeEach(() => {
    Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: playMock,
    });
    Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      value: pauseMock,
    });
    Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
      configurable: true,
      value: loadMock,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    playMock.mockClear();
    pauseMock.mockClear();
    loadMock.mockClear();
  });

  it('renders the initial track and loads its audio source', async () => {
    render(<Player />);

    expect(screen.getByText('Midnight Dreams')).toBeInTheDocument();
    expect(screen.getByText('The Midnight Waves')).toBeInTheDocument();

    const audio = document.querySelector('audio');
    expect(audio).toBeTruthy();

    await waitFor(() => {
      expect(audio?.getAttribute('src') || audio?.src).toContain('/audio/track1.mp3');
    });
  });

  it('starts and pauses playback from the shared audio element', async () => {
    const user = userEvent.setup();
    render(<Player />);

    await user.click(screen.getByTitle('Play'));

    await waitFor(() => {
      expect(playMock).toHaveBeenCalled();
    });

    await user.click(screen.getByTitle('Pause'));

    expect(pauseMock).toHaveBeenCalled();
  });

  it('advances to the next track and updates the shared audio source', async () => {
    const user = userEvent.setup();
    render(<Player />);

    await user.click(screen.getByTitle('Next'));

    await waitFor(() => {
      expect(screen.getByText('Ocean Waves')).toBeInTheDocument();
    });

    const audio = document.querySelector('audio');
    expect(audio?.getAttribute('src') || audio?.src).toContain('/audio/track4.mp3');
    expect(playMock).toHaveBeenCalled();
  });
});