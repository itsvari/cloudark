import { z } from "astro/zod";
import { youtubeVideoId } from "./youtube";

const site = z.enum(["itsvari", "v4ri"]);

const contentHref = z.string().min(1).refine((value) => {
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const url = new URL(value);
    return ["https:", "http:", "mailto:"].includes(url.protocol);
  } catch {
    return false;
  }
}, { message: "Use a root-relative path or an HTTP, HTTPS, or mailto URL" });

export const imageSchema = z.object({
  src: z.string().min(1).refine((value) => {
    if (value.startsWith("/") && !value.startsWith("//")) return true;

    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, { message: "Use a root-relative path or an HTTPS image URL" }),
  alt: z.string().min(1),
  exif: z.string().min(1).optional(),
});

export type ContentImage = z.infer<typeof imageSchema>;

const publicationFields = {
  draft: z.boolean().default(false),
  syndicateTo: z
    .array(site)
    .default([])
    .refine((targets) => new Set(targets).size === targets.length, {
      message: "syndicateTo must not contain duplicate sites",
    }),
};

const webUrl = z.string().url().refine((value) => {
  return /^https?:\/\//.test(value);
}, { message: "Use an HTTP or HTTPS URL" });

const linkMap = z.record(z.string(), webUrl).default({});

export const postsSchema = z
  .object({
    ...publicationFields,
    canonicalSite: site,
    featured: z.boolean().default(false),
    image: imageSchema.optional(),
    kind: z.enum(["post", "note", "essay"]).default("post"),
    publishedAt: z.coerce.date(),
    summary: z.string().min(1),
    tags: z.array(z.string()).default([]),
    title: z.string().min(1),
    updatedAt: z.coerce.date().optional(),
  })
  .refine(({ canonicalSite, syndicateTo }) => !syndicateTo.includes(canonicalSite), {
    message: "syndicateTo cannot include canonicalSite",
    path: ["syndicateTo"],
  });

export const eventsSchema = z
  .object({
    ...publicationFields,
    canonicalSite: z.literal("v4ri"),
    disclosure: z.enum(["public", "minimal"]).default("public"),
    endsAt: z.coerce.date().optional(),
    genres: z.array(z.string().min(1)).default([]),
    image: imageSchema.optional(),
    lineup: z.array(z.string().min(1)).default([]),
    eventStatus: z
      .enum(["scheduled", "cancelled", "postponed"])
      .default("scheduled"),
    publishedAt: z.coerce.date(),
    recordingUrl: webUrl.optional(),
    setlist: z
      .array(
        z.object({
          artist: z.string().min(1),
          title: z.string().min(1),
        }),
      )
      .default([]),
    sourceUrl: webUrl.optional(),
    startsAt: z.coerce.date(),
    timeKind: z.enum(["event", "set"]).default("event"),
    timeNote: z.string().min(1).optional(),
    summary: z.string().min(1),
    ticketUrl: webUrl.optional(),
    title: z.string().min(1),
    venue: z.object({
      address: z.string().min(1).optional(),
      city: z.string().min(1),
      country: z.string().min(1),
      name: z.string().min(1),
    }).optional(),
  })
  .refine(({ syndicateTo }) => !syndicateTo.includes("v4ri"), {
    message: "syndicateTo cannot include canonicalSite",
    path: ["syndicateTo"],
  })
  .refine(({ endsAt, startsAt }) => endsAt === undefined || endsAt > startsAt, {
    message: "endsAt must be later than startsAt",
    path: ["endsAt"],
  })
  .superRefine((event, context) => {
    if (event.disclosure !== "minimal") return;
    const restrictedFields = ["venue", "image", "sourceUrl", "ticketUrl", "recordingUrl"] satisfies (keyof typeof event)[];
    for (const field of restrictedFields) {
      if (event[field] === undefined) continue;
      context.addIssue({ code: "custom", message: "Minimal events cannot disclose this metadata", path: [field] });
    }
    for (const field of ["genres", "setlist", "lineup"] satisfies (keyof typeof event)[]) {
      if (event[field].length === 0) continue;
      context.addIssue({ code: "custom", message: "Minimal events cannot disclose this metadata", path: [field] });
    }
  });

export const releasesSchema = z
  .object({
    ...publicationFields,
    artwork: z.string().optional(),
    canonicalSite: z.literal("v4ri"),
    eventId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    image: imageSchema.optional(),
    links: linkMap,
    publishedAt: z.coerce.date(),
    releaseDate: z.coerce.date(),
    summary: z.string().min(1),
    title: z.string().min(1),
    type: z.enum(["single", "ep", "album", "mix", "edit", "remix", "recording"]),
  })
  .refine(({ syndicateTo }) => !syndicateTo.includes("v4ri"), {
    message: "syndicateTo cannot include canonicalSite",
    path: ["syndicateTo"],
  })
  .refine(({ eventId, type }) => type !== "recording" || eventId !== undefined, {
    message: "Recordings must identify their event",
    path: ["eventId"],
  })
  .refine(({ eventId, links }) => eventId === undefined || youtubeVideoId(links.youtube ?? "") !== undefined, {
    message: "Event recordings require a valid YouTube URL",
    path: ["links", "youtube"],
  });

export const projectsSchema = z
  .object({
    ...publicationFields,
    canonicalSite: z.literal("itsvari"),
    featured: z.boolean().default(false),
    image: imageSchema.optional(),
    links: linkMap,
    publishedAt: z.coerce.date(),
    status: z.enum(["active", "complete", "paused", "archived"]),
    summary: z.string().min(1),
    tags: z.array(z.string()).default([]),
    title: z.string().min(1),
  })
  .refine(({ syndicateTo }) => !syndicateTo.includes("itsvari"), {
    message: "syndicateTo cannot include canonicalSite",
    path: ["syndicateTo"],
  });

export const pagesSchema = z.object({
  draft: z.boolean().default(false),
  tagline: z.string().min(1).optional(),
  intro: z.string().min(1).optional(),
  links: z.array(z.object({
    label: z.string().min(1),
    href: contentHref,
  })).default([]),
  now: z.array(z.object({
    label: z.string().min(1),
    value: z.string().min(1),
    href: contentHref.optional(),
    state: z.string().min(1).optional(),
  })).default([]),
  images: z.array(imageSchema).default([]),
  facts: z.array(z.object({
    label: z.string().min(1),
    value: z.string().min(1),
    href: contentHref.optional(),
  })).default([]),
  timeline: z.array(z.object({
    from: z.string().min(1),
    to: z.string().min(1),
    role: z.string().min(1),
    org: z.string().min(1),
  })).default([]),
  summary: z.string().min(1),
  title: z.string().min(1),
  updatedAt: z.coerce.date().optional(),
});
