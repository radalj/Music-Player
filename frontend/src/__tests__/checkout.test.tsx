import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckoutPage from '@/app/checkout/page';
import { AuthContext } from '@/context/AuthContext';
import { LanguageContext } from '@/context/LanguageContext';
import { PlayerProvider } from '@/context/PlayerContext';
import en from '@/locales/en.json';

const mockPush = jest.fn();
const mockUpdateUser = jest.fn();
const mockPost = jest.fn().mockResolvedValue({
  data: { subscription_type: 'gold', plan: 'gold', user: { subscription_type: 'gold' } },
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams('plan=gold&months=1'),
  usePathname: () => '/checkout',
}));

jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn().mockResolvedValue({ data: [{ name: 'gold', price: 19.99 }] }),
    post: (...args: any[]) => mockPost(...args),
  },
}));

const mockUser = {
  id: 'user1',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  subscriptionType: 'silver',
  role: 'listener',
  followers: 10,
  following: 5,
  dailyStreams: 20,
  access: 'token',
};

const mockT = (key: string) => {
  const keys = key.split('.');
  let result: any = en;
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      return key;
    }
  }
  return typeof result === 'string' ? result : key;
};

describe('Checkout page', () => {
  it('sends the mock payment after card details are submitted', async () => {
    const user = userEvent.setup();
    render(
        <AuthContext.Provider value={{ user: mockUser as any, login: jest.fn(), register: jest.fn(), updateUser: mockUpdateUser, logout: jest.fn(), isAuthenticated: true, isReady: true }}>
        <LanguageContext.Provider value={{ language: 'en', setLanguage: jest.fn(), t: mockT }}>
          <PlayerProvider>
            <CheckoutPage />
          </PlayerProvider>
        </LanguageContext.Provider>
      </AuthContext.Provider>
    );

    await user.type(screen.getByTestId('card-name'), 'Test User');
    await user.type(screen.getByTestId('card-number'), '4111111111111111');
    await user.type(screen.getByTestId('card-expiry'), '12/28');
    await user.type(screen.getByTestId('card-cvv'), '123');
    await user.click(screen.getByTestId('pay-button'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/payments/mock/', {
        plan: 'gold',
        duration_months: 1,
        payment_method: 'card',
      });
    });
    expect(mockUpdateUser).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/subscriptions');
  });
});
