import { describe, expect, it } from "vitest";

import { eventsSchema, postsSchema, projectsSchema, releasesSchema } from "./schemas";

const publication = {
  draft: false,
  publishedAt: "2026-08-01T00:00:00Z",
  syndicateTo: ["itsvari"],
};

const event = {
  ...publication,
  canonicalSite: "v4ri",
  endsAt: "2026-09-13T02:00:00+08:00",
  eventStatus: "scheduled",
  startsAt: "2026-09-12T22:00:00+08:00",
  summary: "A gig",
  title: "A gig",
  venue: { city: "Singapore", country: "SG", name: "Venue" },
};

describe("content ownership schemas", () => {
  it("allows posts to be owned by either site", () => {
    expect(
      postsSchema.safeParse({
        ...publication,
        canonicalSite: "itsvari",
        syndicateTo: [],
        summary: "A post",
        title: "A post",
      }).success,
    ).toBe(true);
    expect(
      postsSchema.safeParse({
        ...publication,
        canonicalSite: "v4ri",
        summary: "A post",
        title: "A post",
      }).success,
    ).toBe(true);
  });

  it("restricts events and releases to v4ri", () => {
    expect(eventsSchema.safeParse(event).success).toBe(true);
    expect(eventsSchema.safeParse({ ...event, canonicalSite: "itsvari" }).success).toBe(false);
    expect(
      releasesSchema.safeParse({
        ...publication,
        canonicalSite: "v4ri",
        releaseDate: "2026-08-01",
        summary: "A release",
        title: "A release",
        type: "mix",
      }).success,
    ).toBe(true);
    expect(
      releasesSchema.safeParse({
        ...publication,
        canonicalSite: "itsvari",
        releaseDate: "2026-08-01",
        summary: "A release",
        title: "A release",
        type: "mix",
      }).success,
    ).toBe(false);
  });

  it("restricts projects to itsvari", () => {
    const project = {
      ...publication,
      canonicalSite: "itsvari",
      syndicateTo: [],
      status: "active",
      summary: "A project",
      title: "A project",
    };

    expect(projectsSchema.safeParse(project).success).toBe(true);
    expect(projectsSchema.safeParse({ ...project, canonicalSite: "v4ri" }).success).toBe(false);
  });

  it("rejects duplicate and self-syndication", () => {
    expect(
      postsSchema.safeParse({
        ...publication,
        canonicalSite: "v4ri",
        syndicateTo: ["itsvari", "itsvari"],
        summary: "A post",
        title: "A post",
      }).success,
    ).toBe(false);
    expect(
      postsSchema.safeParse({
        ...publication,
        canonicalSite: "v4ri",
        syndicateTo: ["v4ri"],
        summary: "A post",
        title: "A post",
      }).success,
    ).toBe(false);
  });
});
