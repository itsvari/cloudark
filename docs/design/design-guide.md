# Design guide — itsvari.com and V4RI

This is the single source of truth for how the two sites look and behave. It is written for people and for coding agents. When this guide and an existing implementation disagree, the guide wins; when the guide and the mockup (`mockups/d-signal-ledger.html`) disagree, the mockup wins and the guide should be corrected.

The refinements below include the approved adaptive dither, numbered reading sections, the motion system in §6, sticky V4RI header, manual full-colour carousel without scanlines, single-tap photo links and full-page mobile navigation drawers. These updates supersede the corresponding behaviour in the original mockup.

The direction is called **Signal + Ledger**: a HUD-like frame (full-bleed image, registration marks, spec strip, ledger tables, fixed index column) carrying an editorial type system (Redaction for titles, bracketed Departure Mono labels, dotted leaders, numbered sections, one red rule per section). Influences: ANTIREAL, Prime Intellect, Dragonfly, Nous Research, micrographics. Blend: minimal 45, neo-brutalist 30, Y2K 25.

## 1. Principles

1. **Black, white, one red.** Pure `#000` background, pure `#fff` text. Red is `#DC2626`, taken from the V4RI logo, and it only ever means state: live, active, external, featured. Never decorative.
2. **Type does the talking.** No boxes with fills, no shadows, no rounded corners. Hierarchy comes from size, face and spacing. Rules are 1px at 22% white; the only heavy line is the 2px red section rule.
3. **Instrumentation at the edges, content in the middle.** Registration marks, rails and readouts live in the margins. Content never shares a row with them.
4. **Same system, every width.** One set of markup per page. Container queries and fluid tokens handle 390px to 2560px. No per-breakpoint redesigns.
5. **Red is a state, not a colour.** Live dot, active nav item, external arrow `↗`, featured corner. If something is red, the reader should be able to say why.
6. **Photo fills reveal colour on interaction.** Rows and cards are greyscale until hover, press or focus, and the colour arrives through the same ordered dither that fades the photograph into its row. The V4RI home carousel always displays full-colour photography beneath its shade.
7. **Lines do the moving.** Interface feedback is a hairline ruled along its length; dither belongs to photographs and to the tone a held surface takes. Nothing moves unprompted. §6 is the specification.

## 2. Colour

| Token | Value | Use |
|---|---|---|
| `--bg` | `#000000` | every background |
| `--fg` | `#FFFFFF` | primary text |
| `--red` | `#DC2626` | state only: live, active nav, `↗`, featured corner, `[ ● live ]`, ticket links |
| `--dim` | `rgba(255,255,255,.55)` | secondary text, labels, asides |
| `--rule` | `rgba(255,255,255,.22)` | 1px rules, card borders, row separators |
| `--dot` | `rgba(255,255,255,.4)` | dotted leaders |
| text on photo | `rgba(255,255,255,.72)` | card summaries |

The websites have no light mode. `color-scheme: dark` on `:root`. The CV's print and downloadable PDF layouts are an approved exception: white paper, black text and greyscale rules, with no colour-dependent meaning.

## 3. Typography

Three families. Self-host all of them as WOFF2 and load with `url()` first, `local()` second. Firefox does not reliably resolve `local()` for user-installed fonts, which is why the first mockups fell back to system fonts there.

| Family | Files | Role |
|---|---|---|
| **TX-02** (Berkeley Graphics, licensed) | Regular 400, Medium 500 | all body copy, table titles, values, intro paragraphs. It is monospace: 1 character ≈ 0.6em, so text wraps wider than a proportional face. |
| **Departure Mono** | Regular | every label: nav, `[ bracketed ]` tags, uppercase spec labels, dates, numbering, micrographics. |
| **Redaction** | Regular | upright display: page `h1`, section `h2`, card `h3`. Always the intact cut. |
| **Redaction 35** | Italic | every italic: taglines, asides in headings, inline flavour in body text. Never use the intact italic. |
| **Redaction 50** | Regular, Italic | the two wordmarks only: `V4RI` (italic) and `Ashe.` (upright). |

TX-02 Light, Bold and Oblique and Redaction Bold are not used. Do not add weights.

### 3.1 Fluid scale

A modular scale interpolated between a 390px and a 1440px container. Base 15px and ratio 1.2 at the small end, base 16px and ratio 1.25 at the large end. Everything is `clamp()`; there are no font-size changes at breakpoints.

