import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from '@/app/settings/page';
import { AuthContext } from '@/context/AuthContext';
import { LanguageContext } from '@/context/LanguageContext';
import en from '@/locales/en.json';
import fa from '@/locales/fa.json';

// Mock contexts
const mockUser = {
  id: 'user1',
  displayName: 'Test User',
  email: 'test@example.com',
  subscriptionType: 'free',
  role: 'listener',
  username: 'testuser',
  followers: 10,
  following: 5,
  dailyStreams: 20,
};

const mockLogout = jest.fn();
const mockSetLanguage = jest.fn();

const renderWithProviders = (ui: React.ReactElement, language = 'en') => {
  const translations = language === 'en' ? en : fa;
  const mockT = (key: string) => {
    const keys = key.split('.');
    let result: any = translations;
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return key;
      }
    }
    return typeof result === 'string' ? result : key;
  };

  return render(
    <AuthContext.Provider value={{ user: mockUser, login: jest.fn(), logout: mockLogout, isAuthenticated: true }}>
      <LanguageContext.Provider value={{ language: language as any, setLanguage: mockSetLanguage, t: mockT }}>
        {ui}
      </LanguageContext.Provider>
    </AuthContext.Provider>
  );
};

describe('Settings Page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should change language to Persian', () => {
    renderWithProviders(<SettingsPage />, 'en');
    const faButton = screen.getByText(/🇮🇷 فارسی/);
    fireEvent.click(faButton);
    expect(mockSetLanguage).toHaveBeenCalledWith('fa');
  });

  test('should toggle notifications', () => {
    renderWithProviders(<SettingsPage />);
    const toggleButtons = screen.getAllByRole('button');
    // First toggle button is for 'Enable notifications'
    const notificationsToggle = toggleButtons[0];
    fireEvent.click(notificationsToggle);
    // Check if localStorage was updated
    const settingsKey = `settings_${mockUser.id}`;
    const stored = JSON.parse(localStorage.getItem(settingsKey) || '{}');
    expect(stored.notificationsEnabled).toBe(false);
  });

  test('should show subscription plan', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText('Free Plan')).toBeInTheDocument();
  });

  test('should open delete modal and validate DELETE input', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    renderWithProviders(<SettingsPage />);
    const deleteButton = screen.getByText('Delete My Account');
    fireEvent.click(deleteButton);
    expect(screen.getByRole('heading', { name: 'Delete Account', level: 3 })).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Type DELETE here');
    const confirmButton = screen.getByText('Delete Permanently');

    // Type wrong text
    await user.type(input, 'WRONG');
    fireEvent.click(confirmButton);
    expect(mockLogout).not.toHaveBeenCalled();

    // Type correct text
    await user.clear(input);
    await user.type(input, 'DELETE');
    fireEvent.click(confirmButton);

    jest.advanceTimersByTime(1000);
    await waitFor(() => expect(mockLogout).toHaveBeenCalled());

    jest.useRealTimers();
  });
});