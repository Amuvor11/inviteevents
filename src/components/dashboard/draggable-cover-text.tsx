"use client";

import { useRef, useState } from "react";
import { resolveTextPosition, type TextPosition } from "@/components/dashboard/placement-picker";
import { cn } from "@/lib/utils/cn";

/** Convert preset placement to percent (center of text block). */
export function presetToOffset(pos: TextPosition): { x: number; y: number } {
  const x = pos.x === "left" ? 18 : pos.x === "right" ? 82 : 50;
  const y = pos.y === "top" ? 14 : pos.y === "bottom" ? 86 : 50;
  return { x, y };
}

export function resolveTextOffset(data: Record<string, unknown>): { x: number; y: number } {
  const ox = data.textOffsetX;
  const oy = data.textOffsetY;
  if (typeof ox === "number" && typeof oy === "number") {
    return {
      x: Math.min(100, Math.max(0, ox)),
      y: Math.min(100, Math.max(0, oy)),
    };
  }
  return presetToOffset(resolveTextPosition(data));
}

interface DraggableCoverTextProps {
  children: React.ReactNode;
  offset: { x: number; y: number };
  enabled?: boolean;
  onOffsetChange?: (offset: { x: number; y: number }) => void;
  className?: string;
}

export function DraggableCoverText({
  children,
  offset,
  enabled = false,
  onOffsetChange,
  className,
}: DraggableCoverTextProps) {
  const [dragging, setDragging] = useState(false);
  const dragOrigin = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    width: number;
    height: number;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!enabled || !onOffsetChange) return;
    e.preventDefault();
    e.stopPropagation();

    const cover = e.currentTarget.parentElement;
    if (!cover) return;
    const rect = cover.getBoundingClientRect();

    dragOrigin.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
      width: rect.width,
      height: rect.height,
    };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const origin = dragOrigin.current;
    if (!origin || origin.pointerId !== e.pointerId || !onOffsetChange) return;
    e.preventDefault();
    e.stopPropagation();

    const dx = ((e.clientX - origin.startX) / origin.width) * 100;
    const dy = ((e.clientY - origin.startY) / origin.height) * 100;
    onOffsetChange({
      x: Math.min(96, Math.max(4, origin.originX + dx)),
      y: Math.min(96, Math.max(4, origin.originY + dy)),
    });
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!dragOrigin.current || dragOrigin.current.pointerId !== e.pointerId) return;
    dragOrigin.current = null;
    setDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={cn(
        "absolute z-20 max-w-[92%] -translate-x-1/2 -translate-y-1/2",
        enabled && "cursor-grab touch-none select-none",
        dragging && "cursor-grabbing",
        className,
      )}
      style={{ left: `${offset.x}%`, top: `${offset.y}%` }}
    >
      {children}
    </div>
  );
}
