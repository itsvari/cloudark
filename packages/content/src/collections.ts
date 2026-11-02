import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import {
  eventsSchema,
  pagesSchema,
  postsSchema,
  projectsSchema,
  releasesSchema,
} from "./schemas";

const posts = defineCollection({
  loader: glob({
    base: new URL("../entries/posts", import.meta.url),
    pattern: "*.md",
  }),
  schema: postsSchema,
});

const events = defineCollection({
  loader: glob({
    base: new URL("../entries/events", import.meta.url),
    pattern: "*.md",
  }),
  schema: eventsSchema,
});

const releases = defineCollection({
  loader: glob({
    base: new URL("../entries/releases", import.meta.url),
    pattern: "*.md",
  }),
  schema: releasesSchema,
});

const projects = defineCollection({
  loader: glob({
    base: new URL("../entries/projects", import.meta.url),
    pattern: "*.md",
  }),
  schema: projectsSchema,
});

const pages = defineCollection({
  loader: glob({
    base: new URL("../entries/pages", import.meta.url),
    pattern: "*.md",
  }),
  schema: pagesSchema,
});

export const collections = { events, pages, posts, projects, releases };
