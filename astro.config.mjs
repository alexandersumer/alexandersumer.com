// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://alexandersumer.com',
  output: 'static',
  integrations: [sitemap()],
  redirects: {
    '/what-to-do-if-you-take-agi-seriously': '/blog/what-to-do-if-you-take-agi-seriously/',
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
