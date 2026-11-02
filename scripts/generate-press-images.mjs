import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const applicationDirectory = join(repositoryDirectory, "apps/v4ri");
const assetDirectory = join(applicationDirectory, "src/assets/press");
const outputDirectory = join(assetDirectory, "optimised");
const mediaDirectory = new URL("https://media.itsvari.com/cloudark/v1/press/");
const quality = 76;
const preferredWidthPx = 1440;
const heroWidthsPx = [480, 768, 1024, 1440, 1920, 2560];
const portraitWidthsPx = [360, 540, 720, 1080];
const photographs = [
  { filename: "20250801_130_FHD.jpg", widthsPx: heroWidthsPx },
  { filename: "20250801_137_FHD.jpg", widthsPx: heroWidthsPx },
  { filename: "20250801_165_FHD.jpg", widthsPx: heroWidthsPx },
  { filename: "20250926_38_Fullres.jpg", widthsPx: heroWidthsPx },
  { filename: "20250926_64_Fullres.jpg", widthsPx: heroWidthsPx },
  { filename: "20250801_7_FHD.jpg", widthsPx: portraitWidthsPx },
];
const requireFromApplication = createRequire(join(applicationDirectory, "package.json"));
const { build } = await import(pathToFileURL(requireFromApplication.resolve("astro")).href);
const buildDirectory = await mkdtemp(join(applicationDirectory, ".press-build-"));

try {
  await mkdir(join(buildDirectory, "src/pages"), { recursive: true });
  await writeFile(join(buildDirectory, "package.json"), JSON.stringify({ type: "module" }));
  const imports = photographs.map(({ filename }, index) => `import photograph${index} from ${JSON.stringify(join(assetDirectory, "originals", filename))};`).join("\n");
  const entries = photographs.map(({ filename, widthsPx }, index) => `{ filename: ${JSON.stringify(filename)}, source: photograph${index}, widthsPx: ${JSON.stringify(widthsPx)} }`).join(",\n");
  const endpoint = `import { getImage } from "astro:assets";
${imports}
const photographs = [${entries}];
export async function GET() {
  const entries = await Promise.all(photographs.map(async ({ filename, source, widthsPx }) => ({
    filename,
    variants: await Promise.all(widthsPx.filter((widthPx) => widthPx <= source.width).map(async (widthPx) => {
      const image = await getImage({ src: source, width: widthPx, format: "webp", quality: ${quality} });
      return { src: image.src, widthPx: image.attributes.width, heightPx: image.attributes.height };
    })),
  })));
  return new Response(JSON.stringify(entries));
}`;
  await writeFile(join(buildDirectory, "src/pages/manifest.json.ts"), endpoint);
  await build({ root: buildDirectory, configFile: false, output: "static", logLevel: "warn" });
  const manifest = JSON.parse(await readFile(join(buildDirectory, "dist/manifest.json"), "utf8"));
  await mkdir(outputDirectory, { recursive: true });
  const metadataEntries = [];
  let variantCount = 0;
  for (const photograph of manifest) {
    const remoteVariants = [];
    for (const variant of photograph.variants) {
      const filename = `${photograph.filename.replace(/\.jpg$/, "")}-${variant.widthPx}w.webp`;
      await copyFile(join(buildDirectory, "dist", variant.src.replace(/^\//, "")), join(outputDirectory, filename));
      remoteVariants.push({ src: new URL(filename, mediaDirectory).href, width: variant.widthPx, height: variant.heightPx });
      variantCount += 1;
    }
    const preferred = remoteVariants.find((variant) => variant.width >= preferredWidthPx) ?? remoteVariants.at(-1);
    if (!preferred) throw new Error(`No responsive variants generated for ${photograph.filename}`);
    metadataEntries.push(`  [${JSON.stringify(preferred.src)}, ${JSON.stringify(remoteVariants, null, 2).replaceAll("\n", "\n  ")}],`);
  }
  const metadata = `export interface PressPhotographVariant {\n  readonly src: string;\n  readonly width: number;\n  readonly height: number;\n}\n\nexport const pressPhotographVariants: ReadonlyMap<string, readonly PressPhotographVariant[]> = new Map([\n${metadataEntries.join("\n")}\n]);\n`;
  await writeFile(join(assetDirectory, "variants.ts"), metadata);
  console.log(`Generated ${variantCount} responsive WebP photographs and their R2 URL manifest. Upload the derivatives separately. Originals remain unchanged.`);
} finally {
  await rm(buildDirectory, { recursive: true, force: true });
}
