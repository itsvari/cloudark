# Cloudflare deployment

Production deployment is deliberately manual until staging passes the smoke checks and the
content acceptance gate. Leave automatic production deploys disabled in Workers Builds; CI
verifies both builds and Wrangler configurations but does not deploy.

Both applications use asset-first delivery with Worker fallback. The `_headers` file in each app
applies the security policy to static responses; middleware applies the same policy to Worker
responses. The production configs keep the bare custom-domain patterns and set `workers_dev` to
`false`.

## Workers Builds projects

Configure two Workers Builds projects from this repository. The app root is the directory that
contains that app's Wrangler file, as recommended for monorepos:

| Site | Worker | Root directory | Production branch |
| --- | --- | --- | --- |
| itsvari.com | `itsvari-com-website` | `/apps/itsvari` | `main` |
| v4ri.wav | `v4ri-music` | `/apps/v4ri` | `main` |

For both projects:

- Build command: `pnpm build`
- Deploy command: `pnpm deploy`
- Non-production command: `pnpm upload`
- Enable build caching.
- Include the app directory, `packages/*`, `package.json`, `pnpm-lock.yaml`,
  `pnpm-workspace.yaml`, and `tsconfig.json` in the build watch paths.

The `itsvari-com-website` name is intentionally preserved from the existing Worker. Keeping the
name preserves its custom-domain attachment and gives the release a straightforward version
rollback. Do not deploy the replacement configuration to `itsvari-web` unless a separate,
approved custom-domain transfer is being performed.

## Staging and smoke acceptance

Create non-production Workers with separate names and no production custom domains. Run both
Workers Builds projects from a non-production branch or version-upload workflow, then execute:

```sh
ITSVARI_SMOKE_BASE_URL=https://itsvari-staging.example.com \
V4RI_SMOKE_BASE_URL=https://v4ri-staging.example.com \
pnpm smoke:deployed
```

The smoke harness checks direct HTML navigation, the static security headers, Worker-rendered
security headers, HTML 404 status/body, and the short cache policy on RSS and sitemap responses.
It must pass on both staging Workers before production promotion.

## Production cutover and rollback

1. Confirm content parity and approve the published About/CV pages plus every activity entry that
   should go live. Draft sample entries must not be promoted accidentally.
2. Confirm both custom domains are active Cloudflare zones and record the current Worker versions.
3. Promote the v4ri version, run the smoke harness against `https://v4ri.wav`, then promote the
   itsvari version and run it against `https://itsvari.com`.
4. Keep the previous versions and the existing `itsvari-com-website` Worker available until both
   domains pass post-deploy verification.
5. If verification fails, roll back the affected Worker to its recorded previous version in the
   Cloudflare dashboard or with the corresponding Wrangler version rollback command. Do not alter
   DNS while rolling back; the custom domains remain attached to the preserved Worker names.

Cloudflare Web Analytics can be enabled independently for both hostnames after deployment.
