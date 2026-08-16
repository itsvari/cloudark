import rss from "@astrojs/rss";
import { getPosts } from "@itsvari/content/astro";
import { canonicalUrl } from "@itsvari/content";

export async function GET(context: { site?: URL }) {
  const posts = await getPosts("itsvari");

  return rss({
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
}
