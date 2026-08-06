"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, RotateCw, Move, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { BorderRadiusPicker } from "@/components/dashboard/border-radius-picker";
import { imageFitClass, objectPositionToCss } from "@/lib/invite/block-style-utils";
import { isValidImageSrc } from "@/lib/utils/image-url";
import type { BlockStyle, ObjectFit, ObjectPosition } from "@/types/design";
import { cn } from "@/lib/utils/cn";

const POSITION_GRID: { value: ObjectPosition; label: string }[] = [
  { value: "top-left", label: "↖" },
  { value: "top", label: "↑" },
  { value: "top-right", label: "↗" },
  { value: "left", label: "←" },
  { value: "center", label: "●" },
  { value: "right", label: "→" },
  { value: "bottom-left", label: "↙" },
  { value: "bottom", label: "↓" },
  { value: "bottom-right", label: "↘" },
];

interface ImageEditModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  style: BlockStyle;
  defaultHeight?: number;
  onApply: (patch: Partial<BlockStyle>) => void;
}

export function ImageEditModal({
  open,
  onClose,
  imageUrl,
  style,
  defaultHeight = 256,
  onApply,
}: ImageEditModalProps) {
  const [draft, setDraft] = useState<BlockStyle>(style);

  useEffect(() => {
    if (open) setDraft(style);
  }, [open, style]);

  if (!open) return null;

  const patch = (p: Partial<BlockStyle>) => setDraft((prev) => ({ ...prev, ...p }));
  const height = draft.imageHeight ?? defaultHeight;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Закрити" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-background p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Редагування зображення</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isValidImageSrc(imageUrl) && (
          <div className="mb-4 flex justify-center rounded-lg bg-muted/40 p-4">
            <div
              className="relative overflow-hidden bg-muted"
              style={{
                width: `${Math.min(draft.imageWidth ?? 100, 100)}%`,
                maxWidth: 280,
                height: Math.min(height, 280),
                borderRadius: draft.borderRadius,
                transform: draft.imageRotation ? `rotate(${draft.imageRotation}deg)` : undefined,
              }}
            >
              <Image
                src={imageUrl!}
                alt=""
                fill
                className={imageFitClass(draft.objectFit)}
                style={{ objectPosition: objectPositionToCss(draft.objectPosition) }}
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label className="mb-2 flex items-center gap-1.5">
              <Maximize2 className="h-3.5 w-3.5" /> Розмір
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Ширина (%)</Label>
                <Input
                  type="range"
                  min={20}
                  max={100}
                  value={draft.imageWidth ?? 100}
                  onChange={(e) => patch({ imageWidth: Number(e.target.value) })}
                  className="h-2 w-full cursor-pointer accent-primary"
                />
                <span className="text-xs text-muted-foreground">{draft.imageWidth ?? 100}%</span>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Висота (px)</Label>
                <Input
                  type="range"
                  min={80}
                  max={600}
                  value={height}
                  onChange={(e) => patch({ imageHeight: Number(e.target.value) })}
                  className="h-2 w-full cursor-pointer accent-primary"
                />
                <span className="text-xs text-muted-foreground">{height}px</span>
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-2 flex items-center gap-1.5">
              <RotateCw className="h-3.5 w-3.5" /> Поворот
            </Label>
            <Input
              type="range"
              min={-180}
              max={180}
              value={draft.imageRotation ?? 0}
              onChange={(e) => patch({ imageRotation: Number(e.target.value) })}
              className="h-2 w-full cursor-pointer accent-primary"
            />
            <span className="text-xs text-muted-foreground">{draft.imageRotation ?? 0}°</span>
          </div>

          <div>
            <Label className="mb-2 flex items-center gap-1.5">
              <Move className="h-3.5 w-3.5" /> Фокус кадру
            </Label>
            <div className="grid w-fit grid-cols-3 gap-1">
              {POSITION_GRID.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => patch({ objectPosition: value })}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-colors",
                    (draft.objectPosition ?? "center") === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Масштаб</Label>
            <div className="flex gap-2">
              {(["cover", "contain"] as ObjectFit[]).map((fit) => (
                <button
                  key={fit}
                  type="button"
                  onClick={() => patch({ objectFit: fit })}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm transition-colors",
                    (draft.objectFit ?? "cover") === fit
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {fit === "cover" ? "Заповнити" : "Вмістити"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Заокруглення</Label>
            <BorderRadiusPicker value={draft.borderRadius ?? 0} onChange={(v) => patch({ borderRadius: v })} />
          </div>

          <div>
            <Label className="mb-2 block">Розміщення</Label>
            <div className="flex gap-2">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => patch({ textAlign: align })}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm transition-colors",
                    (draft.textAlign ?? "center") === align
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {align === "left" ? "Зліва" : align === "center" ? "Центр" : "Справа"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Скасувати
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApply({
                imageWidth: draft.imageWidth,
                imageHeight: draft.imageHeight,
                imageRotation: draft.imageRotation,
                objectPosition: draft.objectPosition,
                objectFit: draft.objectFit,
                borderRadius: draft.borderRadius,
                textAlign: draft.textAlign,
              });
              onClose();
            }}
          >
            Застосувати
          </Button>
        </div>
      </div>
    </div>
  );
}
