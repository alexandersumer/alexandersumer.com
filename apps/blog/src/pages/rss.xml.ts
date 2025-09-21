import rss from "@astrojs/rss";
import { siteConfig } from "../config/site";
import { getPublishedPosts, toFeedItems } from "../domain/posts";

export async function GET(context) {
  const posts = await getPublishedPosts();

  return rss({
    title: siteConfig.site.name,
    description: siteConfig.site.tagline,
    site: context.site ?? siteConfig.site.baseUrl,
    items: toFeedItems(posts),
  });
}
