# Buildout plan — itsvari.com and V4RI

Audience: the engineer or coding agent implementing the front end. Goal: a visually faithful build of `mockups/d-signal-ledger.html` (Direction D, revision 4) across both Astro apps, following `design-guide.md`. Where the mockup and this plan disagree, match the mockup.

## 0. Context you need first

- Monorepo, pnpm 12.16.1, Node ^22.23.4, ^24.16.0 or ≥26.3.0. `apps/itsvari` serves itsvari.com, `apps/v4ri` serves V4RI (domain `v4ri.xyz`). Both are Astro 7 with the Cloudflare adapter in server mode. Read `docs/architecture.md`.
- `packages/content` owns all Markdown content and Zod schemas (`src/schemas.ts`), the domain logic (`src/domain.ts`: event phases, canonical URLs, activity feed) and Astro loaders (`src/astro.ts`). `packages/ui` holds shared Astro components (`ActivityList.astro`, `EmptyState.astro`) and `formatDate` helpers.
- Existing pages per app are in `apps/*/src/pages`; each app has a `SiteLayout.astro` and a `styles/global.css` that will be replaced.
- Verification commands: `pnpm lint`, `pnpm check`, `pnpm test`, `pnpm build`. Keep all four green at the end of every phase.
- Branch from `codex/astro-rearchitecture`. One PR per phase is preferred.

## 1. Fidelity rules

1. Copy token values from the design guide verbatim (`clamp()` strings, rgba values, pixel sizes). Do not round or "improve" them.
2. Open the mockup in a browser alongside your build at 390, 768, 1280 and 2560 wide and compare each frame. The mockup's frames are labelled `D4/1` … `D4/10` in their captions; refer to them by that label in PRs.
3. Placeholder gradients in the mockup stand in for photographs. Use real images where content provides them and the same gradient placeholder (`.p1`–`.p5` in the mockup CSS) when it does not.
4. The mockup's CSS is the reference implementation. Lift selectors and values from it; rename to project conventions but keep the numbers.
5. No new colours, weights, shadows, radii or fonts. If something seems to need one, stop and ask.

## 2. Phases

### Phase 1 — Shared tokens and fonts (`packages/ui`)
- Create `packages/ui/src/styles/tokens.css` with colour, spacing, fluid type, `--gutter`, `--section`, `--edge`, `--safe`, containers and breakpoints exactly as in the guide. Expose it from the package.
- Create `packages/ui/src/styles/base.css`: reset, `color-scheme: dark`, body font (TX-02 `--t0` / 1.5), link reset, focus ring, `prefers-reduced-motion` handling, `.lbl`, `.tag`, `.dim`, `.red`, `.rule`, `.lead` utilities.
- Fonts: `@font-face` for TX-02 400/500, Departure Mono, Redaction Regular, Redaction 35 Italic, Redaction 50 Regular and Italic. `url()` WOFF2 first, `local()` second, `font-display: swap`. Place OFL fonts in each app's `public/fonts`. TX-02 must be served from a non-public path (R2 bucket or a private asset route) unless the licence explicitly permits committing it; until that is confirmed, load it from an environment-configured base URL and fall back to `ui-monospace`.
- Ship `public/dither.svg` (160×4 Bayer tile; generation snippet in §4).
- Acceptance: a scratch page in either app renders every type step and the kit samples identically to the mockup's system panel.

### Phase 2 — Shared components (`packages/ui`)
Build as Astro components with scoped CSS, props typed from `@itsvari/content`:
- `RegistrationMarks.astro` (top pair and end pair, `aria-hidden`), `SectionHeading.astro`, `LeaderRow.astro`, `Tag.astro` (bracketed, with `state` prop mapping to red), `Card.astro` (featured flag, optional image), `LedgerTable.astro` + `LedgerRow.astro` (optional image, phase → status tag), `PhotoFill.astro` (image, dither mask, overlay, greyscale hover), `Ruler.astro`, `CalibrationSwatches.astro`, `TickStrip.astro`, `SectionRail.astro`, `SpecStrip.astro`.
- Replace `ActivityList.astro` usage with `LedgerTable` where lists appear; keep `EmptyState` but restyle it as a dim bracketed line.
- Acceptance: a component gallery page (dev only) matching the mockup fragments.

