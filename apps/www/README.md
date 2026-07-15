# www

The tuiparts.sh website: landing page, docs, and shadcn-compatible registry
host, built with [Blume](https://useblume.dev).

## Structure

- `pages/index.astro` — custom landing page (site root)
- `docs/` — Markdown/MDX documentation, mounted at `/docs`
- `public/r/` — generated registry payloads, served at `/r/<item>.json`
  (built from the repository's `registry.json`; not committed)
- `blume.config.ts` — site, theme, and deployment configuration
- `theme.css` — dark-mode design-token overrides

## Commands

```bash
pnpm dev            # dev server with hot reload
pnpm build          # sync registry into public/r, then static build to dist/
pnpm preview        # serve the production build locally
pnpm run deploy     # build and deploy to Cloudflare with wrangler
```

From the repo root: `pnpm docs:dev` and `pnpm docs:build`.

## Deploying to Cloudflare

The site is a fully static build. Two options:

1. **Wrangler (Workers static assets)** — `pnpm run deploy` in this directory
   uses `wrangler.jsonc` (assets served from `dist/`).
2. **Git integration (Workers Builds / Pages)** — set the root directory to
   `apps/www`, build command `pnpm build`, output directory `dist`, Node 22.12
   or newer.

After the production domain exists, update `deployment.site` in
`blume.config.ts` and the registry URLs in `docs/quickstart.mdx` and
`docs/registry.mdx` (currently `https://tuiparts.sh`).
