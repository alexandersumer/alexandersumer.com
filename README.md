# alexandersumer.com

This monorepo hosts the Astro application that powers alexandersumer.com. The site is a static export deployed to Cloudflare Pages with Pagefind search assets and optional Giscus comments.

## Prerequisites

- Node.js 20.10+
- [corepack](https://nodejs.org/api/corepack.html) enabled (ships with Node ≥16.13)
- `pnpm@10.17.0` (managed automatically by corepack)

## Quick start

```sh
corepack pnpm install
corepack pnpm dev # http://localhost:4321
```

## Key scripts

- `corepack pnpm dev` – Astro development server with live reload.
- `corepack pnpm build` – Production build followed by `pagefind` indexing (outputs to `apps/blog/dist`).
- `corepack pnpm test` – Runs Vitest unit tests and Playwright E2E suites.
- `corepack pnpm lint` – Wraps `astro check`; ensure `@astrojs/check` is present in `node_modules` before running.

## Project layout

```
apps/blog/
  astro.config.mjs      # Astro project configuration with env schema
  package.json
  src/
    config/             # Env-aware site + integration configuration (see app.ts)
    domain/posts/       # Content-domain helpers (collection access, metadata, feeds)
    components/         # UI primitives (ThemeToggle, PagefindSearch, layouts)
    layouts/, pages/, … # Astro routes and shared structure
  functions/            # Cloudflare Pages functions (OG image middleware)
  tests/                # Playwright E2E suites
  test/unit/            # Vitest unit tests
```

### Architecture highlights

- `src/config/app.ts` owns env validation (zod + Astro schema), exposing typed config consumed via `config/site.ts` and `config/integrations.ts`.
- `src/domain/posts` centralises content operations (collection access, sorting, adjacent lookups, reading time, canonical + OG data) so routes, feeds, and middleware share one model.
- Client interactions run through focused components: `ThemeToggle.astro` persists the current theme, and `PagefindSearch.astro` delegates to `PagefindSearchIsland.astro` to lazy-load search assets.

## Testing

```sh
corepack pnpm --filter alexander-blog run test:unit # Vitest suite
corepack pnpm --filter alexander-blog run test:e2e  # Playwright (spawns dev server)
```

E2E runs start the Astro dev server on `127.0.0.1:4321` and execute the Chromium project defined in `playwright.config.ts`.

## Git hooks

Repo-managed hooks live in `.git-hooks/`. Point Git at them with:

```sh
git config core.hooksPath .git-hooks
```

The `pre-commit` hook runs Prettier checks, Astro lint (when `@astrojs/check` is available locally), and both unit and E2E test suites. Set `SKIP_PRECOMMIT=1` to skip the hook for a given commit.

## Build & deploy

Deploy to Cloudflare Pages using:

```
corepack pnpm install --frozen-lockfile && corepack pnpm build
```

Configure Pages to serve the `apps/blog/dist` output directory. The runtime will automatically use `apps/blog/functions` for the OG image middleware.

## Additional notes

- `pagefind@1.4.0` runs after every production build; assets land in `dist/pagefind`.
- `pnpm.onlyBuiltDependencies` permits native installs for `esbuild` and `sharp` during the build pipeline.
- Giscus comments remain optional—enable via the `PUBLIC_GISCUS_*` environment variables.