### Phase 3 — itsvari.com shell and pages (`apps/itsvari`)
- `SiteLayout.astro`: grid shell per guide §5.1, sidebar sticky at `lg+` with pinned footer, header mode below `lg`, `[ menu ]` disclosure below `sm`, marks at document start and end, page meta (`index · nn / 05 · rev.`) and section rail driven by props.
- Home (`D4/4–6`): hero, intro, links, now block, two featured projects, two featured posts, footer link to `/activity`.
- About (`D4/9–10`): meta line, `About` + aside, red rule, prose with inline flavour, facts column (stacks below `lg`), timeline section.
- Projects index, writing index, project detail, post detail (reading page: meta tags, Redaction `--t6` title, `--t1` lede, `--t0`/1.6 body, Redaction 35 Italic pull quotes with a 2px red left rule, right-hand contents rail with leaders at `lg+`), CV, contact, 404, `/activity` (the full feed as a ledger).
- Acceptance: side-by-side match with `D4/4`, `D4/5`, `D4/6`, `D4/9`, `D4/10` at all four widths.

### Phase 4 — V4RI shell and pages (`apps/v4ri`)
- `SiteLayout.astro` with the top bar (logo + `V4RI`, sub-label, nav, `[ menu ]`), marks, `--wide-max` 1536 chrome container, footer with calibration swatches.
- Home (`D4/1–3`): carousel from an `images` array on a new `home` page entry or a `public/photos` manifest, shade + scanlines, rail, hero with wordmark and live line driven by `getEventDisplayPhase`, EXIF caption from image metadata fields, spec strip bound to the next scheduled event, carousel index. Below `lg` and `sm` per guide §4.3.
- Gigs (`D4/7–8`): ledger grouped by phase in this order: live, upcoming, postponed, cancelled, earlier. Row photo fill from `event.data.image`. Filters `[ all ] [ upcoming ] [ past ] [ recorded ]` as links with query params, not client state.
- Releases and posts indexes as ledgers (columns: date, type, title, links); gig, release and post detail pages using the reading-page pattern; 404.
- Acceptance: side-by-side match with `D4/1`, `D4/2`, `D4/3`, `D4/7`, `D4/8` at all four widths; live/upcoming/past states verified by faking `now` in a test.

### Phase 5 — Content model (`packages/content`)
Extend schemas, with tests in `schemas.test.ts`:
- `posts`: `featured: boolean` default false; `image?: { src, alt, exif? }`.
- `events`: `image?: { src, alt, exif? }`; `genres?: string[]`.
- `releases`, `projects`: `image?`.
- New `pages` entries: `home` (tagline, intro, links, `now` rows) and keep `about` with new frontmatter `facts: { label, value, href? }[]` and `timeline: { from, to, role, org }[]`.
- Loaders in `astro.ts`: `getFeaturedProjects(limit)`, `getFeaturedPosts(site, limit)`, `getHomeImages()`.
- Activity feed unchanged; it now renders only on `/activity`.

### Phase 6 — Behaviour and polish
- Carousel: CSS crossfade with `prefers-reduced-motion` fallback; preload the first image, lazy-load the rest.
- Photo fill touch handling: first tap on a row with an image toggles colour, second tap follows the link (small inline script, progressive enhancement).
- Local time in the V4RI rail from a tiny inline script; render the static SGT fallback on the server.
- `aria-hidden` on all micrographics; skip link; visible focus per guide §7.
- RSS, sitemap, `_headers` unchanged; add cache headers for fonts and `dither.svg`.

