# Responsive QA

This file records successive checks. Earlier captures contain placeholder content that has since been removed. The real-content check at the end describes the current sites.

Captured on 2 November 2026 from the local Astro development servers with T3 preview. Files follow `{site}-{page}-{viewport width}.png`; each set covers CSS viewport widths 390, 768, 1280, 1536 and 2560 pixels. T3 scales some output images to fit its capture surface, and the Astro development toolbar is visible in some captures.

- itsvari: `itsvari-home-*`, `itsvari-about-*`, `itsvari-project-*` (Cloudark detail).
- V4RI: `v4ri-home-*`, `v4ri-gigs-*`, `v4ri-gig-*` (Breaks Night 12 detail).

The reference is `../mockups/d-signal-ledger.html`. Its captions say D3/1–10 although the buildout plan calls them D4/1–10. At 1280px, measured heading positions and heights matched the corresponding home, about and gigs frames. At 390px the itsvari headings were within 1.25px and the gigs heading matched; the V4RI home heading was 22.5px lower than the reference (338.875px versus 316.375px). Both use the same bottom anchor; the reference live status wraps onto two lines while the current next-transmission status takes one, accounting for the difference. The sites use real content and images, so wrapping and total page height need not match placeholder content exactly.

The 768px itsvari navigation initially failed to render because it was inside a closed disclosure. After the fix, its links rendered in a horizontal row at x=124–740px, y=51–69px. The 390px menu opened and exposed its links. At 1280px the sidebar navigation rendered. No horizontal document overflow was found on the tested home, about and gigs pages at the five widths. The V4RI recorded filter navigated to `?filter=recorded` and returned three recorded rows; the Breaks Night 12 link opened its detail page.

Safari was checked visually on the desktop V4RI gigs page: navigation, display fonts and dithered photo rows rendered. This was not a complete Safari matrix or a programme-level font-loading check. Firefox 157 was installed in the Playwright cache and checked separately at 390, 768 and 1280px. The gig page loaded Departure Mono, Redaction and Redaction 35 from WOFF2 URLs with HTTP 200; the home page loaded Redaction 50 Italic with HTTP 200. The dither SVG returned HTTP 200 and both `mask-image` and `-webkit-mask-image` computed to its URL; the dither was visible. Home spec-strip container queries produced one, two and five columns respectively. No horizontal overflow was observed. The three Firefox gig captures and raw results are included. `firefox-check.mjs` takes the path to an installed Playwright package as its first argument and expects the V4RI server on port 4322. T3 preview did not offer an independent browser engine selector.

A single Lighthouse mobile run against the local production worker at `http://127.0.0.1:4422/` reported performance 100, LCP 0.92s and CLS 0.001 (rounded). This is a local, simulated throttling result, not a deployed-network measurement or proof that font swaps never shift. Deployed smoke checks and repeat performance testing remain necessary.

A subsequent mobile carousel check paused at 16,393ms with index 05 and the fifth caption, resumed from that time, and matched the animation index. In Firefox, switching to reduced motion from 5,207ms reset index and caption to the first image; switching back restarted at the first image. At 768px, release kinds (`mix`, `ep`) and post kinds (`note`, `post`) were visible beneath their titles.


The raw Lighthouse report is `lighthouse-mobile.json`. Reproduce the local run with:

```sh
pnpm dlx lighthouse http://127.0.0.1:4422/ --chrome-path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' --chrome-flags='--headless' --output=json --output-path=/tmp/cloudark-lighthouse.json --quiet
```

The final builds also passed `scripts/smoke-deployed.mjs` and `scripts/verify-mockup.mjs` against local Wrangler production servers on ports 4421 and 4422. The route crawl covered 12 itsvari routes and 21 V4RI routes. Both Worker deployment dry runs passed. No live deployment was performed.

## Refinements check

Focused captures are named `refinements-*.png`. At 1280px, reading contents numbers appear to the left of their labels and section headings have visible markers. The gig detail article is centred at x=189–1091px; at 768px it is x=84–684px and at 390px x=16–374px, without horizontal overflow. The first Breaks Night 13 capture missed its photo; a subsequent repaint showed the 220×165px image beside the facts. The image returned HTTP 200, had natural width 1920px and was visible in computed layout, indicating capture/decode timing rather than an absent image.

The adaptive photo mask uses 2px cells and an 8px tile at 390px and 1280px. At 1280px, changing a short title to a longer title moved the fade start from 424.61px to 716.26px; resizing changed the tile width to match its row. The additional text shade computed to black at 18% opacity. Synthetic touch pointer events activated the row and prevented the first primary click; the second primary click and secondary ticket click were not prevented. This is not a physical-device touch test.

