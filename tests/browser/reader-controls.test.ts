import { expect, test } from '@playwright/test';

const deck = '/slides/ai-coding-agents/';
const article = '/blog/what-to-do-if-you-take-agi-seriously/';

test('slide keyboard focus stays on visible content', async ({ page }) => {
  await page.goto(deck);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  const theme = page.locator('#theme-toggle');
  await expect(theme).toBeFocused();
  const before = await page.locator('html').getAttribute('data-theme');
  await page.keyboard.press('Space');
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    before === 'dark' ? 'light' : 'dark'
  );
  await expect(page).toHaveURL(deck);
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', before!);
  await expect(page).toHaveURL(deck);
});

test('slide buttons preserve navigation boundaries and links', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(deck);
  const previous = page.getByRole('button', { name: 'Previous slide' });
  const next = page.getByRole('button', { name: 'Next slide' });
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page).toHaveURL(`${deck}#2`);
  await previous.press('Space');
  await expect(page).toHaveURL(deck);
  await next.press('Enter');
  await expect(page).toHaveURL(`${deck}#2`);
  await previous.click();
  await expect(page).toHaveURL(deck);
  await page.locator('#deck').click({ position: { x: 10, y: 150 } });
  await expect(page).toHaveURL(`${deck}#2`);
  await page.locator('#deck').click({ position: { x: 10, y: 150 } });
  await expect(page).toHaveURL(`${deck}#3`);
  await page.keyboard.press('ArrowLeft');
  await expect(page).toHaveURL(`${deck}#2`);
  await page.keyboard.press('End');
  await expect(page).toHaveURL(`${deck}#28`);
  await expect(next).toBeDisabled();
  await expect(previous).toBeEnabled();
  await page.reload();
  await expect(page.locator('.slide.active .end-link')).toBeVisible();
  await page.locator('.slide.active .end-link').click();
  await expect(page).toHaveURL(/\/blog\/how-to-use-ai-coding-agents-effectively\/?$/);
  await expect(
    page.getByRole('heading', { name: 'How to Use AI Coding Agents Effectively', exact: true })
  ).toBeVisible();
});

test('slide content stays reachable above controls in a short landscape window', async ({
  page,
}) => {
  await page.setViewportSize({ width: 667, height: 375 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(deck);
  const total = await page.locator('.slide').count();
  for (let index = 0; index < total; index++) {
    const slide = page.locator('.slide.active');
    const viewportBottom = await slide.evaluate((el) => el.getBoundingClientRect().bottom);
    const controlsTop = await page
      .locator('.slide-controls')
      .evaluate((el) => el.getBoundingClientRect().top);
    expect(viewportBottom, `slide ${index + 1} scrolls above the controls`).toBeLessThanOrEqual(
      controlsTop
    );
    const top = await slide
      .locator('.slide__inner')
      .evaluate((el) => el.getBoundingClientRect().top);
    expect(top, `slide ${index + 1} starts within reach`).toBeGreaterThanOrEqual(0);
    const frame = await slide.boundingBox();
    expect(frame).not.toBeNull();
    await page.mouse.move(frame!.x + frame!.width / 2, frame!.y + frame!.height / 2);
    await page.mouse.wheel(0, 10_000);
    await expect
      .poll(
        () =>
          slide.locator('.slide__inner').evaluate((el) => {
            const bottom = el.getBoundingClientRect().bottom;
            const controlsTop = document
              .querySelector('.slide-controls')!
              .getBoundingClientRect().top;
            return bottom - controlsTop;
          }),
        { message: `slide ${index + 1} can scroll clear of the controls with a wheel` }
      )
      .toBeLessThanOrEqual(0);
    await page.keyboard.press('ArrowRight');
  }
});

test('slide navigation preserves horizontal swipe gestures', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(deck);
  const client = await context.newCDPSession(page);
  async function swipe(from: number, to: number) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: from, y: 300 }],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: to, y: 300 }],
    });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await swipe(300, 80);
  await expect(page).toHaveURL(`${deck}#2`);
  await swipe(80, 300);
  await expect(page).toHaveURL(deck);
  await context.close();
});

test('inactive slides cannot receive focus before JavaScript initializes', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(deck);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeFocused();
  await context.close();
});

