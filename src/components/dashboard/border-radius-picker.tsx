"use client";

import { BORDER_RADIUS_PRESETS } from "@/lib/invite/border-radius-presets";
import { cn } from "@/lib/utils/cn";

interface BorderRadiusPickerProps {
  value?: number;
  onChange: (value: number) => void;
}

export function BorderRadiusPicker({ value = 0, onChange }: BorderRadiusPickerProps) {
  const active = BORDER_RADIUS_PRESETS.some((p) => p.value === value) ? value : null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {BORDER_RADIUS_PRESETS.map(({ value: presetValue, label }) => {
        const selected = active === presetValue || (active === null && presetValue === value);
        const radius = presetValue === 9999 ? 9999 : presetValue;
        return (
          <button
            key={presetValue}
            type="button"
            title={label}
            onClick={() => onChange(presetValue)}
            className={cn(
              "flex h-11 w-11 flex-col items-center justify-center gap-1 rounded-lg border transition-colors",
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <div
              className="h-5 w-5 border-2 border-current bg-current/15"
              style={{ borderRadius: radius === 9999 ? "9999px" : radius }}
            />
            <span className="text-[9px] leading-none">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
