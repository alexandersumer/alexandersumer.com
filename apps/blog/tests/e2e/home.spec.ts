import { expect, test } from '@playwright/test';

test.describe('homepage', () => {
  test('shows the hero content and navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Alexander Sumer');
    await expect(page.getByRole('link', { name: 'Read the blog' })).toHaveAttribute('href', '/blog/');
    await expect(page.getByRole('link', { name: 'Say hello' })).toHaveAttribute('href', 'mailto:hello@alexandersumer.com');
  });
});
