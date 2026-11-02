import { getPosts, getProjects } from "@itsvari/content/astro";
import { canonicalUrl, sitemapXml, siteOrigins } from "@itsvari/content";

const staticPaths = ["/", "/about", "/blog", "/contact", "/cv", "/projects"];

export async function GET() {
  const [posts, projects] = await Promise.all([
    getPosts("itsvari"),
    getProjects("itsvari"),
  ]);
  const urls = [
    ...staticPaths.map((path) => new URL(path, siteOrigins.itsvari).toString()),
    ...posts
      .filter(({ data }) => data.canonicalSite === "itsvari")
      .map(({ id }) => canonicalUrl("post", id, "itsvari")),
    ...projects
      .filter(({ data }) => data.canonicalSite === "itsvari")
      .map(({ id }) => canonicalUrl("project", id, "itsvari")),
  ];

  return new Response(sitemapXml(urls), {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
