"use client";

import { Italic, Underline } from "lucide-react";
import { Input, Label, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { FONT_OPTIONS, fontFamilyCss, type InviteFontId } from "@/lib/invite/fonts";
import type { TextElementStyle } from "@/types/design";

export type FontWeight = 400 | 500 | 600 | 700;

export const FONT_WEIGHT_OPTIONS: { value: FontWeight; label: string }[] = [
  { value: 400, label: "Звичайний" },
  { value: 500, label: "Середній" },
  { value: 600, label: "Напівжирний" },
  { value: 700, label: "Жирний" },
];

interface TextStyleEditorProps {
  label?: string;
  value?: TextElementStyle;
  onChange: (patch: TextElementStyle) => void;
  defaults?: { fontSize?: number; color?: string };
}

export function textElementCss(
  style: TextElementStyle | undefined,
  fallback: {
    fontSize?: number;
    color?: string;
    fontFamily?: InviteFontId;
    fontWeight?: FontWeight;
  } = {},
): React.CSSProperties {
  return {
    fontFamily: fontFamilyCss(style?.fontFamily ?? fallback.fontFamily),
    fontSize: style?.fontSize ?? fallback.fontSize,
    color: style?.color ?? fallback.color,
    fontWeight: style?.fontWeight ?? fallback.fontWeight ?? 400,
    fontStyle: style?.fontStyle ?? "normal",
    textDecoration: style?.textDecoration ?? "none",
  };
}

export function FontSelect({
  value,
  onChange,
  className,
}: {
  value?: InviteFontId;
  onChange: (id: InviteFontId) => void;
  className?: string;
}) {
  const current = value ?? "sans";
  return (
    <div
      className={cn(
        "max-h-40 space-y-0.5 overflow-y-auto rounded-md border border-border bg-background p-1",
        className,
      )}
    >
      {FONT_OPTIONS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={cn(
            "flex w-full items-baseline justify-between gap-2 rounded px-2 py-1.5 text-left transition-colors",
            current === f.id ? "bg-primary/10 text-primary" : "hover:bg-muted/80 text-foreground",
          )}
        >
          <span className="w-20 shrink-0 text-[10px] text-muted-foreground">{f.label}</span>
          <span className="min-w-0 flex-1 truncate text-right text-[15px] leading-tight" style={{ fontFamily: `var(${f.cssVar})` }}>
            {f.sample}
          </span>
        </button>
      ))}
    </div>
  );
}

export function FontWeightSelect({
  value,
  onChange,
}: {
  value?: FontWeight;
  onChange: (weight: FontWeight) => void;
}) {
  return (
    <Select
      value={String(value ?? 400)}
      onChange={(e) => onChange(Number(e.target.value) as FontWeight)}
    >
      {FONT_WEIGHT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}

export function TextStyleEditor({ label, value = {}, onChange, defaults }: TextStyleEditorProps) {
  const size = value.fontSize ?? defaults?.fontSize ?? 16;
  const color = value.color ?? defaults?.color ?? "#ffffff";
  const weight = value.fontWeight ?? 400;
  const italic = value.fontStyle === "italic";
  const underline = value.textDecoration === "underline";

  return (
    <div className="mt-2 space-y-2 rounded-md border border-border/60 bg-background/60 p-2">
      {label && <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>}
      <div className="space-y-2">
        <div>
          <Label className="text-[10px]">Шрифт</Label>
          <FontSelect
            value={value.fontFamily ?? "cormorant"}
            onChange={(fontFamily) => onChange({ fontFamily })}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-[10px]">Розмір</Label>
          <Input
            type="number"
            min={10}
            max={96}
            className="h-8 text-xs"
            value={size}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label className="text-[10px]">Жирність</Label>
          <FontWeightSelect
            value={weight}
            onChange={(fontWeight) => onChange({ fontWeight })}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Label className="shrink-0 text-[10px]">Колір</Label>
        <input
          type="color"
          value={color}
          onChange={(e) => onChange({ color: e.target.value })}
          className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
        />
        <Input
          value={color}
          onChange={(e) => onChange({ color: e.target.value })}
          className="h-8 flex-1 font-mono text-xs"
        />
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          title="Курсив"
          onClick={() => onChange({ fontStyle: italic ? "normal" : "italic" })}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border",
            italic ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
          )}
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Підкреслення"
          onClick={() => onChange({ textDecoration: underline ? "none" : "underline" })}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border",
            underline ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
          )}
        >
          <Underline className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
