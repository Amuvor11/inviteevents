"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BorderRadiusPicker } from "@/components/dashboard/border-radius-picker";
import { ImageEditModal } from "@/components/dashboard/image-edit-modal";
import { PlacementPicker, resolveTextPosition } from "@/components/dashboard/placement-picker";
import { presetToOffset } from "@/components/dashboard/draggable-cover-text";
import {
  CoverEdgePicker,
  getBottomEdgeStyle,
  getTopEdgeStyle,
  type CoverEdgeStyle,
} from "@/components/dashboard/cover-edge";
import { IMAGE_BLOCK_TYPES, isBleedCover, isEdgeToEdgeMedia } from "@/lib/invite/block-style-utils";
import { isValidImageSrc } from "@/lib/utils/image-url";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import type { DesignBlock } from "@/types/design";

interface BlockLayoutSettingsProps {
  block: DesignBlock;
  onUpdateStyle: (patch: Partial<DesignBlock["style"]>) => void;
  onUpdateData?: (patch: Record<string, unknown>) => void;
  imageUrl?: string | null;
}

function symmetricMargin(style: DesignBlock["style"]) {
  return style.marginTop ?? 0;
}

export function BlockLayoutSettings({ block, onUpdateStyle, onUpdateData, imageUrl }: BlockLayoutSettingsProps) {
  const style = block.style;
  const hasImage = IMAGE_BLOCK_TYPES.has(block.type);
  const [editOpen, setEditOpen] = useState(false);
  const defaultHeight = block.type === "hero" ? 256 : block.type === "gallery" ? 320 : 240;
  const textPosition = resolveTextPosition(block.data);
  const bleed = isBleedCover(block);
  const isSection = block.type === "section";
  const isButton = block.type === "button";
  const edgeToEdge = isEdgeToEdgeMedia(block);
  const sectionColor = style.backgroundColor ?? "";
  const bottomEdge = getBottomEdgeStyle(block.data);
  const topEdge = getTopEdgeStyle(block.data);
  const fullWidth = block.data.fullWidth === true;

  if (isButton) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Оформлення кнопки</p>

        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Колір кнопки</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={
                !style.backgroundColor || style.backgroundColor === "transparent"
                  ? "#7c3aed"
                  : style.backgroundColor
              }
              onChange={(e) => onUpdateStyle({ backgroundColor: e.target.value })}
              className="h-9 w-12 shrink-0 cursor-pointer p-1"
              disabled={style.backgroundColor === "transparent"}
            />
            <Input
              value={style.backgroundColor === "transparent" ? "Прозорий" : (style.backgroundColor ?? "")}
              onChange={(e) => {
                const v = e.target.value.trim();
                if (!v || v.toLowerCase() === "прозорий" || v.toLowerCase() === "transparent") {
                  onUpdateStyle({ backgroundColor: "transparent" });
                  return;
                }
                onUpdateStyle({ backgroundColor: v });
              }}
              className="font-mono text-xs"
              placeholder="#7c3aed або прозорий"
            />
            <Button
              type="button"
              size="sm"
              variant={style.backgroundColor === "transparent" ? "primary" : "outline"}
              className="shrink-0 px-2 text-xs"
              title="Прозорий фон"
              onClick={() =>
                onUpdateStyle({
                  backgroundColor:
                    style.backgroundColor === "transparent" ? "#7c3aed" : "transparent",
                })
              }
            >
              {style.backgroundColor === "transparent" ? "Колір" : "Прозорий"}
            </Button>
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Колір тексту</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={style.color || "#ffffff"}
              onChange={(e) => onUpdateStyle({ color: e.target.value })}
              className="h-9 w-12 shrink-0 cursor-pointer p-1"
            />
            <Input
              value={style.color ?? ""}
              onChange={(e) => onUpdateStyle({ color: e.target.value.trim() || undefined })}
              className="font-mono text-xs"
              placeholder="#ffffff"
            />
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Бордер</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={
                style.borderColor && style.borderColor !== "transparent"
                  ? style.borderColor
                  : "#ffffff"
              }
              onChange={(e) =>
                onUpdateStyle({
                  borderColor: e.target.value,
                  ...((style.borderWidth ?? 0) < 1 ? { borderWidth: 2 } : null),
                })
              }
              className="h-9 w-12 shrink-0 cursor-pointer p-1"
            />
            <Input
              value={style.borderColor ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                onUpdateStyle({
                  borderColor: v || undefined,
                  ...(v && (style.borderWidth ?? 0) < 1 ? { borderWidth: 2 } : null),
                });
              }}
              className="font-mono text-xs"
              placeholder="#ffffff"
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Label className="shrink-0 text-xs text-muted-foreground">Товщина бордера</Label>
            <Input
              type="number"
              min={0}
              max={24}
              step={1}
              className="h-8 w-20 px-2 text-sm"
              value={style.borderWidth ?? 0}
              onChange={(e) => {
                const raw = e.target.value;
                const v = raw === "" ? 0 : Math.max(0, Math.min(24, Math.round(Number(raw)) || 0));
                onUpdateStyle({ borderWidth: v });
              }}
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Заокруглення</Label>
          <BorderRadiusPicker
            value={style.borderRadius ?? 12}
            onChange={(v) => onUpdateStyle({ borderRadius: v })}
          />
          <div className="mt-2 flex items-center gap-2">
            <Label className="w-20 shrink-0 text-xs text-muted-foreground">Радіус</Label>
            <Input
              type="number"
              min={0}
              max={999}
              className="h-8 w-20 px-2 text-sm"
              value={style.borderRadius ?? 12}
              onChange={(e) => {
                const v = Math.max(0, Math.min(999, Number(e.target.value) || 0));
                onUpdateStyle({ borderRadius: v });
              }}
            />
            <span className="text-[10px] text-muted-foreground">px</span>
          </div>
        </div>

        {onUpdateData && (
          <ToggleSwitch
            label="На всю ширину"
            checked={fullWidth}
            onChange={(checked) => {
              onUpdateData({ fullWidth: checked });
              if (checked) onUpdateStyle({ maxWidth: 100 });
            }}
          />
        )}

        <p className="text-[10px] text-muted-foreground">
          Ширина кнопки підлаштовується під текст. Увімкніть «На всю ширину», щоб розтягнути на весь ряд.
        </p>

        <div className="space-y-2">
          <Label className="block text-xs text-muted-foreground">Внутрішні відступи</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[10px] text-muted-foreground">Верх</span>
              <Input
                type="number"
                min={0}
                max={80}
                className="h-8 px-2 text-sm"
                value={style.paddingTop ?? 12}
                onChange={(e) => onUpdateStyle({ paddingTop: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[10px] text-muted-foreground">Низ</span>
              <Input
                type="number"
                min={0}
                max={80}
                className="h-8 px-2 text-sm"
                value={style.paddingBottom ?? 12}
                onChange={(e) => onUpdateStyle({ paddingBottom: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[10px] text-muted-foreground">Ліво</span>
              <Input
                type="number"
                min={0}
                max={80}
                className="h-8 px-2 text-sm"
                value={style.paddingLeft ?? 24}
                onChange={(e) => onUpdateStyle({ paddingLeft: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[10px] text-muted-foreground">Право</span>
              <Input
                type="number"
                min={0}
                max={80}
                className="h-8 px-2 text-sm"
                value={style.paddingRight ?? 24}
                onChange={(e) => onUpdateStyle({ paddingRight: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Оформлення</p>

      {hasImage && block.type !== "hero" && onUpdateData && (
        <ToggleSwitch
          label="Без відступів від країв"
          checked={edgeToEdge}
          onChange={(checked) => {
            onUpdateData({ edgeToEdge: checked });
            if (checked) {
              onUpdateStyle({
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: 0,
                paddingRight: 0,
                imageWidth: 100,
                borderRadius: 0,
              });
            }
          }}
        />
      )}

      {block.type === "hero" && onUpdateData && (
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Позиція тексту</Label>
          <PlacementPicker
            value={textPosition}
            onChange={(pos) => {
              const offset = presetToOffset(pos);
              onUpdateData({
                textPositionY: pos.y,
                textPositionX: pos.x,
                textOffsetX: offset.x,
                textOffsetY: offset.y,
              });
            }}
          />
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Або перетягніть текст мишкою прямо на зразку
          </p>
        </div>
      )}

      {!bleed && (
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">
            {isSection ? "Колір секції" : "Колір фону"}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={sectionColor || (isSection ? "#6b7280" : "#ffffff")}
              onChange={(e) => onUpdateStyle({ backgroundColor: e.target.value })}
              className="h-9 w-12 shrink-0 cursor-pointer p-1"
            />
            <Input
              value={sectionColor}
              placeholder={isSection ? "#6b7280" : "Прозорий"}
              onChange={(e) =>
                onUpdateStyle({ backgroundColor: e.target.value.trim() || undefined })
              }
              className="font-mono text-xs"
            />
            {!isSection && sectionColor && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0 px-2"
                title="Скинути"
                onClick={() => onUpdateStyle({ backgroundColor: undefined })}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {isSection && onUpdateData && (
        <>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Верхній край</Label>
            <CoverEdgePicker
              value={topEdge}
              onChange={(edge: CoverEdgeStyle) => onUpdateData({ topEdge: edge })}
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Нижній край</Label>
            <CoverEdgePicker
              value={bottomEdge}
              onChange={(edge: CoverEdgeStyle) => onUpdateData({ bottomEdge: edge })}
            />
          </div>
        </>
      )}

      {!bleed && !isSection && onUpdateData && (
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Нижній край</Label>
          <CoverEdgePicker
            value={bottomEdge}
            onChange={(edge: CoverEdgeStyle) => onUpdateData({ bottomEdge: edge })}
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Для краю зверху й знизу — додайте блок «Секція»
          </p>
        </div>
      )}

      {!isSection && !edgeToEdge && (
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Заокруглення</Label>
          <BorderRadiusPicker value={style.borderRadius ?? 0} onChange={(v) => onUpdateStyle({ borderRadius: v })} />
        </div>
      )}

      {isSection && (
        <div className="space-y-2">
          <Label className="block text-xs text-muted-foreground">Відступи від країв</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[10px] text-muted-foreground">Верх</span>
              <Input
                type="number"
                min={0}
                max={120}
                className="h-8 px-2 text-sm"
                value={style.paddingTop ?? 24}
                onChange={(e) => onUpdateStyle({ paddingTop: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[10px] text-muted-foreground">Низ</span>
              <Input
                type="number"
                min={0}
                max={120}
                className="h-8 px-2 text-sm"
                value={style.paddingBottom ?? 24}
                onChange={(e) => onUpdateStyle({ paddingBottom: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[10px] text-muted-foreground">Ліво</span>
              <Input
                type="number"
                min={0}
                max={80}
                className="h-8 px-2 text-sm"
                value={style.paddingLeft ?? 16}
                onChange={(e) => onUpdateStyle({ paddingLeft: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[10px] text-muted-foreground">Право</span>
              <Input
                type="number"
                min={0}
                max={80}
                className="h-8 px-2 text-sm"
                value={style.paddingRight ?? 16}
                onChange={(e) => onUpdateStyle({ paddingRight: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Label className="shrink-0 text-xs text-muted-foreground">Між блоками</Label>
            <Input
              type="number"
              min={0}
              max={64}
              className="h-8 w-20 px-2 text-sm"
              value={style.gap ?? 8}
              onChange={(e) => onUpdateStyle({ gap: Math.max(0, Number(e.target.value) || 0) })}
            />
            <span className="text-[10px] text-muted-foreground">px</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            0 з боків — контент до краю секції. Для фото увімкніть «Без відступів».
          </p>
        </div>
      )}

      {!isSection && !edgeToEdge && (
        <div className="space-y-2">
          <Label className="block text-xs text-muted-foreground">Внутрішні відступи</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[10px] text-muted-foreground">Верх</span>
              <Input
                type="number"
                min={0}
                max={120}
                className="h-8 px-2 text-sm"
                value={style.paddingTop ?? 8}
                onChange={(e) => onUpdateStyle({ paddingTop: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[10px] text-muted-foreground">Низ</span>
              <Input
                type="number"
                min={0}
                max={120}
                className="h-8 px-2 text-sm"
                value={style.paddingBottom ?? 8}
                onChange={(e) => onUpdateStyle({ paddingBottom: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[10px] text-muted-foreground">Ліво</span>
              <Input
                type="number"
                min={0}
                max={80}
                className="h-8 px-2 text-sm"
                value={style.paddingLeft ?? 0}
                onChange={(e) => onUpdateStyle({ paddingLeft: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[10px] text-muted-foreground">Право</span>
              <Input
                type="number"
                min={0}
                max={80}
                className="h-8 px-2 text-sm"
                value={style.paddingRight ?? 0}
                onChange={(e) => onUpdateStyle({ paddingRight: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-14 shrink-0 text-xs text-muted-foreground">Зовн.</Label>
            <Input
              type="number"
              min={0}
              className="h-8 w-16 px-2 text-sm"
              value={symmetricMargin(style)}
              onChange={(e) => {
                const v = Number(e.target.value);
                onUpdateStyle({ marginTop: v, marginBottom: v, marginLeft: v, marginRight: v });
              }}
            />
          </div>
        </div>
      )}

      {edgeToEdge && !isSection && (
        <div className="flex items-center gap-2">
          <Label className="w-14 shrink-0 text-xs text-muted-foreground">Зовн.</Label>
          <Input
            type="number"
            min={0}
            className="h-8 w-16 px-2 text-sm"
            value={symmetricMargin(style)}
            onChange={(e) => {
              const v = Number(e.target.value);
              onUpdateStyle({ marginTop: v, marginBottom: v });
            }}
          />
          <span className="text-[10px] text-muted-foreground">верх / низ</span>
        </div>
      )}

      {hasImage && block.type !== "hero" && (
        <div className="flex items-center gap-2">
          <Label className="w-14 shrink-0 text-xs text-muted-foreground">Висота</Label>
          <Input
            type="number"
            min={80}
            max={600}
            className="h-8 w-20 px-2 text-sm"
            value={style.imageHeight ?? defaultHeight}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v)) onUpdateStyle({ imageHeight: Math.max(80, Math.min(600, v)) });
            }}
          />
          <span className="text-[10px] text-muted-foreground">px</span>
        </div>
      )}

      {hasImage && isValidImageSrc(imageUrl) && (block.data.coverFill as string) !== "color" && (
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5" /> Редагувати зображення
        </Button>
      )}

      {hasImage && (
        <ImageEditModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          imageUrl={imageUrl}
          style={style}
          defaultHeight={defaultHeight}
          onApply={onUpdateStyle}
        />
      )}

      {!isSection && (
        <p className="text-[10px] text-muted-foreground">Розмір — перетягніть маркери на зразку</p>
      )}
    </div>
  );
}
