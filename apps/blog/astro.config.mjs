import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import site from './site.config.json' assert { type: 'json' };

export default defineConfig({
  site: site.site.baseUrl,
  output: 'static',
  integrations: [
    mdx(),
    tailwind({ applyBaseStyles: false }),
    sitemap()
  ]
});
