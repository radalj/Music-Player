import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/common/Sidebar';

const mockUser = {
  id: 'user1',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  subscriptionType: 'gold',
  role: 'admin',
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
    t: (key: string) => key,
    language: 'en',
    setLanguage: jest.fn(),
  }),
}));

describe('Sidebar Component', () => {
  it('renders navigation links', () => {
    render(<Sidebar />);
    expect(screen.getByText('sidebar.home')).toBeInTheDocument();
    expect(screen.getByText('sidebar.albums_songs')).toBeInTheDocument();
    expect(screen.getByText('sidebar.playlists')).toBeInTheDocument();
  });

  it('renders admin dashboard link when user is admin', () => {
    render(<Sidebar />);
    expect(screen.getByText('sidebar.admin_dashboard')).toBeInTheDocument();
  });
});
