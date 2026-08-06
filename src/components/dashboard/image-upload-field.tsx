"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Pencil, Upload, X } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageEditModal } from "@/components/dashboard/image-edit-modal";
import { uploadToCloudinary } from "@/lib/cloudinary/client-upload";
import { isValidImageSrc } from "@/lib/utils/image-url";
import { cn } from "@/lib/utils/cn";
import type { BlockStyle } from "@/types/design";

export type CoverFillMode = "image" | "color";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  eventId: string;
  folder: string;
  placeholder?: string;
  imageStyle?: BlockStyle;
  onImageStyleChange?: (patch: Partial<BlockStyle>) => void;
  defaultImageHeight?: number;
  fillMode?: CoverFillMode;
  onFillModeChange?: (mode: CoverFillMode) => void;
  fillColor?: string;
  onFillColorChange?: (color: string) => void;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  eventId,
  folder,
  placeholder = "https://...",
  imageStyle,
  onImageStyleChange,
  defaultImageHeight = 256,
  fillMode = "image",
  onFillModeChange,
  fillColor = "#7c3aed",
  onFillColorChange,
}: ImageUploadFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const showFillToggle = Boolean(onFillModeChange && onFillColorChange);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Оберіть файл зображення (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Максимальний розмір файлу — 10 МБ");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const url = await uploadToCloudinary(file, eventId, folder);
      onChange(url);
      onFillModeChange?.("image");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка завантаження");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {showFillToggle && (
          <div className="flex rounded-md border border-border p-0.5 text-[10px]">
            {(["image", "color"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onFillModeChange?.(mode)}
                className={cn(
                  "rounded px-2 py-0.5 transition-colors",
                  fillMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode === "image" ? "Фото" : "Колір"}
              </button>
            ))}
          </div>
        )}
      </div>

      {fillMode === "color" && onFillColorChange ? (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={fillColor}
            onChange={(e) => onFillColorChange(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent"
          />
          <Input
            value={fillColor}
            onChange={(e) => onFillColorChange(e.target.value)}
            className="h-8 flex-1 font-mono text-xs"
          />
        </div>
      ) : (
        <>
          {isValidImageSrc(value) && (
            <div className="relative mb-2 h-20 w-full overflow-hidden rounded-lg border border-border">
              <Image src={value} alt="" fill className="object-cover" sizes="320px" />
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute right-1 top-1 rounded bg-black/60 p-0.5 text-white hover:bg-black/80"
                aria-label="Видалити"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex gap-1.5">
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="h-8 min-w-0 flex-1 text-sm"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="h-8 shrink-0 px-2"
              title="Завантажити"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            </Button>
            {isValidImageSrc(value) && imageStyle && onImageStyleChange && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
                className="h-8 shrink-0 px-2"
                title="Редагувати"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </>
      )}

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      {imageStyle && onImageStyleChange && fillMode === "image" && (
        <ImageEditModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          imageUrl={value}
          style={imageStyle}
          defaultHeight={defaultImageHeight}
          onApply={onImageStyleChange}
        />
      )}
    </div>
  );
}
