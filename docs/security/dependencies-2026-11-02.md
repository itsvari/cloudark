# Dependency security review, 2 November 2026

This is the historical 2 November audit. The subsequent dependency update and verification
are recorded in [dependencies-2026-11-03.md](dependencies-2026-11-03.md).

Verified at **2026-11-02 13:06:16 UTC** on Node.js **26.13.0**, using pnpm **12.16.1**. Both the full dependency audit and the production audit returned zero known vulnerabilities. Required peer dependencies resolved without warnings. Both audits were repeated on 3 November 2026 SGT after the real-content updates, with the same zero-vulnerability results and dependency counts.

This report covers the two Astro applications, workspace packages, installed transitive and optional dependencies, declared peers, the package manager, and CI action versions. The results reflect the registry advisory data available at the verification time.

## Selected dependency versions

The previous values are the manifest ranges at `832f04452841488d1b105d8cb7700c0873209004`. The selected values are the new manifest ranges. Registry `latest` metadata was checked for every external direct dependency.

| Package | Previous declaration | Selected declaration |
|---|---|---|
| `@astrojs/check` | `^0.9.10` | `^0.9.12` |
| `@astrojs/cloudflare` | `^14.2.1` | `^14.4.3` |
| `@astrojs/rss` | `^4.0.19` | `^4.0.19` |
| `@eslint/js` | `^10.0.1` | `^10.0.1` |
| `@types/node` | `^24.3.0` | `^26.6.6` |
| `@vitest/coverage-v8` | `^4.1.11` | `^5.0.5` |
| `astro` | `^7.2.2` | `^7.4.4` |
| `eslint` | `^10.9.0` | `^10.14.0` |
| `eslint-plugin-astro` | `^3.1.0` | `^3.2.1` |
| `typescript` | `^6.0.3` | `~6.0.3` |
| `typescript-eslint` | `^8.46.0` | `^8.72.1` |
| `vite` | `^8.2.1` | `^8.3.5` |
| `vitest` | `^4.1.11` | `^5.0.5` |
| `wrangler` | `^4.123.0` | `^4.156.1` |

Both applications and `@itsvari/content` now use Astro `7.4.4`, including the content package's peer declaration. Existing `workspace:*` dependencies remain local links.

The 3 November CV and source-copy refinements declare `@astrojs/markdown-satteri@^0.4.6` directly in both applications to configure literal punctuation through Astro's current processor API. This is the same version already present in the lockfile through Astro. The registry's latest version was checked, and both full and production audits still report zero known vulnerabilities.

