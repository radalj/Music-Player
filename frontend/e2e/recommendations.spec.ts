import { test, expect, Page } from '@playwright/test';

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(/\/(home|pending-approval|admin)/, { timeout: 15000 });
}

test.describe('5.2 Song recommender', () => {
  test('home shows taste-based recommendations, not the viral pop hit', async ({ page }) => {
    await login(page, 'gold@music.app', 'Password123!');
    const section = page.getByTestId('recommended-tracks');
    await expect(section).toBeVisible();
    await expect(section.getByRole('heading', { name: /recommended for you|پیشنهادی/i })).toBeVisible();

    const firstCard = page.getByTestId('recommended-track-card').first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard).toContainText(/Harbor Lights|Ocean Waves|Midnight Dreams/);
    await expect(firstCard).not.toContainText('Neon Heart');
  });
});
