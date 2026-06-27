/**
 * Validates that every blog post in src/content/blog/ has valid frontmatter
 * against the shared schema. Runs without requiring an Astro build.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { blogSchema } from '../src/content/schema';

const CONTENT_DIR = new URL('../src/content/blog', import.meta.url).pathname;
const PUBLIC_DIR = new URL('../public', import.meta.url).pathname;

function splitPost(raw: string, filename: string): { data: Record<string, unknown>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?=\r?\n|$)/.exec(raw);

  if (!match) {
    throw new Error(`${filename} must start with a YAML frontmatter block`);
  }

  const data = parse(match[1]);

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`${filename} frontmatter must be a YAML object`);
  }

  return {
    data: data as Record<string, unknown>,
    body: raw.slice(match[0].length),
  };
}

const posts = readdirSync(CONTENT_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((filename) => {
    const raw = readFileSync(join(CONTENT_DIR, filename), 'utf-8');
    return { filename, ...splitPost(raw, filename) };
  });

const publishedRoutes = new Set([
  '/',
  '/blog',
  '/slides',
  '/slides/ai-coding-agents',
  ...posts
    .filter(({ data }) => !blogSchema.parse(data).draft)
    .map(({ filename }) => `/blog/${filename.replace(/\.md$/, '')}`),
]);

function normalizePath(value: string): string {
  const withoutHash = value.split('#')[0];
  const withoutQuery = withoutHash.split('?')[0];
  return withoutQuery.length > 1 ? withoutQuery.replace(/\/$/, '') : withoutQuery;
}

function isExternalReference(value: string): boolean {
  return /^(https?:|mailto:|tel:)/.test(value);
}

function stripCodeFences(body: string): string {
  return body.replace(/```[\s\S]*?```/g, '');
}

function referencesIn(body: string): string[] {
  const bodyWithoutCode = stripCodeFences(body);
  const references: string[] = [];

  for (const match of bodyWithoutCode.matchAll(/!?\[[^\]]*]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/g)) {
    references.push(match[1]);
  }

  for (const match of bodyWithoutCode.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
    references.push(match[1]);
  }

  return references;
}

describe('blog content', () => {
  it('has at least one post', () => {
    expect(posts.length).toBeGreaterThan(0);
  });

  it('has unique filenames and titles', () => {
    const slugs = posts.map(({ filename }) => filename.replace(/\.md$/, ''));
    const titles = posts.map(({ data }) => blogSchema.parse(data).title);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(titles).size).toBe(titles.length);
  });

  for (const { filename, data, body } of posts) {
    describe(filename, () => {
      it('has valid frontmatter', () => {
        expect(() => blogSchema.parse(data)).not.toThrow();
      });

      it('is not accidentally left as draft', () => {
        const parsed = blogSchema.parse(data);
        // Warn if draft — posts shouldn't be committed as draft unless intentional.
        // This is a soft check: drafts are allowed but flagged.
        if (parsed.draft) {
          console.warn(`[content] ${filename} is marked draft: true`);
        }
      });

      it('has a URL-safe filename', () => {
        const slug = filename.replace(/\.md$/, '');
        expect(slug).toMatch(/^[a-z0-9-]+$/);
      });

      it('has a non-future date', () => {
        const parsed = blogSchema.parse(data);
        expect(parsed.date.getTime()).toBeLessThanOrEqual(Date.now());
        expect(parsed.updated?.getTime() ?? parsed.date.getTime()).toBeLessThanOrEqual(Date.now());
      });

      it('has body content without a duplicate h1', () => {
        expect(body.trim().length).toBeGreaterThan(0);
        expect(body).not.toMatch(/^#\s+/m);
      });

      it('has no empty markdown headings', () => {
        expect(body).not.toMatch(/^#{2,6}\s*$/m);
      });

      it('has markdown and HTML references that resolve locally or externally', () => {
        for (const reference of referencesIn(body)) {
          if (isExternalReference(reference)) continue;

          if (reference.startsWith('#')) {
            expect(
              reference.length,
              `${filename} has an empty same-page hash link`
            ).toBeGreaterThan(1);
            continue;
          }

          const normalized = normalizePath(reference);
          expect(normalized, `${filename} has an empty reference`).not.toBe('');
          expect(normalized, `${filename} has a path traversal reference`).not.toContain('..');

          if (normalized.startsWith('/')) {
            const publicAsset = join(PUBLIC_DIR, decodeURIComponent(normalized.slice(1)));
            const isKnownRoute = publishedRoutes.has(normalized);
            const isKnownAsset = existsSync(publicAsset);

            expect(
              isKnownRoute || isKnownAsset,
              `${filename} references missing local path ${reference}`
            ).toBe(true);
            continue;
          }

          expect(
            existsSync(join(CONTENT_DIR, decodeURIComponent(normalized))),
            `${filename} references missing relative file ${reference}`
          ).toBe(true);
        }
      });
    });
  }
});
