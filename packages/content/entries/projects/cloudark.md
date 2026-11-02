---
title: Cloudark
summary: The shared publishing architecture behind itsvari.com and V4RI, with typed Markdown content and two independent Astro applications.
publishedAt: 2026-11-02T04:00:00+08:00
canonicalSite: itsvari
syndicateTo: []
status: active
tags: [astro, cloudflare, typescript]
links:
  github: https://github.com/itsvari/cloudark
featured: false
---

## One place to write

Cloudark is the workspace behind this site and V4RI. Two Astro applications share a typed Markdown content model and a set of visual components, while keeping their page layouts and navigation separate.

Entries have a canonical owner. A post can appear in another site's activity feed without creating a second copy or a competing URL.

## Content with a shape

The schemas describe the things the interface needs to know: publication dates, project status, event timing and optional photography. Scheduled gigs become upcoming, live or past at request time. Editorial cancellations and postponements take precedence over the clock.

## Independent applications

Both applications target Cloudflare Workers. Image fields accept local paths or hosted HTTPS images, so photography can move to Cloudflare storage or Images without changing the content model. The reading pages support YouTube embeds for recorded sets.
