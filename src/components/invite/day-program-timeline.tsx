"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

export type DayProgramIconId =
  | "glass"
  | "rings"
  | "dinner"
  | "heart"
  | "cake"
  | "camera"
  | "car"
  | "church"
  | "star";

export interface DayProgramItem {
  id: string;
  title: string;
  time: string;
  icon?: DayProgramIconId;
}

/** PNG assets from `public/icon/` — tinted via CSS mask (any color). */
export const DAY_PROGRAM_ICON_SRC: Record<DayProgramIconId, string> = {
  glass: "/icon/free-icon-wine-glass-1942436.png",
  rings: "/icon/free-icon-rings-706455.png",
  dinner: "/icon/free-icon-banquet-7381833.png",
  heart: "/icon/free-icon-heart-1077035.png",
  cake: "/icon/free-icon-birthday-cake-1244336.png",
  camera: "/icon/free-icon-camera-964062.png",
  car: "/icon/free-icon-cars-6809673.png",
  church: "/icon/free-icon-churches-2569673.png",
  star: "/icon/free-icon-favorite-11238109.png",
};

export const DAY_PROGRAM_ICONS: { id: DayProgramIconId; label: string }[] = [
  { id: "glass", label: "Келих" },
  { id: "rings", label: "Обручки" },
  { id: "dinner", label: "Банкет" },
  { id: "heart", label: "Серце" },
  { id: "cake", label: "Торт" },
  { id: "camera", label: "Фото" },
  { id: "car", label: "Авто" },
  { id: "church", label: "Церква" },
  { id: "star", label: "Зірка" },
];

function resolveIconId(raw: unknown): DayProgramIconId {
  if (typeof raw === "string" && raw in DAY_PROGRAM_ICON_SRC) {
    return raw as DayProgramIconId;
  }
  if (raw === "music") return "star";
  return "star";
}

function iconMaskStyle(src: string, color: string, size: number): CSSProperties {
  return {
    width: size,
    height: size,
    backgroundColor: color,
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    // Black PNG glyphs on transparent → tint via backgroundColor
    maskMode: "alpha",
  };
}

export function DayProgramIcon({
  id,
  size = 28,
  color = "#1a1a1a",
  className,
}: {
  id: DayProgramIconId;
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block shrink-0 select-none", className)}
      style={iconMaskStyle(DAY_PROGRAM_ICON_SRC[id], color, size)}
      role="img"
      aria-hidden
    />
  );
}

interface DayProgramTimelineProps {
  items: DayProgramItem[];
  color?: string;
  /** Tint for icons + timeline line. Falls back to `color`. */
  iconColor?: string;
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  lineColor?: string;
  /** Vertical gap between program rows (px). */
  itemGap?: number;
  /** Background behind icons so the timeline line appears broken. */
  surfaceColor?: string;
  className?: string;
}

export const DEFAULT_DAY_PROGRAM_ITEM_GAP = 36;

export function DayProgramTimeline({
  items,
  color = "#1a1a1a",
  iconColor,
  fontFamily,
  fontWeight = 400,
  fontSize = 15,
  lineColor,
  itemGap = DEFAULT_DAY_PROGRAM_ITEM_GAP,
  surfaceColor = "#ffffff",
  className = "",
}: DayProgramTimelineProps) {
  const tint = iconColor || color;
  const stroke = lineColor || tint;
  if (!items.length) return null;

  const iconSize = Math.round(fontSize * 1.85);
  const gap = Math.max(0, itemGap);

  return (
    <div
      className={cn("mx-auto w-full max-w-md px-1", className)}
      style={{ color, fontFamily, fontWeight, fontSize }}
    >
      <div className="relative">
        <div
          className="pointer-events-none absolute bottom-5 left-1/2 top-5 w-px -translate-x-1/2"
          style={{ backgroundColor: stroke, opacity: 0.55 }}
          aria-hidden
        />

        <ul className="relative" style={{ display: "flex", flexDirection: "column", gap }}>
          {items.map((item) => {
            const icon = resolveIconId(item.icon);

            return (
              <li key={item.id} className="grid grid-cols-[1fr_3.25rem_1fr] items-center gap-2 sm:gap-3">
                <p className="text-right text-[0.82em] uppercase leading-snug tracking-[0.07em]">
                  {item.title}
                </p>
                <div
                  className="relative z-1 mx-auto flex h-12 w-12 items-center justify-center"
                  style={{ backgroundColor: surfaceColor }}
                >
                  <DayProgramIcon id={icon} size={iconSize} color={tint} />
                </div>
                <p className="text-left text-[0.95em] tabular-nums tracking-wide">{item.time}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function parseDayProgramItems(raw: unknown): DayProgramItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
    .map((x, i) => ({
      id: typeof x.id === "string" ? x.id : `item-${i}`,
      title: typeof x.title === "string" ? x.title : "",
      time: typeof x.time === "string" ? x.time : "",
      icon: resolveIconId(x.icon),
    }))
    .filter((x) => x.title.trim() || x.time.trim());
}
