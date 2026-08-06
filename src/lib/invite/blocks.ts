import { nanoid } from "nanoid";
import { BLOCK_TYPE_LABELS } from "@/lib/i18n/uk";
import type { BlockType, DesignBlock, DesignContent, BlockStyle } from "@/types/design";

export type EventBindField = "title" | "invitationMessage" | "dressCode" | "additionalInfo";

export function getBlockBoundText(
  block: DesignBlock,
  event: { title: string; invitationMessage?: string | null; dressCode?: string | null; additionalInfo?: string | null },
): string | null {
  const bind = block.data.bindField as EventBindField | null | undefined;
  if (!bind) return null;
  if (bind === "title") return event.title;
  if (bind === "invitationMessage") return event.invitationMessage ?? null;
  if (bind === "dressCode") return event.dressCode ?? null;
  if (bind === "additionalInfo") return event.additionalInfo ?? null;
  return null;
}

export function syncBlocksFromEvent(
  blocks: DesignBlock[],
  event: { title: string; invitationMessage?: string | null; dressCode?: string | null; additionalInfo?: string | null },
): DesignBlock[] {
  return mapBlocksDeep(blocks, (block) => {
    const bind = block.data.bindField as EventBindField | null | undefined;
    if (!bind) return block;
    const value = getBlockBoundText(block, event);
    return { ...block, data: { ...block.data, text: value ?? "" } };
  });
}

/** Block types that pull live data from the event (left panel). */
export const EVENT_DATA_BLOCKS: Partial<Record<BlockType, string>> = {
  hero: "Назва, організатори, обкладинка",
  monogram: "Монограма з імен",
  countdown: "Дата і час",
  calendar: "Дата події",
  details: "Місце та адреса",
  dressCode: "Дрес-код",
  gallery: "Обкладинка / фото",
  schedule: "Програма дня — пункти з іконками",
  rsvp: "Форма відповіді",
};

export const PALETTE_PREFIX = "palette:";
export const INSERT_PREFIX = "insert:";

export function paletteId(type: BlockType) {
  return `${PALETTE_PREFIX}${type}`;
}

export function isPaletteId(id: string) {
  return id.startsWith(PALETTE_PREFIX);
}

export function paletteType(id: string): BlockType {
  return id.slice(PALETTE_PREFIX.length) as BlockType;
}

export function insertIndex(id: string): number {
  return parseInt(id.slice(INSERT_PREFIX.length), 10);
}

export function isInsertId(id: string) {
  return id.startsWith(INSERT_PREFIX);
}

export function insertId(index: number) {
  return `${INSERT_PREFIX}${index}`;
}

export const CANVAS_DROP_ID = "canvas:preview";
export const SECTION_DROP_PREFIX = "section-drop:";
export const SECTION_INSERT_PREFIX = "section-insert:";

export function isCanvasDropId(id: string) {
  return id === CANVAS_DROP_ID;
}

export function sectionDropId(sectionId: string) {
  return `${SECTION_DROP_PREFIX}${sectionId}`;
}

export function isSectionDropId(id: string) {
  return id.startsWith(SECTION_DROP_PREFIX);
}

export function parseSectionDropId(id: string): string | null {
  if (!isSectionDropId(id)) return null;
  return id.slice(SECTION_DROP_PREFIX.length);
}

/** section-insert:{sectionId}:{index} */
export function sectionInsertId(sectionId: string, index: number) {
  return `${SECTION_INSERT_PREFIX}${sectionId}:${index}`;
}

export function isSectionInsertId(id: string) {
  return id.startsWith(SECTION_INSERT_PREFIX);
}

export function parseSectionInsertId(id: string): { sectionId: string; index: number } | null {
  if (!isSectionInsertId(id)) return null;
  const rest = id.slice(SECTION_INSERT_PREFIX.length);
  const colon = rest.lastIndexOf(":");
  if (colon < 0) return null;
  const sectionId = rest.slice(0, colon);
  const index = parseInt(rest.slice(colon + 1), 10);
  if (!sectionId || Number.isNaN(index)) return null;
  return { sectionId, index };
}

export const LIST_BLOCK_PREFIX = "list-block:";
export const CANVAS_BLOCK_PREFIX = "canvas-block:";

