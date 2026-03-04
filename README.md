# alexandersumer.com

Personal site and blog built with [Astro](https://astro.build/), deployed to GitHub Pages.

## Structure

```
src/
  components/        # Header, Footer, ThemeToggle, ReadingProgress, TableOfContents
  content/blog/      # Markdown blog posts (content collection with Zod schema)
  layouts/           # BaseLayout, PostLayout (composes BaseLayout via slots)
  pages/             # index, blog/index, blog/[...slug]
  styles/global.css  # Design system (CSS custom properties, dark/light tokens)
public/
  CNAME              # Custom domain config
  favicon.svg
```

The resume at `/resume/` is fetched from [alexandersumer/resume](https://github.com/alexandersumer/resume) during CI build.

## Development

```sh
npm install
npm run dev       # localhost:4321
npm run build     # output to dist/
npm run preview   # preview production build
```

## Deployment

Pushes to `main` trigger a GitHub Actions workflow that builds and deploys to GitHub Pages. DNS is managed via CloudFlare.