The V4RI home images computed `filter: none`. With playback paused, direct selection, next, previous and ArrowRight updated the index, selected indicator and caption. In Firefox with reduced motion, next, previous and ArrowRight also updated the first two captions and indices. The sticky header remained at y=16px after scrolling the gig detail 500px at 390, 768 and 1280px. The socials and contact routes expose Instagram links to `https://www.instagram.com/v4ri.wav/`. Carousel buttons measured 44px high and their border/background changed on hover. After the navigation correction, at 768px the logo measured 26×26px with the menu shown, and at 1024px the inline navigation fit without horizontal overflow.

The refinement build passed lint, both application checks, all 51 tests and parallel production builds. Both rebuilt Workers passed the smoke script and the route crawl locally, covering 12 itsvari routes and 23 V4RI routes. The Cloudflare adapter now requests an automatically assigned inspector port for each app, removing the debugger-port race during concurrent prerendering. No dependencies changed in this refinement pass.

## Final progress and label check

Focused current captures are named `final-*.png`. At 390, 768, 1024 and 1280px, the checked about, home, socials, contact, gigs and V4RI about pages had no horizontal document overflow. The short bracketed facts and Instagram labels stayed together in the inspected layouts; the 1024px V4RI navigation fit with a 26×26px logo. A fresh navigation to the current personal home showed two writing entries; the writing index showed four. Their rows had no dotted leader elements. The writing index and article metadata each have a 16px gap before the heading.

The V4RI image filters computed to `none` and the full-frame veil to black at 42% opacity. Direct selection reset the progress clock: at 25ms the fill was 0.006, at 1025ms it was 0.256, and after 4.3s the next photograph and caption were selected. ArrowRight selected the next photograph. Under Firefox reduced-motion emulation, the initial image remained static for 4.5 seconds; manual selection and ArrowRight still worked. The line control background remained transparent on hover. A follow-up 390px capture after image decoding shows the red live-state text on a 92% black inline background, readable against the colour photograph. The full-frame veil remains at 42%.

The content pass now has ten engineering projects backed by supplied documents and repository inspection. Final local production smoke checks cover 20 itsvari routes and 24 V4RI routes; lint, application checks, 51 tests and both builds pass. The profile and music About pages include the dated RICE Media feature.

## Real gig archive check

The refreshed archive rendered nine entries at 390, 768 and 1280px, with eight poster-backed rows. The SKF2026 detail contained only its heading, `iykyk ;)`, and the 24 May 2026 22:00–23:00 SGT set time in main content; it had no image, venue, description, genre or source links. The GHOREHOUSE and Next Beats detail images returned HTTP 200 and preserved their source aspect ratios (920×450 and 640×800 respectively); their times are labelled as event times. The ledger uses cropped image fills by design.

The all-past home displayed nine shows and a latest-show link without a live/upcoming placeholder; the image caption read “sample photography · after dark”. After the tablet flow correction, measured hero-to-spec gaps were 32px at 768×1024, 57.1px at 1024×800 and 56px at 1280×800, without horizontal overflow. Focused captures are `archive-home-768.png`, `archive-home-1024.png` and `archive-home-1280.png`.

The real-gig archive passed lint, both app checks, all 64 tests and both production builds. The production smoke run covered 44 linked routes and included a dedicated SKF2026 check for its exact description, 22:00–23:00 SGT set time and absence of venue, media or additional links in the main content. The verified archive has nine performances and eight poster assets; the organiser announcement resolves Next Beats to 24 January 2026. Public event calendars supply programme bounds rather than individual artist set times.

## Real-content check, 3 November 2026

The current inventory has ten verified engineering projects, ten real performances, four supplied set recordings and no blog posts on either site. Five press-kit photographs replace the stock carousel, and the About page uses a press-kit portrait. The ABYSS gig includes its official poster and the confirmed 31 October 20:00 to 1 November 03:00 SGT programme bounds. Raw press-kit videos are omitted.

Both production Workers passed the smoke and route verification scripts locally. The crawl covered 17 itsvari routes and 24 V4RI routes. Dedicated checks verified the four exact event-to-YouTube mappings, reciprocal gig and recording links, recordings index, recorded-gig filter, RSS and sitemap entries. Deleted posts and fictional releases return HTML 404 pages, and the ten removed stock files return 404. Both post indexes are empty. The personal RSS contains no invented posts. SKF2026 still passes its exact-description, set-time and minimal-disclosure checks.

The five default hero requests return responsive WebP assets below 2 MiB each. The first 1440px hero is 52,244 bytes and the 720px portrait is 33,010 bytes. The six original press photographs remain unchanged in source storage and are not imported into the live site. `node scripts/generate-press-images.mjs` regenerates 28 responsive derivatives through Astro's local image pipeline.

