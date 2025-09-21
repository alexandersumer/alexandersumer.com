import { getCollection, getEntryBySlug, type CollectionEntry } from 'astro:content';

export type BlogEntry = CollectionEntry<'blog'>;

const byPublishedDateDesc = (a: BlogEntry, b: BlogEntry) =>
  b.data.pubDate.getTime() - a.data.pubDate.getTime();

export const getPublishedPosts = async (): Promise<BlogEntry[]> => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort(byPublishedDateDesc);
};

export const getPostBySlug = async (slug: string): Promise<BlogEntry> => {
  const entry = await getEntryBySlug('blog', slug);
  if (!entry) {
    throw new Error(`Post not found for slug: ${slug}`);
  }
  if (entry.data.draft) {
    throw new Error(`Post is marked as draft and cannot be rendered: ${slug}`);
  }
  return entry;
};

export interface AdjacentPosts {
  previous?: BlogEntry;
  next?: BlogEntry;
}

export const getAdjacentPosts = async (
  slug: string,
  posts?: BlogEntry[]
): Promise<AdjacentPosts> => {
  const collection = posts ?? (await getPublishedPosts());
  const index = collection.findIndex((post) => post.slug === slug);
  if (index === -1) {
    throw new Error(`Unable to locate post in collection for slug: ${slug}`);
  }
  return {
    previous: index > 0 ? collection[index - 1] : undefined,
    next: index < collection.length - 1 ? collection[index + 1] : undefined,
  };
};

export interface FeedItem {
  link: string;
  title: string;
  pubDate: Date;
  description: string;
}

export const toFeedItems = (posts: BlogEntry[]): FeedItem[] =>
  posts.map((post) => ({
    link: `/blog/${post.slug}/`,
    title: post.data.title,
    pubDate: post.data.pubDate,
    description: post.data.description,
  }));
