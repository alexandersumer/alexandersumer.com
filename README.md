# [alexandersumer.com](https://alexandersumer.com)

Personal site and blog. Astro, GitHub Pages, CloudFlare DNS.

## Structure

```
src/
  components/        # Header, Footer, PostList, ReadingProgress, TableOfContents
  content/blog/      # Markdown posts (Zod-validated frontmatter)
  layouts/           # BaseLayout, PostLayout
  pages/             # Home, blog, résumé, slides, and 404 routes
  styles/global.css  # Design tokens, dark/light themes
```

The résumé at `/resume/` is a native Astro page owned and deployed by this repository.

## Dev

```sh
npm install
npm run dev      # localhost:4321
npm run check    # Astro type/content validation
npm test         # vitest
npm run build    # dist/
```

## Deploy

Push to `main` triggers GitHub Actions build and deploy.
