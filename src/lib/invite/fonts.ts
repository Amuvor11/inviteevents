/** Invite font catalog — all entries support Cyrillic (Ukrainian). */

export const FONT_OPTIONS = [
  { id: "sans", label: "Sans", cssVar: "--font-geist-sans", sample: "Аа Бб" },
  { id: "serif", label: "Playfair", cssVar: "--font-playfair", sample: "Аа Бб" },
  { id: "cormorant", label: "Cormorant", cssVar: "--font-cormorant", sample: "Аа Бб" },
  { id: "greatVibes", label: "Great Vibes", cssVar: "--font-great-vibes", sample: "Любі Гості" },
  { id: "marckScript", label: "Marck Script", cssVar: "--font-marck-script", sample: "Любі Гості" },
  { id: "caveat", label: "Caveat", cssVar: "--font-caveat", sample: "Любі Гості" },
  { id: "lobster", label: "Lobster", cssVar: "--font-lobster", sample: "Любі Гості" },
  { id: "pacifico", label: "Pacifico", cssVar: "--font-pacifico", sample: "Любі Гості" },
  { id: "badScript", label: "Bad Script", cssVar: "--font-bad-script", sample: "Любі Гості" },
  { id: "philosopher", label: "Philosopher", cssVar: "--font-philosopher", sample: "Аа Бб" },
  { id: "poiret", label: "Poiret One", cssVar: "--font-poiret", sample: "Аа Бб" },
  { id: "arsenal", label: "Arsenal", cssVar: "--font-arsenal", sample: "Аа Бб" },
  { id: "lora", label: "Lora", cssVar: "--font-lora", sample: "Аа Бб" },
  { id: "ebGaramond", label: "EB Garamond", cssVar: "--font-eb-garamond", sample: "Аа Бб" },
  { id: "amatic", label: "Amatic SC", cssVar: "--font-amatic", sample: "ЛЮБІ ГОСТІ" },
] as const;

export type InviteFontId = (typeof FONT_OPTIONS)[number]["id"];

const FONT_IDS = new Set<string>(FONT_OPTIONS.map((f) => f.id));

export function isInviteFontId(value: unknown): value is InviteFontId {
  return typeof value === "string" && FONT_IDS.has(value);
}

export function fontFamilyCss(id?: InviteFontId | string | null): string {
  const opt = FONT_OPTIONS.find((f) => f.id === id);
  return `var(${opt?.cssVar ?? "--font-geist-sans"})`;
}
