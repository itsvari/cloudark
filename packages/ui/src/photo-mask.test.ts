import { describe, expect, it } from 'vitest';
import { photoMaskGeometry, photoMaskSvg } from './photo-mask';

describe('photo mask geometry', () => {
  it('starts the fade after measured short copy and moves it for longer copy', () => {
    const shortCopy = photoMaskGeometry({ widthPx: 1000, textEndPx: 200 });
    const longCopy = photoMaskGeometry({ widthPx: 1000, textEndPx: 500 });
    expect(shortCopy.fadeStartPx).toBe(216);
    expect(longCopy.fadeStartPx).toBe(516);
  });

  it.each([280, 390, 768, 1280, 2560])('keeps the right-hand image visible at %ipx with wrapped copy', (widthPx) => {
    const geometry = photoMaskGeometry({ widthPx, textEndPx: widthPx });
    expect(geometry.fadeStartPx).toBeCloseTo(widthPx * .6);
    expect(geometry.fadeStartPx + geometry.fadeWidthPx).toBeCloseTo(widthPx * .84);
    expect(geometry.pixelSizePx).toBe(2);
    expect(geometry.tileHeightPx).toBe(8);
  });

  it('keeps the Bayer cells at two CSS pixels at every width', () => {
    const narrowMask = photoMaskSvg(photoMaskGeometry({ widthPx: 390, textEndPx: 120 }));
    const wideMask = photoMaskSvg(photoMaskGeometry({ widthPx: 2560, textEndPx: 120 }));
    expect(narrowMask).toContain('width="390" height="8"');
    expect(wideMask).toContain('width="2560" height="8"');
    expect(narrowMask).toContain('h2v2h-2z');
    expect(wideMask).toContain('h2v2h-2z');
  });

  it('leaves the leading region transparent and the trailing region opaque', () => {
    const geometry = photoMaskGeometry({ widthPx: 100, textEndPx: 10 });
    const svg = photoMaskSvg(geometry);
    expect(svg).not.toContain('M0 ');
    expect(svg).toContain('M98 0h2v2h-2z');
    expect(svg).toContain('M98 6h2v2h-2z');
  });
});
