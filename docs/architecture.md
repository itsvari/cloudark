# Architecture

## Applications

The repository contains two independent Astro applications:

- `apps/itsvari` serves `itsvari.com`.
- `apps/v4ri` serves `v4ri.wav`.

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

Activity sample entries remain drafts so scaffolding content cannot be deployed accidentally.
About and CV are the deliberately published pages used by the static routes.

## Storage

Git-backed Markdown remains the content store. D1, R2, KV, Queues, and Durable Objects are intentionally absent until a concrete runtime use case exists. Astro sessions are explicitly disabled, so the adapter does not provision an unused KV namespace.
