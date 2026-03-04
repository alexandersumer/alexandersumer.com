import { describe, it, expect } from 'vitest';
import { blogSchema } from '../src/content/schema';

describe('blogSchema', () => {
  const valid = {
    title: 'Test Post',
    date: '2026-02-13',
    description: 'A test description.',
    draft: false,
  };

  it('accepts valid frontmatter', () => {
    const result = blogSchema.parse(valid);
    expect(result.title).toBe('Test Post');
    expect(result.date).toBeInstanceOf(Date);
    expect(result.description).toBe('A test description.');
    expect(result.draft).toBe(false);
  });

  it('coerces date string to Date', () => {
    const result = blogSchema.parse(valid);
    expect(result.date.getFullYear()).toBe(2026);
    expect(result.date.getMonth()).toBe(1); // 0-indexed
    expect(result.date.getDate()).toBe(13);
  });

  it('defaults draft to false', () => {
    const { draft: _, ...withoutDraft } = valid;
    const result = blogSchema.parse(withoutDraft);
    expect(result.draft).toBe(false);
  });

  it('accepts draft: true', () => {
    const result = blogSchema.parse({ ...valid, draft: true });
    expect(result.draft).toBe(true);
  });

  it('rejects empty title', () => {
    expect(() => blogSchema.parse({ ...valid, title: '' })).toThrow();
  });

  it('rejects empty description', () => {
    expect(() => blogSchema.parse({ ...valid, description: '' })).toThrow();
  });

  it('rejects missing title', () => {
    const { title: _, ...without } = valid;
    expect(() => blogSchema.parse(without)).toThrow();
  });

  it('rejects missing date', () => {
    const { date: _, ...without } = valid;
    expect(() => blogSchema.parse(without)).toThrow();
  });

  it('rejects missing description', () => {
    const { description: _, ...without } = valid;
    expect(() => blogSchema.parse(without)).toThrow();
  });

  it('rejects invalid date string', () => {
    expect(() => blogSchema.parse({ ...valid, date: 'not-a-date' })).toThrow();
  });
});