export function listBlockId(blockId: string) {
  return `${LIST_BLOCK_PREFIX}${blockId}`;
}

export function canvasBlockId(blockId: string) {
  return `${CANVAS_BLOCK_PREFIX}${blockId}`;
}

/** Normalize user-entered link for <a href>. Returns null if empty/invalid. */
export function normalizeBlockLink(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const t = url.trim();
  if (!t) return null;
  if (/^(https?:|mailto:|tel:)/i.test(t)) return t;
  if (t.startsWith("/") || t.startsWith("#")) return t;
  if (/^[\w.-]+\.[\w.-]+/.test(t)) return `https://${t}`;
  return t;
}

export function isListBlockId(id: string) {
  return id.startsWith(LIST_BLOCK_PREFIX);
}

export function isCanvasBlockId(id: string) {
  return id.startsWith(CANVAS_BLOCK_PREFIX);
}

export function parseSortableBlockId(id: string): string | null {
  if (isListBlockId(id)) return id.slice(LIST_BLOCK_PREFIX.length);
  if (isCanvasBlockId(id)) return id.slice(CANVAS_BLOCK_PREFIX.length);
  return null;
}

export const BLOCK_CATALOG: { type: BlockType; label: string; icon: string }[] = [
  { type: "hero", label: BLOCK_TYPE_LABELS.hero, icon: "🖼️" },
  { type: "monogram", label: BLOCK_TYPE_LABELS.monogram, icon: "✨" },
  { type: "heading", label: BLOCK_TYPE_LABELS.heading, icon: "H" },
  { type: "text", label: BLOCK_TYPE_LABELS.text, icon: "T" },
  { type: "image", label: BLOCK_TYPE_LABELS.image, icon: "📷" },
  { type: "countdown", label: BLOCK_TYPE_LABELS.countdown, icon: "⏱️" },
  { type: "calendar", label: BLOCK_TYPE_LABELS.calendar, icon: "📅" },
  { type: "details", label: BLOCK_TYPE_LABELS.details, icon: "📍" },
  { type: "gallery", label: BLOCK_TYPE_LABELS.gallery, icon: "🎞️" },
  { type: "dressCode", label: BLOCK_TYPE_LABELS.dressCode, icon: "👔" },
  { type: "schedule", label: BLOCK_TYPE_LABELS.schedule, icon: "🗓️" },
  { type: "divider", label: BLOCK_TYPE_LABELS.divider, icon: "—" },
  { type: "spacer", label: BLOCK_TYPE_LABELS.spacer, icon: "↕️" },
  { type: "icon", label: BLOCK_TYPE_LABELS.icon, icon: "★" },
  { type: "button", label: BLOCK_TYPE_LABELS.button, icon: "🔗" },
  { type: "rsvp", label: BLOCK_TYPE_LABELS.rsvp, icon: "✉️" },
  { type: "section", label: BLOCK_TYPE_LABELS.section, icon: "▭" },
];

const DEFAULT_STYLE: BlockStyle = {
  textAlign: "center",
  fontSize: 16,
  fontFamily: "sans",
  color: "#2c2420",
  paddingTop: 8,
  paddingBottom: 8,
};

