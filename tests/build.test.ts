/**
 * Build output tests. `npm test` runs `npm run build` first, so missing dist/
 * is a real regression instead of a skipped suite.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load, type CheerioAPI } from 'cheerio';
import { parse } from 'yaml';
import { blogSchema } from '../src/content/schema';
import { isoDate } from '../src/utils/format';

const DIST = new URL('../dist', import.meta.url).pathname;
const CONTENT_DIR = new URL('../src/content/blog', import.meta.url).pathname;

interface SourcePost {
  slug: string;
  title: string;
  date: Date;
  updated?: Date;
  description: string;
}

function parseFrontmatter(raw: string, filename: string): Record<string, unknown> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?=\r?\n|$)/.exec(raw);

  if (!match) {
    throw new Error(`${filename} must start with a YAML frontmatter block`);
  }

  const data = parse(match[1]);

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`${filename} frontmatter must be a YAML object`);
  }

  return data as Record<string, unknown>;
}

function readSourcePosts(): SourcePost[] {
  return readdirSync(CONTENT_DIR)
    .filter((filename) => filename.endsWith('.md'))
    .map((filename) => {
      const data = blogSchema.parse(
        parseFrontmatter(readFileSync(join(CONTENT_DIR, filename), 'utf-8'), filename)
      );

      return {
        slug: filename.replace(/\.md$/, ''),
        title: data.title,
        date: data.date,
        updated: data.updated,
        description: data.description,
        draft: data.draft,
      };
    })
    .filter((post) => !post.draft)
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

const sourcePosts = readSourcePosts();

function readHtml(relPath: string): CheerioAPI {
  const abs = join(DIST, relPath);
  expect(existsSync(abs), `Expected dist file to exist: ${relPath}`).toBe(true);
  return load(readFileSync(abs, 'utf-8'));
}

function jsonLdObjects($: CheerioAPI): Record<string, unknown>[] {
  const objects: Record<string, unknown>[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html();
    if (!raw) return;
    objects.push(JSON.parse(raw) as Record<string, unknown>);
  });

  return objects;
}

function postPath(slug: string): string {
  return `blog/${slug}/index.html`;
}

describe('Build output', () => {
  beforeAll(() => {
    expect(existsSync(DIST), 'Expected dist/ to exist. Run npm run build before vitest.').toBe(
      true
    );
  });

  describe('dist/index.html (homepage)', () => {
    let $: CheerioAPI;
    beforeAll(() => {
      $ = readHtml('index.html');
    });

    it('has correct <title>', () => {
      expect($('title').text()).toBe('Alexander Sumer');
    });

    it('has lang="en" on <html>', () => {
      expect($('html').attr('lang')).toBe('en');
    });

    it('has theme-init script in <head>', () => {
      const headScripts = $('head script')
        .map((_, el) => $(el).html())
        .get();
      expect(
        headScripts.some((s) => s?.includes('localStorage.getItem') && s?.includes('data-theme'))
      ).toBe(true);
    });

    it('has bio text', () => {
      expect($('.home-bio').text()).toContain("Hi, I'm Alexander");
    });

    it('loads the profile image eagerly at a stable size', () => {
      const image = $('img.home-photo');
      expect(image.length).toBe(1);
      expect(image.attr('loading')).toBe('eager');
      expect(image.attr('width')).toBe('264');
      expect(image.attr('height')).toBe('264');
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

    it('lists published blog posts in reverse chronological order', () => {
      const hrefs = $('.blog-posts a')
        .map((_, el) => $(el).attr('href'))
        .get();

      expect(hrefs).toEqual(sourcePosts.map((post) => `/blog/${post.slug}`));
    });

    it('has <time datetime> on each post', () => {
      $(' .blog-posts time').each((_, el) => {
        expect($(el).attr('datetime')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe('dist/resume/index.html', () => {
    let $: CheerioAPI;

    beforeAll(() => {
      $ = readHtml('resume/index.html');
    });

    it('has the correct metadata and canonical URL', () => {
      expect($('title').text()).toBe('Alexander Sumer - Resume');
      expect($('meta[name="description"]').attr('content')).toContain(
        'reliable agent runtimes and secure execution'
      );
      expect($('link[rel="canonical"]').attr('href')).toBe('https://alexandersumer.com/resume/');
      expect($('meta[property="og:url"]').attr('content')).toBe(
        'https://alexandersumer.com/resume/'
      );
    });

    it('contains the current experience, education, skills, and interests', () => {
      const text = $('body').text().replace(/\s+/g, ' ');

      expect($('.h-name').text().trim()).toBe('Alexander Sumer');
      expect($('.s .e').first().find('.e-role')).toHaveLength(3);
      expect($('.s .e').first().find('.e-summary')).toHaveLength(1);
      expect(text).toContain('Senior Machine Learning Systems Engineer, AI Platform');
      expect(text).toContain('Senior Engineer, Jira Platform');
      expect(text).toContain('Earlier Jira Platform roles: Engineer, Graduate & Intern');
      expect(text).toContain('Merged 1,903 PRs in FY26');
      expect(text).toContain('Received 5 Big Kudos');
      expect(text).toContain('Agent Platform:');
      expect(text).toContain('University of New South Wales');
      expect($('.sk-l').first().text().trim()).toBe('Technical focus');
      expect(text).toContain('Agent platforms and runtimes');
      expect(text).toContain('multi-agent orchestration, MCP/ACP');
      expect(text).toContain('Painting and the arts, fitness, volleyball');
    });

    it('omits superseded résumé claims', () => {
      const text = $('body').text().replace(/\s+/g, ' ');

      expect(text).not.toContain('operating at Principal level');
      expect(text).not.toMatch(/20\s*GB persistent/i);
      expect(text).not.toContain('Alta');
      expect(text).not.toContain('Promoted to Senior within two years');
      expect(text).not.toContain('Technical lead for 9 engineers');
      expect(text).not.toContain('Coding-Agent Development:');
      expect(text).not.toContain('Talks & Recognition:');
    });

    it('has the expected profile links', () => {
      expect($('a[href="https://github.com/alexandersumer"]').length).toBe(1);
      expect($('a[href="https://www.linkedin.com/in/alexandersumer"]').length).toBe(1);
    });

    it('is included in the sitemap', () => {
      const sitemap = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf-8');
      expect(sitemap).toContain('<loc>https://alexandersumer.com/resume/</loc>');
    });
  });

  describe('dist/blog/index.html (blog list)', () => {
    let $: CheerioAPI;
    beforeAll(() => {
      $ = readHtml('blog/index.html');
    });

    it('has correct <title>', () => {
      expect($('title').text()).toBe('Blog — Alexander Sumer');
    });

    it('has a <h1>', () => {
      expect($('main h1').text().trim()).toBe('Blog');
    });

    it('lists at least one blog post', () => {
      expect($('.blog-posts li').length).toBeGreaterThan(0);
    });

    it('matches the source content order and count', () => {
      const hrefs = $('.blog-posts a')
        .map((_, el) => $(el).attr('href'))
        .get();

      expect(hrefs).toEqual(sourcePosts.map((post) => `/blog/${post.slug}`));
    });
  });

  describe('dist/blog/what-to-do-if-you-take-agi-seriously/index.html (blog post)', () => {
    const post = sourcePosts.find((entry) => entry.slug === 'what-to-do-if-you-take-agi-seriously');
    let $: CheerioAPI;
    beforeAll(() => {
      $ = readHtml('blog/what-to-do-if-you-take-agi-seriously/index.html');
    });

    it('has a matching source fixture', () => {
      expect(post).toBeDefined();
    });

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

    it('has .post-meta with published and updated dates', () => {
      expect(post).toBeDefined();
      const time = $('.post-meta time');
      expect(time.length).toBe(2);
      expect(time.eq(0).attr('datetime')).toBe(isoDate(post!.date));
      expect(time.eq(1).attr('datetime')).toBe(isoDate(post!.updated!));
      expect($('.post-meta').text()).toContain('Updated');
    });

    it('has article metadata for publication and modification dates', () => {
      expect(post).toBeDefined();
      expect($('meta[property="article:published_time"]').attr('content')).toBe(
        post!.date.toISOString()
      );
      expect($('meta[property="article:modified_time"]').attr('content')).toBe(
        post!.updated!.toISOString()
      );
    });

    it('has BlogPosting JSON-LD with modified date', () => {
      expect(post).toBeDefined();
      const blogPosting = jsonLdObjects($).find((entry) => entry['@type'] === 'BlogPosting');

      expect(blogPosting).toBeDefined();
      expect(blogPosting?.datePublished).toBe(isoDate(post!.date));
      expect(blogPosting?.dateModified).toBe(isoDate(post!.updated!));
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
        const href = $(el).attr('href');
        expect(href).toMatch(/^#/);
        expect($(`article [id="${href!.slice(1)}"]`).length).toBe(1);
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
      const headScripts = $('head script')
        .map((_, el) => $(el).html())
        .get();
      expect(headScripts.some((s) => s?.includes('localStorage.getItem'))).toBe(true);
    });

    it('links to the older adjacent post and not to a nonexistent newer post', () => {
      expect($('.post-navigation a[rel="prev"]').length).toBe(0);
      expect($('.post-navigation a[rel="next"]').attr('href')).toBe(
        '/blog/how-to-use-ai-coding-agents-effectively'
      );
      expect($('.post-navigation a[rel="next"] .post-navigation__title').text()).toContain(
        'How to Use AI Coding Agents Effectively'
      );
    });
  });

  describe('built blog post pages', () => {
    it('generates every published source post', () => {
      for (const post of sourcePosts) {
        expect(existsSync(join(DIST, postPath(post.slug))), post.slug).toBe(true);
      }
    });

    it('renders previous and next links for middle posts', () => {
      const $post = readHtml(postPath('how-to-use-ai-coding-agents-effectively'));

      expect($post('.post-navigation a[rel="prev"]').attr('href')).toBe(
        '/blog/what-to-do-if-you-take-agi-seriously'
      );
      expect($post('.post-navigation a[rel="next"]').attr('href')).toBe(
        '/blog/the-verification-bottleneck'
      );
    });
  });

  describe('dist/CNAME', () => {
    it('exists and contains the custom domain', () => {
      const cname = readFileSync(join(DIST, 'CNAME'), 'utf-8').trim();
      expect(cname).toBe('alexandersumer.com');
    });
  });
});
