"use client";

import { ArrowDownUp, ArrowLeftRight, MoveDiagonal2 } from "lucide-react";
import { IMAGE_BLOCK_TYPES, getCoverLayout, isEdgeToEdgeMedia } from "@/lib/invite/block-style-utils";
import type { DesignBlock } from "@/types/design";

interface BlockResizeHandlesProps {
  block: DesignBlock;
  onUpdateStyle: (patch: Partial<DesignBlock["style"]>) => void;
}

const handleBase =
  "absolute z-30 flex items-center justify-center border-2 border-primary bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110";

export function BlockResizeHandles({ block, onUpdateStyle }: BlockResizeHandlesProps) {
  const hasImage = IMAGE_BLOCK_TYPES.has(block.type);
  const onlyHeight =
    getCoverLayout(block) === "edge" ||
    isEdgeToEdgeMedia(block) ||
    block.type === "button";

  const startDrag = (e: React.PointerEvent, mode: "height" | "width" | "both") => {
    e.preventDefault();
    e.stopPropagation();

    const start = {
      startY: e.clientY,
      startX: e.clientX,
      startH: hasImage ? (block.style.imageHeight ?? 256) : (block.style.minHeight ?? 0),
      startW: hasImage ? (block.style.imageWidth ?? 100) : (block.style.maxWidth ?? 100),
    };

    const move = (ev: PointerEvent) => {
      const dy = ev.clientY - start.startY;
      const dx = ev.clientX - start.startX;
      const patch: Partial<DesignBlock["style"]> = {};

      if (mode === "height" || mode === "both") {
        const newH = Math.max(hasImage ? 80 : 0, Math.min(600, start.startH + dy));
        if (hasImage) patch.imageHeight = Math.round(newH);
        else patch.minHeight = Math.round(newH);
      }
      if (!onlyHeight && (mode === "width" || mode === "both")) {
        const newW = Math.max(20, Math.min(100, start.startW + dx * 0.15));
        if (hasImage) patch.imageWidth = Math.round(newW);
        else patch.maxWidth = Math.round(newW);
      }
      onUpdateStyle(patch);
    };

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Змінити висоту"
        onPointerDown={(e) => startDrag(e, "height")}
        className={`${handleBase} -bottom-3 left-1/2 h-6 w-6 -translate-x-1/2 cursor-ns-resize rounded-full`}
      >
        <ArrowDownUp className="h-3 w-3" />
      </button>
      {!onlyHeight && (
        <>
          <button
            type="button"
            aria-label="Змінити ширину"
            onPointerDown={(e) => startDrag(e, "width")}
            className={`${handleBase} top-1/2 -right-3 h-6 w-6 -translate-y-1/2 cursor-ew-resize rounded-full`}
          >
            <ArrowLeftRight className="h-3 w-3" />
          </button>
          <button
            type="button"
            aria-label="Змінити розмір"
            onPointerDown={(e) => startDrag(e, "both")}
            className={`${handleBase} -right-3 -bottom-3 h-6 w-6 cursor-nwse-resize rounded-md`}
          >
            <MoveDiagonal2 className="h-3 w-3" />
          </button>
        </>
      )}
    </>
  );
}
