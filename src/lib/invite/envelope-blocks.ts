import { nanoid } from "nanoid";
import type { EnvelopeIntroBlock, EnvelopeIntroBlockType, EnvelopeIntroSettings } from "@/types";

export const ENVELOPE_BLOCK_LABELS: Record<EnvelopeIntroBlockType, string> = {
  title: "Заголовок",
  subtitle: "Підзаголовок",
  cta: "Підказка",
  arrow: "Стрілка",
  envelope: "Конверт",
};

export const ENVELOPE_BLOCK_ICONS: Record<EnvelopeIntroBlockType, string> = {
  title: "Aa",
  subtitle: "··",
  cta: "→",
  arrow: "↓",
  envelope: "✉",
};

const DEFAULT_MARGINS: Record<EnvelopeIntroBlockType, { top: number; bottom: number }> = {
  title: { top: 0, bottom: 1 },
  subtitle: { top: 0, bottom: 1 },
  cta: { top: 1.5, bottom: 0.5 },
  arrow: { top: 0, bottom: 2 },
  envelope: { top: 1, bottom: 0 },
};

export function createEnvelopeBlock(type: EnvelopeIntroBlockType): EnvelopeIntroBlock {
  const m = DEFAULT_MARGINS[type];
  return {
    id: nanoid(8),
    type,
    visible: true,
    align: "center",
    marginTop: m.top,
    marginBottom: m.bottom,
    pinBottom: false,
  };
}

export function createDefaultEnvelopeBlocks(): EnvelopeIntroBlock[] {
  return [
    createEnvelopeBlock("title"),
    createEnvelopeBlock("cta"),
    createEnvelopeBlock("arrow"),
    createEnvelopeBlock("envelope"),
  ];
}

/** Normalize settings: ensure blocks[] exists, migrate legacy toggles once. */
export function resolveEnvelopeBlocks(settings?: EnvelopeIntroSettings | null): EnvelopeIntroBlock[] {
  const s = settings ?? {};
  if (Array.isArray(s.blocks) && s.blocks.length > 0) {
    return s.blocks.map((b) => {
      const defaults = DEFAULT_MARGINS[b.type];
      return {
        ...b,
        visible: b.visible !== false,
        align: b.align ?? "center",
        marginTop: typeof b.marginTop === "number" ? b.marginTop : defaults.top,
        marginBottom: typeof b.marginBottom === "number" ? b.marginBottom : defaults.bottom,
        pinBottom: b.pinBottom === true,
      };
    });
  }

  const blocks: EnvelopeIntroBlock[] = [];
  if (s.showTitle !== false) blocks.push(createEnvelopeBlock("title"));
  if (s.showSubtitle === true) blocks.push(createEnvelopeBlock("subtitle"));
  if (s.showCta !== false) blocks.push(createEnvelopeBlock("cta"));
  if (s.showArrow !== false) blocks.push(createEnvelopeBlock("arrow"));
  blocks.push(createEnvelopeBlock("envelope"));
  return blocks;
}

export function resolveEnvelopeContentAlign(
  settings?: EnvelopeIntroSettings | null,
): "top" | "center" | "bottom" {
  return settings?.contentAlign ?? settings?.layout ?? "center";
}

export function updateEnvelopeBlock(
  blocks: EnvelopeIntroBlock[],
  id: string,
  patch: Partial<EnvelopeIntroBlock>,
): EnvelopeIntroBlock[] {
  return blocks.map((b) => (b.id === id ? { ...b, ...patch } : b));
}

export function reorderEnvelopeBlocks(blocks: EnvelopeIntroBlock[], from: number, to: number): EnvelopeIntroBlock[] {
  if (from < 0 || to < 0 || from >= blocks.length || to >= blocks.length || from === to) return blocks;
  const next = [...blocks];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function getMissingEnvelopeBlockTypes(blocks: EnvelopeIntroBlock[]): EnvelopeIntroBlockType[] {
  const present = new Set(blocks.map((b) => b.type));
  return (Object.keys(ENVELOPE_BLOCK_LABELS) as EnvelopeIntroBlockType[]).filter((t) => !present.has(t));
}
