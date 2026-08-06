"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { BLOCK_IN_VIEW_END, DEFAULT_ANIMATION_DURATION_MS } from "@/lib/invite/motion";
import { INK_SPLAT_MASKS } from "@/lib/invite/ink-splat-masks";

export type DressCodeColorShape = "circle" | "blob" | "soft" | "square" | "diamond" | "hex";

export const DRESS_CODE_SHAPES: { id: DressCodeColorShape; label: string }[] = [
  { id: "circle", label: "Коло" },
  { id: "soft", label: "М’яке" },
  { id: "blob", label: "Пляма" },
  { id: "square", label: "Квадрат" },
  { id: "diamond", label: "Ромб" },
  { id: "hex", label: "Грань" },
];

/** Split colors into rows by counts, e.g. [3, 2] → first row 3, second 2. Leftovers continue with the last row size. */
export function chunkColorsByRows(colors: string[], rowSizes: number[]): string[][] {
  if (!colors.length) return [];
  const sizes = rowSizes.filter((n) => n > 0);
  if (!sizes.length) return [colors];

  const rows: string[][] = [];
  let i = 0;
  let rowIdx = 0;
  while (i < colors.length) {
    const size = sizes[Math.min(rowIdx, sizes.length - 1)]!;
    rows.push(colors.slice(i, i + size));
    i += size;
    rowIdx += 1;
  }
  return rows;
}

export function parseColorRows(raw: unknown, colorCount: number): number[] {
  if (Array.isArray(raw) && raw.every((n) => typeof n === "number" && n > 0)) {
    return raw as number[];
  }
  if (colorCount <= 0) return [3, 2];
  if (colorCount <= 3) return [colorCount];
  return [3, Math.max(1, colorCount - 3)];
}

export function parseColorShape(raw: unknown): DressCodeColorShape {
  if (typeof raw === "string" && DRESS_CODE_SHAPES.some((s) => s.id === raw)) {
    return raw as DressCodeColorShape;
  }
  return "circle";
}

function splatMaskStyle(color: string, index: number): CSSProperties {
  const mask = INK_SPLAT_MASKS[index % INK_SPLAT_MASKS.length]!;
  return {
    border: "none",
    borderRadius: 0,
    backgroundColor: color,
    WebkitMaskImage: mask,
    maskImage: mask,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    transform: `rotate(${((index * 47) % 80) - 40}deg)`,
  };
}

function swatchStyle(
  color: string,
  shape: DressCodeColorShape,
  size: number,
  index: number,
): CSSProperties {
  const base: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "block",
  };

  switch (shape) {
    case "soft": {
      const blurPx = Math.max(5, Math.round(size * 0.18));
      return {
        ...base,
        width: "72%",
        height: "72%",
        margin: "auto",
        borderRadius: "50%",
        border: "none",
        backgroundColor: color,
        filter: `blur(${blurPx}px)`,
      };
    }
    case "blob":
      return {
        ...base,
        ...splatMaskStyle(color, index),
      };
    case "square":
      return {
        ...base,
        borderRadius: Math.max(4, Math.round(size * 0.18)),
        border: "1px solid rgba(0,0,0,0.1)",
        backgroundColor: color,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      };
    case "diamond":
      return {
        ...base,
        width: "72%",
        height: "72%",
        margin: "auto",
        borderRadius: Math.max(3, Math.round(size * 0.12)),
        border: "1px solid rgba(0,0,0,0.1)",
        backgroundColor: color,
        transform: "rotate(45deg)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      };
    case "hex":
      return {
        ...base,
        border: "none",
        backgroundColor: color,
        clipPath: "polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)",
      };
    case "circle":
    default:
      return {
        ...base,
        borderRadius: "50%",
        border: "1px solid rgba(0,0,0,0.1)",
        backgroundColor: color,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      };
  }
}

interface DressCodeColorsProps {
  colors: string[];
  rowSizes: number[];
  shape?: DressCodeColorShape;
  size?: number;
  preview?: boolean;
  staggerMs?: number;
  durationMs?: number;
  replayKey?: number;
  className?: string;
}

export function DressCodeColors({
  colors,
  rowSizes,
  shape = "circle",
  size = 44,
  preview = false,
  staggerMs = 120,
  durationMs = DEFAULT_ANIMATION_DURATION_MS,
  replayKey = 0,
  className = "",
}: DressCodeColorsProps) {
  const rows = chunkColorsByRows(colors, rowSizes);
  const gap = Math.max(8, Math.round(size * 0.28));
  let index = 0;

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: staggerMs / 1000,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.55 },
    show: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: durationMs / 1000,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  return (
    <motion.div
      key={replayKey}
      className={`flex flex-col items-center ${className}`}
      style={{ gap }}
      variants={containerVariants}
      initial="hidden"
      {...(preview
        ? { animate: "show" }
        : {
            whileInView: "show",
            // End-of-page friendly: last block still triggers when you can't scroll further
            viewport: BLOCK_IN_VIEW_END,
          })}
    >
      {rows.map((row, rowI) => (
        <div key={`row-${rowI}`} className="flex items-center justify-center" style={{ gap }}>
          {row.map((c) => {
            const i = index++;
            return (
              <motion.span
                key={`${c}-${i}`}
                variants={itemVariants}
                className="inline-flex shrink-0 items-center justify-center overflow-visible"
                style={{ width: size, height: size }}
                title={c}
              >
                <span className="block h-full w-full overflow-visible" style={swatchStyle(c, shape, size, i)} />
              </motion.span>
            );
          })}
        </div>
      ))}
    </motion.div>
  );
}