```css
/* --fl is 0px at 390px and 1050px at 1440px of the page container */
--fl: calc((100cqi - 390px) / 1050);   /* use 100vw instead of 100cqi if not in a container */

--t-2: 10.5px;                                                /* micro labels, fixed */
--t-1: clamp(12.5px, calc(12.5px + .3  * var(--fl)), 12.8px); /* [ tags ], nav, dates */
--t0:  clamp(15px,   calc(15px   + 1   * var(--fl)), 16px);   /* body, table titles, values */
--t1:  clamp(18px,   calc(18px   + 2   * var(--fl)), 20px);   /* lede, intro */
--t2:  clamp(21.6px, calc(21.6px + 3.4 * var(--fl)), 25px);   /* card h3, heading asides */
--t3:  clamp(25.9px, calc(25.9px + 5.35* var(--fl)), 31.25px);/* section h2 */
--t4:  clamp(31.1px, calc(31.1px + 8   * var(--fl)), 39.1px); /* itsvari tagline */
--t5:  clamp(37.3px, calc(37.3px + 11.5* var(--fl)), 48.8px); /* V4RI tagline */
--t6:  clamp(44.8px, calc(44.8px + 16.2* var(--fl)), 61px);   /* page h1 */
--t7:  clamp(53.7px, calc(53.7px + 22.6* var(--fl)), 76.3px);
--t8:  clamp(64.5px, calc(64.5px + 30.9* var(--fl)), 95.4px);
--t9:  clamp(77.4px, calc(77.4px + 41.8* var(--fl)), 119.2px);/* Ashe. */
--t10: clamp(92.9px, calc(92.9px + 56.1* var(--fl)), 149px);  /* V4RI */
```

Line heights: body 1.5 (1.6 in long-form), labels 1.4, headings 1.1, display 0.85 to 0.9. Letter-spacing: `.04em` on bracketed tags and nav, `.08em` on uppercase micro labels, `.14em` on the `V4RI` brand text beside the logo, `-.01em` on the V4RI wordmark.

### 3.2 Inline flavour

Italic emphasis inside TX-02 body copy is Redaction 35 Italic at `font-size: 1.12em`, colour `rgba(255,255,255,.9)`. The 1.12 compensates for Redaction's smaller x-height so the two faces read at the same optical size. Use it sparingly: at most one phrase per paragraph.

### 3.3 Label grammar

- **Bracketed, lowercase, Departure Mono `--t-1`**: navigation, kinds, states, filters, links that act like controls. `[ gigs ]`, `[ ● live ]`, `[ tickets ↗ ]`, `[ menu ]`, `[ all projects → ]`. One space inside each bracket.
- **Uppercase micro, Departure Mono `--t-2`, `.08em`**: spec-strip field names (`NEXT GIG`, `WHEN`, `WHERE`), table headers, sidebar footer lines, EXIF captions.
- **Numbering**: `§ 01` for sections, `fig. 001` for cards, `p. 1/4` for pagination, `index · 00 / 05` for page position, `01 / 05` for carousels.
- **Stamps**: `rev. 2026.11.02`, `v3.0`, `updated 28.10.2026`.
- Dates in tables are `dd.mm.yyyy`; in compact lists `dd.mm.yy`; in prose `Sat 15 Nov`.
- Arrows: `→` for internal, `↗` for external (always red).

## 4. Spacing and layout

### 4.1 Spacing scale

8-point scale, written in `rem` in code: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Tokens `--s-1` … `--s-10`. Two fluid values: `--gutter: clamp(16px, calc(16px + 32 * var(--fl)), 48px)` and `--section: clamp(32px, calc(32px + 32 * var(--fl)), 64px)`.

### 4.2 Safe zones and marks

- `--edge: clamp(10px, calc(10px + 6 * var(--fl)), 16px)` — distance of registration marks from the page edge.
- `--safe: clamp(44px, calc(44px + 20 * var(--fl)), 64px)` — distance of the first and last content from the page edge. Content never enters the band between `--edge` and `--safe`.
- Registration marks are 14px crosshairs with a 6px gap at the centre, 75% white, at the four corners of the **document**, not the viewport: one pair at the top of `<body>`, one pair after the footer. They are never `position: fixed`, so scrolling content cannot pass under them.
- No coordinate or viewport readouts anywhere.

### 4.3 Breakpoints and containers

Tailwind defaults: `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`. Prefer container queries on the page container so components can be previewed at any width.