### Phase 7 — QA and hand-off
- Screenshot both sites at 390, 768, 1280, 1536 and 2560 and compare with the mockup frames; attach to the PR.
- Firefox and Safari pass: fonts load from `url()`, `mask-image` works with the `-webkit-` prefixes present, container queries evaluate.
- Lighthouse: no CLS from font swap (set `size-adjust` if needed), LCP on the V4RI home under 2.5s on a throttled connection.
- Run `pnpm lint && pnpm check && pnpm test && pnpm build`, then the deployed smoke checks in `scripts/smoke-deployed.mjs`.

## 3. Page inventory

| Site | Route | Mockup frame | Notes |
|---|---|---|---|
| itsvari | `/` | D4/4–6 | short intro, two works, two posts |
| itsvari | `/about` | D4/9–10 | long bio, facts, timeline |
| itsvari | `/projects`, `/projects/[id]` | cards from D4/4 | grid of cards, 2-up at `sm+` |
| itsvari | `/blog`, `/blog/[id]` | leader rows from D4/4; reading page per plan §2 phase 3 | |
| itsvari | `/cv`, `/contact`, `/activity`, `/404` | shell only | activity is a ledger |
| V4RI | `/` | D4/1–3 | carousel hero |
| V4RI | `/gigs`, `/gigs/[id]` | D4/7–8 | ledger with photo rows |
| V4RI | `/releases`, `/releases/[id]`, `/posts`, `/posts/[id]`, `/404` | ledger pattern | |

## 4. Reference snippets

Dither tile generation (run once, commit the output as `public/dither.svg`):

```js
const bayer = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
let d = "";
for (let level = 1; level <= 16; level++)
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++)
      if (bayer[y][x] < level) d += `M${64 + (level - 1) * 4 + x} ${y}h1v1h-1z`;
d += "M128 0h32v4h-32z";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="4" shape-rendering="crispEdges"><path d="${d}"/></svg>`;
```

Photo fill CSS (from the mockup):

```css
.hasbg { position: relative; isolation: isolate; }
.bg {
  position: absolute; inset: 0 0 1px; z-index: -1;
  background-size: cover; background-position: center;
  filter: grayscale(1); transition: filter .35s;
  mask-image: url(/dither.svg); mask-size: 100% auto; mask-repeat: repeat-y;
  -webkit-mask-image: url(/dither.svg); -webkit-mask-size: 100% auto; -webkit-mask-repeat: repeat-y;
}
.bg::after { content: ""; position: absolute; inset: 0; background: rgba(0,0,0,.45); }
.card .bg { inset: 1px; }
.hasbg:hover .bg, .hasbg:active .bg, .hasbg:focus-within .bg, .hasbg.is-active .bg { filter: none; }
```

Registration mark:

```css
.mark { position: absolute; width: 14px; height: 14px; opacity: .75; }
.mark::before { content: ""; position: absolute; left: 6.5px; top: 0; width: 1px; height: 100%; background: #fff; }
.mark::after  { content: ""; position: absolute; top: 6.5px; left: 0; height: 1px; width: 100%; background: #fff; }
.mark i { position: absolute; left: 4px; top: 4px; width: 6px; height: 6px; background: #000; z-index: 1; }
```

Spec-strip ruler:

```css
.spec::before {
  content: ""; position: absolute; left: 0; right: 0; top: 0; height: 9px;
  background:
    linear-gradient(var(--rule), var(--rule)) top / 100% 1px no-repeat,
    repeating-linear-gradient(90deg, rgba(255,255,255,.6) 0 1px, transparent 1px 80px) top / 100% 9px no-repeat,
    repeating-linear-gradient(90deg, rgba(255,255,255,.28) 0 1px, transparent 1px 8px) top / 100% 5px no-repeat;
}
```

## 5. Out of scope
Light mode, a CMS, client-side routing, any new colour. Approved motion and interaction refinements are documented in `design-guide.md`. Do not add analytics or third-party scripts.