export function createBlock(type: BlockType): DesignBlock {
  const catalog = BLOCK_CATALOG.find((b) => b.type === type)!;
  const base = {
    id: nanoid(8),
    type,
    label: catalog.label,
    style: { ...DEFAULT_STYLE },
    animation: "fade" as const,
    animationDelay: 0,
    animationDuration: 550,
  };

  switch (type) {
    case "hero":
      return {
        ...base,
        data: {
          showCover: true,
          showTitle: true,
          showHosts: true,
          showGreeting: false,
          greetingText: "",
          fullScreenCover: false,
          coverLayout: "boxed",
          imageAnimation: "fade",
          imageAnimationDelay: 0,
          imageAnimationDuration: 550,
          textAnimation: "fade",
          textAnimationDelay: 200,
          textAnimationDuration: 550,
        },
        style: { ...base.style, imageWidth: 100, imageHeight: 256, borderRadius: 12, objectFit: "cover", objectPosition: "center" },
        animation: "none" as const,
      };
    case "monogram":
      return { ...base, data: { text: "" }, style: { ...base.style, fontFamily: "cormorant", fontSize: 48 } };
    case "heading":
      return {
        ...base,
        data: { text: "День весілля" },
        style: { ...base.style, fontFamily: "cormorant", fontSize: 32, color: "#5c4a3d" },
      };
    case "text":
      return { ...base, data: { text: "Ваш текст запрошення..." }, style: { ...base.style, fontSize: 15 } };
    case "image":
      return {
        ...base,
        data: { url: "", alt: "" },
        style: {
          ...base.style,
          imageWidth: 80,
          imageHeight: 240,
          borderRadius: 16,
          objectFit: "cover",
          objectPosition: "center",
        },
      };
    case "icon":
      return { ...base, data: { icon: "heart", label: "З любов'ю" }, style: { ...base.style, fontSize: 14 } };
    case "button":
      return {
        ...base,
        data: {
          label: "Детальніше",
          url: "",
          openInNewTab: true,
          fullWidth: false,
        },
        style: {
          ...base.style,
          backgroundColor: "#7c3aed",
          color: "#ffffff",
          borderRadius: 12,
          borderWidth: 0,
          borderColor: "#7c3aed",
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          fontSize: 15,
          maxWidth: 100,
        },
      };
    case "divider":
      return { ...base, data: { variant: "line" }, style: { ...base.style, paddingTop: 16, paddingBottom: 16 } };
    case "spacer":
      return { ...base, data: { height: 32 }, animation: "none" };
    case "countdown":
      return {
        ...base,
        data: { style: "elegant", showLabels: true },
        style: { ...base.style, fontFamily: "cormorant", fontSize: 48 },
      };
    case "calendar":
      return {
        ...base,
        data: { dateMarker: "ring-classic", dateMarkerAnimation: "fade" },
        style: { ...base.style, fontFamily: "cormorant", fontSize: 16 },
      };
    case "details":
      return { ...base, data: {} };
    case "gallery":
      return {
        ...base,
        data: {},
        style: { ...base.style, imageWidth: 100, imageHeight: 320, borderRadius: 24, objectFit: "cover", objectPosition: "center" },
      };
    case "dressCode":
      return {
        ...base,
        data: {
          colors: ["#f3e8e4", "#e8aeb8", "#c47884", "#1a2744", "#111111"] as string[],
          colorRows: [3, 2] as number[],
          colorStaggerMs: 120,
          colorSize: 44,
          colorShape: "circle",
        },
        animation: "none" as const,
      };
    case "schedule":
      return {
        ...base,
        data: {
          items: [
            { id: "p1", title: "Збір гостей", time: "13:30", icon: "glass" },
            { id: "p2", title: "Церемонія", time: "14:00", icon: "rings" },
            { id: "p3", title: "Банкет", time: "15:00", icon: "dinner" },
          ],
          itemGap: 36,
        },
        style: { ...base.style, fontFamily: "cormorant", fontSize: 16 },
      };
    case "rsvp":
      return { ...base, data: {} };
    case "section":
      return {
        ...base,
        data: {
          topEdge: "torn",
          bottomEdge: "torn",
          children: [] as DesignBlock[],
        },
        style: {
          ...base.style,
          backgroundColor: "#6b7280",
          color: "#ffffff",
          paddingTop: 24,
          paddingBottom: 24,
          paddingLeft: 16,
          paddingRight: 16,
          gap: 8,
        },
        animation: "fade" as const,
      };
    default:
      return { ...base, data: {} };
  }
}

export function createDefaultDesign(event: {
  title: string;
  hostNames?: string | null;
  invitationMessage?: string | null;
  template?: { layout: string } | null;
}): DesignContent {
  const layout = event.template?.layout ?? "classic";
  const blocks: DesignBlock[] = [];

  blocks.push(createBlock("hero"));
  blocks.push(createBlock("monogram"));

  const greeting = createBlock("heading");
  greeting.data = { text: event.title || "День весілля" };
  blocks.push(greeting);

  const text = createBlock("text");
  text.data = {
    text: event.invitationMessage ?? "Ваш текст запрошення...",
  };
  blocks.push(text);

  blocks.push(createBlock("countdown"));

  if (layout === "romantic" || layout === "classic") {
    blocks.push(createBlock("calendar"));
  }

  blocks.push(createBlock("details"));

  if (layout === "elegant" || layout === "romantic") {
    blocks.push(createBlock("gallery"));
  }

  blocks.push(createBlock("dressCode"));
  blocks.push(createBlock("rsvp"));

  return { version: 1, blocks };
}

