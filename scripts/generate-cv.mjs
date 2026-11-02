import { Buffer } from "node:buffer";
import { access, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execute = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const outputPath = join(repositoryRoot, "apps/itsvari/public/cv/ashe-andromeda-low-cv.pdf");
const baseUrl = process.env.CV_BASE_URL ?? process.argv[2] ?? "http://localhost:4321";
const documentUrl = new URL("/cv", baseUrl);
const exportTimeoutMs = 60_000;
const fontLoadingBudgetMs = 5_000;
const maximumLogBytes = 1024 * 1024;

async function chromiumExecutable() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter((candidate) => Boolean(candidate));
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  throw new Error("Install Chromium or set CHROMIUM_PATH to its executable.");
}

if (!["http:", "https:"].includes(documentUrl.protocol)) {
  throw new Error("CV_BASE_URL must be an HTTP(S) origin serving the itsvari application.");
}

const response = await fetch(documentUrl);
const document = await response.text();
if (!response.ok || !document.includes("cv-document")) {
  throw new Error(`The CV route is unavailable at ${documentUrl}. Start pnpm dev:itsvari first.`);
}

const executable = await chromiumExecutable();
const temporaryDirectory = await mkdtemp(join(tmpdir(), "cloudark-cv-"));
await mkdir(dirname(outputPath), { recursive: true });

try {
  await execute(executable, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--no-pdf-header-footer",
    "--export-tagged-pdf",
    "--generate-pdf-document-outline",
    `--user-data-dir=${temporaryDirectory}`,
    `--virtual-time-budget=${fontLoadingBudgetMs}`,
    `--print-to-pdf=${outputPath}`,
    documentUrl.href,
  ], { timeout: exportTimeoutMs, maxBuffer: maximumLogBytes });

  const output = await readFile(outputPath);
  if (!output.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    throw new Error("Chromium did not produce a PDF document.");
  }
  console.log(`Generated ${outputPath}`);
  console.log("Verify with pdfinfo, pdftotext and pdffonts, then inspect rendered pages before publishing.");
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true, maxRetries: 3 });
}
