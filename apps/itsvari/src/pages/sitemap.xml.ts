import { getPosts, getProjects } from "@itsvari/content/astro";
import { canonicalUrl, siteOrigins } from "@itsvari/content";

const staticPaths = ["/", "/about", "/blog", "/contact", "/cv", "/projects"];

function xml(urls: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${url}</loc></url>`)
    .join("\n")}\n</urlset>`;
}

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

  return new Response(xml(urls), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
