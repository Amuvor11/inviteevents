/** Calendar date markers: basic shapes + user-uploaded ring icons. */

export interface CalendarMarkerItem {
  id: string;
  label: string;
  tags: string[];
  kind: "shape" | "icon";
  /** Optional inline SVG (e.g. future / legacy). */
  svg?: string;
  /** Raster silhouette in /public (white on transparent) — tinted via CSS mask. */
  image?: string;
  /** Ring hole center as fraction of image size from top-left (default 0.5, 0.5). */
  imageAnchorX?: number;
  imageAnchorY?: number;
}

export const CALENDAR_MARKER_CATALOG: CalendarMarkerItem[] = [
  { id: "none", label: "Лише колір", tags: ["колір", "текст", "none", "color"], kind: "shape" },
  { id: "circle", label: "Коло", tags: ["коло", "круг", "circle", "fill"], kind: "shape" },
  { id: "ring", label: "Кільце", tags: ["кільце", "обводка", "ring", "outline"], kind: "shape" },
  { id: "square", label: "Квадрат", tags: ["квадрат", "square"], kind: "shape" },
  { id: "underline", label: "Підкреслення", tags: ["лінія", "підкреслення", "underline"], kind: "shape" },
  { id: "heart", label: "Серце", tags: ["серце", "heart", "любов"], kind: "shape" },
  { id: "star", label: "Зірка", tags: ["зірка", "star"], kind: "shape" },
  { id: "diamond", label: "Ромб", tags: ["ромб", "diamond"], kind: "shape" },

  {
    id: "ring-classic",
    label: "Обручка класична",
    tags: ["обручка", "кільце", "діамант", "весілля", "ring", "wedding", "classic"],
    kind: "icon",
    image: "/markers/ring-classic.png",
    imageAnchorX: 0.5,
    imageAnchorY: 0.62,
  },
  {
    id: "ring-jewelry",
    label: "Обручка з каменем",
    tags: ["обручка", "камінь", "ювелір", "ring", "jewelry", "diamond", "весілля"],
    kind: "icon",
    image: "/markers/ring-jewelry.png",
    imageAnchorX: 0.5,
    imageAnchorY: 0.58,
  },
  {
    id: "ring-diamond",
    label: "Обручка в скриньці",
    tags: ["обручка", "скринька", "коробка", "ring", "box", "proposal", "весілля"],
    kind: "icon",
    image: "/markers/ring-diamond.png",
    imageAnchorX: 0.5,
    imageAnchorY: 0.62,
  },
];

export function getCalendarMarker(id: string | undefined): CalendarMarkerItem | undefined {
  if (!id) return undefined;
  return CALENDAR_MARKER_CATALOG.find((m) => m.id === id);
}

export function searchCalendarMarkers(query: string): CalendarMarkerItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return CALENDAR_MARKER_CATALOG;
  return CALENDAR_MARKER_CATALOG.filter(
    (m) =>
      m.label.toLowerCase().includes(q) ||
      m.id.includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q)),
  );
}

export function sanitizeSvgMarkup(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed.toLowerCase().includes("<svg")) return null;
  let svg = trimmed
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi, "");
  if (!/\bviewBox=/i.test(svg)) {
    svg = svg.replace(/<svg\b/i, '<svg viewBox="0 0 48 48"');
  }
  if (!/preserveAspectRatio=/i.test(svg)) {
    svg = svg.replace(/<svg\b/i, '<svg preserveAspectRatio="xMidYMid meet"');
  }
  if (!/stroke=/i.test(svg) && !/fill=/i.test(svg)) {
    svg = svg.replace(
      /<svg\b/i,
      '<svg fill="none" stroke="currentColor" stroke-width="1.75"',
    );
  }
  return svg;
}

export function isShapeMarker(id: string | undefined): boolean {
  return Boolean(id && getCalendarMarker(id)?.kind === "shape");
}

export function isFilledShape(id: string | undefined): boolean {
  return id === "circle" || id === "square";
}

export function isGlyphShape(id: string | undefined): boolean {
  return id === "heart" || id === "star" || id === "diamond";
}

export function isFramingIcon(id: string | undefined): boolean {
  return (
    id === "ring-classic" ||
    id === "ring-jewelry" ||
    id === "ring-diamond" ||
    id === "custom"
  );
}

export type CalendarMarkerAnimation = "fade" | "scale" | "rotate" | "none";

export const CALENDAR_MARKER_ANIMATIONS: {
  id: CalendarMarkerAnimation;
  label: string;
}[] = [
  { id: "fade", label: "Поява" },
  { id: "scale", label: "Зі збільшенням" },
  { id: "rotate", label: "З поворотом" },
  { id: "none", label: "Без анімації" },
];

/** Entrance timing for the calendar block itself (icon starts after this). */
export const CALENDAR_REVEAL = { delay: 0.2, duration: 0.6 } as const;

export function markerMotion(
  anim: CalendarMarkerAnimation = "fade",
  options?: { play?: boolean },
) {
  const play = options?.play ?? true;

  if (anim === "none") {
    return {
      initial: false as const,
      animate: undefined,
      transition: undefined,
    };
  }

  const springScale = {
    type: "spring" as const,
    stiffness: 260,
    damping: 18,
    delay: 0.05,
  };
  const springRotate = {
    type: "spring" as const,
    stiffness: 200,
    damping: 16,
    delay: 0.05,
  };
  const fadeTransition = {
    duration: 0.55,
    ease: "easeOut" as const,
    delay: 0.05,
  };

  switch (anim) {
    case "scale": {
      const hidden = { opacity: 0, scale: 0.35 };
      const visible = { opacity: 1, scale: 1 };
      return {
        initial: hidden,
        animate: play ? visible : hidden,
        transition: play ? springScale : { duration: 0 },
      };
    }
    case "rotate": {
      const hidden = { opacity: 0, scale: 0.85, rotate: -18 };
      const visible = { opacity: 1, scale: 1, rotate: 0 };
      return {
        initial: hidden,
        animate: play ? visible : hidden,
        transition: play ? springRotate : { duration: 0 },
      };
    }
    case "fade":
    default: {
      const hidden = { opacity: 0 };
      const visible = { opacity: 1 };
      return {
        initial: hidden,
        animate: play ? visible : hidden,
        transition: play ? fadeTransition : { duration: 0 },
      };
    }
  }
}
