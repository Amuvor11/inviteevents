/** Soft organic blot shapes for dress-code "пляма". */

export type InkSplatInner = {
  path: string;
  dots: { cx: number; cy: number; r: number }[];
};

/**
 * Rounded organic blots (amoeba / ink) — smooth curves, no sharp spikes.
 * Rendered as inline SVG so mobile Safari doesn't drop CSS mask-image.
 */
export const INK_SPLAT_SHAPES: readonly InkSplatInner[] = [
  {
    path: "M58 22c14-4 32 4 38 18 10 4 14 20 8 32 6 10-2 26-16 30-4 12-20 18-32 12-12 8-28 2-34-12-12 0-20-14-16-26-8-8-4-24 8-30 2-12 16-20 28-16 6-6 14-10 16-8z",
    dots: [
      { cx: 26, cy: 36, r: 5 },
      { cx: 94, cy: 40, r: 4 },
      { cx: 88, cy: 88, r: 4.5 },
      { cx: 36, cy: 90, r: 3.5 },
    ],
  },
  {
    path: "M52 24c12-8 30-2 36 12 12 0 20 14 16 28 8 8 4 24-8 30-2 12-16 20-28 16-10 8-26 4-32-10-12 2-22-10-18-22-8-6-6-20 4-26 0-12 12-22 24-18 2-6 8-10 6-10z",
    dots: [
      { cx: 22, cy: 48, r: 4.5 },
      { cx: 98, cy: 52, r: 5 },
      { cx: 70, cy: 96, r: 4 },
      { cx: 42, cy: 18, r: 3.5 },
    ],
  },
  {
    path: "M60 20c16-2 30 10 32 24 10 6 10 22 2 32 6 10-4 24-18 26-6 10-22 12-32 4-10 6-24 0-28-14-10 0-16-14-10-24-6-8 0-22 12-26 2-10 14-18 26-16 6-4 12-6 16-6z",
    dots: [
      { cx: 28, cy: 32, r: 4 },
      { cx: 100, cy: 60, r: 4.5 },
      { cx: 74, cy: 98, r: 3.5 },
      { cx: 40, cy: 94, r: 5 },
    ],
  },
  {
    path: "M56 18c14 0 28 8 32 22 10 4 14 18 8 30 6 8-2 22-14 26-4 10-18 14-28 8-10 6-24 2-30-10-10 2-18-8-16-20-8-6-4-20 6-26 0-10 12-20 24-18 6-6 14-10 18-12z",
    dots: [
      { cx: 24, cy: 40, r: 5 },
      { cx: 96, cy: 36, r: 3.5 },
      { cx: 92, cy: 84, r: 5 },
      { cx: 48, cy: 100, r: 4 },
    ],
  },
  {
    path: "M54 22c12-6 28 0 34 14 10 2 16 16 12 28 6 8 0 22-12 26-2 10-14 16-26 12-10 6-24 2-30-10-10 0-16-12-12-22-6-8-2-20 8-26 2-10 12-18 24-16 0-4 4-6 2-6z",
    dots: [
      { cx: 30, cy: 34, r: 4 },
      { cx: 98, cy: 48, r: 5 },
      { cx: 80, cy: 94, r: 4 },
      { cx: 34, cy: 88, r: 3.5 },
      { cx: 64, cy: 14, r: 3 },
    ],
  },
] as const;

/** @deprecated Prefer INK_SPLAT_SHAPES + inline SVG; kept for any CSS-mask callers. */
function blotDataUri(inner: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <defs>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.8"/>
      </filter>
    </defs>
    <g filter="url(%23soft)">${inner}</g>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export const INK_SPLAT_MASKS = INK_SPLAT_SHAPES.map((shape) =>
  blotDataUri(
    `<path fill="white" d="${shape.path}"/>` +
      shape.dots.map((d) => `<circle fill="white" cx="${d.cx}" cy="${d.cy}" r="${d.r}"/>`).join(""),
  ),
);
