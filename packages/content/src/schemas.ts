import { z } from "astro/zod";

const site = z.enum(["itsvari", "v4ri"]);

const publicationFields = {
  draft: z.boolean().default(false),
  syndicateTo: z
    .array(site)
    .default([])
    .refine((targets) => new Set(targets).size === targets.length, {
      message: "syndicateTo must not contain duplicate sites",
    }),
};

const linkMap = z.record(z.string(), z.string().url()).default({});

export const postsSchema = z
  .object({
    ...publicationFields,
    canonicalSite: site,
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
    endsAt: z.coerce.date(),
    eventStatus: z
      .enum(["scheduled", "cancelled", "postponed"])
      .default("scheduled"),
    publishedAt: z.coerce.date(),
    recordingUrl: z.string().url().optional(),
    setlist: z
      .array(
        z.object({
          artist: z.string().min(1),
          title: z.string().min(1),
        }),
      )
      .default([]),
    startsAt: z.coerce.date(),
    summary: z.string().min(1),
    ticketUrl: z.string().url().optional(),
    title: z.string().min(1),
    venue: z.object({
      city: z.string().min(1),
      country: z.string().min(1),
      name: z.string().min(1),
    }),
  })
  .refine(({ syndicateTo }) => !syndicateTo.includes("v4ri"), {
    message: "syndicateTo cannot include canonicalSite",
    path: ["syndicateTo"],
  })
  .refine(({ endsAt, startsAt }) => endsAt > startsAt, {
    message: "endsAt must be later than startsAt",
    path: ["endsAt"],
  });

export const releasesSchema = z
  .object({
    ...publicationFields,
    artwork: z.string().optional(),
    canonicalSite: z.literal("v4ri"),
    links: linkMap,
    publishedAt: z.coerce.date(),
    releaseDate: z.coerce.date(),
    summary: z.string().min(1),
    title: z.string().min(1),
    type: z.enum(["single", "ep", "album", "mix", "edit", "remix"]),
  })
  .refine(({ syndicateTo }) => !syndicateTo.includes("v4ri"), {
    message: "syndicateTo cannot include canonicalSite",
    path: ["syndicateTo"],
  });

export const projectsSchema = z
  .object({
    ...publicationFields,
    canonicalSite: z.literal("itsvari"),
    featured: z.boolean().default(false),
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
  summary: z.string().min(1),
  title: z.string().min(1),
  updatedAt: z.coerce.date().optional(),
});