| Width | itsvari.com | V4RI |
|---|---|---|
| < 640 | nav uses a full-page drawer opened by `[ menu ]`; cards one column; now-rows become a two-row grid; table rows stack to `date / status`, `title`, `venue / arrow` | nav uses a full-page drawer opened by `[ menu ]`; spec strip one column; carousel index below |
| 640–1023 | header layout (brand left, inline nav right); footer moves to page end; about facts stack under prose | spec strip two columns; time column dropped from tables, venue moves under title |
| ≥ 1024 | sidebar appears, sticky, full viewport height, footer pinned to its bottom; full table; section rail | rail, sub-label and EXIF caption appear; full table |
| ≥ 1280 | shell capped at 1280px and centred | — |
| ≥ 1400 | hairline rules on both sides of the shell | — |
| ≥ 1536 | — | chrome capped at 1536px and centred; image still bleeds to the edges |

Prose measure is `65ch`. Sidebar width is `clamp(240px, 24cqi, 300px)`.

## 5. Components

### 5.1 itsvari.com shell
Two columns at `lg+`: sidebar + main. Sidebar: brand (`itsvari` in Departure Mono `--t-1`, `.04em`) with a micro stamp beneath (`v3.0 · rev. 2026.11`), numbered nav (`00 [ home ]` … `05 [ contact ]`, then `↗ V4RI`), 1px rules between items, active item red including its number and marked by a 3px red bar on the sidebar's right edge. In the header layout the marker is a 1px red line under the entry. Footer pinned to the bottom of the sidebar, in order: tick strip, calibration swatches + `cal. · rev. date`, copyright line, `[ rss ] [ sitemap ] [ contact ]`, position line `01.3521°N 103.8198°E · UTC+8`, `§nn · p. 1/1`. No technology, stack or font credits anywhere in the chrome.

Main column: `index · 00 / 05 · rev. yyyy.mm` micro label top right; a vertical section rail at the right edge listing section numbers with the current one red (desktop only).

Below 640px on itsvari and 1024px on V4RI, `[ menu ]` opens an opaque black, full-viewport navigation drawer. Use Departure Mono bracketed links with generous spacing, full-width targets at least 48px high, hairline separators and the current page in red. The menu and close controls also have at least 48px touch targets. Respect device safe areas; on short screens the links scroll inside the drawer. The drawer is drawn down over the page and lifts away faster than it arrived (§6.4). Keep keyboard focus inside the open drawer, restore it to the opener on close, support Escape, and prevent background scrolling. Returning to the desktop breakpoint closes the drawer. Keep navigation reachable when JavaScript is unavailable.

### 5.2 itsvari.com home
`Ashe.` (Redaction 50, `--t9`), tagline (Redaction 35 Italic, `--t4`), one two-sentence intro (`--t1`, 65ch, one inline flavour phrase), three bracketed links, a "now" block of three leader rows (`[ building ]`, `[ writing ]`, `[ next gig ]`), `§ 01 Selected work` with two cards, `§ 02 Selected writing` with two leader rows. No activity feed on the home page; it is one link in the footer.

### 5.3 Section heading
Redaction `--t3` title, Redaction 35 Italic `--t2` dim aside with `.4em` gap, right-aligned `§ nn — [ link → ]` tag, then a 2px red rule with `--s-3` above and `--s-2` below. Section spacing is `--section`.

### 5.4 Leader row
Baseline-aligned row, `--s-2` vertical padding: key (Departure Mono, minimum 14ch to accommodate brackets and letter spacing), value (TX-02), `.lead` (remaining space, 2px dotted `--dot`, nudged up 5px), trailing tag. Current home and contact values share a consistent left edge. Longer keys may expand naturally. Below 640 the leader is hidden and the row becomes a grid: key and trailing tag on row one, value on row two.

### 5.5 Card
1px `--rule` border, `--s-4 --s-5` padding, min-height 150px, flex column. Top row: `[ state · featured ]` tag left, `fig. nnn` micro right. Title Redaction `--t2`. Summary TX-02 `--t0` at 72% white. Bottom row: tags left, `github ↗` right. Featured cards have a white border and a 3px × 40px red bar on the top-left edge. On hover or focus the border brightens to white and crop marks (6px, 1px, set 3px off each corner) register onto the card; the card never lifts or fills.

