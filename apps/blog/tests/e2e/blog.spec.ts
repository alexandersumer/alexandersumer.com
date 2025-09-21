import { expect, test } from '@playwright/test';

test.describe('blog pages', () => {
  test('renders index with posts and search gating', async ({ page }) => {
    await page.goto('/blog/');
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();
    await expect(page.locator('li').first()).toContainText('Hello, Cloudflare');
    await expect(page.locator('#pagefind-search')).toHaveCount(0);
  });

  test('renders post content and disables comments when not configured', async ({ page }) => {
    await page.goto('/blog/hello-cloudflare/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Hello, Cloudflare');
    await expect(page.locator('.giscus')).toHaveCount(0);
    await expect(page.getByText('Comments are disabled for this environment.')).toBeVisible();
  });
});
