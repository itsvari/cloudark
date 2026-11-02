---
title: Ratatoskr
summary: A serverless URL shortener on Cloudflare Workers, with editable links, expiry controls and a private administration interface.
publishedAt: 2026-11-02T09:30:00+08:00
canonicalSite: itsvari
syndicateTo: []
status: active
tags: [cloudflare, typescript, react]
links:
  github: https://github.com/itsvari/ratatoskr
featured: true
---

## Short links with a way back

Ratatoskr is a URL shortener built on Cloudflare Workers and D1, with a React administration interface protected by Cloudflare Access.

Links can be edited, revoked or given an expiry time. The administration side stays private while the redirect paths remain available to the people following a link.

## More than a redirect

The project generates PNG preview cards for shared links. Provisioning, deployment and verification are part of the repository, alongside the application code.

The work brings together a small web product and the infrastructure needed to run it: a database for the links, access control for administration and a deployable Worker.

## Source

Ratatoskr is a public project. Its repository contains the current implementation and setup instructions.
