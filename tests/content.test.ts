/**
 * Validates that every blog post in src/content/blog/ has valid frontmatter
 * against the shared schema. Runs without requiring an Astro build.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { blogSchema } from '../src/content/schema';

const CONTENT_DIR = new URL('../src/content/blog', import.meta.url).pathname;

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

const posts = readdirSync(CONTENT_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((filename) => {
    const raw = readFileSync(join(CONTENT_DIR, filename), 'utf-8');
    return { filename, data: parseFrontmatter(raw, filename) };
  });

describe('blog content', () => {
  it('has at least one post', () => {
    expect(posts.length).toBeGreaterThan(0);
  });

  for (const { filename, data } of posts) {
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
      });
    });
  }
});
