"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { DEFAULT_ANIMATION_DURATION_MS } from "@/lib/invite/motion";
import { INK_SPLAT_SHAPES } from "@/lib/invite/ink-splat-masks";

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

function BlobSwatch({ color, index }: { color: string; index: number }) {
  const uid = useId().replace(/:/g, "");
  const shape = INK_SPLAT_SHAPES[index % INK_SPLAT_SHAPES.length]!;
  const filterId = `ink-soft-${uid}-${index}`;
  const rot = ((index * 47) % 80) - 40;

  return (
    <svg
      viewBox="0 0 120 120"
      width="100%"
      height="100%"
      aria-hidden
      style={{ display: "block", transform: `rotate(${rot}deg)`, overflow: "visible" }}
    >
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        <path fill={color} d={shape.path} />
        {shape.dots.map((d, i) => (
          <circle key={i} fill={color} cx={d.cx} cy={d.cy} r={d.r} />
        ))}
      </g>
    </svg>
  );
}

function swatchStyle(
  color: string,
  shape: DressCodeColorShape,
  size: number,
): CSSProperties {
  const base: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "block",
  };

  switch (shape) {
    case "soft": {
      // Soft glow via box-shadow — CSS filter:blur often clips to invisible on iOS.
      const glow = Math.max(6, Math.round(size * 0.22));
      return {
        ...base,
        width: "58%",
        height: "58%",
        margin: "auto",
        borderRadius: "50%",
        backgroundColor: color,
        boxShadow: `0 0 ${glow}px ${glow}px ${color}`,
      };
    }
    case "blob":
      return {
        ...base,
        background: "transparent",
        border: "none",
      };
    case "square":
      return {
        ...base,
        borderRadius: Math.max(4, Math.round(size * 0.18)),
        border: "1px solid rgba(0,0,0,0.12)",
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
        border: "1px solid rgba(0,0,0,0.12)",
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
        border: "1px solid rgba(0,0,0,0.14)",
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
  const ref = useRef<HTMLDivElement>(null);
  // Large margin — mobile Safari often misses tight whileInView near fold / page end.
  const inView = useInView(ref, { once: true, amount: 0.01, margin: "50% 0px" });
  const [forceShow, setForceShow] = useState(preview);

  useEffect(() => {
    if (preview) {
      setForceShow(true);
      return;
    }
    setForceShow(false);
    const t = window.setTimeout(() => setForceShow(true), 350);
    return () => window.clearTimeout(t);
  }, [replayKey, preview]);

  const visible = preview || inView || forceShow;

  return (
    <div
      key={replayKey}
      ref={ref}
      className={`flex flex-col items-center ${className}`}
      style={{ gap, minHeight: size }}
    >
      {rows.map((row, rowI) => (
        <div
          key={`row-${rowI}`}
          className="flex flex-wrap items-center justify-center"
          style={{ gap }}
        >
          {row.map((c) => {
            const i = index++;
            return (
              <motion.span
                key={`${c}-${i}`}
                initial={preview ? false : { opacity: 0, scale: 0.7 }}
                animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
                transition={{
                  duration: durationMs / 1000,
                  delay: visible ? (i * staggerMs) / 1000 : 0,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="inline-flex shrink-0 items-center justify-center overflow-visible"
                style={{ width: size, height: size }}
                title={c}
              >
                {shape === "blob" ? (
                  <span className="block h-full w-full overflow-visible">
                    <BlobSwatch color={c} index={i} />
                  </span>
                ) : (
                  <span
                    className="block h-full w-full overflow-visible"
                    style={swatchStyle(c, shape, size)}
                  />
                )}
              </motion.span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
