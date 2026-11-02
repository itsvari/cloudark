import { getCollection, getEntry } from "astro:content";

import {
  createActivityFeed,
  isPublished,
  sortProjects,
  type Site,
} from "./domain";

export async function getActivityFeed(site: Site, now = new Date()) {
  const [posts, events, releases, projects] = await Promise.all([
    getCollection("posts"),
    getCollection("events"),
    getCollection("releases"),
    getCollection("projects"),
  ]);

  return createActivityFeed({ events, posts, projects, releases }, site, now);
}

export async function getPosts(site: Site, now = new Date()) {
  const entries = await getCollection("posts", ({ data }) =>
    isPublished(data, site, now),
  );

  return entries.sort(
    (left, right) => right.data.publishedAt.getTime() - left.data.publishedAt.getTime(),
  );
}

export async function getPost(id: string, site: Site, now = new Date()) {
  const entry = await getEntry("posts", id);
  return entry && entry.data.canonicalSite === site && isPublished(entry.data, site, now)
    ? entry
    : undefined;
}

export async function getEvents(site: Site, now = new Date()) {
  const entries = await getCollection("events", ({ data }) =>
    isPublished(data, site, now),
  );

  return entries.sort(
    (left, right) => left.data.startsAt.getTime() - right.data.startsAt.getTime(),
  );
}

export async function getEvent(id: string, site: Site, now = new Date()) {
  const entry = await getEntry("events", id);
  return entry && entry.data.canonicalSite === site && isPublished(entry.data, site, now)
    ? entry
    : undefined;
}

export async function getPage(id: string) {
  const entry = await getEntry("pages", id);
  return entry && !entry.data.draft ? entry : undefined;
}

export async function getReleases(site: Site, now = new Date()) {
  const entries = await getCollection("releases", ({ data }) =>
    isPublished(data, site, now),
  );

  return entries.sort(
    (left, right) => right.data.releaseDate.getTime() - left.data.releaseDate.getTime(),
  );
}

export async function getRelease(id: string, site: Site, now = new Date()) {
  const entry = await getEntry("releases", id);
  return entry && entry.data.canonicalSite === site && isPublished(entry.data, site, now)
    ? entry
    : undefined;
}

export async function getProjects(site: Site, now = new Date()) {
  const entries = await getCollection("projects", ({ data }) =>
    isPublished(data, site, now),
  );

  return sortProjects(entries);
}

export async function getProject(id: string, site: Site, now = new Date()) {
  const entry = await getEntry("projects", id);
  return entry && entry.data.canonicalSite === site && isPublished(entry.data, site, now)
    ? entry
    : undefined;
}

const featuredLimit = 2;

export async function getFeaturedProjects(limit = featuredLimit, now = new Date()) {
  const projects = await getProjects("itsvari", now);
  return projects.filter(({ data }) => data.featured).slice(0, limit);
}

export async function getFeaturedPosts(site: Site, limit = featuredLimit, now = new Date()) {
  const posts = await getPosts(site, now);
  return posts.filter(({ data }) => data.canonicalSite === site && data.featured).slice(0, limit);
}

export async function getHomeImages() {
  const home = await getPage("home");
  return home?.data.images ?? [];
}
