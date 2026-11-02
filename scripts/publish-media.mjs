import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const executeFile = promisify(execFile);
const manifest = JSON.parse(await readFile(new URL("../docs/content/media-delivery.json", import.meta.url), "utf8"));
const wranglerPath = fileURLToPath(new URL("../node_modules/.bin/wrangler", import.meta.url));
const shouldPublish = process.argv.includes("--publish");
const shouldVerify = process.argv.includes("--verify") || shouldPublish;
const images = manifest.objects.filter((object) => object.kind === "image");

function checksum(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

async function verifyDelivery(objectKey, contents, contentType) {
  const response = await fetch(new URL(objectKey, manifest.origin));
  assert.equal(response.status, 200, `${objectKey}: delivery failed`);
  assert.equal(response.headers.get("content-type"), contentType, `${objectKey}: incorrect content type`);
  assert.equal(response.headers.get("cache-control"), manifest.cacheControl, `${objectKey}: incorrect caching`);
  assert.equal(checksum(new Uint8Array(await response.arrayBuffer())), checksum(contents), `${objectKey}: uploaded bytes differ`);
}

let fileCount = 0;
let totalSizeBytes = 0;
for (const image of images) {
  const sourceUrl = new URL(`../${image.sourcePath}`, import.meta.url);
  const contents = await readFile(sourceUrl);
  assert.equal(checksum(contents), image.sha256, `${image.objectKey}: source changed; use a new versioned key and update the manifest`);
  if (shouldPublish) {
    await executeFile(wranglerPath, [
      "r2", "object", "put", `${manifest.bucketName}/${image.objectKey}`, "--remote",
      "--file", fileURLToPath(sourceUrl), "--content-type", image.contentType,
      "--cache-control", manifest.cacheControl, "--storage-class", "Standard",
    ]);
  }
  if (shouldVerify) await verifyDelivery(image.objectKey, contents, image.contentType);
  fileCount += 1;
  totalSizeBytes += contents.byteLength;
  console.log(`${shouldVerify ? "Verified" : "Planned"} ${image.objectKey}`);
}
console.log(`${fileCount} delivery files, ${totalSizeBytes} bytes. Originals are excluded.`);
if (!shouldVerify) console.log("Pass --publish to upload and verify, or --verify to check existing delivery.");
