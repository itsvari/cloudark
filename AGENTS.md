# Cloudark agent instructions

## Verify every push locally

Every push triggers two Cloudflare Workers builds, including pushes that only change documentation. Before you push or retry a failed build, run the full local pipeline on the exact changes you intend to ship. Fix any failures and rerun the pipeline before pushing.

Use the Node.js version in `.node-version` and the pnpm version in `package.json`. Run the matching command from the repository root. Both commands build and dry-run both Workers. Take the public font URL from `docs/workers-builds-settings.json` if it changes.

For a push to `main`, use the default Wrangler environment.

```sh
env -u CLOUDFLARE_ENV CI=true TX02_FONT_BASE_URL=https://media.itsvari.com/fonts/tx-02/v1/ \
  pnpm --dir apps/itsvari run build:cloudflare
```

For a push to any other branch, use the staging Wrangler environment.

```sh
CI=true CLOUDFLARE_ENV=staging TX02_FONT_BASE_URL=https://media.itsvari.com/fonts/tx-02/v1/ \
  pnpm --dir apps/itsvari run build:cloudflare
```

Run both commands if you change Wrangler configuration or code that depends on `CLOUDFLARE_ENV`. If you change a deploy script, run it with `--dry-run` from each affected app directory after building. Use a clean checkout of the candidate commit when changing dependencies, build tooling, or generated assets so local files and cached outputs cannot mask missing inputs.

## Diagnose Workers Builds failures

- Use `cf workers list` to find the Worker's `id`, then run `cf builds list --external-script-id <worker-id>` and `cf builds logs get <build-uuid>`. Read the first failing step in both Worker logs.
- Dependency audits stopped both production Workers on two separate pushes. Advisories can appear between pushes with the same lockfile. The full pipeline runs both `pnpm audit` and `pnpm audit --prod`. Update the affected packages and commit `pnpm-lock.yaml` with any manifest changes. Keep both audits enabled and fix findings before retrying a remote build.
- If Wrangler warns about a Worker name or environment, check each app's generated `dist/server/wrangler.json` for the expected Worker name and routes.
- The first V4RI production deployment passed the build command and failed on a conflicting DNS record for `v4ri.xyz`. For changes to build settings or routes, run `pnpm run check:cloudflare-builds` to compare the live triggers with the repo. Before adding or moving a custom domain, check the Worker's existing domain attachment and inspect the hostname's DNS records with `cf dns records list --zone <zone> --name <hostname>`. A Wrangler dry-run verifies the bundle and configuration. Cloudflare checks DNS ownership and conflicts when it attaches the domain.
