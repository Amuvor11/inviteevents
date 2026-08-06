import type { CSSProperties } from "react";
import type { BlockStyle, DesignBlock, ObjectPosition } from "@/types/design";
import type { InviteTheme } from "@/types/invite";

/** Phone mock height in the design editor preview. */
export const EDITOR_VIEWPORT_HEIGHT = 680;
/** Outer phone frame width in the design editor. */
export const EDITOR_PHONE_OUTER_WIDTH = 390;
/** Bezel on each side of the phone frame. */
export const EDITOR_PHONE_BEZEL = 12;
/** Content width inside the editor phone — public invite must match for WYSIWYG. */
export const INVITE_CONTENT_MAX_WIDTH = EDITOR_PHONE_OUTER_WIDTH - EDITOR_PHONE_BEZEL * 2;
/** Inner content corner radius: phone outer 2.5rem minus 12px bezel. */
export const EDITOR_SCREEN_RADIUS = "1.75rem";

export type CoverLayout = "boxed" | "edge" | "fullscreen";

export function getCoverLayout(block: DesignBlock): CoverLayout {
  if (block.type !== "hero") return "boxed";
  const layout = block.data.coverLayout as CoverLayout | undefined;
  if (layout === "boxed" || layout === "edge" || layout === "fullscreen") return layout;
  if (block.data.fullScreenCover === true) return "fullscreen";
  return "boxed";
}

/** Edge-to-edge (no page padding) — edge or fullscreen. */
export function isBleedCover(block: DesignBlock): boolean {
  const layout = getCoverLayout(block);
  return layout === "edge" || layout === "fullscreen";
}

export function isFullScreenCover(block: DesignBlock): boolean {
  return getCoverLayout(block) === "fullscreen";
}

const OBJECT_POSITION_CSS: Record<ObjectPosition, string> = {
  center: "center center",
  top: "center top",
  bottom: "center bottom",
  left: "left center",
  right: "right center",
  "top-left": "left top",
  "top-right": "right top",
  "bottom-left": "left bottom",
  "bottom-right": "right bottom",
};

export function objectPositionToCss(position?: ObjectPosition): string {
  return OBJECT_POSITION_CSS[position ?? "center"];
}

export function inlineAlignStyle(align?: BlockStyle["textAlign"]): CSSProperties {
  if (align === "left") return { marginLeft: 0, marginRight: "auto" };
  if (align === "right") return { marginLeft: "auto", marginRight: 0 };
  return { marginLeft: "auto", marginRight: "auto" };
}

export function blockWrapperStyle(style: BlockStyle): CSSProperties {
  const maxWidth = style.maxWidth;
  const hasExplicitHorizontalMargin = style.marginLeft !== undefined || style.marginRight !== undefined;
  const marginAlign =
    !hasExplicitHorizontalMargin && maxWidth && maxWidth < 100
      ? inlineAlignStyle(style.textAlign)
      : { marginLeft: undefined, marginRight: undefined };

  return {
    textAlign: style.textAlign ?? "center",
    paddingTop: style.paddingTop,
    paddingBottom: style.paddingBottom,
    paddingLeft: style.paddingLeft,
    paddingRight: style.paddingRight,
    marginTop: style.marginTop,
    marginBottom: style.marginBottom,
    marginLeft: style.marginLeft,
    marginRight: style.marginRight,
    minHeight: style.minHeight,
    maxWidth: maxWidth ? `${maxWidth}%` : undefined,
    ...marginAlign,
    opacity: style.opacity ?? 1,
  };
}

export function pageLayoutMetrics(theme: InviteTheme) {
  return {
    pagePaddingTop: theme.pagePaddingTop ?? 32,
    pagePaddingBottom: theme.pagePaddingBottom ?? 32,
    pagePaddingLeft: theme.pagePaddingLeft ?? 16,
    pagePaddingRight: theme.pagePaddingRight ?? 16,
    blockGap: theme.blockGap ?? 4,
  };
}

/** Image / gallery can break out of page or section padding (no side frame). */
export function isEdgeToEdgeMedia(block: DesignBlock): boolean {
  return (block.type === "image" || block.type === "gallery") && block.data.edgeToEdge === true;
}

/** Negative margins + width so a child spans the full bleed width of its padded parent. */
export function fullBleedBreakoutStyle(left: number, right: number): CSSProperties {
  if (left === 0 && right === 0) {
    return { width: "100%", maxWidth: "none" };
  }
  return {
    marginLeft: -left,
    marginRight: -right,
    width: `calc(100% + ${left + right}px)`,
    maxWidth: "none",
  };
}

/**
 * Full-bleed section band: background color + optional bottom edge gap collapse.
 * Compensates list page padding so the color runs edge-to-edge.
 */
export function sectionBandStyle(
  style: BlockStyle,
  opts: {
    pagePaddingLeft: number;
    pagePaddingRight: number;
    blockGap: number;
    hasBottomEdge: boolean;
  },
): CSSProperties {
  const bg = style.backgroundColor;
  if (!bg && !opts.hasBottomEdge) return {};

  const result: CSSProperties = {};

  if (bg) {
    const padL = style.paddingLeft ?? 0;
    const padR = style.paddingRight ?? 0;
    result.backgroundColor = bg;
    result.marginLeft = -(opts.pagePaddingLeft);
    result.marginRight = -(opts.pagePaddingRight);
    result.width = `calc(100% + ${opts.pagePaddingLeft + opts.pagePaddingRight}px)`;
    result.maxWidth = "none";
    result.paddingLeft = padL + opts.pagePaddingLeft;
    result.paddingRight = padR + opts.pagePaddingRight;
  }

  if (opts.hasBottomEdge) {
    result.marginBottom = -(opts.blockGap);
    result.borderRadius = 0;
  }

  return result;
}

export function blockListLayoutStyle(theme: InviteTheme): CSSProperties {
  const m = pageLayoutMetrics(theme);
  return {
    display: "flex",
    flexDirection: "column",
    gap: m.blockGap,
    paddingTop: m.pagePaddingTop,
    paddingBottom: m.pagePaddingBottom,
    paddingLeft: m.pagePaddingLeft,
    paddingRight: m.pagePaddingRight,
  };
}

export function imageContainerStyle(style: BlockStyle): CSSProperties {
  return {
    width: `${style.imageWidth ?? 100}%`,
    height: style.imageHeight,
    borderRadius: style.borderRadius,
    transform: style.imageRotation ? `rotate(${style.imageRotation}deg)` : undefined,
    ...inlineAlignStyle(style.textAlign),
  };
}

export function imageFitClass(objectFit?: BlockStyle["objectFit"]): string {
  return objectFit === "contain" ? "object-contain" : "object-cover";
}

export const IMAGE_BLOCK_TYPES = new Set(["hero", "image", "gallery"]);
