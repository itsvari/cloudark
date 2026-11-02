import { escapeXml } from "./domain";

export function sitemapXml(urls: readonly string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`)
    .join("\n")}\n</urlset>`;
}
