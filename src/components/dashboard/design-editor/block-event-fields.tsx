"use client";

import Link from "next/link";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";
import { AudioUploadField } from "@/components/dashboard/audio-upload-field";
import {
  DRESS_CODE_SHAPES,
  parseColorRows,
  parseColorShape,
  type DressCodeColorShape,
} from "@/components/invite/dress-code-colors";
import type { DesignBlock } from "@/types/design";
import type { PublicInviteEvent } from "@/types/invite";
import { cn } from "@/lib/utils/cn";
import {
  DAY_PROGRAM_ICONS,
  DayProgramIcon,
  parseDayProgramItems,
  type DayProgramIconId,
  type DayProgramItem,
} from "@/components/invite/day-program-timeline";
import { nanoid } from "nanoid";

interface BlockEventFieldsProps {
  block: DesignBlock;
  event: PublicInviteEvent;
  eventId: string;
  updateEventField: (field: keyof PublicInviteEvent, value: string | null) => void;
  updateBlock: (id: string, patch: Partial<DesignBlock>) => void;
}

export function BlockEventFields({ block, event, eventId, updateEventField, updateBlock }: BlockEventFieldsProps) {
  switch (block.type) {
    case "hero":
      return (
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-medium text-primary">Дані блоку</p>
          <div>
            <Label>Назва події</Label>
            <Input
              value={event.title}
              onChange={(e) => updateEventField("title", e.target.value)}
              placeholder="Залиште порожнім, щоб приховати"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Порожня назва не показується на обкладинці
            </p>
          </div>
          <div>
            <Label>Імена організаторів</Label>
            <Input
              value={event.hostNames ?? ""}
              onChange={(e) => updateEventField("hostNames", e.target.value)}
              placeholder="Анна & Іван"
            />
          </div>
          <ImageUploadField
            label="Обкладинка"
            value={event.coverImageUrl ?? ""}
            onChange={(url) => updateEventField("coverImageUrl", url || null)}
            eventId={eventId}
            folder="cover"
            imageStyle={block.style}
            onImageStyleChange={(patch) => updateBlock(block.id, { style: patch })}
            defaultImageHeight={256}
            fillMode={(block.data.coverFill as "image" | "color") ?? "image"}
            onFillModeChange={(mode) => updateBlock(block.id, { data: { coverFill: mode } })}
            fillColor={block.style.backgroundColor ?? "#7c3aed"}
            onFillColorChange={(c) => updateBlock(block.id, { style: { backgroundColor: c } })}
          />
          <AudioUploadField
            label="Музика на обкладинці"
            value={event.backgroundMusicUrl ?? ""}
            onChange={(url) => updateEventField("backgroundMusicUrl", url || null)}
            eventId={eventId}
            folder="music"
          />
          <div>
            <Label>Назва треку</Label>
            <Input
              value={(block.data.musicTitle as string) ?? ""}
              onChange={(e) => updateBlock(block.id, { data: { musicTitle: e.target.value } })}
              placeholder="shape of my heart"
            />
          </div>
          <div>
            <Label>Виконавець</Label>
            <Input
              value={(block.data.musicArtist as string) ?? ""}
              onChange={(e) => updateBlock(block.id, { data: { musicArtist: e.target.value } })}
              placeholder="Sting"
            />
          </div>
        </div>
      );

    case "heading":
      return (
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-medium text-primary">Дані блоку</p>
          <div>
            <Label>Заголовок</Label>
            <Input
              value={(block.data.text as string) ?? ""}
              onChange={(e) =>
                updateBlock(block.id, { data: { text: e.target.value, bindField: null } })
              }
            />
          </div>
        </div>
      );

    case "text":
      return (
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-medium text-primary">Дані блоку</p>
          <div>
            <Label>Текст</Label>
            <Textarea
              rows={4}
              value={(block.data.text as string) ?? ""}
              onChange={(e) =>
                updateBlock(block.id, { data: { text: e.target.value, bindField: null } })
              }
            />
          </div>
        </div>
      );

    case "monogram":
      return (
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-medium text-primary">Дані блоку</p>
          <div>
            <Label>Літери монограми</Label>
            <Input
              maxLength={3}
              value={(block.data.text as string) ?? ""}
              onChange={(e) => updateBlock(block.id, { data: { text: e.target.value } })}
              placeholder="АІ"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              До 3 літер. Якщо порожньо — беруться з імен організаторів на обкладинці
            </p>
          </div>
        </div>
      );

    case "countdown":
      return (
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-medium text-primary">Дані блоку</p>
          <div>
            <Label>Дата і час</Label>
            <Input
              type="datetime-local"
              value={event.eventDate?.slice(0, 16) ?? ""}
              onChange={(e) => updateEventField("eventDate", new Date(e.target.value).toISOString())}
            />
          </div>
        </div>
      );

    case "calendar":
      return (
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-medium text-primary">Дані блоку</p>
          <div>
            <Label>Дата і час</Label>
            <Input
              type="datetime-local"
              value={event.eventDate?.slice(0, 16) ?? ""}
              onChange={(e) => updateEventField("eventDate", new Date(e.target.value).toISOString())}
            />
          </div>
        </div>
      );

    case "details":
      return (
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-medium text-primary">Дані блоку</p>
          <div>
            <Label>Дата і час</Label>
            <Input
              type="datetime-local"
              value={event.eventDate?.slice(0, 16) ?? ""}
              onChange={(e) => updateEventField("eventDate", new Date(e.target.value).toISOString())}
            />
          </div>
          <div>
            <Label>Місце проведення</Label>
            <Input value={event.venueName ?? ""} onChange={(e) => updateEventField("venueName", e.target.value)} />
          </div>
          <div>
            <Label>Адреса</Label>
            <Input value={event.venueAddress ?? ""} onChange={(e) => updateEventField("venueAddress", e.target.value)} />
          </div>
          <div>
            <Label>Google Maps</Label>
            <Input value={event.googleMapsLink ?? ""} onChange={(e) => updateEventField("googleMapsLink", e.target.value)} />
          </div>
        </div>
      );

    case "dressCode":
      return (
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-medium text-primary">Дані блоку</p>
          <div>
            <Label>Текст (необовʼязково)</Label>
            <Input
              value={event.dressCode ?? ""}
              onChange={(e) => updateEventField("dressCode", e.target.value)}
              placeholder="Наприклад: елегантний вечірній стиль"
            />
          </div>
          <div>
            <Label className="mb-2 block">Кольори</Label>
            <div className="flex flex-wrap items-center gap-2">
              {((block.data.colors as string[] | undefined) ?? []).map((c, i) => (
                <div key={i} className="group relative">
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(c) ? c : "#cccccc"}
                    onChange={(e) => {
                      const next = [...((block.data.colors as string[]) ?? [])];
                      next[i] = e.target.value;
                      updateBlock(block.id, { data: { colors: next } });
                    }}
                    className="h-10 w-10 cursor-pointer rounded-full border border-black/15 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none"
                    title={c}
                  />
                  <button
                    type="button"
                    aria-label="Видалити колір"
                    onClick={() => {
                      const next = ((block.data.colors as string[]) ?? []).filter((_, j) => j !== i);
                      updateBlock(block.id, { data: { colors: next } });
                    }}
                    className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] leading-none text-white group-hover:flex"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                aria-label="Додати колір"
                onClick={() => {
                  const next = [...((block.data.colors as string[]) ?? []), "#c9a0a0"];
                  updateBlock(block.id, { data: { colors: next } });
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-primary/50 text-lg leading-none text-primary transition-colors hover:bg-primary/10"
              >
                +
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">Натисніть коло, щоб змінити колір</p>
          </div>
          <div>
            <Label>Розмір (px)</Label>
            <Input
              type="number"
              min={16}
              max={120}
              value={(block.data.colorSize as number) ?? 44}
              onChange={(e) =>
                updateBlock(block.id, {
                  data: { colorSize: Math.max(16, Math.min(120, Number(e.target.value) || 44)) },
                })
              }
            />
          </div>
          <div>
            <Label className="mb-2 block">Форма</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {DRESS_CODE_SHAPES.map(({ id, label }) => {
                const active = parseColorShape(block.data.colorShape) === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => updateBlock(block.id, { data: { colorShape: id as DressCodeColorShape } })}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-md border px-1 py-2 transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    <ShapePreview shape={id} />
                    <span className="text-[9px] leading-none">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Ряди (скільки кольорів у кожному)</Label>
            <div className="flex flex-wrap items-center gap-2">
              {(
                (block.data.colorRows as number[] | undefined) ??
                parseColorRows(undefined, ((block.data.colors as string[]) ?? []).length)
              ).map((n, i) => (
                <div key={i} className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    className="h-8 w-14 text-center text-xs"
                    value={n}
                    onChange={(e) => {
                      const rows = [
                        ...((block.data.colorRows as number[] | undefined) ??
                          parseColorRows(undefined, ((block.data.colors as string[]) ?? []).length)),
                      ];
                      rows[i] = Math.max(1, Number(e.target.value) || 1);
                      updateBlock(block.id, { data: { colorRows: rows } });
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Видалити ряд"
                    disabled={
                      ((block.data.colorRows as number[] | undefined) ?? [3, 2]).length <= 1
                    }
                    onClick={() => {
                      const rows = (
                        (block.data.colorRows as number[] | undefined) ?? [3, 2]
                      ).filter((_, j) => j !== i);
                      updateBlock(block.id, { data: { colorRows: rows.length ? rows : [3] } });
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-xs text-muted-foreground hover:bg-muted disabled:opacity-40"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const rows = [
                    ...((block.data.colorRows as number[] | undefined) ?? [3, 2]),
                    2,
                  ];
                  updateBlock(block.id, { data: { colorRows: rows } });
                }}
                className="h-8 rounded-md border border-dashed border-primary/40 px-2 text-xs text-primary hover:bg-primary/10"
              >
                + ряд
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Наприклад 3 і 2 — у першому ряду 3 кольори, у другому 2
            </p>
          </div>
          <div>
            <Label>Затримка між кольорами (мс)</Label>
            <Input
              type="number"
              min={0}
              value={(block.data.colorStaggerMs as number) ?? 120}
              onChange={(e) =>
                updateBlock(block.id, {
                  data: { colorStaggerMs: Math.max(0, Number(e.target.value) || 0) },
                })
              }
            />
          </div>
        </div>
      );

    case "schedule": {
      const items = parseDayProgramItems(block.data.items);
      const setItems = (next: DayProgramItem[]) =>
        updateBlock(block.id, { data: { items: next } });

      return (
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-medium text-primary">Дані блоку</p>
          <p className="text-[10px] text-muted-foreground">
            Назва зліва, іконка по центру, час справа
          </p>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="space-y-2 rounded-md border border-border/70 bg-background/70 p-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Пункт {index + 1}
                  </span>
                  <button
                    type="button"
                    className="text-[10px] text-destructive hover:underline"
                    onClick={() => setItems(items.filter((x) => x.id !== item.id))}
                  >
                    Видалити
                  </button>
                </div>
                <div>
                  <Label className="text-[10px]">Назва</Label>
                  <Input
                    value={item.title}
                    onChange={(e) => {
                      const next = items.map((x) =>
                        x.id === item.id ? { ...x, title: e.target.value } : x,
                      );
                      setItems(next);
                    }}
                    placeholder="Церемонія"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Час</Label>
                  <Input
                    value={item.time}
                    onChange={(e) => {
                      const next = items.map((x) =>
                        x.id === item.id ? { ...x, time: e.target.value } : x,
                      );
                      setItems(next);
                    }}
                    placeholder="14:00"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-[10px]">Іконка</Label>
                  <div className="grid grid-cols-5 gap-1">
                    {DAY_PROGRAM_ICONS.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        title={label}
                        onClick={() => {
                          const next = items.map((x) =>
                            x.id === item.id ? { ...x, icon: id as DayProgramIconId } : x,
                          );
                          setItems(next);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-0.5 rounded-md border px-1 py-1.5 transition-colors",
                          item.icon === id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/40",
                        )}
                      >
                        <DayProgramIcon id={id} size={22} color="#2c2420" />
                        <span className="text-[8px] leading-tight text-muted-foreground">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setItems([
                ...items,
                {
                  id: nanoid(8),
                  title: "Новий пункт",
                  time: "16:00",
                  icon: "star",
                },
              ])
            }
            className="w-full rounded-md border border-dashed border-primary/40 py-2 text-xs text-primary hover:bg-primary/10"
          >
            + Додати пункт
          </button>
        </div>
      );
    }

    case "gallery":
      return (
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-medium text-primary">Дані блоку</p>
          <ImageUploadField
            label="Фото для галереї"
            value={event.coverImageUrl ?? ""}
            onChange={(url) => updateEventField("coverImageUrl", url || null)}
            eventId={eventId}
            folder="gallery"
            imageStyle={block.style}
            onImageStyleChange={(patch) => updateBlock(block.id, { style: patch })}
            defaultImageHeight={320}
            fillMode={(block.data.coverFill as "image" | "color") ?? "image"}
            onFillModeChange={(mode) => updateBlock(block.id, { data: { coverFill: mode } })}
            fillColor={block.style.backgroundColor ?? "#7c3aed"}
            onFillColorChange={(c) => updateBlock(block.id, { style: { backgroundColor: c } })}
          />
        </div>
      );

    case "rsvp":
      return (
        <p className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          RSVP налаштовується автоматично. Персоналізація для гостей — у{" "}
          <Link href={`/dashboard/events/${eventId}/guests`} className="text-primary underline">
            Гості
          </Link>
          .
        </p>
      );

    default:
      return null;
  }
}

function ShapePreview({ shape }: { shape: DressCodeColorShape }) {
  const color = "#7c3aed";
  const size = 18;
  if (shape === "blob") {
    return (
      <span
        className="block"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: "58% 42% 52% 48% / 48% 54% 46% 52%",
          filter: "blur(0.6px)",
        }}
      />
    );
  }
  if (shape === "soft") {
    return (
      <span
        className="block rounded-full"
        style={{
          width: size * 0.55,
          height: size * 0.55,
          margin: "auto",
          backgroundColor: color,
          filter: "blur(4px)",
        }}
      />
    );
  }
  if (shape === "square") {
    return <span className="block rounded-[3px] bg-primary" style={{ width: size, height: size }} />;
  }
  if (shape === "diamond") {
    return (
      <span
        className="block rounded-[2px] bg-primary"
        style={{ width: size * 0.72, height: size * 0.72, transform: "rotate(45deg)" }}
      />
    );
  }
  if (shape === "hex") {
    return (
      <span
        className="block bg-primary"
        style={{
          width: size,
          height: size,
          clipPath: "polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)",
        }}
      />
    );
  }
  return <span className="block rounded-full bg-primary" style={{ width: size, height: size }} />;
}

