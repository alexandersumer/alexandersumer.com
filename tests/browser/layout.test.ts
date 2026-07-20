import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/blog/',
  '/blog/what-to-do-if-you-take-agi-seriously/',
  '/resume/',
  '/slides/',
  '/slides/ai-coding-agents/',
];

const overflowViewports = [
  { width: 320, height: 700 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
  { width: 1600, height: 1000 },
];

test.describe('built site browser conformance', () => {
  for (const viewport of overflowViewports) {
    test(`does not horizontally overflow at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);

      for (const route of routes) {
        await page.goto(route);

        await expect
          .poll(
            () =>
              page.evaluate(
                () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
              ),
            { message: `${route} should fit within the viewport` }
          )
          .toBe(true);
      }
    });
  }

  test('home links and profile photo fit on narrow mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/');

    await expect(page.locator('.home-photo')).toBeVisible();
    await expect
      .poll(() =>
        page.locator('.home-photo').evaluate((image) => {
          const img = image as HTMLImageElement;
          return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
        })
      )
      .toBe(true);

    const linksFit = await page.locator('.home-links a').evaluateAll((links) =>
      links.every((link) => {
        const rect = link.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= document.documentElement.clientWidth;
      })
    );

    expect(linksFit).toBe(true);
  });

  test('resume keeps its content and metadata readable on narrow mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/resume/');

    await expect(page.locator('.h-name')).toHaveText('Alexander Sumer');
    await expect(page.getByText('Merged 1,903 PRs in FY26', { exact: false })).toBeVisible();
    await expect(page.getByText('Skills & Interests')).toBeVisible();

    const metadataFits = await page.locator('.e-row').evaluateAll((rows) =>
      rows.every((row) => {
        const rect = row.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= document.documentElement.clientWidth;
      })
    );

    expect(metadataFits).toBe(true);
  });

  test('resume keeps its Letter dimensions and prints on one page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/resume/');
    const loadedLatoFaces = await page.evaluate(async () => {
      await document.fonts.ready;
      return (await document.fonts.load('9.5pt Lato')).length;
    });
    expect(loadedLatoFaces).toBeGreaterThan(0);

    const sheet = await page.locator('.resume-page').boundingBox();
    expect(sheet).not.toBeNull();
    expect(sheet?.width).toBeCloseTo(816, 0);

    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
    });
    const pdfSource = pdf.toString('latin1');

    expect(pdfSource.match(/\/Type\s*\/Page\b/g)).toHaveLength(1);
    expect(pdfSource).toMatch(/\/MediaBox\s*\[\s*0\s+0\s+612\s+792\s*\]/);
  });

  test('article layout keeps the reading column readable', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/blog/what-to-do-if-you-take-agi-seriously/');

    const articleWidth = await page.locator('article').evaluate((article) => {
      return Math.round(article.getBoundingClientRect().width);
    });

    expect(articleWidth).toBeLessThanOrEqual(700);
  });

  test('table of contents switches at the desktop breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/blog/what-to-do-if-you-take-agi-seriously/');
    await expect(page.locator('#toc-sidebar')).toBeHidden();

    await page.setViewportSize({ width: 1600, height: 1000 });
    await expect(page.locator('#toc-sidebar')).toBeVisible();
  });

  test('theme toggle updates the document theme through the real header button', async ({
    page,
  }) => {
    await page.goto('/');

    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(before === 'light' || before === 'dark').toBe(true);

    await page.locator('#theme-toggle').click();

    const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(after === 'light' || after === 'dark').toBe(true);
    expect(after).not.toBe(before);
  });
});
