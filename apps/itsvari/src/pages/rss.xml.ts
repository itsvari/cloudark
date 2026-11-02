import rss from "@astrojs/rss";
import { getPosts } from "@itsvari/content/astro";
import { canonicalUrl } from "@itsvari/content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = await getPosts("itsvari");

  const response = await rss({
    customData: "<language>en-SG</language>",
    description: "Writing and notes from Ashe.",
    items: posts.map((post) => ({
      description: post.data.summary,
      link: canonicalUrl("post", post.id, post.data.canonicalSite),
      pubDate: post.data.publishedAt,
      title: post.data.title,
    })),
    site: context.site ?? new URL("https://itsvari.com"),
    title: "itsvari",
  });

  response.headers.set(
    "Cache-Control",
    "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
  );
  return response;
}