### 5.6 Ledger table (gigs, releases, posts)
Grid rows, 1px `--rule` between, `--s-3` vertical padding. Desktop columns `110px 124px 1fr 260px 150px 30px`: date, time, title (TX-02 500), venue (70% white), status tag, `→`. Group labels `[ upcoming — 02 ]` in dim tags, no header row below `lg`. Status vocabulary maps to `EventDisplayPhase` from `@itsvari/content`: `live → [ ● live ]` red, `upcoming → [ tickets ↗ ]` or `[ announced ]`, `postponed → [ postponed ]` dim with struck date, `cancelled → [ cancelled ]` dim with struck title, `past → [ rec ↗ ]` or `[ — ]`.

### 5.7 Photo fill (rows and cards, optional)
Any ledger row, writing row or project card may carry an image. Rules:
- The image fills the row at the row's existing height; the row never grows.
- Use a generated 4×4 Bayer mask with fixed 2px cells and an 8px repeating strip. Measure the rendered text in `data-photo-text` elements, then start the fade 16px after its right edge, bounded between 12% and 60% of the photo width. Finish by 84% to retain a visible photograph on the right. Recalculate after resizing and font loading. Without JavaScript, use a smooth fade as the fallback.
- Keep the `rgba(0,0,0,.45)` image overlay. Add a separate `rgba(0,0,0,.18)` layer between the image and the copy so text stays legible throughout the fade.
- Greyscale at rest, colour on hover-capable `:hover`, press and keyboard focus. The photograph itself is never filtered: a veil that removes its saturation (`mix-blend-mode: saturation`) lies over it and breaks up through the sixteen dither thresholds over `--motion-select-ms`, closing again on leaving. A touch press reveals colour immediately and its first tap follows the link through normal browser navigation. Never cancel a click or require another tap to reveal an image.
- Row borders stay visible: inset the image 1px at the bottom for rows and 1px all round for cards.

### 5.8 V4RI home
Full-colour, full-bleed photo carousel, 4s per image and five images, under a vertical shade. There are no scanlines. The next photograph resolves over the last through the sixteen thresholds of the 2px ordered dither, at constant speed, in `--motion-signature-ms` (480ms); this is the one signature moment on either site (§6.5). Only thin, directly selectable lines control the carousel. The active line fills over four seconds; its animation clock also advances the photo, caption and readout. There are no arrow or pause buttons. Keyboard arrows work within the controls. Manual selection resets the progress clock. Hiding the page pauses the same clock; reduced motion keeps the active line static and allows manual selection. The top bar begins at `--safe`, sticks 16px from the viewport top and has a translucent black backing: logo mark (26px) + `V4RI` text, centred `[ dj / producer — singapore ]`, nav `[ gigs ] [ releases ] [ posts ] [ about ] [ socials ] [ contact ] itsvari.com ↗`. Collapse the extended navigation below 1024px and hide the sub-label below 1280px. Socials and contact currently link only to Instagram `@v4ri.wav`. A full-frame black veil at 42% opacity sits below all home-page text; the live-state line also has a local 92% black backing. Left vertical rail (micro, dim): local time, coordinates, `◼ REC — year`. Hero bottom-left: `V4RI` in Redaction 50 Italic `--t10`, tagline Redaction 35 Italic `--t5`, live line `[ ● live now — … ]` in red when an event is live. EXIF-style caption above the strip on the right. Spec strip at `--safe` from the bottom: ticked ruler (1px rule, 8px minor ticks, 80px major ticks), five columns `NEXT GIG / WHEN / WHERE / TICKETS / 01 ⁄ 05 + five 34×2px bars`, active bar red. A bar thickens under the pointer and again while held. On touch each bar sits in a 44px-wide target, so the bars stand further apart. Below `lg` the strip is two columns with the index row full width; below `sm` one column. Below `lg`, hero and strip stay in normal flow with a 32px gap so longer real event names cannot overlap the hero links.

Itsvari page eyebrows and headings have a 16px gap. Short bracketed labels remain on one line; longer associated values may wrap. Writing rows use space between their text and trailing metadata instead of dotted leaders.

Reading pages show sequential `§ 01` and `§ 01.1` markers above H2 and H3 headings. Contents links use a fixed number column beside a wrapping label. The section currently being read has a red contents link and `aria-current="location"`; the state follows scrolling and direct section links. V4RI reading pages use a centred, bounded body and contents layout; gig facts and photography form a balanced detail band above it.

