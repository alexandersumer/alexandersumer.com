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
- `corepack pnpm --filter alexander-blog lint` – Runs `astro check` (install `@astrojs/check` locally when prompted).

## Source layout (apps/blog)

```
src/
  features/
    site/        # Layout shell, theming, config helpers, OG middleware support
    blog/        # Blog data access, computed metadata, Pagefind UI
  content/      # Astro content collections (blog posts + transforms)
  pages/        # Astro routes
  styles/       # Global CSS
functions/      # Cloudflare Pages Functions (OG image generation)
test/           # Vitest setup + unit suites
tests/          # Playwright end-to-end specs
```

## Configuration notes

- Environment overrides are read from `import.meta.env` or `process.env`. Set `PUBLIC_SITE_URL`, `PUBLIC_ENABLE_PAGEFIND`, and the `PUBLIC_GISCUS_*` keys to mirror production behaviour.
- Blog frontmatter enriches each entry with computed display dates during `astro sync`, so collection consumers (`features/blog/api/posts.ts`) receive ready-to-render metadata.

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
