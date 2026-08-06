"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

export type CoverEdgeStyle =
  | "none"
  | "torn"
  | "torn2"
  | "torn3"
  | "torn4"
  | "wave"
  | "zigzag"
  | "scallop";

export const COVER_EDGE_OPTIONS: { id: CoverEdgeStyle; label: string }[] = [
  { id: "none", label: "Рівний" },
  { id: "torn", label: "Рваний" },
  { id: "torn2", label: "Волокно" },
  { id: "torn3", label: "Грубий" },
  { id: "torn4", label: "Зріз" },
  { id: "wave", label: "Хвиля" },
  { id: "zigzag", label: "Зигзаг" },
  { id: "scallop", label: "Хвильки" },
];

const TORN_VERSION = "7";

/** Full-frame raster masks from user samples (PNG stretches; SVG letterboxes). */
const TORN_MASKS: Record<"torn" | "torn2" | "torn3" | "torn4", { mask: string; preview: string }> = {
  torn: {
    mask: `/edges/torn.png?v=${TORN_VERSION}`,
    preview: `/edges/torn-preview.png?v=${TORN_VERSION}`,
  },
  torn2: {
    mask: `/edges/torn2.png?v=${TORN_VERSION}`,
    preview: `/edges/torn2-preview.png?v=${TORN_VERSION}`,
  },
  torn3: {
    mask: `/edges/torn3.png?v=${TORN_VERSION}`,
    preview: `/edges/torn3-preview.png?v=${TORN_VERSION}`,
  },
  torn4: {
    mask: `/edges/torn4.png?v=${TORN_VERSION}`,
    preview: `/edges/torn4-preview.png?v=${TORN_VERSION}`,
  },
};

function isTornEdge(edge: CoverEdgeStyle): edge is keyof typeof TORN_MASKS {
  return edge in TORN_MASKS;
}

/**
 * Bottom-strip SVGs for geometric edges. Wide viewBox + fixed height strip
 * avoids full-frame SVG letterboxing side gaps.
 */
