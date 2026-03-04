import type { CollectionEntry } from 'astro:content';

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
};

/** "Feb 13, 2026" */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', DATE_FORMAT);
}

/** "2026-02-13" — used for <time datetime="..."> */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function sortPosts(posts: CollectionEntry<'blog'>[]): CollectionEntry<'blog'>[] {
  return posts.slice().sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