`pnpm outdated -r --format json` reports only TypeScript `6.0.3`, whose registry latest version is `7.0.2`. The user explicitly chose the newest supported TypeScript version. `@astrojs/check@0.9.12` requires TypeScript 5 or 6, and `typescript-eslint@8.72.1` requires TypeScript below 6.1. TypeScript is constrained to `~6.0.3` so a future incompatible 6.1 does not enter the toolchain automatically. The [typescript-eslint compatibility issue](https://github.com/typescript-eslint/typescript-eslint/issues/12518) documents the missing TypeScript 7 compiler API.

## Package manager and CI

The root and both app manifests declare `pnpm@12.16.1`, replacing `pnpm@9.15.0`. Verification used `npx --yes pnpm@12.16.1`; the system package manager was not replaced.

The workspace's native build permissions migrated from `onlyBuiltDependencies` to `allowBuilds`. Only `esbuild`, `sharp`, and `workerd` may run dependency build scripts. The minimatch override moved from `package.json.pnpm` to `pnpm-workspace.yaml`, because pnpm 11 and later no longer read the former settings. These changes follow the [pnpm 11 migration notes](https://pnpm.io/blog/releases/11.0).

pnpm's default one-day publication delay remains active. Thirteen exact versions needed exceptions to satisfy the request for the newest dependencies: `@cloudflare/vite-plugin@1.67.0`, the seven `@shikijs` packages at `4.6.0` listed in the workspace file, `miniflare@5.20261101.0-beta`, `minimatch@11.0.4`, `shiki@4.6.0`, `tinybench@6.2.3`, and `wrangler@4.156.1`. Each exception is restricted to the selected version. Future versions remain subject to the delay. The [pnpm dependency-resolution reference](https://pnpm.io/settings/dependency-resolution#minimumreleaseageexclude) documents these version-specific exceptions.

The shared Node.js engine is now `^22.23.4 || ^24.16.0 || >=26.3.0`, the intersection of the current Astro and ESLint plugin requirements. CI uses Node.js `26.13.0`.

| CI action | Previous | Selected release |
|---|---|---|
| `actions/checkout` | `v4` | [v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1) |
| `actions/setup-node` | `v4` | [v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0) |
| `pnpm/action-setup` | `v4` | [v6.1.0](https://github.com/pnpm/action-setup/releases/tag/v6.1.0) |

CI installs with `--frozen-lockfile --strict-peer-dependencies` and runs `pnpm audit:dependencies`. That command checks both the full and production dependency graphs. No advisory IDs or severity levels are suppressed.

## Advisory fixes and applicability

The baseline full audit reported 86 vulnerability findings: 12 low, 39 moderate, 33 high, and 2 critical. The baseline production audit reported 69: 10 low, 31 moderate, 26 high, and 2 critical. The complete baseline contains 62 distinct GHSA IDs. Repeated dependency paths and version variants account for the difference between distinct IDs and reported findings.

The baseline was reproduced by copying the committed manifests, workspace file, and lockfile into a temporary audit directory and running pnpm 9.15.0 audit commands there. No packages were installed from that fixture. Dependency counts from pnpm 9 and pnpm 12 use different classifications and are not directly comparable.

Upgrading the direct dependencies resolved the runtime and build advisories in Astro, devalue, fast-uri, js-yaml, sharp, smol-toml, source-map-js, svgo, undici, Vite, Vitest's mocker, Zod, and other transitive packages.

One development advisory remained after direct upgrades: [CVE-2026-118764, minimatch glob amplification](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249). It affected `minimatch@10.2.6` in ESLint and typescript-eslint. The attack requires an attacker-controlled glob with high optimisation enabled. Those packages are development tooling, and the public applications do not accept glob patterns. The scoped override `minimatch@>=10 <11.0.1: ^11.0.4` removes the affected installed version. Linting passes with the patched major version. The override can be removed when upstream ranges resolve a fixed version without it.

The old package manager was also in the affected range for [CVE-2026-50015, patch path traversal](https://github.com/pnpm/pnpm/security/advisories/GHSA-rxhj-4m44-96r4) and [CVE-2026-48995, missing integrity for GitHub tarballs](https://github.com/pnpm/pnpm/security/advisories/GHSA-hg3w-7f8c-63hp). This workspace has no patched dependencies or GitHub git dependencies. Both installer issues are outside the affected version ranges after the upgrade to pnpm 12.16.1.

The baseline critical Astro advisory concerned [AVIF image optimisation](https://github.com/advisories/GHSA-26w7-cxv4-gfx2). The applications now use Astro 7.4.4, above the patched 7.2.8 threshold. The fix is retained regardless of whether the current sample-image paths exercise the affected code.

### Complete baseline advisory inventory

“Production graph” means that the production dependency scan reported the advisory. Build tools can be present in that graph without being executed by the deployed Worker. Every row below is absent from the final audits.

| Package | Advisory | Severity | Baseline scope | Final status |
|---|---|---|---|---|
| `@vitest/mocker` | [GHSA-qxg6-89mg-rqv8](https://github.com/advisories/GHSA-qxg6-89mg-rqv8) | moderate | development only | resolved |
| `@vitest/mocker` | [GHSA-xp26-3454-mjgp](https://github.com/advisories/GHSA-xp26-3454-mjgp) | moderate | development only | resolved |
| `astro` | [GHSA-26w7-cxv4-gfx2](https://github.com/advisories/GHSA-26w7-cxv4-gfx2) | critical | production graph | resolved |
| `astro` | [GHSA-376h-93r7-7g6f](https://github.com/advisories/GHSA-376h-93r7-7g6f) | moderate | production graph | resolved |
| `astro` | [GHSA-98hj-9722-w3j8](https://github.com/advisories/GHSA-98hj-9722-w3j8) | moderate | production graph | resolved |
| `astro` | [GHSA-mpr7-6m5w-76rw](https://github.com/advisories/GHSA-mpr7-6m5w-76rw) | low | production graph | resolved |
| `brace-expansion` | [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) | high | development only | resolved |
| `brace-expansion` | [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) | moderate | development only | resolved |
| `brace-expansion` | [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | high | development only | resolved |
| `devalue` | [GHSA-4q55-j62x-fr9h](https://github.com/advisories/GHSA-4q55-j62x-fr9h) | moderate | production graph | resolved |
| `devalue` | [GHSA-9rgm-9g3h-6x36](https://github.com/advisories/GHSA-9rgm-9g3h-6x36) | moderate | production graph | resolved |
| `devalue` | [GHSA-hx4r-w6wj-j8fg](https://github.com/advisories/GHSA-hx4r-w6wj-j8fg) | moderate | production graph | resolved |
| `devalue` | [GHSA-j22f-vq7h-c4qm](https://github.com/advisories/GHSA-j22f-vq7h-c4qm) | high | production graph | resolved |
| `devalue` | [GHSA-mcm9-63f2-9j32](https://github.com/advisories/GHSA-mcm9-63f2-9j32) | high | production graph | resolved |
| `devalue` | [GHSA-r9w8-h9r3-54w4](https://github.com/advisories/GHSA-r9w8-h9r3-54w4) | high | production graph | resolved |
| `devalue` | [GHSA-wf3x-273g-mvxv](https://github.com/advisories/GHSA-wf3x-273g-mvxv) | low | production graph | resolved |
| `devalue` | [GHSA-x5rw-q4pp-hg5g](https://github.com/advisories/GHSA-x5rw-q4pp-hg5g) | high | production graph | resolved |
| `fast-uri` | [GHSA-333x-w4r6-6crp](https://github.com/advisories/GHSA-333x-w4r6-6crp) | low | development only | resolved |
| `fast-uri` | [GHSA-5jgf-p345-68v8](https://github.com/advisories/GHSA-5jgf-p345-68v8) | high | development only | resolved |
| `fast-uri` | [GHSA-f65p-4m7j-42xc](https://github.com/advisories/GHSA-f65p-4m7j-42xc) | high | development only | resolved |
| `fast-uri` | [GHSA-fph4-wmhf-6fwf](https://github.com/advisories/GHSA-fph4-wmhf-6fwf) | high | development only | resolved |
| `fast-uri` | [GHSA-hrr3-gc8f-f4qj](https://github.com/advisories/GHSA-hrr3-gc8f-f4qj) | moderate | development only | resolved |
| `fast-uri` | [GHSA-jqff-g426-hqxp](https://github.com/advisories/GHSA-jqff-g426-hqxp) | high | development only | resolved |
| `fast-uri` | [GHSA-qw65-cvwx-89v3](https://github.com/advisories/GHSA-qw65-cvwx-89v3) | high | development only | resolved |
| `fast-uri` | [GHSA-w74x-v6f9-j3xg](https://github.com/advisories/GHSA-w74x-v6f9-j3xg) | moderate | development only | resolved |
| `fast-uri` | [GHSA-wjr9-j795-jxcr](https://github.com/advisories/GHSA-wjr9-j795-jxcr) | moderate | development only | resolved |
| `fast-uri` | [GHSA-xhq7-xmqj-769h](https://github.com/advisories/GHSA-xhq7-xmqj-769h) | low | development only | resolved |
| `js-yaml` | [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) | high | production graph | resolved |
| `minimatch` | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) | moderate | development only | resolved |
| `postcss-selector-parser` | [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) | moderate | development only | resolved |
| `sharp` | [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) | high | production graph | resolved |
| `sharp` | [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) | high | production graph | resolved |
| `smol-toml` | [GHSA-r4xh-jqrq-34v2](https://github.com/advisories/GHSA-r4xh-jqrq-34v2) | moderate | production graph | resolved |
| `source-map-js` | [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | high | production graph | resolved |
| `svgo` | [GHSA-4vpr-x523-8j87](https://github.com/advisories/GHSA-4vpr-x523-8j87) | moderate | production graph | resolved |
| `svgo` | [GHSA-w27v-7q3p-w38r](https://github.com/advisories/GHSA-w27v-7q3p-w38r) | high | production graph | resolved |
| `undici` | [GHSA-2gqq-gqf2-x968](https://github.com/advisories/GHSA-2gqq-gqf2-x968) | low | production graph | resolved |
| `undici` | [GHSA-2jfj-6hjv-fm6j](https://github.com/advisories/GHSA-2jfj-6hjv-fm6j) | moderate | production graph | resolved |
| `undici` | [GHSA-2m5v-pch6-74hx](https://github.com/advisories/GHSA-2m5v-pch6-74hx) | high | production graph | resolved |
| `undici` | [GHSA-3wwx-pv8p-q78v](https://github.com/advisories/GHSA-3wwx-pv8p-q78v) | moderate | production graph | resolved |
| `undici` | [GHSA-3xpg-4rpp-hhhm](https://github.com/advisories/GHSA-3xpg-4rpp-hhhm) | moderate | production graph | resolved |
| `undici` | [GHSA-4qv8-2p9j-2685](https://github.com/advisories/GHSA-4qv8-2p9j-2685) | moderate | production graph | resolved |
| `undici` | [GHSA-4w7w-5xrc-9h26](https://github.com/advisories/GHSA-4w7w-5xrc-9h26) | high | production graph | resolved |
| `undici` | [GHSA-55wc-3pg8-jfw6](https://github.com/advisories/GHSA-55wc-3pg8-jfw6) | moderate | production graph | resolved |
| `undici` | [GHSA-8436-99hf-9mmv](https://github.com/advisories/GHSA-8436-99hf-9mmv) | low | production graph | resolved |
| `undici` | [GHSA-9fm3-97px-rjf6](https://github.com/advisories/GHSA-9fm3-97px-rjf6) | moderate | production graph | resolved |
| `undici` | [GHSA-f72v-6w45-q472](https://github.com/advisories/GHSA-f72v-6w45-q472) | moderate | production graph | resolved |
| `undici` | [GHSA-pmjh-fq2x-6v4x](https://github.com/advisories/GHSA-pmjh-fq2x-6v4x) | moderate | production graph | resolved |
| `undici` | [GHSA-qrxm-fqhp-jwvm](https://github.com/advisories/GHSA-qrxm-fqhp-jwvm) | high | production graph | resolved |
| `undici` | [GHSA-r53p-7pc4-xj5r](https://github.com/advisories/GHSA-r53p-7pc4-xj5r) | low | production graph | resolved |
| `undici` | [GHSA-rfgv-xxqx-mfg5](https://github.com/advisories/GHSA-rfgv-xxqx-mfg5) | high | production graph | resolved |
| `undici` | [GHSA-rx4f-c7p8-82vq](https://github.com/advisories/GHSA-rx4f-c7p8-82vq) | moderate | production graph | resolved |
| `undici` | [GHSA-vp8m-p9jh-q5pm](https://github.com/advisories/GHSA-vp8m-p9jh-q5pm) | high | production graph | resolved |
| `undici` | [GHSA-w293-vg96-wgc3](https://github.com/advisories/GHSA-w293-vg96-wgc3) | high | production graph | resolved |
| `undici` | [GHSA-xjj6-f33q-929c](https://github.com/advisories/GHSA-xjj6-f33q-929c) | high | production graph | resolved |
| `vite` | [GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm) | high | production graph | resolved |
| `vite` | [GHSA-698v-4r3x-3vcv](https://github.com/advisories/GHSA-698v-4r3x-3vcv) | moderate | production graph | resolved |
| `vite` | [GHSA-9jrq-w75r-8gcw](https://github.com/advisories/GHSA-9jrq-w75r-8gcw) | low | production graph | resolved |
| `vite` | [GHSA-r825-w8mm-5pxw](https://github.com/advisories/GHSA-r825-w8mm-5pxw) | moderate | production graph | resolved |
| `vite` | [GHSA-rq7h-c2jc-7f22](https://github.com/advisories/GHSA-rq7h-c2jc-7f22) | moderate | production graph | resolved |
| `vite` | [GHSA-vfpm-58rq-9qcg](https://github.com/advisories/GHSA-vfpm-58rq-9qcg) | moderate | production graph | resolved |
| `zod` | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | high | production graph | resolved |

## Verification commands and output

`npx --yes pnpm@12.16.1 install --frozen-lockfile --strict-peer-dependencies` exited 0. The lockfile passed supply-chain verification, and installation emitted no peer warnings.

`npx --yes pnpm@12.16.1 outdated -r --format json` exited 1 because of the approved TypeScript 6 exception. It reported no other outdated direct dependency.

`pnpm lint`, `pnpm test`, and `pnpm check` passed after the dependency upgrade. Tests ran on Vitest 5.0.5, with all 43 passing. Astro check reported zero errors, warnings, and hints for both applications. The primary agent also verified the final production builds and runtime smoke checks under pnpm 12.

`npx --yes pnpm@12.16.1 audit --json` exited 0 with this complete output:

```json
{
  "advisories": {},
  "metadata": {
    "vulnerabilities": {
      "info": 0,
      "low": 0,
      "moderate": 0,
      "high": 0,
      "critical": 0
    },
    "dependencies": 224,
    "devDependencies": 192,
    "optionalDependencies": 121,
    "totalDependencies": 537
  }
}
```

`npx --yes pnpm@12.16.1 audit --prod --json` exited 0 with this complete output:

```json
{
  "advisories": {},
  "metadata": {
    "vulnerabilities": {
      "info": 0,
      "low": 0,
      "moderate": 0,
      "high": 0,
      "critical": 0
    },
    "dependencies": 219,
    "devDependencies": 0,
    "optionalDependencies": 126,
    "totalDependencies": 345
  }
}
```
