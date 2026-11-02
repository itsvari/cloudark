import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const applications = [
  {
    base: process.argv[2] ?? "http://127.0.0.1:4321",
    name: "itsvari",
    routes: ["/", "/about", "/projects", "/blog", "/cv", "/contact", "/activity"],
  },
  {
    base: process.argv[3] ?? "http://127.0.0.1:4322",
    name: "v4ri",
    routes: ["/", "/gigs", "/releases", "/posts", "/about", "/socials", "/contact"],
  },
];
const routeLimit = 100;
const mediaOrigin = "https://media.itsvari.com";
const mediaPathPrefix = "/cloudark/v1/";
const remoteMediaAssets = new Set();
const decodeAttribute = (value) => value.replaceAll("&amp;", "&");
const removedContent = /M7lc1UVf-VE|basement-tapes-0[12]|\/releases\/low-light|\/blog\/(?:ariadne-collaboration|astro-rearchitecture|soc-ai-website)|\/posts\/(?:dancefloor-notes|recording-the-room)|\/photos\/0[1-5]\.jpg/;

async function readPage(url, expectedStatus = 200) {
  const response = await fetch(url);
  assert.equal(response.status, expectedStatus, `${url} returned ${response.status}`);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/, `${url} must be HTML`);
  const body = await response.text();
  assert.match(body, /<h1[\s>]/, `${url} needs a page heading`);
  assert.match(body, /Skip to content/, `${url} needs a skip link`);
  if (expectedStatus === 200) assert(!removedContent.test(body), `${url} still contains removed sample content`);
  return body;
}

function attributeValue(tag, name) {
  return tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
}