### 5.10 CV and print adaptation

The web CV retains the dark reading-page system. Employer and section headings use intact Redaction. Position titles and duration metadata use Departure Mono. PDF download and print controls appear before the CV body, and a PDF link also appears on the personal home page.

The print and downloadable PDF versions use a white background with black primary text, dark grey secondary text and greyscale rules. Preserve the typographic hierarchy and restrained spacing, with a single column sized for paper. Remove navigation, contents rails, registration marks, section-number ornaments, interactive controls and photographic fills. Keep the candidate name and contact details in the document body. Use standard section names, real selectable text, embedded fonts and a logical reading order. Do not use tables, text rendered as images or decorative text in headers and footers. Keep role headings with their first bullet and avoid splitting individual bullets across pages.

### 5.9 Micrographics kit
Use freely in margins, never inside running text. Registration marks; ticked ruler; tick strip; calibration swatches (`#000`, `#DC2626`, `#fff`, 8px, 1px 35% white border); section rail; numbering (`§`, `fig.`, `p.`, `index`); stamps (`rev.`, `v`, `updated`); EXIF captions (`img_0412 · 35mm · f/1.8 · 1/60 · iso 3200 · venue · date`); position line. Everything at `--t-2`, 45–75% white. Not used: coordinates, viewport readouts, commit hashes, stack or font credits.

## 6. Motion

The interaction layer lives in `packages/ui/src/styles/motion.css`, with its durations in `tokens.css` and the dither pieces in `dither.css`. Components add only what is particular to them.

### 6.1 Motion brief

**itsvari.com** is an engineer's index: projects, writing and a CV, set like a technical document. Its devices are borrowed from print production and the terminal: registration marks, calibration swatches, tick strips, dotted leaders, § numbers, rev. stamps and bracketed monospace labels. Motion from the same place is the motion of ruling and indexing. What belongs: a hairline drawn along its length, a mark registering onto a target, a page swapped in place. What is foreign: lifts and shadows, bounces, blurs, fade-and-rise entrances, parallax, anything that eases like an app. It is quick, mechanical and quiet.

**V4RI** is a DJ and producer working in dark techno, EBM and industrial. This is the Signal half of the system: its devices are borrowed from video and camera hardware (`◼ REC`, EXIF captions, a running clock, the live dot) laid over the same ledger. Motion from the same place behaves like a signal: a hairline drawn along its length, a picture resolving through dither, a meter filling at constant speed. What is foreign: pans and zooms, pulsing glows, springs, soft parallax, anything that strobes. It is tight and quiet everywhere, and bolder in exactly one place: the photo carousel.

Both sites share one hand. **Lines do the moving; dither belongs to photographs and to pressure.** Nothing moves unprompted: there is no animation on load or on scroll, and content is never delayed, covered or cropped by motion.

### 6.2 Tokens

One duration for each kind of interaction and a single easing, defined on `:root`. Nothing else in the codebase states a duration.

| Token | Value | Used for |
|---|---|---|
| `--motion-press-ms` | 80ms | press feedback: a line finishing under a held control, the 1px travel of a bordered control or card |
| `--motion-hover-ms` | 140ms | hover and keyboard focus: label hairlines, frames brightening, arrows advancing; the outgoing page leaving |
| `--motion-select-ms` | 220ms | selection and larger surfaces: row hairlines, leader rules, crop marks, the colour veil on photographs, the current contents entry, caption and index, the drawer closing; the incoming page arriving |
| `--motion-page-ms` | 320ms | the drawer opening, and everything that travels during a page change |
| `--motion-signature-ms` | 480ms | the carousel dissolve, and nothing else |
| `--motion-ease` | `cubic-bezier(.2, 0, 0, 1)` | every movement that eases. Fades and the dither dissolve are linear |

Under `prefers-reduced-motion: reduce` every duration is `0ms` (§6.6).

### 6.3 One pressable language

Every link and button publishes two numbers, `--engaged` (pointer or keyboard is on it) and `--pressed` (it is held down), and every visual state is derived from them. Hover sets `--engaged` only inside `@media (hover: hover)`, so touch never gets a sticky state. Keyboard focus sets it through `:focus-visible`, so focus always shows the hover treatment as well as the 1px white outline. Press is `:active` or `[data-pressed]`; `TouchPress.astro` sets the attribute for a held touch because browsers disagree on when a touch is `:active`.

