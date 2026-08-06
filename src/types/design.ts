import type { InviteFontId } from "@/lib/invite/fonts";

export type BlockType =
  | "hero"
  | "heading"
  | "text"
  | "image"
  | "monogram"
  | "countdown"
  | "calendar"
  | "details"
  | "divider"
  | "spacer"
  | "icon"
  | "button"
  | "gallery"
  | "dressCode"
  | "schedule"
  | "rsvp"
  | "section";

export type BlockAnimation = "none" | "fade" | "slideUp" | "slideDown" | "zoom";

export type ObjectFit = "cover" | "contain";

export type ObjectPosition =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface TextElementStyle {
  fontFamily?: InviteFontId;
  fontSize?: number;
  color?: string;
  fontWeight?: 400 | 500 | 600 | 700;
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
}

export interface BlockStyle {
  textAlign?: "left" | "center" | "right";
  fontSize?: number;
  fontFamily?: InviteFontId;
  /** Calendar: font for the month title above the grid. Falls back to fontFamily. */
  monthFontFamily?: InviteFontId;
  fontWeight?: 400 | 500 | 600 | 700;
  color?: string;
  /** Day program / icon glyphs. Falls back to `color`. */
  iconColor?: string;
  backgroundColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  /** Gap between nested children (section). */
  gap?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  minHeight?: number;
  maxWidth?: number;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  imageWidth?: number;
  imageHeight?: number;
  objectFit?: ObjectFit;
  objectPosition?: ObjectPosition;
  imageRotation?: number;
  opacity?: number;
}

export interface DesignBlock {
  id: string;
  type: BlockType;
  label: string;
  data: Record<string, unknown>;
  style: BlockStyle;
  animation: BlockAnimation;
  animationDelay?: number;
  /** Entrance animation length in ms. */
  animationDuration?: number;
}

export interface DesignContent {
  version: 1;
  blocks: DesignBlock[];
}
