"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Layers, Plus, Trash2, Mail, Stamp } from "lucide-react";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";
import { TextStyleEditor } from "@/components/dashboard/text-style-editor";
import { Input, Label } from "@/components/ui/input";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import type { TextElementStyle } from "@/types/design";
import {
  ENVELOPE_BLOCK_ICONS,
  ENVELOPE_BLOCK_LABELS,
  createEnvelopeBlock,
  getMissingEnvelopeBlockTypes,
  resolveEnvelopeBlocks,
  resolveEnvelopeContentAlign,
  updateEnvelopeBlock,
} from "@/lib/invite/envelope-blocks";
import type { EnvelopeIntroBlock, EnvelopeIntroBlockType, EnvelopeIntroSettings } from "@/types";
import { cn } from "@/lib/utils/cn";

function PanelHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 border-b border-border pb-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="mb-1 block text-[11px] text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 font-mono text-xs" />
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "rounded-md border px-1.5 py-1.5 text-[10px] font-medium transition-colors",
            value === opt.id
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SortableEnvelopeStructureItem({
  block,
  selected,
  onSelect,
  onDelete,
  onToggleVisible,
}: {
  block: EnvelopeIntroBlock;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleVisible: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `envelope-struct:${block.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-2 py-2 text-sm transition-colors",
        selected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background hover:bg-muted/40",
        block.visible === false && "opacity-50",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground"
        aria-label="Перетягнути"
        title="Змінити порядок"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button type="button" className="flex flex-1 items-center gap-2 text-left" onClick={onSelect}>
        <span className="text-base">{ENVELOPE_BLOCK_ICONS[block.type]}</span>
        <span className="truncate">{ENVELOPE_BLOCK_LABELS[block.type]}</span>
      </button>
      <button
        type="button"
        onClick={onToggleVisible}
        className="rounded p-1 text-muted-foreground hover:bg-muted"
        title={block.visible === false ? "Показати" : "Сховати"}
      >
        {block.visible === false ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** Structure list with drag-reorder — same UX as invite «Структура». */
export function EnvelopeIntroStructurePanel({
  settings,
  onChange,
  selectedBlockId,
  onSelectBlock,
}: {
  settings: EnvelopeIntroSettings;
  onChange: (patch: Partial<EnvelopeIntroSettings>) => void;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
}) {
  const blocks = resolveEnvelopeBlocks(settings);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => `envelope-struct:${b.id}` === String(active.id));
    const newIndex = blocks.findIndex((b) => `envelope-struct:${b.id}` === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onChange({ blocks: arrayMove(blocks, oldIndex, newIndex) });
  };

  return (
    <div className="shrink-0 border-b border-border p-4">
      <PanelHeader
        icon={Layers}
        title="Структура"
        subtitle="Перетягуйте блоки, щоб змінити порядок"
      />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={blocks.map((b) => `envelope-struct:${b.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="max-h-56 space-y-1.5 overflow-y-auto">
            {blocks.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">Додайте блок зліва</p>
            ) : (
              blocks.map((block) => (
                <SortableEnvelopeStructureItem
                  key={block.id}
                  block={block}
                  selected={selectedBlockId === block.id}
                  onSelect={() => onSelectBlock(block.id)}
                  onToggleVisible={() =>
                    onChange({
                      blocks: updateEnvelopeBlock(blocks, block.id, {
                        visible: block.visible === false,
                      }),
                    })
                  }
                  onDelete={() => {
                    onChange({ blocks: blocks.filter((b) => b.id !== block.id) });
                    if (selectedBlockId === block.id) onSelectBlock(null);
                  }}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export function EnvelopeIntroLeftPanel({
  settings,
  onChange,
  eventId,
  selectedBlockId,
  onSelectBlock,
}: {
  settings: EnvelopeIntroSettings;
  onChange: (patch: Partial<EnvelopeIntroSettings>) => void;
  eventId: string;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
}) {
  const blocks = resolveEnvelopeBlocks(settings);
  const missing = getMissingEnvelopeBlockTypes(blocks);
  const selected = blocks.find((b) => b.id === selectedBlockId) ?? null;

  const setBlocks = (next: EnvelopeIntroBlock[]) => onChange({ blocks: next });

  const patchSelected = (patch: Partial<EnvelopeIntroBlock>) => {
    if (!selected) return;
    setBlocks(updateEnvelopeBlock(blocks, selected.id, patch));
  };

  const addBlock = (type: EnvelopeIntroBlockType) => {
    const block = createEnvelopeBlock(type);
    setBlocks([...blocks, block]);
    onSelectBlock(block.id);
  };

  return (
    <div className="space-y-5">
      <PanelHeader icon={Mail} title="Екран перед запрошенням" subtitle="Додайте блоки та налаштуйте обраний" />

      {missing.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Додати блок</p>
          {missing.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => addBlock(type)}
              className="flex w-full items-center gap-2 rounded-lg border border-border bg-background p-2 text-xs transition-shadow hover:border-primary/40"
            >
              <span className="text-base">{ENVELOPE_BLOCK_ICONS[type]}</span>
              <span className="flex-1 truncate text-left">{ENVELOPE_BLOCK_LABELS[type]}</span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Plus className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>
      )}

      {selected ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3">
          <p className="text-xs font-medium text-primary">{ENVELOPE_BLOCK_LABELS[selected.type]}</p>

          {(selected.type === "title" || selected.type === "subtitle" || selected.type === "cta") && (
            <>
              <div>
                <Label>Текст</Label>
                <Input
                  value={
                    selected.text ??
                    (selected.type === "title"
                      ? settings.title ?? ""
                      : selected.type === "subtitle"
                        ? settings.subtitle ?? ""
                        : settings.ctaLabel ?? "")
                  }
                  onChange={(e) => {
                    const text = e.target.value;
                    const nextBlocks = updateEnvelopeBlock(blocks, selected.id, { text });
                    if (selected.type === "title") onChange({ title: text, blocks: nextBlocks });
                    else if (selected.type === "subtitle") onChange({ subtitle: text, blocks: nextBlocks });
                    else onChange({ ctaLabel: text, blocks: nextBlocks });
                  }}
                  placeholder={
                    selected.type === "title"
                      ? "Wedding Invitation"
                      : selected.type === "subtitle"
                        ? "Анна & Дмитро"
                        : "тисни сюди"
                  }
                />
              </div>
              <TextStyleEditor
                label="Шрифт"
                value={selected.textStyle ?? {}}
                onChange={(patch) => {
                  const current = (selected.textStyle ?? {}) as TextElementStyle;
                  patchSelected({ textStyle: { ...current, ...patch } });
                }}
                defaults={
                  selected.type === "title"
                    ? {
                        fontSize: settings.titleSize ?? 36,
                        color: settings.textColor ?? "#2c2420",
                      }
                    : selected.type === "subtitle"
                      ? { fontSize: 14, color: settings.textColor ?? "#2c2420" }
                      : { fontSize: 11, color: settings.textColor ?? "#2c2420" }
                }
              />
            </>
          )}

          {selected.type === "envelope" && (
            <>
              <ImageUploadField
                label="Фото на конверті"
                value={settings.envelopeImageUrl ?? ""}
                onChange={(url) =>
                  onChange({
                    envelopeImageUrl: url || undefined,
                    envelopeStyle: url
                      ? "photo"
                      : settings.envelopeStyle === "photo"
                        ? "classic"
                        : settings.envelopeStyle,
                    // Full photo replaces CSS envelope — turn off overlays by default
                    ...(url
                      ? { showSeal: false, showPlayIcon: false }
                      : { showSeal: true, showPlayIcon: true }),
                  })
                }
                eventId={eventId}
                folder="envelope"
              />
              <div>
                <Label>Ініціали печатки</Label>
                <Input
                  value={settings.monogram ?? ""}
                  onChange={(e) => onChange({ monogram: e.target.value })}
                  placeholder="З імен"
                  maxLength={8}
                />
              </div>
            </>
          )}

          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Вирівнювання</Label>
            <Segmented
              value={selected.align ?? "center"}
              onChange={(align) => patchSelected({ align })}
              options={[
                { id: "left", label: "Ліво" },
                { id: "center", label: "Центр" },
                { id: "right", label: "Право" },
              ]}
            />
          </div>

          <ToggleSwitch
            label="Притиснути до низу"
            checked={selected.pinBottom === true}
            onChange={(pinBottom) => patchSelected({ pinBottom })}
          />

          {!selected.pinBottom ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Відступ зверху (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={selected.marginTop ?? 0}
                  onChange={(e) =>
                    patchSelected({
                      marginTop: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                    })
                  }
                />
              </div>
              <div>
                <Label>Відступ знизу (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={selected.marginBottom ?? 0}
                  onChange={(e) =>
                    patchSelected({
                      marginBottom: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                    })
                  }
                />
              </div>
            </div>
          ) : (
            <div>
              <Label>Відступ знизу (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={selected.marginBottom ?? 0}
                onChange={(e) =>
                  patchSelected({
                    marginBottom: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                  })
                }
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Відсоток від висоти екрана
              </p>
            </div>
          )}
          {!selected.pinBottom && (
            <p className="text-[10px] text-muted-foreground">Відступи — у % від висоти екрана</p>
          )}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
          Оберіть блок у структурі справа або на прев’ю
        </p>
      )}

      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Фон екрану</p>
        <ColorField
          label="Колір фону"
          value={settings.backgroundColor ?? "#f3eee6"}
          onChange={(backgroundColor) => onChange({ backgroundColor })}
        />
        <ImageUploadField
          label="Фонове фото"
          value={settings.backgroundImageUrl ?? ""}
          onChange={(url) => onChange({ backgroundImageUrl: url || undefined })}
          eventId={eventId}
          folder="envelope-bg"
        />
        {settings.backgroundImageUrl ? (
          <div>
            <Label className="mb-1 block text-[11px] text-muted-foreground">
              Затемнення ({Math.round((settings.backgroundOverlay ?? 0.35) * 100)}%)
            </Label>
            <input
              type="range"
              min={0}
              max={80}
              value={Math.round((settings.backgroundOverlay ?? 0.35) * 100)}
              onChange={(e) => onChange({ backgroundOverlay: Number(e.target.value) / 100 })}
              className="w-full"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function EnvelopeIntroRightPanel({
  settings,
  onChange,
  enabled,
  onEnabledChange,
  selectedBlockId,
}: {
  settings: EnvelopeIntroSettings;
  onChange: (patch: Partial<EnvelopeIntroSettings>) => void;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  selectedBlockId: string | null;
}) {
  const blocks = resolveEnvelopeBlocks(settings);
  const selected = blocks.find((b) => b.id === selectedBlockId) ?? null;
  const contentAlign = resolveEnvelopeContentAlign(settings);

  return (
    <div className="space-y-4 p-5">
      <PanelHeader icon={Stamp} title="Стиль екрана" subtitle="Висота екрана = висота сторінки" />

      <ToggleSwitch label="Показувати гостям" checked={enabled} onChange={onEnabledChange} />

      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Автовідкриття
        </p>
        <ToggleSwitch
          label="Відкрити без натискання"
          checked={(settings.autoOpenSeconds ?? 0) > 0}
          onChange={(v) => onChange({ autoOpenSeconds: v ? (settings.autoOpenSeconds || 5) : 0 })}
        />
        {(settings.autoOpenSeconds ?? 0) > 0 && (
          <div>
            <Label>Через скільки секунд</Label>
            <Input
              type="number"
              min={1}
              max={120}
              value={settings.autoOpenSeconds ?? 5}
              onChange={(e) => {
                const n = Math.min(120, Math.max(1, Number(e.target.value) || 1));
                onChange({ autoOpenSeconds: n });
              }}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Після цього часу запрошення відкриється само. Натискання на конверт і далі працює.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Розміщення стопки</p>
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Блоки на екрані</Label>
          <Segmented
            value={contentAlign}
            onChange={(next) => onChange({ contentAlign: next })}
            options={[
              { id: "top", label: "Зверху" },
              { id: "center", label: "Центр" },
              { id: "bottom", label: "Знизу" },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Padding зверху</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={settings.paddingTop ?? 48}
              onChange={(e) => onChange({ paddingTop: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Padding знизу</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={settings.paddingBottom ?? 48}
              onChange={(e) => onChange({ paddingBottom: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
        <div>
          <Label>Padding з боків</Label>
          <Input
            type="number"
            min={0}
            max={80}
            value={settings.paddingX ?? 24}
            onChange={(e) => onChange({ paddingX: Number(e.target.value) || 0 })}
          />
        </div>
      </div>

      {selected && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-medium text-primary">Обрано: {ENVELOPE_BLOCK_LABELS[selected.type]}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Відступи блоку — зліва. Порядок — перетягніть у «Структура».
          </p>
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Конверт</p>
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Стиль</Label>
          <Segmented
            value={settings.envelopeStyle ?? (settings.envelopeImageUrl ? "photo" : "classic")}
            onChange={(envelopeStyle) => onChange({ envelopeStyle })}
            options={[
              { id: "classic", label: "Класика" },
              { id: "photo", label: "З фото" },
              { id: "minimal", label: "Печатка" },
            ]}
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Ширина</Label>
          <Segmented
            value={settings.envelopeWidth ?? "normal"}
            onChange={(envelopeWidth) => onChange({ envelopeWidth })}
            options={[
              { id: "narrow", label: "Вузький" },
              { id: "normal", label: "Звичайний" },
              { id: "wide", label: "Широкий" },
            ]}
          />
        </div>
        <ToggleSwitch
          label="Печатка"
          checked={settings.envelopeImageUrl ? settings.showSeal === true : settings.showSeal !== false}
          onChange={(showSeal) => onChange({ showSeal })}
        />
        <ToggleSwitch
          label="Іконка play"
          checked={
            settings.envelopeImageUrl
              ? settings.showPlayIcon === true
              : settings.showPlayIcon !== false
          }
          onChange={(showPlayIcon) => onChange({ showPlayIcon })}
        />
        <p className="text-[10px] text-muted-foreground -mt-1">
          З фото конверта печатка й play вимкнені за замовчуванням — увімкніть, якщо потрібні поверх фото.
        </p>
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Розмір печатки</Label>
          <Segmented
            value={settings.sealSize ?? "md"}
            onChange={(sealSize) => onChange({ sealSize })}
            options={[
              { id: "sm", label: "S" },
              { id: "md", label: "M" },
              { id: "lg", label: "L" },
            ]}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Типографіка</p>
        <p className="text-[10px] leading-snug text-muted-foreground">
          Шрифт, товщина, розмір і колір — у налаштуваннях текстового блоку зліва (заголовок, підзаголовок, підказка).
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Кольори</p>
        <div className="grid grid-cols-2 gap-2">
          <ColorField
            label="Текст"
            value={settings.textColor ?? "#2c2420"}
            onChange={(textColor) => onChange({ textColor })}
          />
          <ColorField
            label="Печатка"
            value={settings.sealColor ?? "#c62828"}
            onChange={(sealColor) => onChange({ sealColor })}
          />
          <ColorField
            label="Конверт"
            value={settings.envelopeColor ?? "#f0ebe3"}
            onChange={(envelopeColor) => onChange({ envelopeColor })}
          />
          <ColorField
            label="Клапан"
            value={settings.flapColor ?? "#fbf9f6"}
            onChange={(flapColor) => onChange({ flapColor })}
          />
        </div>
      </div>
    </div>
  );
}
