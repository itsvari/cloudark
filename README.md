# cloudark

Monorepo for Ashe's two Astro websites:

- [itsvari.com](https://itsvari.com), personal portfolio, writing, CV, and activity.
- [v4ri.xyz](https://v4ri.xyz), DJ gigs, set recordings, posts, and releases.

Both applications run on Cloudflare Workers and share Git-backed Astro Content Collections.

## Requirements

- Node.js matching `^22.23.4 || ^24.16.0 || >=26.3.0`
- pnpm 12.16.1

## Development

```sh
pnpm install
pnpm dev:itsvari
pnpm dev:v4ri
```

The two development commands run independently. Astro uses Vite for development and production builds.

## Verification

```sh
pnpm lint
pnpm check
pnpm test
pnpm coverage
pnpm build
```

Workers Builds runs the full validation pipeline with:

```sh
pnpm run build:cloudflare
```

This installs development dependencies from the frozen lockfile with strict peers, runs full
and production dependency audits, lints, checks types, runs tests, builds both applications,
and dry-runs both Worker deployments. Each app exposes the same command from its own directory.

GitHub hosts the repository. Cloudflare Workers Builds provides CI, with two production Workers
for `main` and two separate staging Workers for all other branches. Successful `main` builds
automatically deploy production. Successful non-`main` builds deploy staging for smoke checks
before merge. All four remote build connections are configured, and the GitHub Actions
workflow has been removed. Both staging Workers require the owner's Cloudflare account login,
including static files and version URLs.

Builds pin Node.js 26.13.0 and pnpm 12.16.1. Workers Builds skips automatic dependency installation
so the repository controls the installation flags. The reference settings in
[`docs/workers-builds-settings.json`](docs/workers-builds-settings.json) require dashboard or API
configuration; Cloudflare does not apply that file automatically.

With an authenticated `cf` CLI, `pnpm run check:cloudflare-builds` reads back all four remote
connections and checks their repository, branch filters, commands, and build variables.
`pnpm run check:staging-access` verifies owner-only Access policies and anonymous denial.
Photos, posters and the two licensed TX-02 webfonts are served from R2 at `media.itsvari.com`.
`pnpm run check:media` verifies their checksums, headers and font CORS without local binaries.

After a staging deployment, run `pnpm smoke:deployed` with `ITSVARI_SMOKE_BASE_URL` and
`V4RI_SMOKE_BASE_URL` set. The harness checks direct navigation, headers, feeds, and HTML 404s.

See [`docs/architecture.md`](docs/architecture.md) for the content architecture and
[`docs/deployment.md`](docs/deployment.md) for Workers Builds configuration.

## Sites

The Signal + Ledger sites use verified profile and project content, ten real performances,
press-kit photographs and four supplied set recordings. Blog indexes are empty until posts are published.
Use `http://localhost:4321` for itsvari and start V4RI on another port:

```sh
pnpm dev:v4ri --port 4322
node scripts/verify-mockup.mjs http://localhost:4321 http://localhost:4322
```

The route check follows internal links, loads media, validates feeds and checks the HTML 404 pages.
It also checks the responsive press photographs and SKF2026's minimal disclosure.
The development-only component gallery is at `/__design` on itsvari. The CV page supports printing and saving as PDF.

The home page and CV page also link to the generated two-page PDF in `apps/itsvari/public/cv`.
After editing the shared CV Markdown or print CSS, regenerate it from the running personal site:

```sh
node scripts/generate-cv.mjs http://localhost:4321
node scripts/verify-cv.mjs
```

The generator uses installed Chromium, or the executable specified by `CHROMIUM_PATH`.
The verifier requires Poppler's `pdfinfo`, `pdftotext` and `pdffonts`. It checks tagging,
embedded Unicode fonts, source text, contact details, section order and two-page pagination.
The PDF and print styles use white paper and greyscale text; the website stays dark.

See [media assets](docs/design/media-assets.md) for photo sources, YouTube recordings,
Cloudflare image URLs and the optional `TX02_FONT_BASE_URL` setting.