| Kind | At rest | Hover or focus | Press |
|---|---|---|---|
| Inline label (bracketed links, prose links, footer and hero links, filters) | 1px hairline at 22% white under the label; 40% in prose | the hairline is overdrawn in the label's colour from the left, and retracts to the right on leaving | the line doubles to 2px and the label takes a half-tone |
| Navigation entry and plain-value link (`.v-nav`, spec-strip links, facts, the RICE feature title) | no line | as above | as above |
| Bordered control (`button`, `.control`, PDF download, ticket link, contact actions) | 1px frame | the frame brightens to white and a 2px rule is drawn along the bottom edge | the rule thickens to 3px, the control travels 1px down and takes a half-tone |
| Row (ledger, writing and leader rows, sidebar and drawer entries, contents entries) | its own hairline | the hairline is overdrawn across the full width and the arrow advances 4px. A leader row rules its dotted leader solid instead | the line doubles and the row takes a quarter-tone |
| Card | 1px frame | the frame brightens and crop marks register on the corners | the card travels 1px down and takes a quarter-tone |
| Photograph (photo fill, gig poster) | greyscale | colour arrives through the dither | colour at once on touch |
| Carousel line | 34×2px, 30% white | thickens to 4px | thickens to 6px |
| Brand mark and logo | no line | a hairline is drawn under the name | half-tone |
| External arrow `↗` | red | leaves 2px along its diagonal | — |

The tones are the 2px ordered dither at 25% and 50% coverage. They exist so that a press is visible around a fingertip, where a hairline is not.

Rules for new components:

- Do not declare `transition`, `:hover`, `:focus` or `:active` styles in a component for a link or button. Give the element one of the kinds above (usually by putting it in a `.tag` container, or by using `.control`) and it inherits the language.
- A link stretched across a card or row (`h3 a::after`, `.title a::after`) speaks for the whole surface: the card or row shows the hover, focus ring and press.
- Red still means state only. Hover and press never turn anything red; a link that is already red draws its line in red.
- Anything hover reveals must also be reachable by press and by keyboard focus.

### 6.4 Navigation and state changes

Moving between pages is a cross-document view transition, declared in CSS alone (`@view-transition { navigation: auto }` inside `prefers-reduced-motion: no-preference`). Where it is unsupported the navigation is ordinary. The rule sits in `motion.css`, which only the two public layouts import.

- **Chrome holds.** The itsvari sidebar or header and the V4RI header keep their own snapshot (`site-chrome`), so page content changes beneath them.
- **Content crossfades in place.** The outgoing page fades out over `--motion-hover-ms`; the incoming page fades in over `--motion-select-ms` after `--motion-press-ms`. Nothing rises or slides.
- **The red rule travels.** The one rule under a page's heading (`page-rule`) glides to where the next page keeps its own. A page arriving with a rule where there was none draws it from the left.
- **The current-page marker travels** between navigation entries (`navigation-marker`).
- **A title travels.** A project card's title scales into the page heading, because both are Redaction. A ledger or writing row's title is set in the body face, so the row's line alone travels, at its own size, to an anchor on the heading's first line while the heading fades with its page; on the way back it returns to its row. Posters and photographs never travel.
- **A filter re-sorts the ledger.** On `/gigs`, rows still listed after a filter change are carried to their new places.

Pairing needs no script. `view-transition-names.ts` derives a name from an address, so a card or row names its title after the page it links to and that page names its heading after itself. Names must be unique on a page; `motion-check.mjs` fails if two elements share one.

In-page state changes:

- **Drawer.** Drawn down over the page in `--motion-page-ms`, lifted away in `--motion-select-ms`. Where a browser cannot transition a dialog out of the top layer it closes at once. A link followed from the open drawer leaves the drawer in place as the outgoing picture.
- **Contents rail.** The current entry changes colour over `--motion-select-ms`.
- **Carousel readouts.** The EXIF caption and the `01 / 05` index fade in place over `--motion-select-ms` when the photograph changes. Their boxes do not move.
- **Photographs.** §5.7.

### 6.5 Signature moment

There is one: the V4RI carousel. The next photograph resolves over the last through all sixteen thresholds of the 2px ordered dither, linearly, in `--motion-signature-ms`. The first cells land the instant a line is selected. The first photograph never animates in on load; the dissolve is armed only once something has changed. itsvari.com has no signature moment beyond the travelling red rule.

### 6.6 Reduced motion