for (const width of [390, 1280]) {
  test(`article contents are usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(article);
    const toc = page.getByRole('navigation', { name: 'Table of contents' });
    const disclosure = toc.locator('details');
    await expect(toc.getByText('On this page', { exact: true })).toBeVisible();
    await expect(disclosure).not.toHaveAttribute('open');
    await toc.locator('summary').click();
    const link = toc.locator('a').nth(2);
    const hash = await link.getAttribute('href');
    await link.click();
    await expect(page).toHaveURL(`${article}${hash}`);
    await expect
      .poll(() => page.locator(hash!).evaluate((el) => el.getBoundingClientRect().top))
      .toBeGreaterThanOrEqual(0);
    await expect
      .poll(() => page.locator(hash!).evaluate((el) => el.getBoundingClientRect().top))
      .toBeLessThan(150);
    expect(await page.locator('html').evaluate((el) => getComputedStyle(el).scrollBehavior)).toBe(
      'auto'
    );
    await page.goBack();
    await expect(page).toHaveURL(article);
  });
}

test('contents disclosure and anchors work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto(article);
  const toc = page.getByRole('navigation', { name: 'Table of contents' });
  await toc.locator('summary').click();
  const link = toc.locator('a').nth(1);
  const hash = await link.getAttribute('href');
  await link.click();
  await expect(page).toHaveURL(`${article}${hash}`);
  expect(
    await page.locator(hash!).evaluate((el) => el.getBoundingClientRect().top)
  ).toBeGreaterThanOrEqual(0);
  await context.close();
});

test('article section links support opening in a new tab', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(article);
  const toc = page.getByRole('navigation', { name: 'Table of contents' });
  await toc.locator('summary').click();
  const link = toc.locator('a').nth(2);
  const hash = await link.getAttribute('href');
  const [linkedPage] = await Promise.all([
    context.waitForEvent('page', { timeout: 5000 }),
    link.click({ modifiers: [process.platform === 'darwin' ? 'Meta' : 'Control'] }),
  ]);
  await linkedPage.waitForLoadState();
  await expect(linkedPage).toHaveURL(`${article}${hash}`);
  await expect(linkedPage.locator(hash!)).toBeVisible();
  await expect
    .poll(() => linkedPage.locator(hash!).evaluate((el) => el.getBoundingClientRect().top))
    .toBeGreaterThanOrEqual(0);
  await expect
    .poll(() => linkedPage.locator(hash!).evaluate((el) => el.getBoundingClientRect().top))
    .toBeLessThan(150);
  await expect(page).toHaveURL(article);
  await linkedPage.close();
});

test('desktop contents stay expanded across breakpoint changes', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(article);
  const toc = page.getByRole('navigation', { name: 'Table of contents' });
  await expect(toc.locator('a').first()).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(toc.locator('details')).not.toHaveAttribute('open');
  await page.setViewportSize({ width: 1600, height: 1000 });
  await expect(toc.locator('a').first()).toBeVisible();
  await expect(page.locator('#toc-sidebar')).toHaveCount(1);
});

for (const route of ['/', deck]) {
  for (const failure of ['read', 'write', 'access'] as const) {
    test(`theme tolerates ${failure} storage failure on ${route}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.addInitScript((failure) => {
        if (failure === 'access') {
          Object.defineProperty(window, 'localStorage', {
            get() {
              throw new DOMException('Storage unavailable', 'SecurityError');
            },
          });
        } else {
          Object.defineProperty(Storage.prototype, failure === 'read' ? 'getItem' : 'setItem', {
            value() {
              throw new DOMException('Storage unavailable', 'SecurityError');
            },
          });
        }
      }, failure);
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto(route);
      const root = page.locator('html');
      const button = page.locator('#theme-toggle');
      await expect(root).toHaveAttribute('data-theme', 'dark');
      await page.emulateMedia({ colorScheme: 'light' });
      await expect(root).toHaveAttribute('data-theme', 'light');
      await expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      await button.click();
      await expect(root).toHaveAttribute('data-theme', 'dark');
      await expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.emulateMedia({ colorScheme: 'light' });
      await expect(root).toHaveAttribute('data-theme', 'dark');
      await button.click();
      await expect(root).toHaveAttribute('data-theme', 'light');
      await expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      expect(errors).toEqual([]);
    });
  }

  for (const selected of ['light', 'dark'] as const) {
    test(`saved ${selected} theme persists and ignores system changes on ${route}`, async ({
      page,
    }) => {
      const system = selected === 'light' ? 'dark' : 'light';
      await page.emulateMedia({ colorScheme: system });
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-theme', system);
      await page.locator('#theme-toggle').click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', selected);
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme', selected);
      await page.emulateMedia({ colorScheme: selected });
      await page.emulateMedia({ colorScheme: system });
      await expect(page.locator('html')).toHaveAttribute('data-theme', selected);
      await expect(page.locator('#theme-toggle')).toHaveAttribute(
        'aria-label',
        selected === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    });
  }

  test(`invalid saved theme follows the system on ${route}`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'invalid'));
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
}
