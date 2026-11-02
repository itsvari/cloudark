# Design guide — itsvari.com and V4RI

This is the single source of truth for how the two sites look and behave. It is written for people and for coding agents. When this guide and an existing implementation disagree, the guide wins; when the guide and the mockup (`mockups/d-signal-ledger.html`) disagree, the mockup wins and the guide should be corrected.

The direction is called **Signal + Ledger**: a HUD-like frame (full-bleed image, registration marks, spec strip, ledger tables, fixed index column) carrying an editorial type system (Redaction for titles, bracketed Departure Mono labels, dotted leaders, numbered sections, one red rule per section). Influences: ANTIREAL, Prime Intellect, Dragonfly, Nous Research, micrographics. Blend: minimal 45, neo-brutalist 30, Y2K 25.

## 1. Principles

1. **Black, white, one red.** Pure `#000` background, pure `#fff` text. Red is `#DC2626`, taken from the V4RI logo, and it only ever means state: live, active, external, featured. Never decorative.
2. **Type does the talking.** No boxes with fills, no shadows, no rounded corners. Hierarchy comes from size, face and spacing. Rules are 1px at 22% white; the only heavy line is the 2px red section rule.
3. **Instrumentation at the edges, content in the middle.** Registration marks, rails and readouts live in the margins. Content never shares a row with them.
4. **Same system, every width.** One set of markup per page. Container queries and fluid tokens handle 390px to 2560px. No per-breakpoint redesigns.
5. **Red is a state, not a colour.** Live dot, active nav item, external arrow `↗`, featured corner. If something is red, the reader should be able to say why.
6. **Images are greyscale until touched.** Photography sits behind scanlines on the V4RI home and behind a dither mask in rows and cards. Colour arrives on hover, press or focus.

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

There is no light mode. `color-scheme: dark` on `:root`.

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
| < 640 | nav collapses to `[ menu ]`; cards one column; now-rows become a two-row grid; table rows stack to `date / status`, `title`, `venue / arrow` | nav collapses to `[ menu ]`; spec strip one column; carousel index below |
| 640–1023 | header layout (brand left, inline nav right); footer moves to page end; about facts stack under prose | spec strip two columns; time column dropped from tables, venue moves under title |
| ≥ 1024 | sidebar appears, sticky, full viewport height, footer pinned to its bottom; full table; section rail | rail, sub-label and EXIF caption appear; full table |
| ≥ 1280 | shell capped at 1280px and centred | — |
| ≥ 1400 | hairline rules on both sides of the shell | — |
| ≥ 1536 | — | chrome capped at 1536px and centred; image still bleeds to the edges |

Prose measure is `65ch`. Sidebar width is `clamp(240px, 24cqi, 300px)`.

## 5. Components

### 5.1 itsvari.com shell
Two columns at `lg+`: sidebar + main. Sidebar: brand (`itsvari` in Departure Mono `--t-1`, `.04em`) with a micro stamp beneath (`v3.0 · rev. 2026.11`), numbered nav (`00 [ home ]` … `05 [ contact ]`, then `↗ V4RI`), 1px rules between items, active item red including its number. Footer pinned to the bottom of the sidebar, in order: tick strip, calibration swatches + `cal. · rev. date`, copyright line, `[ rss ] [ sitemap ] [ contact ]`, position line `01.3521°N 103.8198°E · UTC+8`, `§nn · p. 1/1`. No technology, stack or font credits anywhere in the chrome.

Main column: `index · 00 / 05 · rev. yyyy.mm` micro label top right; a vertical section rail at the right edge listing section numbers with the current one red (desktop only).

### 5.2 itsvari.com home
`Ashe.` (Redaction 50, `--t9`), tagline (Redaction 35 Italic, `--t4`), one two-sentence intro (`--t1`, 65ch, one inline flavour phrase), three bracketed links, a "now" block of three leader rows (`[ building ]`, `[ writing ]`, `[ next gig ]`), `§ 01 Selected work` with two cards, `§ 02 Selected writing` with two leader rows. No activity feed on the home page; it is one link in the footer.

### 5.3 Section heading
Redaction `--t3` title, Redaction 35 Italic `--t2` dim aside with `.4em` gap, right-aligned `§ nn — [ link → ]` tag, then a 2px red rule with `--s-3` above and `--s-2` below. Section spacing is `--section`.

### 5.4 Leader row
Flex row, baseline aligned, `--s-2` vertical padding: key (Departure Mono, fixed width), value (TX-02), `.lead` (flex 1, 2px dotted `--dot`, nudged up 5px), trailing tag. Below 640 the leader is hidden and the row becomes a grid: key and trailing tag on row one, value on row two.

