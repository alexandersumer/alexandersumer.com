# Contributing

Thanks for your interest in improving alexandersumer.com! This project is kept intentionally lightweight, but the following guidelines help maintain fast previews and consistent builds.

## Prerequisites

- Node.js 20.10 or newer (Cloudflare Pages currently targets Node 20).
- pnpm 10 (managed automatically via Corepack).

Install dependencies with:

```sh
corepack pnpm install
```

## Development workflow

1. Start the dev server:
   ```sh
   corepack pnpm dev
   ```
2. Create or update content in `apps/blog/src/content/blog`.
3. Run checks before opening a pull request:
   ```sh
   corepack pnpm lint
   corepack pnpm build
   ```

## Pull requests

- CI must pass (`lint` and `build`).
- Link Cloudflare preview URLs when available.
- For new features, update the README if setup steps change.

Thank you!