export function parseDesignContent(raw: unknown): DesignContent {
  if (!raw || typeof raw !== "object") return { version: 1, blocks: [] };
  const obj = raw as { version?: number; blocks?: DesignBlock[] };
  if (obj.version === 1 && Array.isArray(obj.blocks)) {
    return { version: 1, blocks: obj.blocks };
  }
  return { version: 1, blocks: [] };
}

export function getSectionChildren(block: DesignBlock): DesignBlock[] {
  if (block.type !== "section") return [];
  const raw = block.data.children;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (c): c is DesignBlock =>
      !!c &&
      typeof c === "object" &&
      typeof (c as DesignBlock).id === "string" &&
      typeof (c as DesignBlock).type === "string",
  );
}

export function findBlockDeep(
  blocks: DesignBlock[],
  id: string,
): { block: DesignBlock; parentSectionId: string | null } | null {
  for (const b of blocks) {
    if (b.id === id) return { block: b, parentSectionId: null };
    if (b.type === "section") {
      const children = getSectionChildren(b);
      for (const child of children) {
        if (child.id === id) return { block: child, parentSectionId: b.id };
      }
    }
  }
  return null;
}

export function mapBlocksDeep(
  blocks: DesignBlock[],
  fn: (block: DesignBlock) => DesignBlock,
): DesignBlock[] {
  return blocks.map((b) => {
    const next = fn(b);
    if (next.type === "section") {
      const children = getSectionChildren(next);
      return {
        ...next,
        data: {
          ...next.data,
          children: children.map((c) => fn(c)),
        },
      };
    }
    return next;
  });
}

/**
 * Make heading/text blocks independent: copy bound event value into data.text
 * and clear bindField so each block can be edited separately.
 */
export function detachBoundTextBlocks(
  blocks: DesignBlock[],
  event: { title: string; invitationMessage?: string | null; dressCode?: string | null; additionalInfo?: string | null },
): DesignBlock[] {
  return mapBlocksDeep(blocks, (block) => {
    if (block.type !== "text" && block.type !== "heading") return block;
    if (!block.data.bindField) return block;
    const text = getBlockBoundText(block, event) ?? (block.data.text as string) ?? "";
    return { ...block, data: { ...block.data, text, bindField: null } };
  });
}

export function updateBlockDeep(
  blocks: DesignBlock[],
  id: string,
  patch: Partial<DesignBlock>,
): DesignBlock[] {
  return blocks.map((b) => {
    if (b.id === id) {
      return {
        ...b,
        ...patch,
        data: { ...b.data, ...(patch.data ?? {}) },
        style: { ...b.style, ...(patch.style ?? {}) },
      };
    }
    if (b.type === "section") {
      const children = getSectionChildren(b);
      if (children.some((c) => c.id === id)) {
        return {
          ...b,
          data: {
            ...b.data,
            children: children.map((c) =>
              c.id === id
                ? {
                    ...c,
                    ...patch,
                    data: { ...c.data, ...(patch.data ?? {}) },
                    style: { ...c.style, ...(patch.style ?? {}) },
                  }
                : c,
            ),
          },
        };
      }
    }
    return b;
  });
}

export function deleteBlockDeep(blocks: DesignBlock[], id: string): DesignBlock[] {
  const filtered = blocks.filter((b) => b.id !== id);
  return filtered.map((b) => {
    if (b.type !== "section") return b;
    const children = getSectionChildren(b);
    if (!children.some((c) => c.id === id)) return b;
    return {
      ...b,
      data: { ...b.data, children: children.filter((c) => c.id !== id) },
    };
  });
}

export function addBlockToSection(
  blocks: DesignBlock[],
  sectionId: string,
  child: DesignBlock,
): DesignBlock[] {
  return addBlockToSectionAt(blocks, sectionId, child, -1);
}