### 5.5 Card
1px `--rule` border, `--s-4 --s-5` padding, min-height 150px, flex column. Top row: `[ state · featured ]` tag left, `fig. nnn` micro right. Title Redaction `--t2`. Summary TX-02 `--t0` at 72% white. Bottom row: tags left, `github ↗` right. Featured cards have a white border and a 3px × 40px red bar on the top-left edge.

### 5.6 Ledger table (gigs, releases, posts)
Grid rows, 1px `--rule` between, `--s-3` vertical padding. Desktop columns `110px 124px 1fr 260px 150px 30px`: date, time, title (TX-02 500), venue (70% white), status tag, `→`. Group labels `[ upcoming — 02 ]` in dim tags, no header row below `lg`. Status vocabulary maps to `EventDisplayPhase` from `@itsvari/content`: `live → [ ● live ]` red, `upcoming → [ tickets ↗ ]` or `[ announced ]`, `postponed → [ postponed ]` dim with struck date, `cancelled → [ cancelled ]` dim with struck title, `past → [ rec ↗ ]` or `[ — ]`.

### 5.7 Photo fill (rows and cards, optional)
Any ledger row, writing row or project card may carry an image. Rules:
- The image fills the row at the row's existing height; the row never grows.
- It is masked with a 4×4 Bayer ordered-dither tile (`/dither.svg`, 160×4: columns 0–63 transparent, 64–127 sixteen coverage bands, 128–159 opaque) using `mask-size: 100% auto; mask-repeat: repeat-y`. Result: solid black under the leading 40% where the text sits, a stepped dither across the next 40%, full image on the trailing 20%. Pixel size scales with row width by design.
- A `rgba(0,0,0,.45)` overlay sits on the image everywhere so trailing status text stays legible.
- `filter: grayscale(1)` at rest; `filter: none` on `:hover`, `:active`, `:focus-within`. Transition 350ms. On touch devices the first tap reveals colour, the second follows the link.
- Row borders stay visible: inset the image 1px at the bottom for rows and 1px all round for cards.

### 5.8 V4RI home
Full-bleed photo carousel (crossfade, 20s cycle, 4s per image, 5 images) under a vertical shade and 1px/4px scanlines. Top bar at `--safe`: logo mark (26px) + `V4RI` text, centred `[ dj / producer — singapore ]`, nav `[ gigs ] [ releases ] [ posts ] itsvari.com ↗`. Left vertical rail (micro, dim): local time, coordinates, `◼ REC — year`. Hero bottom-left: `V4RI` in Redaction 50 Italic `--t10`, tagline Redaction 35 Italic `--t5`, live line `[ ● live now — … ]` in red when an event is live. EXIF-style caption above the strip on the right. Spec strip at `--safe` from the bottom: ticked ruler (1px rule, 8px minor ticks, 80px major ticks), five columns `NEXT GIG / WHEN / WHERE / TICKETS / 01 ⁄ 05 + five 34×2px bars`, active bar red. Below `lg` the strip is two columns with the index row full width; below `sm` one column.

### 5.9 Micrographics kit
Use freely in margins, never inside running text. Registration marks; ticked ruler; tick strip; calibration swatches (`#000`, `#DC2626`, `#fff`, 8px, 1px 35% white border); section rail; numbering (`§`, `fig.`, `p.`, `index`); stamps (`rev.`, `v`, `updated`); EXIF captions (`img_0412 · 35mm · f/1.8 · 1/60 · iso 3200 · venue · date`); position line. Everything at `--t-2`, 45–75% white. Not used: coordinates, viewport readouts, commit hashes, stack or font credits.

## 6. Motion
- Carousel crossfade only; no pans or zooms.
- Photo fill: 350ms `filter` transition.
- Live dot: static glow (`box-shadow: 0 0 10px var(--red)`), no pulse.
- Respect `prefers-reduced-motion`: stop the carousel on the first image, drop transitions.

## 7. Accessibility
- All text meets WCAG AA on black; dim text (`.55`) is 7.6:1. Red on black is 4.7:1, acceptable for the `--t-1` tags it is used on; never set `--t-2` text in red.
- Hover-only colour on photo fills is decorative; the row remains fully readable in greyscale.
- Visible focus: 1px white outline offset 2px, matching the rule weight.
- Bracketed labels are real text, not pseudo-content, so screen readers announce them.
- Marks, rails, rulers and swatches are `aria-hidden`.

## 8. Fonts and licensing
Departure Mono (OFL) and Redaction (OFL) may be committed. TX-02 is licensed from Berkeley Graphics; confirm web-embedding terms before shipping and keep the files out of any public repository (serve from a private asset path or R2). `fonts.sh` regenerates the WOFF2 set from locally installed OTFs.
