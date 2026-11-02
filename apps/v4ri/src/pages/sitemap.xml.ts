import { getEvents, getPosts, getReleases } from "@itsvari/content/astro";
import { canonicalUrl, sitemapXml, siteOrigins } from "@itsvari/content";

const staticPaths = ["/", "/gigs", "/posts", "/releases", "/about", "/socials", "/contact"];

export async function GET() {
  const [posts, events, releases] = await Promise.all([
    getPosts("v4ri"),
    getEvents("v4ri"),
    getReleases("v4ri"),
  ]);
  const urls = [
    ...staticPaths.map((path) => new URL(path, siteOrigins.v4ri).toString()),
    ...posts
      .filter(({ data }) => data.canonicalSite === "v4ri")
      .map(({ id }) => canonicalUrl("post", id, "v4ri")),
    ...events
      .filter(({ data }) => data.canonicalSite === "v4ri")
      .map(({ id }) => canonicalUrl("event", id, "v4ri")),
    ...releases
      .filter(({ data }) => data.canonicalSite === "v4ri")
      .map(({ id }) => canonicalUrl("release", id, "v4ri")),
  ];

  return new Response(sitemapXml(urls), {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
