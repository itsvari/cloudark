import { describe, expect, it } from "vitest";

import {
  canonicalUrl,
  createActivityFeed,
  getEventPhase,
  isPublished,
} from "./domain";

const startsAt = new Date("2026-09-12T22:00:00+08:00");
const endsAt = new Date("2026-09-13T02:00:00+08:00");

describe("getEventPhase", () => {
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
              publishedAt: new Date("2026-08-01T00:00:00Z"),
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
    expect(feed[0]?.href).toBe("https://v4ri.wav/posts/music-note");
  });
});

describe("canonicalUrl", () => {
  it("uses site-specific post routes", () => {
    expect(canonicalUrl("post", "hello", "itsvari")).toBe(
      "https://itsvari.com/blog/hello",
    );
    expect(canonicalUrl("post", "hello", "v4ri")).toBe(
      "https://v4ri.wav/posts/hello",
    );
  });
});
