/// <reference types="node" />
// this package is typed for the browser; the reference above is for this file, which reads the committed stylesheet from disk.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bayerPattern, ditherCells, ditherLevelCount, ditherMaskLayers, ditherMaskSizes, ditherStylesheet, ditherTileSizePx } from "./dither-cells";

describe("ordered dither cells", () => {
  it("uses each threshold of the matrix exactly once", () => {
    const thresholds = bayerPattern.flat().sort((left, right) => left - right);
    expect(thresholds).toEqual(Array.from({ length: ditherLevelCount }, (_, threshold) => threshold));
  });

  it("orders cells by the threshold at which they switch on", () => {
    expect(ditherCells().map(({ threshold }) => threshold)).toEqual(Array.from({ length: ditherLevelCount }, (_, threshold) => threshold));
    expect(ditherCells()[0]).toEqual({ threshold: 0, columnIndex: 0, rowIndex: 0 });
  });

  it("builds one mask layer and one size per threshold, plus a layer that keeps the mask in force when all have collapsed", () => {
    const layers = ditherMaskLayers();
    const sizes = ditherMaskSizes();
    expect(layers).toHaveLength(ditherLevelCount + 1);
    expect(sizes).toHaveLength(layers.length);
    expect(layers.at(-1)).toBe("linear-gradient(transparent, transparent)");
    expect(sizes.at(-1)).toBe("auto");
    expect(sizes[3]).toBe(`calc(${ditherTileSizePx}px * clamp(0, var(--dither-level, ${ditherLevelCount}) - 3, 1))`);
  });

  it("draws each layer as a single cell of the tile", () => {
    for (const layer of ditherMaskLayers().slice(0, ditherLevelCount)) {
      expect(layer.match(/M\d+ \d+h2v2h-2z/g)).toHaveLength(1);
      expect(layer).toContain(`viewBox='0 0 ${ditherTileSizePx} ${ditherTileSizePx}'`);
    }
  });

  it("matches the stylesheet checked into the package", () => {
    const committedStylesheet = readFileSync(new URL("./styles/dither.css", import.meta.url), "utf8");
    expect(committedStylesheet).toBe(ditherStylesheet());
  });
});
