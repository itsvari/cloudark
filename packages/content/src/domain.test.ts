import { describe, expect, it } from "vitest";

import {
  canonicalUrl,
  createActivityFeed,
  escapeXml,
  getEventDisplayPhase,
  getEventPhase,
  isValidCanonicalPair,
  isValidSyndication,
  isPublished,
  sortProjects,
} from "./domain";

const startsAt = new Date("2026-09-12T22:00:00+08:00");
const endsAt = new Date("2026-09-13T02:00:00+08:00");

describe("getEventPhase", () => {
  it("never claims an event is live without a confirmed ending", () => {
    expect(getEventPhase({ startsAt }, new Date(startsAt.getTime() - 1))).toBe("upcoming");
    expect(getEventPhase({ startsAt }, startsAt)).toBe("past");
    expect(getEventPhase({ startsAt }, new Date(startsAt.getTime() + 1))).toBe("past");
  });

  it("derives the phase at exact event boundaries", () => {
    expect(getEventPhase({ endsAt, startsAt }, new Date(startsAt.getTime() - 1))).toBe(
      "upcoming",
    );
    expect(getEventPhase({ endsAt, startsAt }, startsAt)).toBe("live");
    expect(getEventPhase({ endsAt, startsAt }, new Date(endsAt.getTime() - 1))).toBe(
      "live",
    );
    expect(getEventPhase({ endsAt, startsAt }, endsAt)).toBe("past");
  });
});

describe("getEventDisplayPhase", () => {
  it("handles an unknown ending without overriding editorial states", () => {
    expect(getEventDisplayPhase({ eventStatus: "scheduled", startsAt }, startsAt)).toBe("past");
    expect(getEventDisplayPhase({ eventStatus: "postponed", startsAt }, startsAt)).toBe("postponed");
    expect(getEventDisplayPhase({ eventStatus: "cancelled", startsAt }, startsAt)).toBe("cancelled");
  });

  it.each([
    ["2026-09-12T21:59:59+08:00", "upcoming"],
    ["2026-09-12T22:00:00+08:00", "live"],
    ["2026-09-13T02:00:00+08:00", "past"],
  ])("derives scheduled display state at %s", (time, expectedPhase) => {
    expect(getEventDisplayPhase(
      { endsAt, eventStatus: "scheduled", startsAt },
      new Date(time),
    )).toBe(expectedPhase);
  });

  it("lets editorial cancellation and postponement override time", () => {
    const now = new Date("2026-09-12T23:00:00+08:00");

    expect(
      getEventDisplayPhase({ endsAt, eventStatus: "cancelled", startsAt }, now),
    ).toBe("cancelled");
    expect(
      getEventDisplayPhase({ endsAt, eventStatus: "postponed", startsAt }, now),
    ).toBe("postponed");
    expect(
      getEventDisplayPhase({ endsAt, eventStatus: "scheduled", startsAt }, now),
    ).toBe("live");
  });
});

describe("publication", () => {
  const publication = {
    canonicalSite: "v4ri" as const,
    draft: false,
    publishedAt: new Date("2026-08-01T00:00:00Z"),
    syndicateTo: ["itsvari" as const],
  };

  it("publishes canonical content to syndication targets", () => {
    const now = new Date("2026-08-02T00:00:00Z");

    expect(isPublished(publication, "v4ri", now)).toBe(true);
    expect(isPublished(publication, "itsvari", now)).toBe(true);
  });

  it("keeps drafts and future entries private", () => {
    const now = new Date("2026-07-01T00:00:00Z");

    expect(isPublished(publication, "itsvari", now)).toBe(false);
    expect(isPublished({ ...publication, draft: true }, "itsvari", new Date())).toBe(false);
  });

  it("rejects duplicate and self-syndication targets", () => {
    expect(isValidSyndication(publication)).toBe(true);
    expect(
      isValidSyndication({ ...publication, syndicateTo: ["itsvari", "itsvari"] }),
    ).toBe(false);
    expect(
      isValidSyndication({ ...publication, syndicateTo: ["v4ri"] }),
    ).toBe(false);
    expect(
      isPublished({ ...publication, syndicateTo: ["v4ri"] }, "v4ri"),
    ).toBe(false);
  });
});

