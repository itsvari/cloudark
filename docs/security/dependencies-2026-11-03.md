# Dependency update, 3 November 2026

The six Dependabot pull requests opened in September referred to the removed npm
`package-lock.json`. Four packages in those requests are absent from the current pnpm
dependency graph: `qs`, `browserslist`, `baseline-browser-mapping` and `js-yaml`.
The other requests are already satisfied: `@humanfs/node` is at 0.16.8, `sharp` is at
0.35.5, and Wrangler is newer than the requested 4.131.0. The obsolete pull requests
were closed.

The workspace and compatible transitive dependencies were refreshed using pnpm 12.16.1.
The direct updates are Astro 7.4.5, `@astrojs/cloudflare` 14.4.4, Wrangler 4.156.2,
Vitest 5.1.0 and `@vitest/coverage-v8` 5.1.0. Both applications and the shared content
package declare the matching Astro range. Node.js 26.13.0 and pnpm 12.16.1 remain the
latest stable releases used by the build pipeline.

TypeScript remains at 6.0.3 by the owner's choice. `@astrojs/check` 0.9.12 supports
TypeScript 5 and 6, while `typescript-eslint` 8.72.1 supports versions below 6.1.
TypeScript 7.0.2 is therefore not compatible with the current checking and linting stack.
Other transitive packages remain within their owners' supported ranges: for example,
ESLint 10.14.0 requires `@humanfs/node` 0.16.x, and the Cloudflare Vite plugin pins its
own Miniflare version. These are not overridden to newer, unsupported releases.

The requested releases were published within pnpm's 24-hour minimum release age. The
workspace records exceptions for the exact selected versions and their required
platform-specific packages; the minimum-age policy remains in force for other releases.
The normal frozen install verifies the resulting lockfile against those policies.

Verification covered a frozen install with strict peer dependencies, full and production
dependency audits with zero reported vulnerabilities, media integrity, lint, type checks,
80 tests, V8 coverage, both production builds and Wrangler deployment dry-runs. Both
staging environments were built and dry-run with separate Worker names and no production
routes. Local production Worker previews passed the smoke checks and all 41 linked-route
checks, including the CV, event descriptions, recordings and R2 media. GitHub reported no
open Dependabot alerts at verification time.
