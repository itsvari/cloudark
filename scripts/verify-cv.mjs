import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execute = promisify(execFile);
const documentPath = fileURLToPath(new URL("../apps/itsvari/public/cv/ashe-andromeda-low-cv.pdf", import.meta.url));
const sourcePath = fileURLToPath(new URL("../packages/content/entries/pages/cv.md", import.meta.url));
const expectedPageCount = 2;
const sectionNames = ["Profile", "Education", "Work experience", "Leadership experience", "Projects", "Skills"];
const [metadata, extracted, fonts, source] = await Promise.all([
  execute("pdfinfo", [documentPath]),
  execute("pdftotext", [documentPath, "-"]),
  execute("pdffonts", [documentPath]),
  readFile(sourcePath, "utf8"),
]);

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function wordCounts(content) {
  const words = content.normalize("NFKD").toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return words.reduce((counts, word) => new Map(counts).set(word, (counts.get(word) ?? 0) + 1), new Map());
}

const pageCount = Number(metadata.stdout.match(/^Pages:\s+(\d+)$/m)?.[1]);
requireCondition(pageCount === expectedPageCount, `CV has ${pageCount} pages; review pagination before publishing.`);
requireCondition(/^Tagged:\s+yes$/m.test(metadata.stdout), "CV must retain its tagged reading structure.");
requireCondition(/^Encrypted:\s+no$/m.test(metadata.stdout), "CV must allow text extraction without a password.");
requireCondition(/^JavaScript:\s+no$/m.test(metadata.stdout), "CV must not contain PDF JavaScript.");

const fontEntries = fonts.stdout.trim().split(/\r?\n/).slice(2);
requireCondition(fontEntries.length > 0, "CV has no embedded text fonts.");
for (const entry of fontEntries) {
  const flags = entry.match(/\s+(yes|no)\s+(yes|no)\s+(yes|no)\s+\d+\s+\d+\s*$/);
  requireCondition(flags?.[1] === "yes" && flags[3] === "yes", `Font lacks embedding or Unicode mappings: ${entry}`);
}
for (const family of ["Redaction-Regular", "DepartureMono-Regular"]) {
  requireCondition(fonts.stdout.includes(family), `Required design-system font is missing: ${family}`);
}
requireCondition(!fonts.stdout.includes("TX-02"), "Public CV must use the permitted body fallback until TX-02 embedding rights are confirmed.");

const printableSource = source
  .replace(/^---[\s\S]*?---\s*/, "")
  .replace(/^\[.+\]\(\/projects\/.+\)\s*$/gm, "")
  .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
const expectedWords = wordCounts(printableSource);
const extractedWords = wordCounts(extracted.stdout);
const missingWords = [...expectedWords].filter(([word, count]) => (extractedWords.get(word) ?? 0) < count).map(([word]) => word);
requireCondition(missingWords.length === 0, `PDF text differs from the CV source. Missing words: ${missingWords.join(", ")}`);

const sectionPositions = sectionNames.map((section) => extracted.stdout.indexOf(section));
requireCondition(sectionPositions.every((position, index) => position >= 0 && (index === 0 || position > sectionPositions[index - 1])), "CV sections are missing or extract in the wrong order.");
for (const contact of ["contact@itsvari.com", "linkedin.com/in/itsvari", "itsvari.com"]) {
  requireCondition(extracted.stdout.includes(contact), `Visible contact text is missing: ${contact}`);
}
requireCondition(!extracted.stdout.includes("On this page") && !extracted.stdout.includes("§"), "Web navigation or decorative numbering leaked into the PDF.");

console.log(JSON.stringify({ pages: pageCount, tagged: true, embeddedUnicodeFonts: fontEntries.length, sourceTextComplete: true, sectionOrder: sectionNames, contactsInBody: true }));