Lint, both app checks, content and UI TypeScript checks, all 70 tests and both production builds pass. Astro's content loader reports that the posts directory has no Markdown files, as intended. The full and production dependency audits report zero known vulnerabilities. No live deployment was performed.

Current focused captures are `recordings-home-390.png`, `recordings-home-1280.png`, `recordings-recording-390.png` and `recordings-recording-1280.png`. The home, tagline, latest-recording link and checked recording layouts had no horizontal overflow at 390, 768 and 1280px. Each recording page had its correct privacy-enhanced YouTube iframe, a direct YouTube link and the matching gig link. Both writing indexes displayed empty states, and the personal home had no zero-of-zero count.

The preview player displayed "This video is unavailable", so playback in that browser was not verified. A separate check of YouTube's public player metadata reported `status: OK`, `playableInEmbed: true` and `isPrivate: false` for all four videos. The preview failure is therefore not evidence that these uploads prohibit embedding. Direct YouTube links remain available beside every player.

## CV, spacing and organiser-copy refinements

The CV is a two-page A4 PDF with a white background, black text and grey rules. Both rendered pages passed visual inspection for margins, typography, clipping and page transitions. Body text is 10pt, with Departure Mono role and duration lines at 9.25pt. Redaction provides intact section and employer headings. All seven font entries are embedded with Unicode mappings. The PDF is tagged, unencrypted and contains no JavaScript. `scripts/verify-cv.mjs` confirms all printable source words, contact details and standard section order, with no web navigation or decorative section numbers in the extracted text. This verifies the document's text structure, not acceptance by every ATS vendor.

Headless Chrome measured identical value-column starts within each home and contact group at 768px and 1280px, with a 12px key-to-value gap and no horizontal overflow. Role paragraphs computed to Departure Mono. The home PDF control measured 228px at 390px and 232px at 1280px. The original-ticket control measured 286px and 331px at those widths. The first carousel request is now the former fifth image, `20250926_64`.

Scrolling checks selected CV work experience and skills in both directions, education after a direct hash, and skills alone at the page bottom. Gig checks followed lineup, description and recording. Both active indicator spans computed to `rgb(220, 38, 38)`. The gig description heading rested at 95px, below the sticky header's 66px lower edge. On the shorter Cloudark project page, a requested 665px scroll was clamped at the 623px document maximum; the final visible section correctly became active, and returning to the top selected the first section. Raw results and the rerunnable browser check are `cv-scrollspy-results.json` and `cv-scrollspy-check.mjs`.

The `cv-refinements-*` captures cover personal home, contact and CV, plus a long gig detail at 390px and 1280px. These initial captures precede the final 14ch label-track adjustment; the final alignment measurements above cover that adjustment. T3 preview snapshots timed out twice, and the fallback browser host was unavailable. The recorded browser checks therefore used installed headless Chrome through Playwright. All owned browser sessions were closed.

All nine public gig bodies preserve complete organiser wording and hyperlinks, with separate published lineups. Source and Markdown checksums are in `docs/content/gig-sources.json`; the route verifier checks the transcription hashes, description and lineup sections, and available ticket controls. Both apps configure Sätteri's smart punctuation off to preserve source characters. The 3NiTi calendar/description timing discrepancy is explicitly noted beside the event time. SKF2026 remains unchanged and passes its dedicated privacy check. Both sites use the original white-line V4RI logo for their SVG and ICO favicons.

The final pass passed lint, type checks, 80 tests, both production builds, PDF verification and the 41-route production crawl. Both dependency audits still report zero known vulnerabilities. No live deployment was performed.

## R2 delivery and staging protection

The final delivery pass on 3 November 2026 SGT moved 28 responsive WebPs and nine event posters to R2. Only the two required TX-02 webfonts are hosted beside them, outside Git. All 39 files pass size, SHA-256, MIME-type and immutable-cache checks; both production font origins pass CORS checks. The full Cloudflare build command passes dependency audits, lint, type checks, 80 tests, production builds and Wrangler dry-runs. Local production previews pass deployed smoke checks and all 41 linked-route checks with the external media and real TX-02 fonts.

Both staging Workers now require the owner's Cloudflare account through whole-Worker Access policies. Policy readback and 12 anonymous base, static-file and current-version probes pass. Content smoke checks after Access require owner-session cookies; no bypass or service-auth policy was added for testing.

The final Chrome visual check used CDP device emulation at 390 × 844 and 1440 × 1000 for personal home, CV and contact, plus V4RI home, About and Blacklight Sessions 02. Document widths matched each viewport with no horizontal overflow or clipped labels in the initial-view screenshots. TX-02 checks passed at weights 400 and 500; both faces reached loaded status on the CV. Visible images decoded without media-host errors. The carousel opened on `20250926_64_Fullres` with thin progress-line controls. This check covers the initial viewport, not each page's full scrolled length.