async function checkPressPhotos(body, base) {
  const photographs = [...body.matchAll(/<img\b[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => attributeValue(tag, "class")?.split(" ").includes("carousel-photo"));
  assert.equal(photographs.length, 5, "V4RI home must show the five selected press-kit photographs");
  for (const photograph of photographs) {
    const source = attributeValue(photograph, "src");
    assert(source, "Press photographs need a source");
    assert(attributeValue(photograph, "srcset"), "Press photographs need responsive variants");
    const sourceUrl = new URL(decodeAttribute(source), base);
    assert.equal(sourceUrl.origin, mediaOrigin, "Press photographs must use the R2 media domain");
    assert(sourceUrl.pathname.startsWith(`${mediaPathPrefix}press/`), "Press photographs must use versioned object keys");
    assert.match(sourceUrl.pathname, /-1440w\.webp$/, "The hero fallback must retain its 1440px WebP size");
    assert(Number(attributeValue(photograph, "width")) > 0, "Press photographs need their intrinsic width");
    assert(Number(attributeValue(photograph, "height")) > 0, "Press photographs need their intrinsic height");
  }
  console.log("V4RI press photos: five responsive photographs retain the remote WebP URLs and dimensions");
}

function collectRemoteMedia(body, base) {
  for (const [tag] of body.matchAll(/<img\b[^>]*>/g)) {
    const source = attributeValue(tag, "src");
    assert(!source?.startsWith("/photos/"), "Site images must not depend on local photo binaries");
    const sources = [source, ...(attributeValue(tag, "srcset")?.split(",").map((variant) => variant.trim().split(/\s+/)[0]) ?? [])];
    for (const imageSource of sources) {
      if (!imageSource) continue;
      const imageUrl = new URL(decodeAttribute(imageSource), base);
      if (imageUrl.origin === mediaOrigin) remoteMediaAssets.add(imageUrl.href);
    }
  }
}

async function checkRemoteMedia() {
  const expectedPressVariantCount = 28;
  const expectedPosterCount = 9;
  const maximumImageSizeBytes = 2 * 1024 * 1024;
  const pressVariants = [...remoteMediaAssets].filter((source) => new URL(source).pathname.startsWith(`${mediaPathPrefix}press/`));
  const posters = [...remoteMediaAssets].filter((source) => new URL(source).pathname.startsWith(`${mediaPathPrefix}gigs/`));
  assert.equal(pressVariants.length, expectedPressVariantCount, "All selected press photograph sizes must be available through srcset");
  assert.equal(posters.length, expectedPosterCount, "All nine public gig posters must use R2");
  assert.equal(remoteMediaAssets.size, expectedPressVariantCount + expectedPosterCount, "Media must use the approved versioned keys");
  for (const source of remoteMediaAssets) {
    const response = await fetch(source);
    assert.equal(response.status, 200, `R2 image ${source} is unavailable`);
    assert.match(response.headers.get("content-type") ?? "", /image\//, `${source} must return an image`);
    if (pressVariants.includes(source)) assert.match(response.headers.get("content-type") ?? "", /image\/webp/, `${source} must return WebP`);
    const sizeBytes = (await response.arrayBuffer()).byteLength;
    assert(sizeBytes > 0 && sizeBytes < maximumImageSizeBytes, `${source} must be a small delivery image`);
  }
  console.log(`R2 media: ${pressVariants.length} WebP variants and ${posters.length} posters load from the media domain`);
}

async function checkApplication({ base, name, routes }) {
  const visited = new Set();
  const pending = [...routes];
  const assets = new Set(["/dither.svg", "/fonts/departure-mono-regular.woff2", "/favicon.svg", "/favicon.ico", "/apple-touch-icon.png"]);
  while (pending.length > 0) {
    const path = pending.shift();
    if (visited.has(path)) continue;
    visited.add(path);
    assert(visited.size <= routeLimit, "Route crawl exceeded the expected site size");
    const url = new URL(path, base);
    const body = await readPage(url);
    assert.match(body, /rel="canonical"/, `${url} needs a canonical URL`);
    assert.match(body, /rel="icon" href="\/favicon\.svg" type="image\/svg\+xml"/, `${url} must use the white-line V4RI favicon`);
    collectRemoteMedia(body, base);
    if (name === "v4ri" && path === "/") await checkPressPhotos(body, base);
    for (const [, attribute] of body.matchAll(/\bhref="([^"]+)"/g)) {
      const href = decodeAttribute(attribute);
      if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/__design")) continue;
      const linked = new URL(href, base);
      if (/\.[a-z0-9]+$/i.test(linked.pathname)) continue;
      const linkedPath = `${linked.pathname}${linked.search}`;
      if (!visited.has(linkedPath)) pending.push(linkedPath);
    }
    for (const [, source] of body.matchAll(/\bsrc="(https:\/\/www\.youtube-nocookie\.com\/embed\/[^" ]+)"/g)) {
      assert.match(source, /\/embed\/[a-zA-Z0-9_-]{11}(?:\?|$)/, `${url} has an invalid YouTube embed`);
    }
  }
  for (const asset of assets) {
    const response = await fetch(new URL(asset, base));
    assert.equal(response.status, 200, `${name} asset ${asset} is missing`);
    assert((await response.arrayBuffer()).byteLength > 0, `${name} asset ${asset} is empty`);
  }
  const missing = await readPage(new URL("/__missing_mockup_route__", base), 404);
  assert.match(missing, /Page not found/i);
  for (const feed of ["/rss.xml", "/sitemap.xml"]) {
    const response = await fetch(new URL(feed, base));
    assert.equal(response.status, 200, `${name} ${feed} is unavailable`);
    assert.match(response.headers.get("content-type") ?? "", /xml/);
    assert(!removedContent.test(await response.text()), `${name} ${feed} contains removed sample content`);
  }
  console.log(`${name}: ${visited.size} linked routes, ${assets.size} assets, feeds and HTML 404 passed`);
}

async function checkRestrictedGig(base) {
  const body = await readPage(new URL("/gigs/skf2026", base));
  const main = body.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
  assert(main, "SKF2026 needs a main content area");
  assert.match(main, /<h1[^>]*>SKF2026<\/h1>/);
  const paragraphs = [...main.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)]
    .map(([, paragraph]) => paragraph.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
  assert.equal(paragraphs.length, 2, "SKF2026 must contain only its summary and time paragraph");
  assert.equal(paragraphs[0], "iykyk ;)");
  assert(main.includes('datetime="2026-05-24T14:00:00.000Z"'), "SKF2026 must start at 22:00 SGT");
  assert(main.includes('datetime="2026-05-24T15:00:00.000Z"'), "SKF2026 must end at 23:00 SGT");
  assert(!/<img\b|<iframe\b|<a\b|Where|event details|recording/i.test(main), "SKF2026 must not disclose venue, media or additional links");
  assert(body.includes('name="description" content="iykyk ;)"'), "SKF2026 metadata must use the exact description");
  console.log("SKF2026: exact description, set time and minimal disclosure passed");
}

async function checkRecordings(base) {
  const manifest = JSON.parse(await readFile(new URL("../docs/content/recording-sources.json", import.meta.url), "utf8"));
  const recordings = manifest.recordings;
  assert.equal(recordings.length, 4, "The recording source manifest must contain the four supplied sets");
  const recordingIndex = await readPage(new URL("/releases", base));
  const recordedGigs = await readPage(new URL("/gigs?filter=recorded", base));
  const feed = await (await fetch(new URL("/rss.xml", base))).text();
  const sitemap = await (await fetch(new URL("/sitemap.xml", base))).text();
  const indexedRecordings = new Set([...recordingIndex.matchAll(/href="\/releases\/([^"#?]+)"/g)].map(([, identifier]) => identifier));
  const indexedGigs = new Set([...recordedGigs.matchAll(/href="\/gigs\/([^"#?]+)"/g)].map(([, identifier]) => identifier));
  assert.equal(indexedRecordings.size, 4, "The recordings index must contain exactly four sets");
  assert.equal(indexedGigs.size, 4, "The recorded gig filter must contain exactly four performances");
  for (const recording of recordings) {
    assert(indexedRecordings.has(recording.releaseId), `${recording.label} is missing from the recordings index`);
    assert(indexedGigs.has(recording.eventId), `${recording.label} is missing from the recorded gigs`);
    const gigPath = `/gigs/${recording.eventId}`;
    const recordingPath = `/releases/${recording.releaseId}`;
    const gig = await readPage(new URL(gigPath, base));
    const page = await readPage(new URL(recordingPath, base));
    const embed = `https://www.youtube-nocookie.com/embed/${recording.videoId}`;
    assert(gig.includes(embed), `${gigPath} must embed its supplied recording`);
    assert(page.includes(embed), `${recordingPath} must embed its supplied recording`);
    assert(gig.includes(`href="${recordingPath}"`), `${gigPath} must link to its recording page`);
    assert(page.includes(`href="${gigPath}"`), `${recordingPath} must link to its performance`);
    const canonical = `https://v4ri.xyz${recordingPath}`;
    assert(feed.includes(canonical), `${recordingPath} must appear in V4RI's RSS feed`);
    assert(sitemap.includes(canonical), `${recordingPath} must appear in V4RI's sitemap`);
  }
  console.log("Recordings: all four supplied sets have matching event pages, players, index entries and links");
}

async function checkRemovedContent({ name, base }) {
  const removedPosts = name === "itsvari"
    ? ["/blog/ariadne-collaboration", "/blog/astro-rearchitecture", "/blog/soc-ai-website"]
    : ["/posts/dancefloor-notes", "/posts/recording-the-room", "/releases/basement-tapes-01", "/releases/basement-tapes-02", "/releases/low-light"];
  for (const path of removedPosts) await readPage(new URL(path, base), 404);
  const index = await readPage(new URL(name === "itsvari" ? "/blog" : "/posts", base));
  assert(!/href="\/(?:blog|posts)\/[^"#?]+"/.test(index), `${name} must not list unpublished posts`);
  if (name === "itsvari") {
    const feed = await (await fetch(new URL("/rss.xml", base))).text();
    assert(!/<item[\s>]/.test(feed), "The personal writing feed must not invent posts");
  }
  for (let photographNumber = 1; photographNumber <= 5; photographNumber += 1) {
    const path = `/photos/${String(photographNumber).padStart(2, "0")}.jpg`;
    assert.equal((await fetch(new URL(path, base))).status, 404, `${name} still serves stock photograph ${path}`);
  }
  console.log(`${name}: empty post index, removed sample routes and removed stock photographs passed`);
}

async function checkCvDownload(base) {
  const home = await readPage(new URL("/", base));
  const cv = await readPage(new URL("/cv", base));
  const download = cv.match(/href="(\/cv\/[^" ]+\.pdf)"/i)?.[1];
  assert(download, "The CV page must link directly to its downloadable PDF");
  assert(home.includes(`href="${download}"`), "The personal home must expose the same PDF download");
  const response = await fetch(new URL(download, base));
  assert.equal(response.status, 200, "The PDF CV download is unavailable");
  assert.match(response.headers.get("content-type") ?? "", /application\/pdf/, "The CV download must be a PDF");
  const document = Buffer.from(await response.arrayBuffer());
  assert.equal(document.subarray(0, 5).toString(), "%PDF-", "The CV download must contain a real PDF");
  console.log("CV: personal home and CV page link to the available PDF document");
}

async function checkGigDescriptions(base) {
  const manifest = JSON.parse(await readFile(new URL("../docs/content/gig-sources.json", import.meta.url), "utf8"));
  const publicEvents = manifest.events.filter((event) => event.organiserCopy);
  assert.equal(publicEvents.length, 9, "Nine public performances must retain their original organiser copy");
  for (const event of publicEvents) {
    const source = await readFile(new URL(`../packages/content/entries/events/${event.id}.md`, import.meta.url), "utf8");
    const body = `${source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim()}\n`;
    assert.equal(createHash("sha256").update(body).digest("hex"), event.organiserCopy.markdownSha256, `${event.id} organiser copy differs from its verified source transcription`);
    const page = await readPage(new URL(`/gigs/${event.id}`, base));
    assert(page.includes('id="event-description"'), `${event.id} must display its organiser description`);
    assert(page.includes('id="event-lineup"'), `${event.id} must display the published lineup`);
    if (/^ticketUrl:/m.test(source)) assert(page.includes('class="ticket-link tag"'), `${event.id} must expose its original ticket listing`);
  }
  console.log("Gig descriptions: nine original-copy checksums, description sections and lineups passed");
}

for (const application of applications) {
  await checkApplication(application);
  await checkRemovedContent(application);
  if (application.name === "v4ri") {
    await checkRestrictedGig(application.base);
    await checkRecordings(application.base);
    await checkGigDescriptions(application.base);
  } else {
    await checkCvDownload(application.base);
  }
}
await checkRemoteMedia();
console.log("Mockup route verification passed.");
