import { defineConfig, envField } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import site from "./site.config.json" assert { type: "json" };

export default defineConfig({
  site: site.site.baseUrl,
  output: "static",
  integrations: [mdx(), tailwind({ applyBaseStyles: false }), sitemap()],
  env: {
    schema: {
      PUBLIC_SITE_URL: envField.string({
        context: "client",
        access: "public",
        optional: true,
        url: true,
      }),
      PUBLIC_ENABLE_PAGEFIND: envField.boolean({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_PAGEFIND_MIN_ITEMS: envField.number({
        context: "client",
        access: "public",
        optional: true,
        min: 0,
      }),
      PUBLIC_PAGEFIND_PLACEHOLDER: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_ENABLE_GISCUS: envField.boolean({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_GISCUS_REPO: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_GISCUS_REPO_ID: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_GISCUS_CATEGORY: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_GISCUS_CATEGORY_ID: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_OG_BACKGROUND: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_OG_FOREGROUND: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_OG_ACCENT: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
    },
  },
});
