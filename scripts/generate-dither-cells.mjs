// writes packages/ui/src/styles/dither.css from the dither matrix in packages/ui/src/dither-cells.ts.
// run it after changing the matrix, the cell size or the tones; a unit test fails while the two disagree.
import { writeFile } from "node:fs/promises";
import { ditherStylesheet } from "../packages/ui/src/dither-cells.ts";

const stylesheet = new URL("../packages/ui/src/styles/dither.css", import.meta.url);
await writeFile(stylesheet, ditherStylesheet());
console.log(`wrote ${stylesheet.pathname}`);
