import rss from "@astrojs/rss";
import { getPosts } from "@itsvari/content/astro";
import { canonicalUrl } from "@itsvari/content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = await getPosts("v4ri");

  const response = await rss({
    customData: "<language>en-SG</language>",
    description: "DJ and production notes from v4ri.",
    items: posts.map((post) => ({
      description: post.data.summary,
      link: canonicalUrl("post", post.id, post.data.canonicalSite),
      pubDate: post.data.publishedAt,
      title: post.data.title,
    })),
    site: context.site ?? new URL("https://v4ri.wav"),
    title: "v4ri.wav",
  });

  response.headers.set(
    "Cache-Control",
    "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
  );
  return response;
}
