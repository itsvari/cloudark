import { Buffer } from "node:buffer";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const repository = new URL("../", import.meta.url);
const applicationRequire = createRequire(new URL("apps/v4ri/package.json", repository));
const astroRequire = createRequire(applicationRequire.resolve("astro"));
const sharp = astroRequire("sharp");
const source = await readFile(new URL("packages/ui/assets/v4ri-white.svg", repository));
const sizesPx = [16, 32, 48];
const headerSizeBytes = 6;
const directoryEntrySizeBytes = 16;
const iconImageType = 1;
const colourPlanes = 1;
const colourDepthBits = 32;
const directory = Buffer.alloc(headerSizeBytes + directoryEntrySizeBytes * sizesPx.length);
directory.writeUInt16LE(iconImageType, 2);
directory.writeUInt16LE(sizesPx.length, 4);
const images = await Promise.all(sizesPx.map((sizePx) => sharp(source).resize(sizePx, sizePx).png().toBuffer()));
let imageOffsetBytes = directory.length;
for (const [index, image] of images.entries()) {
  const entryOffsetBytes = headerSizeBytes + index * directoryEntrySizeBytes;
  directory.writeUInt8(sizesPx[index], entryOffsetBytes);
  directory.writeUInt8(sizesPx[index], entryOffsetBytes + 1);
  directory.writeUInt16LE(colourPlanes, entryOffsetBytes + 4);
  directory.writeUInt16LE(colourDepthBits, entryOffsetBytes + 6);
  directory.writeUInt32LE(image.length, entryOffsetBytes + 8);
  directory.writeUInt32LE(imageOffsetBytes, entryOffsetBytes + 12);
  imageOffsetBytes += image.length;
}
const icon = Buffer.concat([directory, ...images]);
for (const application of ["itsvari", "v4ri"]) {
  const publicDirectory = new URL(`apps/${application}/public/`, repository);
  await writeFile(new URL("favicon.svg", publicDirectory), source);
  await writeFile(new URL("favicon.ico", publicDirectory), icon);
  await sharp(source).resize(180, 180).png().toFile(fileURLToPath(new URL("apple-touch-icon.png", publicDirectory)));
}
console.log("Generated both sites' favicons from the original white-line V4RI logo.");
