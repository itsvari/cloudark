# cloudark

Monorepo for Ashe's two Astro websites:

- [itsvari.com](https://itsvari.com) — personal portfolio, writing, CV, and activity.
- [v4ri.wav](https://v4ri.wav) — DJ gigs, set recordings, posts, and releases.

Both applications run on Cloudflare Workers and share Git-backed Astro Content Collections.

## Requirements

- Node.js 22.12 or newer
- pnpm 9.15

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

After a staging deployment, run the direct-navigation, header, feed, and 404 smoke checks with
`ITSVARI_SMOKE_BASE_URL` and `V4RI_SMOKE_BASE_URL` set.

See [`docs/architecture.md`](docs/architecture.md) for the content architecture and
[`docs/deployment.md`](docs/deployment.md) for Workers Builds configuration.
