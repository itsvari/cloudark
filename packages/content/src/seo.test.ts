import { describe, expect, it } from "vitest";

import { sitemapXml } from "./seo";

describe("sitemapXml", () => {
  it("serializes and escapes every URL as a sitemap loc", () => {
    expect(sitemapXml(["https://example.com/", "https://example.com/a?x=1&y=2"])).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://example.com/</loc></url>\n  <url><loc>https://example.com/a?x=1&amp;y=2</loc></url>\n</urlset>',
    );
  });
});
