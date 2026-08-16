import { expect, test, type Page } from '@playwright/test';
import path from 'path';

const ADMIN = { email: 'admin@music.app', password: 'Password123!' };
const ARTIST = { email: 'artist@music.app', password: 'Password123!' };
const AUDIO = path.join(__dirname, '../public/audio/preview.wav');

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

async function loginAsArtist(page: Page) {
  await login(page, ARTIST.email, ARTIST.password);
  await expect(page).toHaveURL(/\/home/, { timeout: 15000 });
  await page.goto('/artist-dashboard');
  await expect(page.getByTestId('artist-new-release')).toBeVisible({ timeout: 15000 });
}

test.describe('Admin login and artist uploads', () => {
  test('admin can sign in and reach the admin dashboard', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 15000 });
    await expect(page.getByText(/ticket|admin|verification|accounting/i).first()).toBeVisible();
    await expect(page.getByText(/access denied|please login/i)).toHaveCount(0);
  });

  test('artist can upload a track with lyrics', async ({ page }) => {
    const title = `E2E Track ${Date.now()}`;
    await loginAsArtist(page);
    await page.getByTestId('artist-new-release').click();
    await page.getByTestId('artist-track-title').fill(title);
    await page.getByTestId('track-lyrics-input').fill('Hello from the test lyrics');
    await page.locator('#audio-upload').setInputFiles(AUDIO);
    await page.getByTestId('artist-publish').click();
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/hello from the test lyrics/i).first()).toBeVisible();
  });

  test('artist can upload an album with a track', async ({ page }) => {
    const stamp = Date.now();
    const albumTitle = `E2E Album ${stamp}`;
    const trackTitle = `E2E Album Cut ${stamp}`;
    await loginAsArtist(page);
    await page.getByTestId('artist-new-release').click();
    await page.locator('select').first().selectOption('album');
    await page.getByTestId('artist-album-title').fill(albumTitle);
    await page.getByTestId('artist-track-title').fill(trackTitle);
    await page.locator('#audio-upload').setInputFiles(AUDIO);
    await page.getByTestId('artist-publish').click();
    await expect(page.getByText(trackTitle).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(albumTitle).first()).toBeVisible();
  });
});
