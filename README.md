# alexandersumer.com

Visit the site: [alexandersumer.com](https://alexandersumer.com)

This repo holds the Astro project that powers the blog and landing page. It ships static HTML, CSS, and Pagefind search assets to Cloudflare Pages while using pnpm for dependency management.

## Getting started

```sh
corepack pnpm install
corepack pnpm dev      # http://localhost:4321
```

Useful commands:

- `corepack pnpm lint` – Astro type check.
- `corepack pnpm test` – Vitest unit tests followed by Playwright e2e.
- `corepack pnpm build` – production build plus the Pagefind index.

## Deploying

Cloudflare Pages build command:

```
corepack pnpm install --frozen-lockfile && corepack pnpm build
```

Set the output directory to `apps/blog/dist`. The Pages runtime auto-detects `apps/blog/functions` for the OG image middleware.

## Structure

```
apps/blog/
  src/          # layouts, pages, components, and MDX content
  site.config.json
  playwright.config.ts
```

`site.config.json` keeps the site name, base URL, and brand colors in one place. Feature flags for search and comments live in `src/config/integrations.ts` and read from `PUBLIC_*` environment variables.

## Notes

- The build approves native installs for `esbuild` and `sharp` through `package.json → pnpm.onlyBuiltDependencies`.
- Pagefind runs after every production build via `pnpm dlx pagefind`; search assets land in `dist/pagefind`.
- Comments are optional via Giscus—enable them by setting the `PUBLIC_GISCUS_*` variables.
