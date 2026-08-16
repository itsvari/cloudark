import { getEvents, getPosts, getReleases } from "@itsvari/content/astro";
import { canonicalUrl, siteOrigins } from "@itsvari/content";

const staticPaths = ["/", "/gigs", "/posts", "/releases"];

function xml(urls: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${url}</loc></url>`)
    .join("\n")}\n</urlset>`;
}

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

  return new Response(xml(urls), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
