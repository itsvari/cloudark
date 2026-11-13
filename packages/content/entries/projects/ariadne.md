---
title: Ariadne
summary: a dual-agent AI facilitator for collaborative problem-solving in multiplayer VR, built in TypeScript and connected to Unity.
publishedAt: 2026-11-02T09:00:00+08:00
canonicalSite: itsvari
syndicateTo: []
status: complete
tags: [typescript, ai, xr]
links:
  github: https://github.com/itsvari/ariadne
featured: true
---

## the question

how does AI mediation change the way people collaborate and make decisions in multiplayer VR? Ariadne is a team project for CS4240 at NUS, built around that question.

my contribution centred on the TypeScript dual-agent LLM facilitator and the shared API contracts connecting it to a Unity client. the AI architecture was designed to support research into team collaboration rather than treat a conversation as an end in itself.

## coherence, latency and intervention

keeping agents coherent across turns was a central concern. so was managing latency without losing too much quality, and deciding when a facilitator should intervene instead of stepping back.

those are engineering questions as much as interaction questions. the connection between the facilitator and the VR environment has to support both the technical integration and the collaborative experience.

## outcome

Ariadne placed third in its course at the 28th NUS School of Computing Term Project Showcase.

the broader interest it left me with is AI that functions well enough for real people and real workflows.
