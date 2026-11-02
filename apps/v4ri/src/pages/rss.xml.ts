import rss from "@astrojs/rss";
import { getActivityFeed } from "@itsvari/content/astro";
import { siteOrigins } from "@itsvari/content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const activity = await getActivityFeed("v4ri");

  const response = await rss({
    customData: "<language>en-SG</language>",
    description: "Gigs and recorded sets from V4RI, Singapore.",
    items: activity.map((item) => ({
      description: item.summary,
      link: item.href,
      pubDate: item.date,
      title: item.title,
    })),
    site: context.site ?? new URL(siteOrigins.v4ri),
    title: "V4RI",
  });

  response.headers.set(
    "Cache-Control",
    "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
  );
  return response;
}
