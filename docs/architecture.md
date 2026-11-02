# Architecture

## Applications

The repository contains two independent Astro applications:

- `apps/itsvari` serves `itsvari.com`.
- `apps/v4ri` serves `v4ri.xyz`.

Both applications use Astro's Cloudflare adapter with server output. Time-sensitive routes such as activity and gig listings are rendered by a Cloudflare Worker on request. Stable informational routes opt into prerendering.

Astro uses Vite as its development server and production bundler. The explicit Vite configuration allows each application to import workspace packages and shared content outside its own directory.

## Content

`packages/content` is the source of truth for all Markdown content and collection schemas. Each application re-exports the same `collections` object from its own required `src/content.config.ts` entrypoint.

Published entries declare a canonical owner and optional syndication targets:

```yaml
canonicalSite: v4ri
syndicateTo:
  - itsvari
```

Syndicated feed items always link to the canonical domain. Detail routes only render entries canonically owned by that application.

The ownership contract is enforced in the collection schemas: projects are owned by `itsvari`,
events and releases are owned by `v4ri`, and posts may be owned by either site. Syndication
targets must be unique and cannot include the canonical site. This keeps every generated
canonical URL backed by a real detail route.

Event phase is derived at request time from `startsAt` and `endsAt` for scheduled events.
`cancelled` and `postponed` are editorial display states that override the temporal phase.

Content entries are intentionally flat `*.md` files at the root of each collection. The current
single-segment detail routes depend on that flat-ID constraint; nested content requires migrating
all detail routes together to rest parameters.

The personal profile, CV and engineering portfolio use the supplied documents and verified GitHub
repositories. Private projects have high-level descriptions without source links. The home page and
project descriptions use this material as editorial copy. Neither site currently publishes blog posts.
The gig archive uses verified real performances. V4RI's hero photographs and About portrait come
from the supplied press kit, and its four set recordings use the supplied YouTube URLs.
Asset sources and replacement instructions are in `design/media-assets.md`.

Public gig descriptions preserve the organisers' original wording, with source provenance and
copy checksums in `content/gig-sources.json`. Both apps explicitly configure Sätteri without
smart punctuation so Markdown rendering does not change the quoted copy. Published lineups
are separate structured fields. Minimal-disclosure events reject lineup data as well as venue,
media and booking links.

The CV uses the same Markdown source for the web page and the generated PDF. Its print stylesheet
adapts the type hierarchy to a single-column, light paper layout. `scripts/generate-cv.mjs`
exports tagged PDF through installed Chromium; `scripts/verify-cv.mjs` checks source text,
contact details, section order, pagination and embedded Unicode fonts with Poppler.

## Storage

Git-backed Markdown remains the content store. D1, R2, KV, Queues, and Durable Objects are intentionally absent until a concrete runtime use case exists. Astro sessions are explicitly disabled, so the adapter does not provision an unused KV namespace.

Events may omit an unknown end time or venue. Only a confirmed end can produce a live badge; started archive entries with unknown ends appear under earlier shows. Event programme times and artist set times have separate labels. Minimal-disclosure entries reject venue, media and external event links, and bypass Markdown rendering.
