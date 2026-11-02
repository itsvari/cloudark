# Media assets

The V4RI hero and About portrait use real photographs from the supplied press kit. The gig archive uses ten supplied performances, official event listings and user-provided posters. Four supplied YouTube set recordings link to the matching events. The stock photographs, fictional releases and drafted posts have been removed. Neither site currently publishes blog posts.

The personal profile and engineering projects use the supplied CVs, cover letter and verified GitHub repositories. Private projects have high-level descriptions without source links. The attached PDFs are not published.

The open fonts are included in each app's `public/fonts`, with their original licence notices. Departure Mono is by Helena Zhang. Redaction is by the Redaction Project Authors. See [Departure Mono](https://www.departuremono.com/) and [Redaction](https://www.redaction.us/).

TX-02 web-use rights are confirmed. Its binaries stay outside this public repository. The separate font host uses `https://media.itsvari.com/fonts/tx-02/v1/`, serving only `tx-02-regular.woff2` and `tx-02-medium.woff2`, with CORS headers allowing the site origins. Set `TX02_FONT_BASE_URL` to that directory in all four Workers Builds environments. The two WOFF2 files total 60,184 bytes and are uploaded from outside the repository. Without the setting, body text uses the monospace fallback. See `docs/deployment.md` for the original file mapping and build settings.

Images use `{ src, alt, exif? }` in Markdown frontmatter. Delivery URLs use the `media.itsvari.com` custom domain and the R2 Standard bucket `cloudark-media`. The image prefix is `cloudark/v1/`, with `press/` for generated WebPs and `gigs/` for posters. There is no Cloudflare Images storage or transformation service, and the apps need no R2 binding or credentials.

The delivery set contains 28 WebPs and nine posters, totalling 3,976,897 bytes. R2 Standard includes 10 GB-month of storage, one million Class A operations, and ten million Class B operations each month. These allowances are shared with the account's other R2 usage. Egress is free, and usage beyond the included allowances is billable. See [R2 pricing](https://developers.cloudflare.com/r2/pricing/). Versioned object keys and long cache lifetimes reduce repeat reads through the custom domain.

## Press photographs

The five carousel photographs and About portrait come from the [V4RI press kit](https://drive.google.com/drive/folders/1JCjAwvXgwJXvk4SJsPTUzE51jQZS_w0i). `docs/content/press-kit-sources.json` records the source files, dimensions and bio reference. No photographer credit was available in the sampled metadata.

Unchanged originals remain locally in `apps/v4ri/src/assets/press/originals`. The delivery WebPs remain locally in `optimised`. Both directories are ignored by Git. The originals total 30,004,557 bytes and are not uploaded to the public media bucket.

`variants.ts` contains typed remote URLs and intrinsic dimensions, with no binary imports. `press-media.ts` selects the preferred image and builds `srcset` from that manifest. The five hero photographs retain their order, crops, and responsive widths from 480px to 2560px, capped at the original width. The portrait retains its four widths from 360px to 1080px. Hero fallback URLs use the 1440px variants.

To regenerate the derivatives after replacing originals, run:

```sh
node scripts/generate-press-images.mjs
```

The generator uses Astro's local image pipeline in a temporary static build at quality 76. It writes the WebPs locally and updates the remote URL and dimensions manifest. Uploading the generated delivery files is a separate step. When an image changes, use a new versioned key and update its content URL so immutable caches do not retain the previous image. Normal site builds use only the manifest and require no originals, Drive access, or media credentials. Press-kit videos are omitted at the user's request. Recordings continue to use YouTube embeds.

## Set recordings

The four supplied recordings are Tuff Club Takeover, Blacklight Sessions 02 at Enclavebar, Blacklight x 3NiTi: 000, and Blacklight 16. Each has a recording page and a player on the matching event page. The recorded date is the performance date, not a claimed YouTube upload date. `docs/content/recording-sources.json` records the supplied URLs and YouTube oEmbed titles.

## Gig posters and timing

The nine remote posters comprise six Peatix cover images, the matching clean NUS SynQ poster, the supplied Blacklight Sessions 02 poster, and the ABYSS poster from Clubpass. Event and recording frontmatter uses their absolute `https://media.itsvari.com/cloudark/v1/gigs/` URLs. The development gallery reads the same content, so it also uses remote images. The forwarded Telegram screenshot is not published. `docs/content/gig-sources.json` records the public listing, calendar, and organiser announcement sources.

The previous copies in both apps' `public/photos/gigs` directories remain locally until the uploads are verified. Git ignores all app `public/photos` directories, and each app's `.assetsignore` excludes `/photos/` from Worker asset uploads. These local copies are no longer referenced by the site. Generated screenshots under `docs/design/qa` and files under `output/` are also ignored. The small logo, favicon files, and dither SVGs stay in the repository.

Listed programme times are labelled as event times. “Till late” stays open-ended. SKF2026 uses only the supplied name, description and set time, with no venue, media or additional event links. Its minimal page does not render Markdown content, and the schema rejects additional descriptive metadata.

Run `node scripts/verify-mockup.mjs` against the two running sites to check the image URLs. The verifier visits the real routes, confirms the carousel's responsive metadata, and loads all 28 remote WebP variants and nine posters. Both apps permit the HTTPS media origin. Their existing security headers do not set a Content Security Policy that restricts image sources.

## Favicons

Both sites use the original [white-line V4RI SVG](https://drive.google.com/file/d/1IvLJ0KXAlO8vIsCeU5np4BXsU7kD2OrT/view) from the supplied press kit. `packages/ui/assets/v4ri-white.svg` preserves its white path and red polygon, with a black background for contrast in browser tabs. `node scripts/generate-favicons.mjs` writes the SVG favicon, 16px, 32px and 48px ICO frames, and 180px Apple touch icon to both applications.
