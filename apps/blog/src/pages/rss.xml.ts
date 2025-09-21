import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('blog')).filter((post) => !post.data.draft);

  return rss({
    title: 'alexandersumer.com',
    description: 'Writing by Alexander Sumer',
    site: context.site ?? 'https://alexandersumer.com',
    items: posts.map((post) => ({
      link: `/blog/${post.slug}/`,
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description
    }))
  });
}
