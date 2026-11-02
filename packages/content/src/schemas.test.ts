import { describe, expect, it } from "vitest";

import {
  eventsSchema,
  imageSchema,
  pagesSchema,
  postsSchema,
  projectsSchema,
  releasesSchema,
} from "./schemas";

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

describe("content photography", () => {
  const image = {
    src: "https://imagedelivery.net/example/room/public",
    alt: "Light over a dancefloor",
    exif: "img_0412 · 35mm · f/1.8 · null room",
  };

  it("accepts Cloudflare delivery URLs and local mockup photography", () => {
    expect(imageSchema.parse(image)).toEqual(image);
    expect(imageSchema.parse({ ...image, src: "/photos/01.jpg" }).src).toBe("/photos/01.jpg");
    expect(imageSchema.parse({ src: "/photos/01.jpg", alt: "A dancefloor" })).toEqual({
      src: "/photos/01.jpg",
      alt: "A dancefloor",
    });
  });

  it("rejects empty alt text and unsafe or ambiguous image sources", () => {
    expect(imageSchema.safeParse({ ...image, alt: "" }).success).toBe(false);
    for (const src of ["", "photos/01.jpg", "//example.com/image.jpg", "javascript:alert(1)"]) {
      expect(imageSchema.safeParse({ ...image, src }).success).toBe(false);
    }
  });

  it("preserves images on every visual content collection", () => {
    expect(eventsSchema.parse({ ...event, genres: ["breaks"], image })).toMatchObject({
      genres: ["breaks"],
      image,
    });
    expect(postsSchema.parse({
      ...publication,
      canonicalSite: "v4ri",
      featured: true,
      image,
      summary: "A post",
      title: "A post",
    })).toMatchObject({ featured: true, image });
    expect(projectsSchema.parse({
      ...publication,
      canonicalSite: "itsvari",
      image,
      status: "active",
      summary: "A project",
      syndicateTo: [],
      title: "A project",
    }).image).toEqual(image);
    expect(releasesSchema.parse({
      ...publication,
      canonicalSite: "v4ri",
      image,
      releaseDate: "2026-08-01",
      summary: "A release",
      title: "A release",
      type: "mix",
    }).image).toEqual(image);
  });

  it("keeps old posts unfeatured and old events without genres valid", () => {
    expect(postsSchema.parse({
      ...publication,
      canonicalSite: "v4ri",
      summary: "A post",
      title: "A post",
    }).featured).toBe(false);
    expect(eventsSchema.parse(event).genres).toEqual([]);
  });
});

describe("editorial pages", () => {
  it("keeps a simple CV entry valid without home or biography fields", () => {
    expect(pagesSchema.parse({ summary: "Current practice", title: "CV" })).toMatchObject({
      draft: false,
      facts: [],
      images: [],
      links: [],
      now: [],
      timeline: [],
    });
  });

  it("preserves home content, biography facts and timeline data", () => {
    const page = pagesSchema.parse({
      summary: "Software and records",
      title: "Home",
      tagline: "writes code, plays records.",
      intro: "Software engineer in Singapore.",
      links: [{ label: "about", href: "/about" }],
      now: [{ label: "building", value: "Cloudark", href: "/projects/cloudark", state: "active" }],
      images: [{ src: "/photos/01.jpg", alt: "A room" }],
      facts: [{ label: "contact", value: "email", href: "mailto:contact@itsvari.com" }],
      timeline: [{ from: "2024", to: "now", role: "Engineer", org: "Independent" }],
    });

    expect(page.now[0]?.state).toBe("active");
    expect(page.facts[0]?.href).toBe("mailto:contact@itsvari.com");
    expect(page.timeline[0]?.to).toBe("now");
    expect(page.images).toHaveLength(1);
  });

  it("rejects incomplete rows and executable editorial links", () => {
    const page = { summary: "A page", title: "A page" };
    expect(pagesSchema.safeParse({ ...page, now: [{ label: "building" }] }).success).toBe(false);
    expect(pagesSchema.safeParse({
      ...page,
      links: [{ label: "unsafe", href: "javascript:alert(1)" }],
    }).success).toBe(false);
    expect(pagesSchema.safeParse({
      ...page,
      timeline: [{ from: "2024", to: "now", role: "Engineer" }],
    }).success).toBe(false);
  });
});


describe("outbound content links", () => {
  it.each(["javascript:alert(1)", "data:text/html,unsafe", "not a url"])("rejects %s for event destinations", (url) => {
    expect(eventsSchema.safeParse({ ...event, ticketUrl: url }).success).toBe(false);
    expect(eventsSchema.safeParse({ ...event, recordingUrl: url }).success).toBe(false);
  });

  it("rejects executable project links and accepts web links", () => {
    const project = {
      canonicalSite: "itsvari",
      publishedAt: "2026-08-01",
      status: "active",
      summary: "A project",
      title: "A project",
    };
    expect(projectsSchema.safeParse({ ...project, links: { source: "javascript:alert(1)" } }).success).toBe(false);
    expect(projectsSchema.safeParse({ ...project, links: { source: "https://github.com/itsvari/cloudark" } }).success).toBe(true);
  });
});


