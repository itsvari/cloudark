export const siteOrigins = {
  itsvari: "https://itsvari.com",
  v4ri: "https://v4ri.wav",
} as const;

export type Site = keyof typeof siteOrigins;
export type EventPhase = "upcoming" | "live" | "past";
export type EditorialEventStatus = "scheduled" | "cancelled" | "postponed";

export interface PublicationData {
  canonicalSite: Site;
  draft: boolean;
  publishedAt: Date;
  syndicateTo: Site[];
}

export interface EventTiming {
  endsAt: Date;
  startsAt: Date;
}

export type ActivityKind = "event" | "post" | "project" | "release";

export interface ActivityItem {
  canonicalSite: Site;
  date: Date;
  eventPhase?: EventPhase;
  href: string;
  id: string;
  kind: ActivityKind;
  summary: string;
  title: string;
}

interface ActivityEntry<TData> {
  data: TData;
  id: string;
}

interface PostData extends PublicationData {
  summary: string;
  title: string;
}

interface EventData extends PostData, EventTiming {}

interface ReleaseData extends PostData {}

interface ProjectData extends PostData {}

export interface ActivitySources {
  events: ActivityEntry<EventData>[];
  posts: ActivityEntry<PostData>[];
  projects: ActivityEntry<ProjectData>[];
  releases: ActivityEntry<ReleaseData>[];
}

export function getEventPhase(
  { endsAt, startsAt }: EventTiming,
  now = new Date(),
): EventPhase {
  if (now < startsAt) return "upcoming";
  if (now < endsAt) return "live";
  return "past";
}

export function publishesTo(
  { canonicalSite, syndicateTo }: Pick<PublicationData, "canonicalSite" | "syndicateTo">,
  site: Site,
): boolean {
  return canonicalSite === site || syndicateTo.includes(site);
}

export function isPublished(
  data: PublicationData,
  site: Site,
  now = new Date(),
): boolean {
  return !data.draft && data.publishedAt <= now && publishesTo(data, site);
}

export function contentPath(kind: ActivityKind, id: string, site: Site): string {
  switch (kind) {
    case "event":
      return `/gigs/${id}`;
    case "post":
      return site === "itsvari" ? `/blog/${id}` : `/posts/${id}`;
    case "project":
      return `/projects/${id}`;
    case "release":
      return `/releases/${id}`;
  }
}

export function canonicalUrl(kind: ActivityKind, id: string, site: Site): string {
  return new URL(contentPath(kind, id, site), siteOrigins[site]).toString();
}

export function createActivityFeed(
  sources: ActivitySources,
  site: Site,
  now = new Date(),
): ActivityItem[] {
  const normalize = <TData extends PostData>(
    kind: ActivityKind,
    entries: ActivityEntry<TData>[],
  ): ActivityItem[] =>
    entries
      .filter(({ data }) => isPublished(data, site, now))
      .map(({ data, id }) => ({
        canonicalSite: data.canonicalSite,
        date: data.publishedAt,
        href: canonicalUrl(kind, id, data.canonicalSite),
        id,
        kind,
        summary: data.summary,
        title: data.title,
        ...(kind === "event"
          ? { eventPhase: getEventPhase(data as unknown as EventData, now) }
          : {}),
      }));

  return [
    ...normalize("post", sources.posts),
    ...normalize("event", sources.events),
    ...normalize("release", sources.releases),
    ...normalize("project", sources.projects),
  ].sort((left, right) => right.date.getTime() - left.date.getTime());
}
