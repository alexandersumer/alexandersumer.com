# alexandersumer.com

Static site for alexandersumer.com. The Astro app lives in `apps/blog`, deploys to Cloudflare Pages, and ships with Pagefind search plus optional Giscus comments.

## Prerequisites

- Node.js 20+
- [corepack](https://nodejs.org/api/corepack.html) enabled
- `pnpm@10.17.0` (corepack installs it automatically)

## Quick start

```sh
corepack pnpm install
corepack pnpm --filter alexander-blog dev  # http://localhost:4321
```

## Useful scripts

- `corepack pnpm --filter alexander-blog dev` – Astro dev server with HMR.
- `corepack pnpm --filter alexander-blog build` – Static build + Pagefind index in `apps/blog/dist`.
- `corepack pnpm --filter alexander-blog test:unit` – Vitest unit suite.
- `corepack pnpm --filter alexander-blog test:e2e` – Playwright smoke tests.
- `corepack pnpm --filter alexander-blog lint` – Runs `astro check`.

## Source layout (apps/blog)

```
src/
  features/
    site/        # Layout shell, env-aware config helpers, OG middleware support
    blog/        # Blog data access, computed metadata, Pagefind/Giscus UI glue
  content/      # Astro content collections (blog posts + transforms)
  pages/        # Astro routes
  styles/       # Global CSS
functions/      # Cloudflare Pages Functions (OG image generation)
test/           # Vitest setup + unit suites + Astro env stubs
tests/          # Playwright end-to-end specs
```

## Configuration notes

- Public environment overrides come from `astro:env` (see `src/features/site/config`). Set `PUBLIC_SITE_URL`, `PUBLIC_ENABLE_PAGEFIND`, and the `PUBLIC_GISCUS_*` keys to mirror production behaviour. Vitest maps this module to `test/stubs/astro-env-client.ts` so unit tests can stub values with `process.env`.
- Blog frontmatter enriches each entry with display dates during `astro sync`; the runtime layer (`features/blog/api/posts.ts`) attaches canonical URLs, reading time, and OG image metadata directly from collection entries.
- Pagefind search and Giscus comments hydrate only when the relevant containers intersect the viewport, keeping the static HTML payload unchanged.

## Testing

```sh
corepack pnpm --filter alexander-blog test:unit
corepack pnpm --filter alexander-blog test:e2e
```

Playwright starts Astro on `127.0.0.1:4321` and runs the Chromium project defined in `playwright.config.ts`.

## Deploying

Cloudflare Pages command:

```
corepack pnpm install --frozen-lockfile
corepack pnpm --filter alexander-blog build
```

Publish the `apps/blog/dist` directory and include `apps/blog/functions` for the OG image middleware. Pagefind assets are generated at `dist/pagefind` as part of the build.