describe("documented event timing and disclosure", () => {
  const minimalEvent = {
    ...publication,
    canonicalSite: "v4ri",
    disclosure: "minimal",
    startsAt: "2026-05-24T22:00:00+08:00",
    endsAt: "2026-05-24T23:00:00+08:00",
    timeKind: "set",
    summary: "iykyk ;)",
    title: "SKF 2026",
  };

  it("accepts a known start without inventing an ending or venue", () => {
    const parsed = eventsSchema.parse({ ...event, endsAt: undefined, venue: undefined, timeNote: "till late" });
    expect(parsed.endsAt).toBeUndefined();
    expect(parsed.venue).toBeUndefined();
    expect(parsed.timeNote).toBe("till late");
    expect(parsed.timeKind).toBe("event");
    expect(parsed.disclosure).toBe("public");
  });

  it("validates a known ending against the documented start", () => {
    expect(eventsSchema.safeParse({ ...event, endsAt: event.startsAt }).success).toBe(false);
    expect(eventsSchema.safeParse({ ...event, endsAt: "2026-09-12T21:00:00+08:00" }).success).toBe(false);
  });

  it("preserves a public historical source independently of ticket sales", () => {
    const parsed = eventsSchema.parse({ ...event, sourceUrl: "https://example.peatix.com/", venue: { ...event.venue, address: "1 Example Road" } });
    expect(parsed.sourceUrl).toBe("https://example.peatix.com/");
    expect(parsed.ticketUrl).toBeUndefined();
    expect(parsed.venue?.address).toBe("1 Example Road");
    expect(eventsSchema.safeParse({ ...event, sourceUrl: "javascript:alert(1)" }).success).toBe(false);
  });

  it("accepts a minimal set with its exact summary and empty optional collections", () => {
    expect(eventsSchema.parse(minimalEvent)).toMatchObject({
      disclosure: "minimal",
      summary: "iykyk ;)",
      timeKind: "set",
      genres: [],
      setlist: [],
      lineup: [],
    });
  });

  it.each([
    { venue: event.venue },
    { image: { src: "/photos/01.jpg", alt: "A room" } },
    { sourceUrl: "https://example.peatix.com/" },
    { ticketUrl: "https://example.peatix.com/" },
    { recordingUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE" },
    { genres: ["example"] },
    { lineup: ["V4RI"] },
    { setlist: [{ artist: "Example", title: "Example" }] },
  ])("rejects extra metadata on a minimal event: %o", (metadata) => {
    expect(eventsSchema.safeParse({ ...minimalEvent, ...metadata }).success).toBe(false);
  });
});


describe("event recording links", () => {
  const recording = {
    ...publication,
    canonicalSite: "v4ri",
    eventId: "blacklight-national-60th-tuff",
    links: { youtube: "https://youtu.be/bVndYY1EUFI" },
    releaseDate: "2025-08-02T22:00:00+08:00",
    summary: "V4RI's recorded set from Tuff Club.",
    title: "Tuff Club Takeover",
    type: "recording",
  };

  it("preserves the event relation and documented performance date", () => {
    expect(releasesSchema.parse(recording)).toMatchObject({
      eventId: "blacklight-national-60th-tuff",
      links: { youtube: "https://youtu.be/bVndYY1EUFI" },
      releaseDate: new Date("2025-08-02T22:00:00+08:00"),
      type: "recording",
    });
  });

  it("requires an event relation for recordings", () => {
    expect(releasesSchema.safeParse({ ...recording, eventId: undefined }).success).toBe(false);
    expect(releasesSchema.safeParse({ ...recording, eventId: "events/nested" }).success).toBe(false);
  });

  it.each([undefined, "https://example.com/watch", "https://youtu.be/invalid", "https://youtube.com.evil.example/watch?v=bVndYY1EUFI"])("rejects an absent or invalid event recording URL: %s", (youtube) => {
    const links = youtube ? { youtube } : {};
    expect(releasesSchema.safeParse({ ...recording, links }).success).toBe(false);
  });
});


describe("event lineups", () => {
  it("keeps the published billing separate from the description", () => {
    const lineup = ["V4RI", "3NiTi"];
    expect(eventsSchema.parse({ ...event, lineup }).lineup).toEqual(lineup);
    expect(eventsSchema.parse(event).lineup).toEqual([]);
    expect(eventsSchema.safeParse({ ...event, lineup: [""] }).success).toBe(false);
  });
});
