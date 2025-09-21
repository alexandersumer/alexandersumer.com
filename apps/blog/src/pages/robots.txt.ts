import { siteConfig } from '../config/site';

export function GET() {
  const sitemapUrl = `${siteConfig.site.baseUrl}/sitemap-index.xml`;
  return new Response(
    `User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
}
