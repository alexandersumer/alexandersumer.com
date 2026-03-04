/**
 * Build output tests. Require a pre-built dist/ — run after `npm run build`.
 * Skipped automatically if dist/ doesn't exist (e.g. fresh checkout).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load, type CheerioAPI } from 'cheerio';

const DIST = new URL('../dist', import.meta.url).pathname;
const hasDist = existsSync(DIST);

function readHtml(relPath: string): CheerioAPI {
  const abs = join(DIST, relPath);
  expect(existsSync(abs), `Expected dist file to exist: ${relPath}`).toBe(true);
  return load(readFileSync(abs, 'utf-8'));
}

describe.skipIf(!hasDist)('Build output', () => {
  describe('dist/index.html (homepage)', () => {
    let $: CheerioAPI;
    beforeAll(() => { $ = readHtml('index.html'); });

    it('has correct <title>', () => {
      expect($('title').text()).toBe('Alexander Sumer');
    });

    it('has lang="en" on <html>', () => {
      expect($('html').attr('lang')).toBe('en');
    });

    it('has theme-init script in <head>', () => {
      const headScripts = $('head script').map((_, el) => $(el).html()).get();
      expect(headScripts.some(s => s?.includes('localStorage.getItem') && s?.includes('data-theme'))).toBe(true);
    });

    it('has bio text', () => {
      expect($('.home-bio').text()).toContain("Hi, I'm Alexander");
    });

    it('resume link points to /resume/', () => {
      const resumeLink = $('.home-links a').filter((_, el) => $(el).text().trim() === 'Resume');
      expect(resumeLink.attr('href')).toBe('/resume/');
    });

    it('linkedin link is external with noopener', () => {
      const li = $('.home-links a[href*="linkedin"]');
      expect(li.attr('rel')).toContain('noopener');
      expect(li.attr('target')).toBe('_blank');
    });

    it('lists at least one blog post', () => {
      expect($('.blog-posts li').length).toBeGreaterThan(0);
    });

    it('blog post link goes to /blog/...', () => {
      const href = $('.blog-posts a').first().attr('href');
      expect(href).toMatch(/^\/blog\//);
    });

    it('has <time datetime> on each post', () => {
      $(' .blog-posts time').each((_, el) => {
        expect($(el).attr('datetime')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe('dist/blog/index.html (blog list)', () => {
    let $: CheerioAPI;
    beforeAll(() => { $ = readHtml('blog/index.html'); });

    it('has correct <title>', () => {
      expect($('title').text()).toBe('Blog — Alexander Sumer');
    });

    it('has a <h1>', () => {
      expect($('main h1').text().trim()).toBe('Blog');
    });

    it('lists at least one blog post', () => {
      expect($('.blog-posts li').length).toBeGreaterThan(0);
    });
  });

  describe('dist/blog/what-to-do-if-you-take-agi-seriously/index.html (blog post)', () => {
    let $: CheerioAPI;
    beforeAll(() => { $ = readHtml('blog/what-to-do-if-you-take-agi-seriously/index.html'); });

    it('has correct <title>', () => {
      expect($('title').text()).toContain('What to Do If You Take AGI Seriously');
    });

    it('has <meta name="description">', () => {
      const content = $('meta[name="description"]').attr('content');
      expect(content).toBeTruthy();
      expect(content!.length).toBeGreaterThan(20);
    });

    it('has .post-title h1', () => {
      expect($('h1.post-title').text()).toContain('What to Do If You Take AGI Seriously');
    });

    it('has .post-meta with <time>', () => {
      const time = $('.post-meta time');
      expect(time.length).toBe(1);
      expect(time.attr('datetime')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('has reading progress bar', () => {
      expect($('#reading-progress').length).toBe(1);
    });

    it('has TOC sidebar', () => {
      expect($('#toc-sidebar').length).toBe(1);
    });

    it('TOC has multiple entries', () => {
      expect($('#toc-sidebar a').length).toBeGreaterThan(5);
    });

    it('TOC entries link to heading anchors', () => {
      $('#toc-sidebar a').each((_, el) => {
        expect($(el).attr('href')).toMatch(/^#/);
      });
    });

    it('article has h2 headings', () => {
      expect($('article h2').length).toBeGreaterThan(3);
    });

    it('h2 headings have id attributes (for anchor links)', () => {
      $('article h2').each((_, el) => {
        expect($(el).attr('id')).toBeTruthy();
      });
    });

    it('theme-init script is in <head>', () => {
      const headScripts = $('head script').map((_, el) => $(el).html()).get();
      expect(headScripts.some(s => s?.includes('localStorage.getItem'))).toBe(true);
    });
  });

  describe('dist/CNAME', () => {
    it('exists and contains the custom domain', () => {
      const cname = readFileSync(join(DIST, 'CNAME'), 'utf-8').trim();
      expect(cname).toBe('alexandersumer.com');
    });
  });
});
