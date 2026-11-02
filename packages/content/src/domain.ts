export const siteOrigins = {
  itsvari: "https://itsvari.com",
  v4ri: "https://v4ri.xyz",
} as const;

export type Site = keyof typeof siteOrigins;
export type EventPhase = "upcoming" | "live" | "past";
export type EditorialEventStatus = "scheduled" | "cancelled" | "postponed";
export type EventDisplayPhase = EventPhase | Exclude<EditorialEventStatus, "scheduled">;

export interface PublicationData {
  canonicalSite: Site;
  draft: boolean;
  publishedAt: Date;
  syndicateTo: Site[];
}

export interface EventTiming {
  endsAt?: Date;
  startsAt: Date;
}

export type ActivityKind = "event" | "post" | "project" | "release";

export interface ActivityItem {
  canonicalSite: Site;
  date: Date;
  eventPhase?: EventDisplayPhase;
  eventStatus?: EditorialEventStatus;
  href: string;
  id: string;
  kind: ActivityKind;
  summary: string;
  title: string;
}

export interface ActivityEntry<TData> {
  data: TData;
  id: string;
}

export interface PostData extends PublicationData {
  summary: string;
  title: string;
}

export interface EventData extends Omit<PostData, "canonicalSite">, EventTiming {
  canonicalSite: "v4ri";
  eventStatus: EditorialEventStatus;
}

export type ReleaseData = Omit<PostData, "canonicalSite"> & { canonicalSite: "v4ri" };

export interface ProjectData extends Omit<PostData, "canonicalSite"> {
  canonicalSite: "itsvari";
  featured: boolean;
}

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
  // an unknown ending cannot substantiate a live-now claim.
  if (endsAt && now < endsAt) return "live";
  return "past";
}

export function getEventDisplayPhase(
  { endsAt, eventStatus, startsAt }: Pick<EventData, "endsAt" | "eventStatus" | "startsAt">,
  now = new Date(),
): EventDisplayPhase {
  return eventStatus === "scheduled" ? getEventPhase({ endsAt, startsAt }, now) : eventStatus;
}

export function isValidSyndication(
  { canonicalSite, syndicateTo }: Pick<PublicationData, "canonicalSite" | "syndicateTo">,
): boolean {
  return (
    new Set(syndicateTo).size === syndicateTo.length &&
    !syndicateTo.includes(canonicalSite)
  );
}

export function publishesTo(
  { canonicalSite, syndicateTo }: Pick<PublicationData, "canonicalSite" | "syndicateTo">,
  site: Site,
): boolean {
  return isValidSyndication({ canonicalSite, syndicateTo }) &&
    (canonicalSite === site || syndicateTo.includes(site));
}

export function isPublished(
  data: PublicationData,
  site: Site,
  now = new Date(),
): boolean {
  return !data.draft && data.publishedAt <= now && publishesTo(data, site);
}

export function sortProjects<
  T extends ActivityEntry<Pick<ProjectData, "featured" | "publishedAt">>,
>(entries: T[]): T[] {
  return [...entries].sort((left, right) => {
    if (left.data.featured !== right.data.featured) return left.data.featured ? -1 : 1;
    return right.data.publishedAt.getTime() - left.data.publishedAt.getTime();
  });
}

export type CanonicalSiteForKind<K extends ActivityKind> = K extends "project"
  ? "itsvari"
  : K extends "event" | "release"
    ? "v4ri"
    : Site;

export function isValidCanonicalPair(kind: ActivityKind, site: Site): boolean {
  return (
    kind === "post" ||
    (kind === "project" && site === "itsvari") ||
    ((kind === "event" || kind === "release") && site === "v4ri")
  );
}

export function contentPath<K extends ActivityKind>(
  kind: K,
  id: string,
  site: CanonicalSiteForKind<K>,
): string {
  if (!isValidCanonicalPair(kind, site)) {
    throw new Error(`No canonical route exists for ${kind} content on ${site}`);
  }

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

export function canonicalUrl<K extends ActivityKind>(
  kind: K,
  id: string,
  site: CanonicalSiteForKind<K>,
): string {
  return new URL(contentPath(kind, id, site), siteOrigins[site]).toString();
}

export function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "\"":
        return "&quot;";
      case "'":
        return "&apos;";
      default:
        return character;
    }
  });
}

export function createActivityFeed(
  sources: ActivitySources,
  site: Site,
  now = new Date(),
): ActivityItem[] {
  const normalize = <
    K extends ActivityKind,
    TData extends PostData & { canonicalSite: CanonicalSiteForKind<K> },
  >(
    kind: K,
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
      }));

  const normalizeEvents = (entries: ActivityEntry<EventData>[]): ActivityItem[] =>
    entries
      .filter(({ data }) => isPublished(data, site, now))
      .map(({ data, id }) => ({
        canonicalSite: data.canonicalSite,
        date: data.publishedAt,
        eventPhase: getEventDisplayPhase(data, now),
        eventStatus: data.eventStatus,
        href: canonicalUrl("event", id, data.canonicalSite),
        id,
        kind: "event" as const,
        summary: data.summary,
        title: data.title,
      }));

  return [
    ...normalize("post", sources.posts),
    ...normalizeEvents(sources.events),
    ...normalize("release", sources.releases),
    ...normalize("project", sources.projects),
  ].sort((left, right) => right.date.getTime() - left.date.getTime());
}