export function addBlockToSectionAt(
  blocks: DesignBlock[],
  sectionId: string,
  child: DesignBlock,
  index: number,
): DesignBlock[] {
  return blocks.map((b) => {
    if (b.id !== sectionId || b.type !== "section") return b;
    const children = getSectionChildren(b);
    const to = index < 0 ? children.length : Math.max(0, Math.min(index, children.length));
    return {
      ...b,
      data: {
        ...b.data,
        children: [...children.slice(0, to), child, ...children.slice(to)],
      },
    };
  });
}

/** Move a top-level or nested block into a section (appended). */
export function moveBlockIntoSection(
  blocks: DesignBlock[],
  blockId: string,
  sectionId: string,
): DesignBlock[] {
  return moveBlockIntoSectionAt(blocks, blockId, sectionId, -1);
}

/** Insert into section at index (-1 = append). Reorders if already in that section. */
export function moveBlockIntoSectionAt(
  blocks: DesignBlock[],
  blockId: string,
  sectionId: string,
  index: number,
): DesignBlock[] {
  if (blockId === sectionId) return blocks;
  const found = findBlockDeep(blocks, blockId);
  if (!found || found.block.type === "section" || found.block.type === "hero") return blocks;

  const extracted = found.block;

  // Same section → reorder
  if (found.parentSectionId === sectionId) {
    return blocks.map((b) => {
      if (b.id !== sectionId) return b;
      const children = getSectionChildren(b);
      const from = children.findIndex((c) => c.id === blockId);
      if (from < 0) return b;
      let to = index < 0 ? children.length - 1 : index;
      // When removing first, indices after shift
      const without = children.filter((c) => c.id !== blockId);
      if (from < to) to -= 1;
      to = Math.max(0, Math.min(to, without.length));
      return {
        ...b,
        data: {
          ...b.data,
          children: [...without.slice(0, to), extracted, ...without.slice(to)],
        },
      };
    });
  }

  const without = deleteBlockDeep(blocks, blockId);
  return without.map((b) => {
    if (b.id !== sectionId || b.type !== "section") return b;
    const children = getSectionChildren(b);
    const to = index < 0 ? children.length : Math.max(0, Math.min(index, children.length));
    return {
      ...b,
      data: {
        ...b.data,
        children: [...children.slice(0, to), extracted, ...children.slice(to)],
      },
    };
  });
}

export function reorderSectionChildren(
  blocks: DesignBlock[],
  sectionId: string,
  activeChildId: string,
  overChildId: string,
): DesignBlock[] {
  return blocks.map((b) => {
    if (b.id !== sectionId) return b;
    const children = getSectionChildren(b);
    const oldIndex = children.findIndex((c) => c.id === activeChildId);
    const newIndex = children.findIndex((c) => c.id === overChildId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return b;
    const next = [...children];
    const [item] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, item);
    return { ...b, data: { ...b.data, children: next } };
  });
}

/** Lift child out (or move top-level) to a specific top-level index. */
export function moveBlockToTopLevelAt(
  blocks: DesignBlock[],
  blockId: string,
  index: number,
): DesignBlock[] {
  const found = findBlockDeep(blocks, blockId);
  if (!found || found.block.type === "section") return blocks;
  const extracted = found.block;
  const without = deleteBlockDeep(blocks, blockId);
  const to = Math.max(0, Math.min(index, without.length));
  return [...without.slice(0, to), extracted, ...without.slice(to)];
}

/** Lift a child out of its section to top-level (after the section). */
export function moveBlockOutOfSection(
  blocks: DesignBlock[],
  blockId: string,
): DesignBlock[] {
  let lifted: DesignBlock | null = null;
  let sectionIndex = -1;
  const next = blocks.map((b, i) => {
    if (b.type !== "section") return b;
    const children = getSectionChildren(b);
    const child = children.find((c) => c.id === blockId);
    if (!child) return b;
    lifted = child;
    sectionIndex = i;
    return {
      ...b,
      data: { ...b.data, children: children.filter((c) => c.id !== blockId) },
    };
  });
  if (!lifted || sectionIndex < 0) return blocks;
  return [...next.slice(0, sectionIndex + 1), lifted, ...next.slice(sectionIndex + 1)];
}
