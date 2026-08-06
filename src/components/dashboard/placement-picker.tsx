"use client";

import { AlignCenter, ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type TextPositionY = "top" | "center" | "bottom";
export type TextPositionX = "left" | "center" | "right";

export interface TextPosition {
  y: TextPositionY;
  x: TextPositionX;
}

/** Migrate old single-axis textPlacement to x/y. */
export function resolveTextPosition(data: Record<string, unknown>): TextPosition {
  const y = data.textPositionY as TextPositionY | undefined;
  const x = data.textPositionX as TextPositionX | undefined;
  if (y || x) {
    return { y: y ?? "bottom", x: x ?? "center" };
  }

  const legacy = data.textPlacement as string | undefined;
  switch (legacy) {
    case "top":
      return { y: "top", x: "center" };
    case "left":
      return { y: "center", x: "left" };
    case "right":
      return { y: "center", x: "right" };
    case "center":
      return { y: "center", x: "center" };
    case "bottom":
    default:
      return { y: "bottom", x: "center" };
  }
}

const Y_OPTIONS: { value: TextPositionY; label: string; Icon: typeof ArrowUp }[] = [
  { value: "top", label: "Зверху", Icon: ArrowUp },
  { value: "center", label: "По вертикалі", Icon: AlignCenter },
  { value: "bottom", label: "Знизу", Icon: ArrowDown },
];

const X_OPTIONS: { value: TextPositionX; label: string; Icon: typeof ArrowUp }[] = [
  { value: "left", label: "Зліва", Icon: ArrowLeft },
  { value: "center", label: "По горизонталі", Icon: AlignCenter },
  { value: "right", label: "Справа", Icon: ArrowRight },
];

interface PlacementPickerProps {
  value: TextPosition;
  onChange: (value: TextPosition) => void;
}

function OptionButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function PlacementPicker({ value, onChange }: PlacementPickerProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {Y_OPTIONS.map(({ value: v, label, Icon }) => (
          <OptionButton key={v} active={value.y === v} label={label} onClick={() => onChange({ ...value, y: v })}>
            <Icon className="h-3.5 w-3.5" />
          </OptionButton>
        ))}
      </div>
      <div className="flex gap-1">
        {X_OPTIONS.map(({ value: v, label, Icon }) => (
          <OptionButton key={v} active={value.x === v} label={label} onClick={() => onChange({ ...value, x: v })}>
            <Icon className="h-3.5 w-3.5" />
          </OptionButton>
        ))}
      </div>
    </div>
  );
}
