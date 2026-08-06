"use client";

import { useMemo, useRef, useState } from "react";
import { Loader2, Search, Upload, X } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import {
  CALENDAR_MARKER_ANIMATIONS,
  CALENDAR_MARKER_CATALOG,
  sanitizeSvgMarkup,
  searchCalendarMarkers,
  type CalendarMarkerAnimation,
  type CalendarMarkerItem,
} from "@/lib/invite/calendar-markers";

interface CalendarMarkerPickerProps {
  value: string;
  customSvg?: string | null;
  animation?: CalendarMarkerAnimation;
  onChange: (patch: {
    dateMarker?: string;
    dateMarkerSvg?: string | null;
    dateMarkerAnimation?: CalendarMarkerAnimation;
  }) => void;
}

function MarkerThumb({
  item,
  customSvg,
  selected,
  onClick,
}: {
  item?: CalendarMarkerItem;
  customSvg?: string | null;
  selected?: boolean;
  onClick: () => void;
}) {
  const svg = customSvg ?? item?.svg;
  const image = item?.image;
  return (
    <button
      type="button"
      title={item?.label ?? "Свій SVG"}
      onClick={onClick}
      className={cn(
        "flex aspect-square items-center justify-center rounded-md border p-1.5 transition-colors",
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-foreground/80 hover:border-primary/40",
      )}
    >
      <span className="flex h-7 w-7 items-center justify-center">
        {image ? (
          <span
            className="block h-full w-full"
            style={{
              backgroundColor: "currentColor",
              WebkitMaskImage: `url("${image}")`,
              maskImage: `url("${image}")`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />
        ) : svg ? (
          <span
            className="flex h-full w-full items-center justify-center [&_svg]:h-full [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : item?.id === "circle" ? (
          <span className="h-5 w-5 rounded-full bg-current opacity-80" />
        ) : item?.id === "square" ? (
          <span className="h-5 w-5 rounded-sm bg-current opacity-80" />
        ) : item?.id === "ring" ? (
          <span className="h-5 w-5 rounded-full border-2 border-current" />
        ) : item?.id === "underline" ? (
          <span className="relative text-[10px] font-semibold leading-none">
            24
            <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-current" />
          </span>
        ) : item?.id === "none" ? (
          <span className="text-[11px] font-semibold leading-none">24</span>
        ) : item?.id === "heart" ? (
          <span className="text-lg leading-none">♥</span>
        ) : item?.id === "star" ? (
          <span className="text-lg leading-none">★</span>
        ) : item?.id === "diamond" ? (
          <span className="text-lg leading-none">◆</span>
        ) : (
          <span className="text-[10px]">?</span>
        )}
      </span>
    </button>
  );
}

export function CalendarMarkerPicker({
  value,
  customSvg,
  animation = "fade",
  onChange,
}: CalendarMarkerPickerProps) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => searchCalendarMarkers(query), [query]);
  const shapes = filtered.filter((m) => m.kind === "shape");
  const icons = filtered.filter((m) => m.kind === "icon");

  const handleSvgFile = async (file: File) => {
    setError(null);
    const isSvg =
      file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    if (!isSvg) {
      setError("Завантажте файл .svg");
      return;
    }
    if (file.size > 200 * 1024) {
      setError("SVG має бути до 200 КБ");
      return;
    }
    setBusy(true);
    try {
      const text = await file.text();
      const clean = sanitizeSvgMarkup(text);
      if (!clean) {
        setError("Не вдалося прочитати SVG");
        return;
      }
      onChange({ dateMarker: "custom", dateMarkerSvg: clean });
    } catch {
      setError("Помилка читання файлу");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Анімація іконки
        </p>
        <div className="grid grid-cols-2 gap-1">
          {CALENDAR_MARKER_ANIMATIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onChange({ dateMarkerAnimation: id })}
              className={cn(
                "rounded-md border px-2 py-1.5 text-[10px] font-medium transition-colors",
                animation === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Пошук іконки…"
          className="h-8 pl-8 text-xs"
        />
        {query && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            onClick={() => setQuery("")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {shapes.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Форми</p>
          <div className="grid grid-cols-4 gap-1.5">
            {shapes.map((item) => (
              <MarkerThumb
                key={item.id}
                item={item}
                selected={value === item.id}
                onClick={() => onChange({ dateMarker: item.id, dateMarkerSvg: null })}
              />
            ))}
          </div>
        </div>
      )}

      {icons.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Іконки ({icons.length})
          </p>
          <div className="grid max-h-48 grid-cols-4 gap-1.5 overflow-y-auto pr-0.5">
            {icons.map((item) => (
              <MarkerThumb
                key={item.id}
                item={item}
                selected={value === item.id}
                onClick={() => onChange({ dateMarker: item.id, dateMarkerSvg: null })}
              />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="py-2 text-center text-xs text-muted-foreground">Нічого не знайдено</p>
      )}

      <div className="rounded-md border border-dashed border-border p-2">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <Label className="text-[10px]">Свій SVG</Label>
          {value === "custom" && customSvg && (
            <button
              type="button"
              className="text-[10px] text-muted-foreground hover:text-foreground"
              onClick={() => onChange({ dateMarker: "ring-classic", dateMarkerSvg: null })}
            >
              Скинути
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".svg,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleSvgFile(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-md border px-2 py-2 text-xs transition-colors",
            value === "custom"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40",
          )}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {value === "custom" ? "Замінити SVG" : "Завантажити SVG"}
        </button>
        {value === "custom" && customSvg && (
          <div className="mt-2 flex justify-center text-primary">
            <span
              className="flex h-10 w-10 items-center justify-center [&_svg]:h-full [&_svg]:w-full"
              dangerouslySetInnerHTML={{ __html: customSvg }}
            />
          </div>
        )}
        {error && <p className="mt-1 text-[10px] text-destructive">{error}</p>}
        <p className="mt-1 text-[9px] leading-snug text-muted-foreground">
          Лінійний SVG (stroke) найкраще виглядає навколо дати, як обручка на прикладі.
        </p>
      </div>

      <p className="text-[9px] text-muted-foreground">
        Усього в бібліотеці: {CALENDAR_MARKER_CATALOG.length} варіантів
      </p>
    </div>
  );
}
