---
title: Cloudark
summary: the shared publishing architecture behind itsvari.com and V4RI, with typed Markdown content and two independent Astro applications.
publishedAt: 2026-11-02T04:00:00+08:00
canonicalSite: itsvari
syndicateTo: []
status: active
tags: [astro, cloudflare, typescript]
links:
  github: https://github.com/itsvari/cloudark
featured: false
---

## one place to write

Cloudark is the workspace behind this site and V4RI. two Astro applications share a typed Markdown content model and a set of visual components, while keeping their page layouts and navigation separate.

entries have a canonical owner. a post can appear in another site's activity feed without creating a second copy or a competing URL.

## content with a shape

the schemas describe the things the interface needs to know: publication dates, project status, event timing and optional photography. scheduled gigs become upcoming, live or past at request time. editorial cancellations and postponements take precedence over the clock.

## independent applications

both applications target Cloudflare Workers. image fields accept local paths or hosted HTTPS images, so photography can move to Cloudflare storage or Images without changing the content model. the reading pages support YouTube embeds for recorded sets.
