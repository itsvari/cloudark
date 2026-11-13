---
title: Anamnesis
summary: a prototype for turning PDFs, slides and text into interlinked Obsidian notes, with ingestion and synthesis on Cloudflare.
publishedAt: 2026-11-02T07:10:00+08:00
canonicalSite: itsvari
syndicateTo: []
status: complete
tags: [cloudflare, next.js, ai]
featured: false
---

## documents into connected notes

Anamnesis is an internship take-home prototype that turns PDFs, slide decks and text into interlinked Markdown for Obsidian.

the web application uses Next.js and OpenNext. the processing pipeline uses Cloudflare services for document storage, ingestion and AI-assisted synthesis.

## a pipeline rather than one request

Queues and Workflows separate ingestion from synthesis. Vectorize supports semantic deduplication, while D1, R2 and KV handle the different kinds of application data.

the project connects a document workflow to the notes people already use, rather than asking them to keep a separate knowledge base inside the application.

## scope

this is a prototype, and the source is private. the description here is a high-level account of its purpose and architecture.
