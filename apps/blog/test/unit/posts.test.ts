import { describe, expect, it, vi } from 'vitest';

type BlogEntry = {
  slug: string;
  data: {
    title: string;
    description: string;
    pubDate: Date;
    draft?: boolean;
  };
};

const entries: BlogEntry[] = [
  {
    slug: 'cloudflare',
    data: {
      title: 'Cloudflare',
      description: 'Intro to Cloudflare',
      pubDate: new Date('2025-09-21'),
    },
  },
  {
    slug: 'astro-rocks',
    data: {
      title: 'Astro Rocks',
      description: 'Building with Astro',
      pubDate: new Date('2024-01-01'),
    },
  },
  {
    slug: 'draft-post',
    data: {
      title: 'Draft',
      description: 'Not published',
      pubDate: new Date('2023-01-01'),
      draft: true,
    },
  },
];

vi.mock('astro:content', () => {
  const getCollection = async (_collection: string, filter?: (entry: any) => boolean) => {
    const filtered = filter ? entries.filter((entry) => filter({ data: entry.data })) : entries;
    return filtered.map((entry) => ({
      ...entry,
      body: '',
      collection: 'blog',
    }));
  };
  const getEntryBySlug = async (_collection: string, slug: string) => {
    const match = entries.find((entry) => entry.slug === slug);
    if (!match) {
      return null;
    }
    return {
      ...match,
      body: '',
      collection: 'blog',
      render: async () => ({
        Content: () => null,
        headings: [],
        remarkPluginFrontmatter: {},
        data: match.data,
      }),
    };
  };
  return { getCollection, getEntryBySlug };
});

describe('posts lib', () => {
  it('retrieves published posts sorted by date', async () => {
    const { getPublishedPosts } = await import('../../src/lib/posts');
    const posts = await getPublishedPosts();
    expect(posts).toHaveLength(2);
    expect(posts[0].slug).toBe('cloudflare');
    expect(posts[1].slug).toBe('astro-rocks');
  });

  it('throws when requesting a draft slug', async () => {
    const { getPostBySlug } = await import('../../src/lib/posts');
    await expect(getPostBySlug('draft-post')).rejects.toThrow('Post is marked as draft');
  });

  it('returns adjacent posts relative to slug', async () => {
    const { getAdjacentPosts, getPublishedPosts } = await import('../../src/lib/posts');
    const published = await getPublishedPosts();
    const { previous, next } = await getAdjacentPosts('astro-rocks', published);
    expect(previous?.slug).toBe('cloudflare');
    expect(next).toBeUndefined();
  });

  it('maps posts to feed items', async () => {
    const { getPublishedPosts, toFeedItems } = await import('../../src/lib/posts');
    const posts = await getPublishedPosts();
    const feedItems = toFeedItems(posts);
    expect(feedItems[0]).toEqual(
      expect.objectContaining({
        link: '/blog/cloudflare/',
        title: 'Cloudflare',
      })
    );
  });
});
