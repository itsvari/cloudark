import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../docs/content/media-delivery.json", import.meta.url), "utf8"));
const fontOrigins = ["https://itsvari.com", "https://v4ri.xyz"];

async function verifyObject(object) {
  const url = new URL(object.objectKey, manifest.origin);
  const response = await fetch(url);
  assert.equal(response.status, 200, `${url}: media is unavailable`);
  assert.equal(response.headers.get("content-type"), object.contentType, `${url}: incorrect content type`);
  assert.equal(response.headers.get("cache-control"), manifest.cacheControl, `${url}: incorrect caching`);
  const contents = new Uint8Array(await response.arrayBuffer());
  assert.equal(contents.byteLength, object.sizeBytes, `${url}: incorrect file size`);
  const checksum = createHash("sha256").update(contents).digest("hex");
  assert.equal(checksum, object.sha256, `${url}: integrity check failed`);
  if (object.kind !== "font") return;
  for (const origin of fontOrigins) {
    const fontResponse = await fetch(url, { method: "HEAD", headers: { Origin: origin } });
    assert.equal(fontResponse.status, 200, `${url}: font is unavailable to ${origin}`);
    assert.equal(fontResponse.headers.get("access-control-allow-origin"), origin, `${url}: font CORS is missing for ${origin}`);
  }
}

await Promise.all(manifest.objects.map(verifyObject));
console.log(`${manifest.objects.length} R2 images and webfonts verified against their size, checksum, MIME type and immutable caching; font CORS passed.`);
