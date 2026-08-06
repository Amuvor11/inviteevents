import type { InviteTheme } from "@/types/invite";

const LAYOUT_DEFAULTS: Record<string, Partial<InviteTheme>> = {
  romantic: {
    primaryColor: "#8b2942",
    secondaryColor: "#f5f0eb",
    accentColor: "#c9a87c",
    backgroundColor: "#1a1412",
    textColor: "#2c2420",
    fontFamily: "var(--font-geist-sans)",
    serifFontFamily: "var(--font-cormorant)",
    showCalendar: true,
    countdownStyle: "elegant",
    locale: "uk",
    glassOpacity: 0.88,
    backgroundOverlay: 0.35,
  },
  elegant: {
    primaryColor: "#5c4a3d",
    secondaryColor: "#e8ddd4",
    accentColor: "#a69080",
    backgroundColor: "#d4c4b8",
    textColor: "#3d3229",
    fontFamily: "var(--font-geist-sans)",
    serifFontFamily: "var(--font-cormorant)",
    showCalendar: false,
    countdownStyle: "elegant",
    locale: "uk",
    glassOpacity: 0.75,
    backgroundOverlay: 0.5,
  },
  minimal: {
    primaryColor: "#18181b",
    secondaryColor: "#fafafa",
    accentColor: "#71717a",
    backgroundColor: "#ffffff",
    textColor: "#18181b",
    fontFamily: "var(--font-geist-sans)",
    serifFontFamily: "var(--font-geist-sans)",
    showCalendar: false,
    countdownStyle: "inline",
    locale: "uk",
    glassOpacity: 0.9,
    backgroundOverlay: 0.2,
  },
  classic: {
    primaryColor: "#7c3aed",
    secondaryColor: "#f4f4f5",
    accentColor: "#a78bfa",
    backgroundColor: "#fafafa",
    textColor: "#0a0a0a",
    fontFamily: "var(--font-geist-sans)",
    serifFontFamily: "var(--font-playfair)",
    showCalendar: true,
    countdownStyle: "cards",
    locale: "uk",
    glassOpacity: 0.85,
    backgroundOverlay: 0.45,
  },
};

const BASE: InviteTheme = {
  primaryColor: "#7c3aed",
  secondaryColor: "#f4f4f5",
  accentColor: "#a78bfa",
  backgroundColor: "#fafafa",
  textColor: "#0a0a0a",
  fontFamily: "var(--font-geist-sans)",
  serifFontFamily: "var(--font-playfair)",
  showCalendar: true,
  countdownStyle: "cards",
  locale: "uk",
  glassOpacity: 0.85,
  backgroundOverlay: 0.4,
};

export function resolveInviteTheme(
  layout: string,
  custom?: Partial<InviteTheme> | null,
): InviteTheme {
  const layoutDefaults = LAYOUT_DEFAULTS[layout] ?? LAYOUT_DEFAULTS.classic;
  return { ...BASE, ...layoutDefaults, ...custom };
}

export function deriveMonogram(hostNames: string | null, monogram?: string): string {
  if (monogram?.trim()) return monogram.trim().slice(0, 3).toUpperCase();
  if (!hostNames) return "";
  const parts = hostNames.split(/[&+,]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return hostNames.slice(0, 2).toUpperCase();
}
