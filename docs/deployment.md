# Cloudflare deployment

Each Astro app deploys as a separate Cloudflare Worker from the same repository using Workers Builds. GitHub Actions are not required.

## itsvari.com

- Worker name: `itsvari-web`
- Production branch: `main`
- Root directory: `/apps/itsvari`
- Build command: `pnpm build`
- Deploy command: `pnpm deploy`
- Non-production deploy command: `pnpm upload`
- Include paths: `apps/itsvari/*`, `packages/*`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`

## v4ri.wav

- Worker name: `v4ri-music`
- Production branch: `main`
- Root directory: `/apps/v4ri`
- Build command: `pnpm build`
- Deploy command: `pnpm deploy`
- Non-production deploy command: `pnpm upload`
- Include paths: `apps/v4ri/*`, `packages/*`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`

Enable build caching for both projects. The custom domains are declared in each application's `wrangler.jsonc`; confirm that both domains are active Cloudflare zones before the first production deployment.

Cloudflare Web Analytics can be enabled independently for both hostnames after deployment.
