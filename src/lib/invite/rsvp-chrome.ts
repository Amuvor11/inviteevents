import type { CSSProperties } from "react";
import type { DesignBlock, BlockStyle } from "@/types/design";
import type { InviteTheme } from "@/types/invite";

export type RsvpSurface = "theme" | "glass" | "card" | "custom";

export const RSVP_SURFACES: { id: RsvpSurface; label: string }[] = [
  { id: "theme", label: "Як фон запрошення" },
  { id: "glass", label: "Скло" },
  { id: "card", label: "Картка" },
  { id: "custom", label: "Власний колір" },
];

export function parseRsvpSurface(raw: unknown): RsvpSurface {
  if (typeof raw === "string" && RSVP_SURFACES.some((s) => s.id === raw)) {
    return raw as RsvpSurface;
  }
  return "theme";
}

function parseHex(color: string): { r: number; g: number; b: number } | null {
  const c = color.trim();
  const short = /^#([0-9a-f]{3})$/i.exec(c);
  if (short) {
    const h = short[1]!;
    return {
      r: parseInt(h[0]! + h[0]!, 16),
      g: parseInt(h[1]! + h[1]!, 16),
      b: parseInt(h[2]! + h[2]!, 16),
    };
  }
  const full = /^#([0-9a-f]{6})$/i.exec(c);
  if (full) {
    const h = full[1]!;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(c);
  if (rgb) {
    return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  }
  return null;
}

export function isDarkColor(color: string): boolean {
  const rgb = parseHex(color);
  if (!rgb) return false;
  const lum = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return lum < 0.45;
}

function rgba(color: string, alpha: number, fallback = "255,255,255"): string {
  const rgb = parseHex(color);
  if (!rgb) return `rgba(${fallback},${alpha})`;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

function resolveCardFill(
  surface: RsvpSurface,
  theme: InviteTheme,
  customBg: string,
): string {
  switch (surface) {
    case "glass": {
      const base = isDarkColor(theme.backgroundColor) ? theme.backgroundColor : "#ffffff";
      return rgba(base, theme.glassOpacity ?? 0.85);
    }
    case "card":
      return isDarkColor(theme.backgroundColor) ? rgba("#ffffff", 0.06) : "#ffffff";
    case "custom":
      return customBg;
    case "theme":
    default:
      return theme.backgroundColor;
  }
}

/** Solid color used to judge field contrast (ignore alpha). */
function contrastBase(
  surface: RsvpSurface,
  theme: InviteTheme,
  customBg: string,
): string {
  switch (surface) {
    case "card":
      return isDarkColor(theme.backgroundColor) ? theme.backgroundColor : "#ffffff";
    case "custom":
      return customBg;
    case "glass":
    case "theme":
    default:
      return theme.backgroundColor;
  }
}

export interface RsvpChrome {
  surface: RsvpSurface;
  showShadow: boolean;
  showBorder: boolean;
  cardBackground: string;
  borderRadius: number;
  fieldBackground: string;
  fieldBorder: string;
  fieldColor: string;
  cardStyle: CSSProperties;
  cardClassName: string;
}

export function resolveRsvpChrome(
  theme: InviteTheme,
  block?: Pick<DesignBlock, "data" | "style"> | null,
): RsvpChrome {
  const data = block?.data ?? {};
  const style = (block?.style ?? {}) as BlockStyle;
  const surface = parseRsvpSurface(data.surface);
  const showShadow = data.showShadow === true;
  // Theme surface blends in — border off by default; others on unless explicitly false
  const showBorder =
    data.showBorder === true || (data.showBorder !== false && surface !== "theme");
  const customBg =
    typeof style.backgroundColor === "string" && style.backgroundColor !== "transparent"
      ? style.backgroundColor
      : theme.primaryColor;
  const borderRadius = style.borderRadius ?? 16;

  const cardBackground = resolveCardFill(surface, theme, customBg);
  const base = contrastBase(surface, theme, customBg);
  const cardIsDark = isDarkColor(base);

  let cardClassName = "mx-auto max-w-lg p-6 sm:p-8";
  const cardStyle: CSSProperties = {
    borderRadius,
    backgroundColor: cardBackground,
  };

  if (surface === "glass") {
    cardClassName += " backdrop-blur-xl";
  }
  if (showBorder) {
    cardClassName += " border";
    cardStyle.borderColor = cardIsDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  }
  if (showShadow) {
    cardClassName += surface === "glass" ? " shadow-xl" : " shadow-sm";
  }

  return {
    surface,
    showShadow,
    showBorder,
    cardBackground,
    borderRadius,
    fieldBackground: cardIsDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
    fieldBorder: cardIsDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)",
    fieldColor: theme.textColor,
    cardStyle,
    cardClassName,
  };
}
