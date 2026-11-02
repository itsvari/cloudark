const bases = {
  itsvari: process.env.ITSVARI_SMOKE_BASE_URL ?? process.argv[2],
  v4ri: process.env.V4RI_SMOKE_BASE_URL ?? process.argv[3],
};

if (!bases.itsvari || !bases.v4ri) {
  throw new Error(
    "Set ITSVARI_SMOKE_BASE_URL and V4RI_SMOKE_BASE_URL, or pass both base URLs as arguments.",
  );
}

const accessTokens = {
  itsvari: process.env.ITSVARI_SMOKE_ACCESS_TOKEN,
  v4ri: process.env.V4RI_SMOKE_ACCESS_TOKEN,
};
const accessTokenPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
for (const [name, token] of Object.entries(accessTokens)) {
  if (token && !accessTokenPattern.test(token)) {
    throw new Error(`${name}: the Access token must be the CF_Authorization cookie value only.`);
  }
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

async function get(base, path, accept = "*/*", accessToken) {
  const response = await fetch(urlFor(base, path), {
    headers: { Accept: accept, ...(accessToken ? { Cookie: `CF_Authorization=${accessToken}` } : {}) },
    redirect: accessToken ? "manual" : "follow",
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

async function checkApp(name, base, { staticPath, routes, accessToken }) {
  const getPage = (path, accept) => get(base, path, accept, accessToken);
  const home = await getPage("/", "text/html");
  assert(!new URL(home.response.url).hostname.endsWith(".cloudflareaccess.com"), `${name}: staging requires the owner's authenticated CF_Authorization session cookie.`);
  assert(home.response.status === 200, `${name} home returned ${home.response.status}`);
  assert(
    home.response.headers.get("content-type")?.includes("text/html"),
    `${name} home is not HTML`,
  );
  assertSecurityHeaders(home.response, `${name} SSR home`);

  const staticAsset = await getPage(staticPath);
  assert(staticAsset.response.status === 200, `${name} ${staticPath} returned ${staticAsset.response.status}`);
  assertSecurityHeaders(staticAsset.response, `${name} static asset`);

  for (const path of routes) {
    const page = await getPage(path, "text/html");
    assert(page.response.status === 200, `${name} ${path} returned ${page.response.status}`);
    assert(page.response.headers.get("content-type")?.includes("text/html"), `${name} ${path} is not HTML`);
  }

  const missing = await getPage("/__codex_missing_route__", "text/html");
  assert(missing.response.status === 404, `${name} missing route returned ${missing.response.status}`);
  assert(missing.body.includes("Page not found"), `${name} missing route is not the HTML 404 page`);
  assertSecurityHeaders(missing.response, `${name} HTML 404`);

  for (const path of ["/rss.xml", "/sitemap.xml"]) {
    const feed = await getPage(path);
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
  accessToken: accessTokens.itsvari,
});
await checkApp("v4ri", bases.v4ri, {
  routes: ["/gigs", "/posts", "/releases"],
  staticPath: "/robots.txt",
  accessToken: accessTokens.v4ri,
});

console.log("Deployed smoke checks passed for both applications.");
