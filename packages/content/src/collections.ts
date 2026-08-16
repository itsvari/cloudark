import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const site = z.enum(["itsvari", "v4ri"]);

const publicationFields = {
  canonicalSite: site,
  draft: z.boolean().default(false),
  syndicateTo: z.array(site).default([]),
};

const linkMap = z.record(z.string(), z.string().url()).default({});

const posts = defineCollection({
  loader: glob({
    base: new URL("../entries/posts", import.meta.url),
    pattern: "**/*.{md,mdx}",
  }),
  schema: z.object({
    ...publicationFields,
    kind: z.enum(["post", "note", "essay"]).default("post"),
    publishedAt: z.coerce.date(),
    summary: z.string().min(1),
    tags: z.array(z.string()).default([]),
    title: z.string().min(1),
    updatedAt: z.coerce.date().optional(),
  }),
});

const events = defineCollection({
  loader: glob({
    base: new URL("../entries/events", import.meta.url),
    pattern: "**/*.{md,mdx}",
  }),
  schema: z
    .object({
      ...publicationFields,
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
    .refine(({ endsAt, startsAt }) => endsAt > startsAt, {
      message: "endsAt must be later than startsAt",
      path: ["endsAt"],
    }),
});

const releases = defineCollection({
  loader: glob({
    base: new URL("../entries/releases", import.meta.url),
    pattern: "**/*.{md,mdx}",
  }),
  schema: z.object({
    ...publicationFields,
    artwork: z.string().optional(),
    links: linkMap,
    publishedAt: z.coerce.date(),
    releaseDate: z.coerce.date(),
    summary: z.string().min(1),
    title: z.string().min(1),
    type: z.enum(["single", "ep", "album", "mix", "edit", "remix"]),
  }),
});

const projects = defineCollection({
  loader: glob({
    base: new URL("../entries/projects", import.meta.url),
    pattern: "**/*.{md,mdx}",
  }),
  schema: z.object({
    ...publicationFields,
    featured: z.boolean().default(false),
    links: linkMap,
    publishedAt: z.coerce.date(),
    status: z.enum(["active", "complete", "paused", "archived"]),
    summary: z.string().min(1),
    tags: z.array(z.string()).default([]),
    title: z.string().min(1),
  }),
});

const pages = defineCollection({
  loader: glob({
    base: new URL("../entries/pages", import.meta.url),
    pattern: "**/*.{md,mdx}",
  }),
  schema: z.object({
    draft: z.boolean().default(false),
    summary: z.string().min(1),
    title: z.string().min(1),
    updatedAt: z.coerce.date().optional(),
  }),
});

export const collections = { events, pages, posts, projects, releases };
