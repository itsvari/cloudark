const bases = {
  itsvari: process.env.ITSVARI_SMOKE_BASE_URL ?? process.argv[2],
  v4ri: process.env.V4RI_SMOKE_BASE_URL ?? process.argv[3],
};

if (!bases.itsvari || !bases.v4ri) {
  throw new Error(
    "Set ITSVARI_SMOKE_BASE_URL and V4RI_SMOKE_BASE_URL, or pass both base URLs as arguments.",
  );
}

const requiredSecurityHeaders = [
  "permissions-policy",
  "referrer-policy",
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
];

function urlFor(base, path) {
  return new URL(path, base.endsWith("/") ? base : `${base}/`);
}

async function get(base, path, accept = "*/*") {
  const response = await fetch(urlFor(base, path), {
    headers: { Accept: accept },
  });
  return { body: await response.text(), response };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertSecurityHeaders(response, label) {
  for (const header of requiredSecurityHeaders) {
    assert(response.headers.has(header), `${label} is missing ${header}`);
  }
}

async function checkApp(name, base, { staticPath, routes }) {
  const home = await get(base, "/", "text/html");
  assert(home.response.status === 200, `${name} home returned ${home.response.status}`);
  assert(
    home.response.headers.get("content-type")?.includes("text/html"),
    `${name} home is not HTML`,
  );
  assertSecurityHeaders(home.response, `${name} SSR home`);

  const staticAsset = await get(base, staticPath);
  assert(staticAsset.response.status === 200, `${name} ${staticPath} returned ${staticAsset.response.status}`);
  assertSecurityHeaders(staticAsset.response, `${name} static asset`);

  for (const path of routes) {
    const page = await get(base, path, "text/html");
    assert(page.response.status === 200, `${name} ${path} returned ${page.response.status}`);
    assert(page.response.headers.get("content-type")?.includes("text/html"), `${name} ${path} is not HTML`);
  }

  const missing = await get(base, "/__codex_missing_route__", "text/html");
  assert(missing.response.status === 404, `${name} missing route returned ${missing.response.status}`);
  assert(missing.body.includes("Page not found"), `${name} missing route is not the HTML 404 page`);
  assertSecurityHeaders(missing.response, `${name} HTML 404`);

  for (const path of ["/rss.xml", "/sitemap.xml"]) {
    const feed = await get(base, path);
    assert(feed.response.status === 200, `${name} ${path} returned ${feed.response.status}`);
    assert(
      feed.response.headers.get("cache-control")?.includes("max-age=300"),
      `${name} ${path} does not have the deliberate short cache policy`,
    );
  }
}

await checkApp("itsvari", bases.itsvari, {
  routes: ["/about", "/blog", "/projects", "/contact", "/cv"],
  staticPath: "/about",
});
await checkApp("v4ri", bases.v4ri, {
  routes: ["/gigs", "/posts", "/releases"],
  staticPath: "/robots.txt",
});

console.log("Deployed smoke checks passed for both applications.");