const EDGE_STRIPS: Record<"wave" | "zigzag" | "scallop", { svg: string; height: number }> = {
  wave: {
    height: 28,
    svg: encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 48" preserveAspectRatio="none">
      <path fill="white" d="M0 0h1200v18C1050 42 900 6 750 28S450 48 300 22 100 40 0 18V0z"/>
    </svg>`),
  },
  zigzag: {
    height: 18,
    svg: encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 32" preserveAspectRatio="none">
      <path fill="white" d="M0 0h1200v10L1125 28 1050 10 975 28 900 10 825 28 750 10 675 28 600 10 525 28 450 10 375 28 300 10 225 28 150 10 75 28 0 10V0z"/>
    </svg>`),
  },
  scallop: {
    height: 20,
    svg: encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 36" preserveAspectRatio="none">
      <path fill="white" d="M0 0h1200v12
        a30 24 0 0 1-60 20 30 24 0 0 1-60-20 30 24 0 0 1-60 20 30 24 0 0 1-60-20
        a30 24 0 0 1-60 20 30 24 0 0 1-60-20 30 24 0 0 1-60 20 30 24 0 0 1-60-20
        a30 24 0 0 1-60 20 30 24 0 0 1-60-20 30 24 0 0 1-60 20 30 24 0 0 1-60-20
        a30 24 0 0 1-60 20 30 24 0 0 1-60-20 30 24 0 0 1-60 20 30 24 0 0 1-60-20
        a30 24 0 0 1-60 20 30 24 0 0 1-60-20 30 24 0 0 1-60 20 30 24 0 0 1-60-20
        a30 24 0 0 1-60 20 30 24 0 0 1-60-20V0z"/>
    </svg>`),
  },
};

export function getCoverEdgeStyle(data: Record<string, unknown>): CoverEdgeStyle {
  const v = data.coverEdge as CoverEdgeStyle | undefined;
  if (v && COVER_EDGE_OPTIONS.some((o) => o.id === v)) return v;
  return "none";
}

/** Bottom edge for colored section bands (non-hero blocks). */
export function getBottomEdgeStyle(data: Record<string, unknown>): CoverEdgeStyle {
  const v = data.bottomEdge as CoverEdgeStyle | undefined;
  if (v && COVER_EDGE_OPTIONS.some((o) => o.id === v)) return v;
  return "none";
}

/** Top edge for section containers. */
export function getTopEdgeStyle(data: Record<string, unknown>): CoverEdgeStyle {
  const v = data.topEdge as CoverEdgeStyle | undefined;
  if (v && COVER_EDGE_OPTIONS.some((o) => o.id === v)) return v;
  return "none";
}

const EDGE_CAP_HEIGHT = 48;

/**
 * Cap strip for top/bottom torn edges on section containers.
 * Torn masks are bottom-oriented; top caps are flipped with scaleY(-1).
 */
export function edgeCapStyle(edge: CoverEdgeStyle, side: "top" | "bottom"): CSSProperties | undefined {
  if (edge === "none") return undefined;

  if (isTornEdge(edge)) {
    return {
      height: EDGE_CAP_HEIGHT,
      WebkitMaskImage: `url("${TORN_MASKS[edge].mask}")`,
      WebkitMaskSize: "100% 280%",
      WebkitMaskPosition: "center bottom",
      WebkitMaskRepeat: "no-repeat",
      maskImage: `url("${TORN_MASKS[edge].mask}")`,
      maskSize: "100% 280%",
      maskPosition: "center bottom",
      maskRepeat: "no-repeat",
      maskMode: "alpha",
      transform: side === "top" ? "scaleY(-1)" : undefined,
      filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.18))",
    };
  }

  const { svg, height } = EDGE_STRIPS[edge];
  return {
    height,
    WebkitMaskImage: `url("data:image/svg+xml,${svg}")`,
    WebkitMaskSize: "100% 100%",
    WebkitMaskPosition: "center",
    WebkitMaskRepeat: "no-repeat",
    maskImage: `url("data:image/svg+xml,${svg}")`,
    maskSize: "100% 100%",
    maskPosition: "center",
    maskRepeat: "no-repeat",
    transform: side === "top" ? "scaleY(-1)" : undefined,
  };
}

export { EDGE_CAP_HEIGHT };

function fullFrameMask(url: string): CSSProperties {
  return {
    WebkitMaskImage: url,
    WebkitMaskSize: "100% 100%",
    WebkitMaskPosition: "center",
    WebkitMaskRepeat: "no-repeat",
    maskImage: url,
    maskSize: "100% 100%",
    maskPosition: "center",
    maskRepeat: "no-repeat",
    maskMode: "alpha",
  };
}

function stripMask(edgeUrl: string, height: number): CSSProperties {
  const body = `linear-gradient(#000 0 0)`;
  return {
    WebkitMaskImage: `${body}, ${edgeUrl}`,
    WebkitMaskSize: `100% calc(100% - ${height - 1}px), 100% ${height}px`,
    WebkitMaskPosition: "top left, bottom left",
    WebkitMaskRepeat: "no-repeat, no-repeat",
    WebkitMaskComposite: "source-over",
    maskImage: `${body}, ${edgeUrl}`,
    maskSize: `100% calc(100% - ${height - 1}px), 100% ${height}px`,
    maskPosition: "top left, bottom left",
    maskRepeat: "no-repeat, no-repeat",
    maskComposite: "add",
  };
}

export function coverEdgeMaskStyle(edge: CoverEdgeStyle): CSSProperties | undefined {
  if (edge === "none") return undefined;

  if (isTornEdge(edge)) {
    return {
      ...fullFrameMask(`url("${TORN_MASKS[edge].mask}")`),
      filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.22))",
    };
  }

  const { svg, height } = EDGE_STRIPS[edge];
  return stripMask(`url("data:image/svg+xml,${svg}")`, height);
}

interface CoverEdgePickerProps {
  value: CoverEdgeStyle;
  onChange: (value: CoverEdgeStyle) => void;
}

export function CoverEdgePicker({ value, onChange }: CoverEdgePickerProps) {
  return (
    <div className="grid grid-cols-4 gap-1">
      {COVER_EDGE_OPTIONS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          title={label}
          onClick={() => onChange(id)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-md border px-1 py-1.5 transition-colors",
            value === id
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40",
          )}
        >
          <EdgePreview style={id} />
          <span className="text-[9px] leading-none">{label}</span>
        </button>
      ))}
    </div>
  );
}

function EdgePreview({ style }: { style: CoverEdgeStyle }) {
  if (style === "none") {
    return <span className="block h-3 w-full border-b-2 border-current" />;
  }
  if (isTornEdge(style)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={TORN_MASKS[style].preview} alt="" className="h-3 w-full object-cover" />
    );
  }
  const paths: Record<"wave" | "zigzag" | "scallop", string> = {
    wave: "M0 5 Q5 1 10 5 T20 5",
    zigzag: "M0 6 L4 2 L8 6 L12 2 L16 6 L20 2",
    scallop: "M0 6 Q2.5 1 5 6 Q7.5 1 10 6 Q12.5 1 15 6 Q17.5 1 20 6",
  };
  return (
    <svg viewBox="0 0 20 8" className="h-3 w-full" aria-hidden>
      <path d={paths[style]} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
