import { describe, expect, it, vi } from "vitest";

type BlogEntry = {
  slug: string;
  data: {
    title: string;
    description: string;
    pubDate: Date;
    draft?: boolean;
  };
  body: string;
};

const modulePath = "../../src/domain/posts";

const entries: BlogEntry[] = [
  {
    slug: "cloudflare",
    data: {
      title: "Cloudflare",
      description: "Intro to Cloudflare",
      pubDate: new Date("2025-09-21"),
    },
    body: "Edge content at the speed of light.".repeat(50),
  },
  {
    slug: "astro-rocks",
    data: {
      title: "Astro Rocks",
      description: "Building with Astro",
      pubDate: new Date("2024-01-01"),
    },
    body: "Astro keeps content fast.".repeat(40),
  },
  {
    slug: "draft-post",
    data: {
      title: "Draft",
      description: "Not published",
      pubDate: new Date("2023-01-01"),
      draft: true,
    },
    body: "Draft draft draft.".repeat(10),
  },
];

vi.mock("astro:content", () => {
  const getCollection = async (
    _collection: string,
    filter?: (entry: any) => boolean,
  ) => {
    const filtered = filter
      ? entries.filter((entry) => filter({ data: entry.data }))
      : entries;
    return filtered.map((entry) => ({
      ...entry,
      body: entry.body,
      collection: "blog",
    }));
  };
  const getEntryBySlug = async (_collection: string, slug: string) => {
    const match = entries.find((entry) => entry.slug === slug);
    if (!match) {
      return null;
    }
    return {
      ...match,
      body: match.body,
      collection: "blog",
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

describe("posts lib", () => {
  it("retrieves published posts sorted by date", async () => {
    const { getPublishedPosts } = await import(modulePath);
    const posts = await getPublishedPosts();
    expect(posts).toHaveLength(2);
    expect(posts[0].slug).toBe("cloudflare");
    expect(posts[1].slug).toBe("astro-rocks");
    expect(posts[0].computed.permalink).toBe("/blog/cloudflare/");
  });

  it("throws when requesting a draft slug", async () => {
    const { getPostBySlug } = await import(modulePath);
    await expect(getPostBySlug("draft-post")).rejects.toThrow(
      "Post is marked as draft",
    );
  });

  it("returns adjacent posts relative to slug", async () => {
    const { getAdjacentPosts, getPublishedPosts } = await import(modulePath);
    const published = await getPublishedPosts();
    const { previous, next } = await getAdjacentPosts("astro-rocks", published);
    expect(previous?.slug).toBe("cloudflare");
    expect(next).toBeUndefined();
  });

  it("maps posts to feed items", async () => {
    const { getPublishedPosts, toFeedItems } = await import(modulePath);
    const posts = await getPublishedPosts();
    const feedItems = toFeedItems(posts);
    expect(feedItems[0]).toEqual(
      expect.objectContaining({
        link: "/blog/cloudflare/",
        title: "Cloudflare",
        canonicalUrl: expect.stringContaining("https://"),
        readingTimeMinutes: expect.any(Number),
      }),
    );
  });

  it("computes reading time metadata for each post", async () => {
    const { getPublishedPosts } = await import(modulePath);
    const posts = await getPublishedPosts();
    expect(posts[0].computed.readingTime.minutes).toBeGreaterThanOrEqual(1);
    expect(posts[0].computed.readingTime.words).toBeGreaterThan(0);
    expect(posts[0].computed.readingTime.text).toMatch(/min read$/);
  });
});
