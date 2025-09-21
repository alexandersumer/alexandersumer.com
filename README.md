# alexandersumer.com

Modern, edge-first blog for [alexandersumer.com](https://alexandersumer.com), built with Astro, Tailwind CSS, and Cloudflare Pages. The repository follows a monorepo-friendly layout so you can expand beyond the blog later (dashboards, experiments, etc.) while keeping deployments fast and reliable.

## Tech stack (as of September 2025)

- Astro 5.13.x with the first-party MDX/RSS/Sitemap integrations
- Tailwind CSS 3.4 (via `@astrojs/tailwind@6`) plus Typography plugin 0.5.x
- React 19.1 for any interactive islands you add later
- TypeScript 5.9 with strict Astro defaults
- Vitest 3.2 + `@vitest/coverage-v8` for unit coverage, Playwright 1.55 for browser e2e
- Pagefind 1.4 for static search indexing

## Requirements

- **Node.js** ≥ 20.10 (matches Cloudflare’s default runtime)
- **pnpm** ≥ 10 (managed automatically via Corepack)

Optional tooling: the project ships with an `.editorconfig` for consistent formatting and a GitHub Actions workflow for CI.

## Quick start

```sh
# 1. Install dependencies
corepack pnpm install

# 2. Start the dev server (http://localhost:4321)
corepack pnpm dev

# 3. Type-check routes/content without building
corepack pnpm lint

# 4. Create a production build + Pagefind search index
corepack pnpm build

# 5. Run the full automated test suite (unit + e2e)
corepack pnpm test
```

Production builds emit to `apps/blog/dist`. The Pagefind CLI runs automatically after Astro’s build to generate `/pagefind` assets used by the search UI.

## Testing

- `corepack pnpm test` – runs unit tests (Vitest with coverage thresholds) followed by Playwright end-to-end checks.
- `corepack pnpm -C apps/blog test:unit [--coverage]` – standalone unit tests covering shared config and content services (coverage reporting available via the optional flag).
- `corepack pnpm -C apps/blog test:e2e` – headless Chromium smoke tests exercising the homepage and blog routes.
- `corepack pnpm -C apps/blog test:e2e:ui` – launches the Playwright UI runner for local debugging.

First-time contributors should install the Playwright browser binaries once:

```sh
corepack pnpm -C apps/blog exec playwright install --with-deps
```

## Continuous integration

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR and is optimized around `pnpm`, mirroring the local workflow:

- **Lint & typecheck** on Node.js 20 and 22 using `pnpm lint` (`astro check`).
- **Unit tests with coverage** on both Node versions via `pnpm -C apps/blog test:unit:coverage`, publishing the HTML/LCOV bundle as an artifact.
- **Playwright E2E** smoke tests on Node 22 after installing browsers with `pnpm exec playwright install --with-deps`, uploading the Playwright HTML report for debugging.
- **Build** job gated on all checks that produces `apps/blog/dist` (uploaded for PRs) to verify the static export + Pagefind index.

The workflow relies on `pnpm/action-setup` and `actions/setup-node` caching the pnpm store, so lockfile changes are the single source of truth. Telemetry is disabled and the Playwright browser cache lives under `${{ runner.temp }}` for rapid re-runs.

## Landing page

The homepage (`/`) is a minimal “coming soon” hero with links to the blog and your contact email, while the full post index lives at `/blog/`. Update the copy in `apps/blog/src/pages/index.astro` whenever you are ready to launch the broader site.

## Repository layout

```
.
├─ apps/
│  └─ blog/              # Astro site deployed to Cloudflare Pages
│     ├─ src/
│     │  ├─ config/      # Site metadata + integration feature flags
│     │  ├─ lib/         # Content helpers (queries, feeds, etc.)
│     │  ├─ content/     # MDX posts managed by Astro content collections
│     │  ├─ layouts/     # Shared shells with SEO/meta helpers
│     │  ├─ components/  # Pagefind search widget, etc.
│     │  └─ pages/       # Astro routes (index, posts, RSS, robots)
│     ├─ public/         # Static assets (favicons, images)
│     └─ functions/      # Cloudflare Pages Functions (dynamic OG images)
├─ .github/workflows/ci.yml  # Lint + build on pushes/PRs
├─ CONTRIBUTING.md
├─ package.json              # Workspace scripts (dev, build, lint)
├─ pnpm-workspace.yaml       # Workspace definition
└─ pnpm-lock.yaml            # Locked dependency tree
```

## Authoring content

Posts live under `apps/blog/src/content/blog/*.mdx` and are validated by the schema in `src/content/config.ts`. Frontmatter fields:

```yaml
---
title: "Your post title"
description: "Short summary (<= 200 chars)"
pubDate: 2025-09-21
updatedDate: 2025-09-22 # optional
hero: ./hero.jpg         # optional, processed via Astro image service
tags: [astro, cloudflare]
draft: false
---
```

- Draft posts (`draft: true`) stay out of production builds and feeds.
- Use MDX when you want interactive components; plain Markdown works out of the box.
- Assets referenced from frontmatter (e.g., `hero`) should live next to the MDX file.

## Configuration

- `apps/blog/site.config.json` centralizes site metadata, branding colors, and contact details. Front-end code imports typed helpers from `src/config/site.ts`, while build tooling and edge functions consume the same JSON for consistency.
- Feature toggles and keys for integrations live in `src/config/integrations.ts`. Set them through environment variables (e.g., `PUBLIC_ENABLE_PAGEFIND`, `PUBLIC_GISCUS_*`) to enable Pagefind, Giscus, or override OG image colors per environment.
- Content utilities in `src/lib/posts.ts` expose shared helpers (`getPublishedPosts`, `getAdjacentPosts`, `toFeedItems`) so pages, feeds, and tests agree on filtering/sorting rules.

## Search & comments

- **Search** uses [Pagefind](https://pagefind.app). Enable it in production by default (or opt in locally) via `PUBLIC_ENABLE_PAGEFIND=true`. The search UI component reads translations and asset paths from the integrations config and expects the generated `/pagefind` assets present after `pnpm build`.
- **Comments** hook into [Giscus](https://giscus.app). Provide `PUBLIC_ENABLE_GISCUS=true` alongside the GitHub identifiers (`PUBLIC_GISCUS_REPO`, `PUBLIC_GISCUS_REPO_ID`, `PUBLIC_GISCUS_CATEGORY`, `PUBLIC_GISCUS_CATEGORY_ID`) to activate the widget; otherwise the page shows a friendly “Comments are disabled” notice.

## Dynamic Open Graph images

`apps/blog/functions/blog/_middleware.tsx` wires Cloudflare’s `@cloudflare/pages-plugin-vercel-og` so every `/blog/*` route automatically responds with a generated social preview at `/blog/<slug>/social-image.png`. Customize the React component to tweak typography or branding.

## Deployment (Cloudflare Pages)

1. Create a Pages project connected to this repository and choose `apps/blog` as the project root.
2. Configure the build settings (in *Build settings → Production*):
   - **Build command:** `corepack pnpm install --frozen-lockfile && corepack pnpm -C apps/blog build`
   - **Output directory:** `apps/blog/dist`
3. Pages detects `apps/blog/functions` automatically and deploys the middleware with the static assets.
4. Choose `main` (or your chosen production branch) as the deployment branch.
5. Map **alexandersumer.com** (and optionally `www.alexandersumer.com`) to the Pages project under *Custom Domains*.
6. Enable [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/) or [Cloudflare Fonts](https://developers.cloudflare.com/speed/optimization/content/fonts/) in the dashboard as needed—no code changes required.

### Deployment from CI

The included GitHub Actions workflow (`ci.yml`) runs on every push or PR to `main`:

1. Install dependencies with the pinned pnpm version.
2. Execute `pnpm lint` (`astro check`) to catch content/schema issues.
3. Build the site and upload the `dist` folder as an artifact for pull requests.

To enable automatic deployments from CI, add a second workflow using [cloudflare/wrangler-action](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/) and provide `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` secrets.

## Maintenance checklist

- Run `corepack pnpm update --interactive` periodically to keep Astro/Tailwind/Pagefind current.
- Build scripts for native tooling (like `esbuild` and `sharp`) are pre-approved through `package.json` → `pnpm.onlyBuiltDependencies`; add new entries there if future dependencies need compilation during install.
- Confirm OG images by visiting `/blog/<slug>/social-image.png` after major layout changes.
- Rebuild locally after editing the search UI to regenerate Pagefind assets (`pnpm build`).
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guardrails and pre-PR checks.

Happy writing!
