# alexandersumer.com

Modern, edge-first blog for [alexandersumer.com](https://alexandersumer.com), built with Astro, Tailwind CSS, and Cloudflare Pages. The repository follows a monorepo-friendly layout so you can expand beyond the blog later (dashboards, experiments, etc.) while keeping deployments fast and reliable.

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
```

Production builds emit to `apps/blog/dist`. The Pagefind CLI runs automatically after Astro’s build to generate `/pagefind` assets used by the search UI.

## Landing page

The homepage (`/`) is a minimal “coming soon” hero with links to the blog and your contact email, while the full post index lives at `/blog/`. Update the copy in `apps/blog/src/pages/index.astro` whenever you are ready to launch the broader site.

## Repository layout

```
.
├─ apps/
│  └─ blog/              # Astro site deployed to Cloudflare Pages
│     ├─ src/
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

## Search & comments

- **Search** uses [Pagefind](https://pagefind.app). The search UI component in `src/components/PagefindSearch.astro` looks for the generated `/pagefind` assets during production builds. No backend is required.
- **Comments** hook into [Giscus](https://giscus.app). Update the placeholders (`data-repo`, `data-*id`) in `src/pages/blog/[slug].astro` with your GitHub Discussions repository before enabling.

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
- Confirm OG images by visiting `/blog/<slug>/social-image.png` after major layout changes.
- Rebuild locally after editing the search UI to regenerate Pagefind assets (`pnpm build`).
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guardrails and pre-PR checks.

Happy writing!
