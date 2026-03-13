import { test, expect } from '@playwright/test';

test.describe('Generate Page', () => {
  test('redirects unauthenticated users', async ({ page }) => {
    await page.goto('/generate');
    await expect(page).toHaveURL(/sign-in|accounts\.clerk/i, { timeout: 8000 });
  });

  test('generate page has correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Timep/i);
  });
});