Reduced motion is a complete mode. Every token is `0ms`, view transitions are not requested, all animations and transitions are removed, and the carousel does not advance by itself. States and colours still change, at once, and manual carousel selection still works.

### 6.7 Inventory

Every interactive element takes one of the kinds in §6.3.

| Site | Element | Kind |
|---|---|---|
| both | skip link | static (see below) |
| both | brand mark (`.i-brand`, `.logo`) | brand |
| both | navigation entries; drawer entries; contents entries | row (itsvari sidebar, drawer, contents), navigation entry (V4RI header, itsvari header layout) |
| both | `[ menu ]`, `[ close ]` | inline label drawn under the text of a 48px button |
| both | footer links, back links, reading links, section-heading links, status links in rows, card links | inline label |
| both | prose links | inline label, 40% resting line |
| both | ledger rows, writing rows, linked leader rows | row |
| itsvari | home links incl. `cv →` and `pdf ↓`; 404 links | inline label |
| itsvari | project cards | card |
| itsvari | `[ download cv · pdf ↓ ]`, `[ print cv ]` | bordered control |
| itsvari | facts links on About | plain-value link |
| V4RI | hero links, gig archive link, filters, detail links | inline label |
| V4RI | live line | inline label drawn along the bottom of its own backing |
| V4RI | spec-strip links, RICE feature title | plain-value link |
| V4RI | carousel lines | carousel line |
| V4RI | ticket link, contact actions | bordered control |
| V4RI | gig poster | photograph |

Deliberately static, and why:

- **Skip link.** It appears at once for the keyboard user who asked for it.
- **Registration marks, rulers, tick strips, swatches, section rail, `fig.` and `§` numbers.** Instrumentation, hidden from assistive technology, never interactive.
- **The running clock on the V4RI home.** A readout, not an animation; it changes text once a second.
- **The carousel progress line.** A linear meter the visitor can stop by selecting a photograph, and the only thing on either site that moves without being asked. It does not run under reduced motion.
- **The live dot.** Static glow, no pulse.
- **Leader rows without a link, the Instagram ledger rows, empty states.** Not interactive.
- **The YouTube player.** Third-party content in an iframe.
- **Printing the CV.** The button answers; the print dialog is the browser's.

### 6.8 Browser support

| Feature | Chrome and Edge | Safari | Firefox | Without it |
|---|---|---|---|---|
| Cross-document view transitions, `view-transition-class` | 126 | 18.2 | not in 157 | ordinary navigation |
| `@property` (stepped dither level) | 85 | 16.4 | 128 | colour and photographs change at once |
| Dialog entry (`@starting-style`) and exit (`overlay`) transitions | 117 | 17.5, entry only | 129, entry only | the drawer opens or closes at once |
| `:has()` (stretched-link focus and press on the whole card or row) | 105 | 15.4 | 121 | the link itself shows focus and press |
| `color-mix()`, `lh` | 111 | 16.4 | 120 | frames do not brighten; touch targets fall back to their natural size |

Hairlines, tones, the colour veil and the carousel need none of these beyond `@property` for stepping.

## 7. Accessibility
- All text meets WCAG AA on black; dim text (`.55`) is 7.6:1. Red on black is 4.7:1, acceptable for the `--t-1` tags it is used on; never set `--t-2` text in red.
- Hover-only colour on photo fills is decorative; the row remains fully readable in greyscale. No information is carried by motion alone.
- Visible focus: 1px white outline offset 2px, matching the rule weight, always together with the hover treatment. A card or ledger row shows the outline around the whole surface its link covers.
- Touch targets are at least 44×44px wherever any pointer is coarse. Standalone labels are extended invisibly: padding cancelled by an equal negative margin, or a transparent layer where neighbouring margins would collapse, so nothing moves and the page is pixel-identical to the mouse layout. Carousel lines sit in 44px-wide targets. Links inside running prose keep the height of their line, because stretching them would cover the lines above and below.
- Reduced motion is honoured completely (§6.6).
- Bracketed labels are real text, not pseudo-content, so screen readers announce them.
- Marks, rails, rulers and swatches are `aria-hidden`.

## 8. Fonts and licensing
Departure Mono (OFL) and Redaction (OFL) may be committed. TX-02 is licensed from Berkeley Graphics; confirm web-embedding terms before shipping and keep the files out of any public repository (serve from a private asset path or R2). `fonts.sh` regenerates the WOFF2 set from locally installed OTFs.
