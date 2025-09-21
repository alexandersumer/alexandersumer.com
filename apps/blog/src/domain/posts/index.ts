import {
  getCollection,
  getEntryBySlug,
  type CollectionEntry,
} from "astro:content";
import { absoluteUrl } from "../../config/site";

export type BlogEntry = CollectionEntry<"blog">;

const BLOG_BASE_PATH = "/blog";
const OG_IMAGE_SUFFIX = "social-image.png";
const WORDS_PER_MINUTE = 225;

const byPublishedDateDesc = (a: BlogEntry, b: BlogEntry) =>
  b.data.pubDate.getTime() - a.data.pubDate.getTime();

const countWords = (content: string) =>
  content
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .split(/\s+/)
    .filter(Boolean).length;

const readableDate = (date: Date | undefined) =>
  date
    ? date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : undefined;

export interface PostComputed {
  permalink: string;
  canonicalUrl: string;
  ogImage: {
    path: string;
    url: string;
  };
  readingTime: {
    minutes: number;
    words: number;
    text: string;
  };
  publishedDisplay: string;
  updatedDisplay?: string;
}

export type Post = BlogEntry & { computed: PostComputed };

const withComputed = (entry: BlogEntry): Post => {
  const permalink = `${BLOG_BASE_PATH}/${entry.slug}/`;
  const canonicalUrl = absoluteUrl(permalink);
  const ogImagePath = `${permalink}${OG_IMAGE_SUFFIX}`;
  const words = countWords(entry.body ?? "");
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));

  return {
    ...entry,
    computed: {
      permalink,
      canonicalUrl,
      ogImage: {
        path: ogImagePath,
        url: absoluteUrl(ogImagePath),
      },
      readingTime: {
        minutes,
        words,
        text: `${minutes} min read`,
      },
      publishedDisplay: readableDate(entry.data.pubDate)!,
      updatedDisplay: readableDate(entry.data.updatedDate),
    },
  };
};

export const getPublishedPosts = async (): Promise<Post[]> => {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.sort(byPublishedDateDesc).map(withComputed);
};

export const getPostBySlug = async (slug: string): Promise<Post> => {
  const entry = await getEntryBySlug("blog", slug);
  if (!entry) {
    throw new Error(`Post not found for slug: ${slug}`);
  }
  if (entry.data.draft) {
    throw new Error(`Post is marked as draft and cannot be rendered: ${slug}`);
  }
  return withComputed(entry);
};

export interface AdjacentPosts {
  previous?: Post;
  next?: Post;
}

export const getAdjacentPosts = async (
  slug: string,
  posts?: Post[],
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
  canonicalUrl: string;
  ogImageUrl: string;
  readingTimeMinutes: number;
}

export const toFeedItems = (posts: Post[]): FeedItem[] =>
  posts.map((post) => ({
    link: post.computed.permalink,
    title: post.data.title,
    pubDate: post.data.pubDate,
    description: post.data.description,
    canonicalUrl: post.computed.canonicalUrl,
    ogImageUrl: post.computed.ogImage.url,
    readingTimeMinutes: post.computed.readingTime.minutes,
  }));
