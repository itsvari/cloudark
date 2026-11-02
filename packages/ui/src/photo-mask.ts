export interface PhotoMaskGeometry {
  readonly widthPx: number;
  readonly fadeStartPx: number;
  readonly fadeWidthPx: number;
  readonly pixelSizePx: number;
  readonly tileHeightPx: number;
}

interface PhotoMaskMeasurements {
  readonly widthPx: number;
  readonly textEndPx?: number;
}

const pixelSizePx = 2;
const bayerPattern = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const bayerSideLength = bayerPattern.length;
const bayerLevelCount = bayerSideLength * bayerSideLength;
const textClearancePx = 16;
const minimumFadeStartRatio = .12;
const maximumFadeStartRatio = .6;
const fallbackFadeStartRatio = .4;
const preferredFadeWidthRatio = .36;
const maximumFadeEndRatio = .84;

export function photoMaskGeometry({ widthPx, textEndPx }: PhotoMaskMeasurements): PhotoMaskGeometry {
  const measuredStartPx = textEndPx === undefined ? widthPx * fallbackFadeStartRatio : textEndPx + textClearancePx;
  const fadeStartPx = Math.min(widthPx * maximumFadeStartRatio, Math.max(widthPx * minimumFadeStartRatio, measuredStartPx));
  const fadeWidthPx = Math.min(widthPx * preferredFadeWidthRatio, widthPx * maximumFadeEndRatio - fadeStartPx);
  return { widthPx, fadeStartPx, fadeWidthPx, pixelSizePx, tileHeightPx: bayerSideLength * pixelSizePx };
}

export function photoMaskSvg(geometry: PhotoMaskGeometry): string {
  const { widthPx, fadeStartPx, fadeWidthPx, pixelSizePx, tileHeightPx } = geometry;
  const columnCount = Math.ceil(widthPx / pixelSizePx);
  const path = bayerPattern.flatMap((thresholds, rowIndex) => Array.from({ length: columnCount }, (_, columnIndex) => {
    const horizontalPositionPx = columnIndex * pixelSizePx;
    const coverage = Math.min(1, Math.max(0, (horizontalPositionPx - fadeStartPx) / fadeWidthPx));
    const threshold = thresholds[columnIndex % bayerSideLength] ?? 0;
    if (coverage * bayerLevelCount <= threshold) return '';
    return `M${horizontalPositionPx} ${rowIndex * pixelSizePx}h${pixelSizePx}v${pixelSizePx}h-${pixelSizePx}z`;
  })).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${tileHeightPx}" shape-rendering="crispEdges"><path d="${path}"/></svg>`;
}
