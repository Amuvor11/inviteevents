"use client";

import { createContext, type CSSProperties, type ReactNode, type Ref } from "react";
import {
  EDGE_CAP_HEIGHT,
  edgeCapStyle,
  type CoverEdgeStyle,
} from "@/components/dashboard/cover-edge";
import { pageLayoutMetrics, sectionBandStyle } from "@/lib/invite/block-style-utils";
import type { BlockStyle } from "@/types/design";
import type { InviteTheme } from "@/types/invite";
import { cn } from "@/lib/utils/cn";

/** Horizontal insets of the section body — used by edge-to-edge media to break out. */
export const SectionContentInsetsContext = createContext<{ left: number; right: number } | null>(null);

/** Section band background — e.g. timeline icons that need to cover the center line. */
export const SectionSurfaceContext = createContext<string | null>(null);

interface SectionFrameProps {
  backgroundColor: string;
  topEdge: CoverEdgeStyle;
  bottomEdge: CoverEdgeStyle;
  style: BlockStyle;
  theme: InviteTheme;
  children: ReactNode;
  containerRef?: Ref<HTMLDivElement>;
  className?: string;
}

/**
 * Full-bleed colored band with optional torn/wave edges via edge caps
 * (not a full-frame mask on content — that clipped children and broke dual edges).
 */
export function SectionFrame({
  backgroundColor,
  topEdge,
  bottomEdge,
  style,
  theme,
  children,
  containerRef,
  className,
}: SectionFrameProps) {
  const metrics = pageLayoutMetrics(theme);
  const hasTop = topEdge !== "none";
  const hasBottom = bottomEdge !== "none";

  const bleed = sectionBandStyle(
    { ...style, backgroundColor },
    {
      pagePaddingLeft: metrics.pagePaddingLeft,
      pagePaddingRight: metrics.pagePaddingRight,
      blockGap: metrics.blockGap,
      hasBottomEdge: hasBottom || hasTop,
    },
  );

  // Full-bleed geometry without padding — caps must span edge-to-edge.
  // Content padding is applied on the body only (bg still paints under it).
  const shell: CSSProperties = {
    marginLeft: bleed.marginLeft,
    marginRight: bleed.marginRight,
    marginTop: hasTop ? -(metrics.blockGap) : bleed.marginTop,
    marginBottom: bleed.marginBottom,
    width: bleed.width,
    maxWidth: bleed.maxWidth,
    borderRadius: 0,
    backgroundColor: "transparent",
    padding: 0,
  };

  const contentPadL = style.paddingLeft ?? 0;
  const contentPadR = style.paddingRight ?? 0;
  const gap = style.gap ?? 8;

  const body: CSSProperties = {
    backgroundColor,
    paddingTop: style.paddingTop ?? 24,
    paddingBottom: style.paddingBottom ?? 24,
    paddingLeft: contentPadL,
    paddingRight: contentPadR,
    marginTop: hasTop ? -1 : 0,
    marginBottom: hasBottom ? -1 : 0,
  };

  const topCap = hasTop ? edgeCapStyle(topEdge, "top") : undefined;
  const bottomCap = hasBottom ? edgeCapStyle(bottomEdge, "bottom") : undefined;

  return (
    <div ref={containerRef} className={cn("relative", className)} style={shell}>
      {hasTop && topCap && (
        <div
          aria-hidden
          className="relative z-[1] w-full shrink-0"
          style={{ backgroundColor, ...topCap, height: EDGE_CAP_HEIGHT }}
        />
      )}
      <div style={body}>
        <SectionSurfaceContext.Provider value={backgroundColor}>
          <SectionContentInsetsContext.Provider value={{ left: contentPadL, right: contentPadR }}>
            <div className="flex min-h-12 flex-col" style={{ gap }}>
              {children}
            </div>
          </SectionContentInsetsContext.Provider>
        </SectionSurfaceContext.Provider>
      </div>
      {hasBottom && bottomCap && (
        <div
          aria-hidden
          className="relative z-[1] w-full shrink-0"
          style={{ backgroundColor, ...bottomCap, height: EDGE_CAP_HEIGHT }}
        />
      )}
    </div>
  );
}