describe("createActivityFeed", () => {
  it("sorts mixed entries and links to their canonical site", () => {
    const common = {
      draft: false,
      syndicateTo: ["itsvari" as const],
      summary: "Summary",
    };
    const feed = createActivityFeed(
      {
        events: [],
        posts: [
          {
            id: "music-note",
            data: {
              ...common,
              canonicalSite: "v4ri",
              publishedAt: new Date("2026-08-02T00:00:00Z"),
              title: "Music note",
            },
          },
        ],
        projects: [
          {
            id: "portfolio",
            data: {
              ...common,
              canonicalSite: "itsvari",
              featured: true,
              publishedAt: new Date("2026-08-01T00:00:00Z"),
              syndicateTo: [],
              title: "Portfolio",
            },
          },
        ],
        releases: [],
      },
      "itsvari",
      new Date("2026-08-03T00:00:00Z"),
    );

    expect(feed.map(({ id }) => id)).toEqual(["music-note", "portfolio"]);
    expect(feed[0]?.href).toBe("https://v4ri.xyz/posts/music-note");
  });

  it("keeps editorial event status in the activity item", () => {
    const feed = createActivityFeed(
      {
        events: [
          {
            id: "cancelled-gig",
            data: {
              canonicalSite: "v4ri",
              draft: false,
              endsAt,
              eventStatus: "cancelled",
              publishedAt: new Date("2026-08-02T00:00:00Z"),
              startsAt,
              summary: "Cancelled event",
              syndicateTo: ["itsvari"],
              title: "Cancelled gig",
            },
          },
        ],
        posts: [],
        projects: [],
        releases: [],
      },
      "itsvari",
      new Date("2026-09-12T23:00:00+08:00"),
    );

    expect(feed[0]).toMatchObject({
      eventPhase: "cancelled",
      eventStatus: "cancelled",
    });
  });
});

describe("canonicalUrl", () => {
  it("uses site-specific post routes", () => {
    expect(canonicalUrl("post", "hello", "itsvari")).toBe(
      "https://itsvari.com/blog/hello",
    );
    expect(canonicalUrl("post", "hello", "v4ri")).toBe(
      "https://v4ri.xyz/posts/hello",
    );
  });

  it("covers every valid canonical kind/site pair", () => {
    expect(canonicalUrl("event", "gig", "v4ri")).toBe("https://v4ri.xyz/gigs/gig");
    expect(canonicalUrl("release", "mix", "v4ri")).toBe(
      "https://v4ri.xyz/releases/mix",
    );
    expect(canonicalUrl("project", "cloudark", "itsvari")).toBe(
      "https://itsvari.com/projects/cloudark",
    );
    expect(isValidCanonicalPair("post", "itsvari")).toBe(true);
    expect(isValidCanonicalPair("post", "v4ri")).toBe(true);
    expect(isValidCanonicalPair("project", "v4ri")).toBe(false);
    expect(isValidCanonicalPair("event", "itsvari")).toBe(false);
    expect(isValidCanonicalPair("release", "itsvari")).toBe(false);
    expect(() => canonicalUrl("event", "gig", "itsvari" as never)).toThrow(
      "No canonical route exists",
    );
  });
});

describe("sortProjects", () => {
  it("puts featured projects first, then sorts by publication date", () => {
    const entries = [
      { id: "old-featured", data: { featured: true, publishedAt: new Date("2026-08-01") } },
      { id: "new-unfeatured", data: { featured: false, publishedAt: new Date("2026-08-03") } },
      { id: "new-featured", data: { featured: true, publishedAt: new Date("2026-08-04") } },
    ];

    expect(sortProjects(entries).map(({ id }) => id)).toEqual([
      "new-featured",
      "old-featured",
      "new-unfeatured",
    ]);
  });
});

describe("escapeXml", () => {
  it("escapes sitemap text values", () => {
    expect(escapeXml("https://example.com/a?x=1&y=2\"<>")).toBe(
      "https://example.com/a?x=1&amp;y=2&quot;&lt;&gt;",
    );
  });
});
