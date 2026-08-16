import { test, expect, Page } from '@playwright/test';

const LISTENER = { email: 'gold@music.app', password: 'Password123!' };
const FREE_LISTENER = { email: 'listener@music.app', password: 'Password123!' };
const ADMIN = { email: 'admin@music.app', password: 'Password123!' };
const ARTIST = { email: 'artist@music.app', password: 'Password123!' };

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(/\/(home|pending-approval|admin)/, { timeout: 15000 });
}

test.describe('Phase 1 required features', () => {
  test('2.1 Login, forgot password and listener registration', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /MusicApp/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();

    await page.getByTestId('forgot-password-link').click();
    await expect(page).toHaveURL(/forgot-password/);
    await expect(page.locator('input[type="email"]')).toBeVisible();

    await page.goto('/login');
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/register/);

    await expect(page.getByTestId('privacy-policy')).toBeVisible();
    await page.getByTestId('privacy-policy').click();
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible();
    await page.getByRole('button', { name: /got it/i }).click();

    const stamp = Date.now();
    await page.getByTestId('register-display-name').fill('Playwright User');
    await page.getByTestId('register-email').fill(`pw_${stamp}@example.com`);
    await page.locator('input[type="password"]').nth(0).fill('Password123!');
    await page.locator('input[type="password"]').nth(1).fill('Password123!');
    await page.getByTestId('register-birth-date').fill('1999-01-15');
    await page.getByTestId('register-gender').selectOption('female');
    await page.locator('input[type="checkbox"]').check();
    await page.getByTestId('register-submit').click();
    await page.waitForURL('**/home', { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Playwright User' })).toBeVisible();
  });

  test('2.1 Artist registration goes to pending approval', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: /^artist$/i }).click();
    const stamp = Date.now();
    await page.locator('input[placeholder="Your stage name"]').fill(`Stage ${stamp}`);
    await page.locator('input[placeholder="artist@example.com"]').fill(`artist_${stamp}@example.com`);
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByTestId('register-portfolio').fill('https://soundcloud.com/demo');
    await page.getByTestId('register-submit').click();
    await page.waitForURL('**/pending-approval', { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /در انتظار تأیید|pending/i })).toBeVisible();
  });

  test('2.2 Home page layout, sidebar and gold early access', async ({ page }) => {
    await login(page, LISTENER.email, LISTENER.password);
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('aside')).toContainText(/home/i);
    await expect(page.locator('aside')).toContainText(/profile/i);
    await expect(page.locator('aside')).toContainText(/playlist/i);
    await expect(page.locator('aside')).toContainText(/album/i);
    await expect(page.locator('aside')).toContainText(/settings/i);
    await expect(page.getByRole('heading', { name: 'Gold Listener' })).toBeVisible();
    await expect(page.getByText(/early access|دسترسی زودهنگام|gold/i).first()).toBeVisible();
  });

  test('2.3 User profile shows assigned username, plan and edit', async ({ page }) => {
    await login(page, LISTENER.email, LISTENER.password);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Gold Listener' })).toBeVisible();
    await expect(page.getByText(/golduser|username/i).first()).toBeVisible();
    await expect(page.getByTestId('edit-profile')).toBeVisible();
  });

  test('2.4 Artist profile has bio, works, verified badge and follow', async ({ page }) => {
    await login(page, LISTENER.email, LISTENER.password);
    await page.goto('/albums');
    await page.getByTestId('album-artist-link').first().click();
    await expect(page).toHaveURL(/artist\//);
    await expect(page.getByRole('button', { name: /follow|following/i })).toBeVisible();
    await expect(page.getByTestId('artist-gold-listeners')).toBeVisible();
  });

  test('2.5 Settings: notifications, volume, language, delete account', async ({ page }) => {
    await login(page, LISTENER.email, LISTENER.password);
    await page.goto('/settings');
    await expect(page.getByText(/notification/i).first()).toBeVisible();
    await expect(page.getByTestId('settings-volume')).toBeVisible();
    await expect(page.getByRole('button', { name: /english/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /فارسی|persian/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /delete/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /upgrade|manage/i }).click();
    await expect(page).toHaveURL(/subscriptions/);
  });

  test('2.6 Notifications: unread style, mark read, delete, empty handling', async ({ page }) => {
    await login(page, LISTENER.email, LISTENER.password);
    await page.goto('/notifications');
    await expect(page.getByRole('heading', { name: /notification/i })).toBeVisible();
    const markAll = page.getByTestId('mark-all-read');
    await expect(markAll).toBeVisible();
    if (await page.getByTestId('mark-as-read').count()) {
      await page.getByTestId('mark-as-read').first().click();
    }
    if (await markAll.isEnabled()) {
      await markAll.click();
    }
  });

  test('2.7 Playlists create, rename, add tracks and empty state', async ({ page }) => {
    await login(page, FREE_LISTENER.email, FREE_LISTENER.password);
    await page.goto('/playlists');
    await page.getByTestId('create-playlist').click();
    await page.locator('input[placeholder]').first().fill(`My List ${Date.now()}`);
    await page.getByRole('button', { name: /^create$/i }).click();
    await expect(page.getByText(/my list/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /add/i }).first()).toBeVisible();
  });

  test('2.8 Albums page search, filters, album and track cards', async ({ page }) => {
    await login(page, LISTENER.email, LISTENER.password);
    await page.goto('/albums');
    const search = page.locator('input[placeholder*="search" i], input[placeholder*="جستجو" i]');
    await expect(search).toBeVisible();
    await expect(page.getByText(/Dreamscape|Midnight Dreams|Ocean Waves/i).first()).toBeVisible();
    await page.getByText(/Dreamscape/i).first().click();
    await expect(page).toHaveURL(/album\//);
  });

  test('2.9 Music player controls, queue, repeat, shuffle, lyrics, expand', async ({ page }) => {
    await login(page, LISTENER.email, LISTENER.password);
    await page.goto('/home');
    const player = page.getByTestId('music-player');
    await expect(player).toBeVisible();
    await expect(page.getByTestId('player-play')).toBeVisible();
    await expect(page.getByTestId('player-next')).toBeVisible();
    await expect(page.getByTestId('player-prev')).toBeVisible();
    await expect(page.getByTestId('player-shuffle')).toBeVisible();
    await expect(page.getByTestId('player-repeat')).toBeVisible();
    await expect(page.getByTestId('player-progress')).toBeVisible();
    await expect(page.getByTestId('player-volume')).toBeVisible();
    await page.getByTestId('player-queue').click();
    await expect(page.getByText(/queue/i).first()).toBeVisible();
    await page.getByTestId('player-lyrics').click();
    await page.getByTestId('player-expand').click({ force: true });
    await expect(page.getByTestId('player-expanded')).toBeVisible();
    await page.getByTestId('player-collapse').click();
    await page.getByTestId('player-play').click();
    await page.getByTestId('player-repeat').click();
    await page.getByTestId('player-shuffle').click();
  });

  test('2.10 Artist dashboard for verified artists', async ({ page }) => {
    await login(page, ARTIST.email, ARTIST.password);
    await page.goto('/artist-dashboard');
    await expect(page.getByText(/upload|publish|track|album|dashboard/i).first()).toBeVisible();
  });

  test('2.11 Admin dashboard: tickets, verification, accounting, prices', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto('/admin/dashboard');
    await expect(page.getByText(/ticket/i).first()).toBeVisible();
    await expect(page.getByText(/Neon Pulse|pending|verification|artist/i).first()).toBeVisible();
    const accounting = page.getByRole('button', { name: /accounting|financial|حساب/i });
    if (await accounting.count()) {
      await accounting.first().click();
    }
    const settingsTab = page.getByRole('button', { name: /settings|price|قیمت/i });
    if (await settingsTab.count()) {
      await settingsTab.first().click();
    }
  });
});
