"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  DragOverlay,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Save,
  Trash2,
  ExternalLink,
  Plus,
  Palette,
  Layers,
  Settings2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { EditorBlockCanvas } from "@/components/dashboard/design-editor/editor-block-canvas";
import { BlockEventFields } from "@/components/dashboard/design-editor/block-event-fields";
import { BlockLayoutSettings } from "@/components/dashboard/design-editor/block-layout-settings";
import { IMAGE_BLOCK_TYPES } from "@/lib/invite/block-style-utils";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";
import { resolveInviteContext } from "@/lib/invite/personalization";
import {
  EnvelopeIntroScreen,
} from "@/components/invite/envelope-intro-screen";
import {
  EnvelopeIntroLeftPanel,
  EnvelopeIntroRightPanel,
  EnvelopeIntroStructurePanel,
} from "@/components/dashboard/design-editor/envelope-intro-editor";
import type { EnvelopeIntroSettings } from "@/types";
import { resolveEnvelopeBlocks } from "@/lib/invite/envelope-blocks";
import {
  BLOCK_CATALOG,
  createBlock,
  createDefaultDesign,
  parseDesignContent,
  syncBlocksFromEvent,
  detachBoundTextBlocks,
  paletteId,
  isPaletteId,
  paletteType,
  isInsertId,
  insertIndex,
  CANVAS_DROP_ID,
  isCanvasDropId,
  listBlockId,
  canvasBlockId,
  isListBlockId,
  isCanvasBlockId,
  parseSortableBlockId,
  findBlockDeep,
  updateBlockDeep,
  deleteBlockDeep,
  getSectionChildren,
  addBlockToSection,
  addBlockToSectionAt,
  moveBlockIntoSection,
  moveBlockOutOfSection,
  moveBlockIntoSectionAt,
  moveBlockToTopLevelAt,
  reorderSectionChildren,
  isSectionDropId,
  parseSectionDropId,
  isSectionInsertId,
  parseSectionInsertId,
} from "@/lib/invite/blocks";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { FontSelect, FontWeightSelect, TextStyleEditor } from "@/components/dashboard/text-style-editor";
import type { FontWeight } from "@/components/dashboard/text-style-editor";
import { getCoverLayout, type CoverLayout, EDITOR_SCREEN_RADIUS } from "@/lib/invite/block-style-utils";
import { CoverEdgePicker, getCoverEdgeStyle, type CoverEdgeStyle } from "@/components/dashboard/cover-edge";
import { CalendarMarkerPicker } from "@/components/dashboard/calendar-marker-picker";
import type { DesignBlock, DesignContent, BlockAnimation, TextElementStyle } from "@/types/design";
import type { PublicInviteEvent } from "@/types/invite";
import type { CustomTheme } from "@/types";
import { cn } from "@/lib/utils/cn";
import { BLOCK_TYPE_LABELS, ICON_LABELS } from "@/lib/i18n/uk";
import type { InviteFontId } from "@/lib/invite/fonts";
import { DEFAULT_ANIMATION_DURATION_MS } from "@/lib/invite/motion";

type RightTab = "block" | "style";

function getBlockImageUrl(block: DesignBlock, event: PublicInviteEvent): string | null {
  if (block.type === "image") return (block.data.url as string) || null;
  if (block.type === "hero" || block.type === "gallery") return event.coverImageUrl;
  return null;
}

function pointerInsideRect(
  coords: { x: number; y: number },
  rect: { top: number; left: number; bottom: number; right: number },
) {
  return coords.x >= rect.left && coords.x <= rect.right && coords.y >= rect.top && coords.y <= rect.bottom;
}

function DraggablePaletteItem({
  type,
  icon,
  label,
  onAdd,
}: {
  type: DesignBlock["type"];
  icon: string;
  label: string;
  onAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: paletteId(type) });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-background p-2 text-xs transition-shadow",
        isDragging && "opacity-40 shadow-lg",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex flex-1 cursor-grab items-center gap-2 text-left"
      >
        <span className="text-base">{icon}</span>
        <span className="truncate">{label}</span>
      </button>
      <button
        type="button"
        onClick={onAdd}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20"
        aria-label={`Додати ${label}`}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SortableBlockItem({
  block,
  selected,
  onSelect,
  onDelete,
  nested = false,
}: {
  block: DesignBlock;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  nested?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: listBlockId(block.id),
    data: { type: nested ? "list-section-child" : "list-top" },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const catalog = BLOCK_CATALOG.find((b) => b.type === block.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-lg border text-sm transition-colors",
        nested ? "ml-4 px-2 py-1.5 text-xs" : "px-2 py-2",
        selected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background hover:bg-muted/40",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground"
        aria-label="Перетягнути"
        title={nested ? "Змінити порядок у секції" : "Змінити порядок"}
      >
        <GripVertical className={nested ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </button>
      <button type="button" className="flex flex-1 items-center gap-2 text-left" onClick={onSelect}>
        <span className={nested ? "text-sm" : "text-base"}>{catalog?.icon}</span>
        <span className="truncate">{BLOCK_TYPE_LABELS[block.type] ?? block.label}</span>
      </button>
      <button type="button" onClick={onDelete} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
        <Trash2 className={nested ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </button>
    </div>
  );
}

function PanelHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="mb-4 border-b border-border pb-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export function DesignEditor({
  eventId,
  setupMode = false,
  onFinishSetup,
}: {
  eventId: string;
  setupMode?: boolean;
  onFinishSetup?: () => void;
}) {
  const [event, setEvent] = useState<PublicInviteEvent | null>(null);
  const [blocks, setBlocks] = useState<DesignBlock[]>([]);
  const [customTheme, setCustomTheme] = useState<CustomTheme>({});
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("block");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draggingPaletteType, setDraggingPaletteType] = useState<DesignBlock["type"] | null>(null);
  const [activeDropId, setActiveDropId] = useState<string | null>(null);
  const [activeSectionDropId, setActiveSectionDropId] = useState<string | null>(null);
  const [animationReplayKey, setAnimationReplayKey] = useState(0);
  const [canvasView, setCanvasView] = useState<"invite" | "envelope">("invite");
  const [envelopePreviewKey, setEnvelopePreviewKey] = useState(0);
  const [selectedEnvelopeBlockId, setSelectedEnvelopeBlockId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const collisionDetection = useCallback<CollisionDetection>(
    (args) => {
      const activeId = String(args.active.id);
      const coords = args.pointerCoordinates;

      // Structure tree: siblings only (top-level among top-level, children among same section)
      if (isListBlockId(activeId)) {
        const activeBlockId = parseSortableBlockId(activeId);
        const activeFound = activeBlockId ? findBlockDeep(blocks, activeBlockId) : null;
        const parentId = activeFound?.parentSectionId ?? null;
        return closestCenter(args).filter(({ id }) => {
          if (!isListBlockId(String(id))) return false;
          const overBlockId = parseSortableBlockId(String(id));
          if (!overBlockId) return false;
          const overFound = findBlockDeep(blocks, overBlockId);
          if (!overFound) return false;
          return (overFound.parentSectionId ?? null) === parentId;
        });
      }

      const activeCanvasId = isCanvasBlockId(activeId) ? parseSortableBlockId(activeId) : null;
      const activeFound = activeCanvasId ? findBlockDeep(blocks, activeCanvasId) : null;
      const activeParentSectionId = activeFound?.parentSectionId ?? null;

      const rectHits = (predicate: (id: string) => boolean): { id: string | number }[] => {
        if (!coords) return [];
        const hits: { id: string | number }[] = [];
        for (const container of args.droppableContainers) {
          const id = String(container.id);
          if (!predicate(id)) continue;
          const rect = container.rect.current;
          if (rect && pointerInsideRect(coords, rect)) hits.push({ id: container.id });
        }
        return hits;
      };

      // —— Canvas block drag ——
      if (isCanvasBlockId(activeId)) {
        // Precise insert slots under pointer (same section first when nested)
        const insertHits = rectHits(isSectionInsertId);
        if (activeParentSectionId) {
          const sameSection = insertHits.filter(
            (h) => parseSectionInsertId(String(h.id))?.sectionId === activeParentSectionId,
          );
          if (sameSection.length > 0) return sameSection;
        } else if (insertHits.length > 0) {
          return insertHits;
        }

        // Reorder: closest sibling / other canvas block (must beat parent section-drop)
        const closestBlocks = closestCenter(args).filter(({ id }) => {
          const s = String(id);
          if (!isCanvasBlockId(s) || s === activeId) return false;
          if (!activeParentSectionId) return true;
          const oid = parseSortableBlockId(s);
          if (!oid) return false;
          return findBlockDeep(blocks, oid)?.parentSectionId === activeParentSectionId;
        });
        if (closestBlocks.length > 0) return closestBlocks;

        // Nest into another section (never treat own parent body as target — it blocks reorder)
        const sectionBodyHits = rectHits((id) => {
          if (!isSectionDropId(id)) return false;
          const sid = parseSectionDropId(id);
          return !!sid && sid !== activeParentSectionId;
        });
        if (sectionBodyHits.length > 0) return sectionBodyHits;

        if (coords) {
          const withinInsert = pointerWithin(args).filter(({ id }) => isSectionInsertId(String(id)));
          if (withinInsert.length > 0) return withinInsert;
        }

        // Lift out / top-level reorder
        const closest = closestCenter(args).filter(({ id }) => {
          const s = String(id);
          if (isSectionDropId(s) && parseSectionDropId(s) === activeParentSectionId) return false;
          return isInsertId(s) || isCanvasBlockId(s) || isCanvasDropId(s) || isSectionDropId(s) || isSectionInsertId(s);
        });
        if (closest.length > 0) return closest;
        return closestCenter(args);
      }

      // —— Palette: prefer section targets over top-level insert gaps ——
      const isCanvasTarget = (id: string) =>
        isCanvasDropId(id) ||
        isInsertId(id) ||
        isSectionDropId(id) ||
        isSectionInsertId(id) ||
        isCanvasBlockId(id);

      const sectionInsertHits = rectHits(isSectionInsertId);
      if (sectionInsertHits.length > 0) return sectionInsertHits;
      const sectionBodyHits = rectHits(isSectionDropId);
      if (sectionBodyHits.length > 0) return sectionBodyHits;

      if (coords) {
        const withinInsert = pointerWithin(args).filter(({ id }) => isSectionInsertId(String(id)));
        if (withinInsert.length > 0) return withinInsert;
        const withinDrop = pointerWithin(args).filter(({ id }) => isSectionDropId(String(id)));
        if (withinDrop.length > 0) return withinDrop;
      }

      const canvasContainer = args.droppableContainers.find((c) => c.id === CANVAS_DROP_ID);
      const canvasRect = canvasContainer?.rect.current;
      const inCanvas = canvasRect && coords ? pointerInsideRect(coords, canvasRect) : false;

      if (coords) {
        const hits = pointerWithin(args).filter(({ id }) => isCanvasTarget(String(id)));
        if (hits.length > 0) return hits;
        if (inCanvas) return [{ id: CANVAS_DROP_ID }];
        return [];
      }

      return closestCenter(args).filter(({ id }) => isCanvasTarget(String(id)));
    },
    [blocks],
  );

  const load = useCallback(() => {
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.data) return;
        const e = j.data;
        const design = parseDesignContent(e.design?.content);
        setEvent({
          ...e,
          design: { backgroundImageUrl: e.design?.backgroundImageUrl ?? null, content: design },
        });
        const rawBlocks = design.blocks.length ? design.blocks : createDefaultDesign(e).blocks;
        setBlocks(detachBoundTextBlocks(rawBlocks, e));
        setCustomTheme((e.customTheme as CustomTheme) ?? {});
        setBackgroundImageUrl(e.design?.backgroundImageUrl ?? "");
      });
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedFound = selectedId ? findBlockDeep(blocks, selectedId) : null;
  const selectedBlock = selectedFound?.block ?? null;
  const selectedParentSectionId = selectedFound?.parentSectionId ?? null;

  const previewEvent = useMemo((): PublicInviteEvent | null => {
    if (!event) return null;
    return {
      ...event,
      customTheme,
      design: { backgroundImageUrl: backgroundImageUrl || null, content: { version: 1, blocks } },
    };
  }, [event, customTheme, backgroundImageUrl, blocks]);

  const ctx = previewEvent ? resolveInviteContext(previewEvent, null) : null;

  const updateBlock = (id: string, patch: Partial<DesignBlock>) => {
    setBlocks((prev) => updateBlockDeep(prev, id, patch));
    setSaved(false);
  };

  const updateTextElementStyle = (
    id: string,
    key: "titleStyle" | "hostsStyle" | "greetingStyle",
    patch: TextElementStyle,
  ) => {
    const current =
      (findBlockDeep(blocks, id)?.block.data[key] as TextElementStyle | undefined) ?? {};
    updateBlock(id, { data: { [key]: { ...current, ...patch } } });
  };

  const replayAnimation = (id: string, patch: Partial<DesignBlock>) => {
    updateBlock(id, patch);
    setAnimationReplayKey((k) => k + 1);
  };

  const selectBlock = (id: string) => {
    setSelectedId(id);
    setRightTab("block");
  };

  const addBlock = (type: DesignBlock["type"], atIndex?: number) => {
    if (type !== "section" && selectedBlock?.type === "section") {
      const child = createBlock(type);
      setBlocks((prev) => addBlockToSection(prev, selectedBlock.id, child));
      setSelectedId(child.id);
      setRightTab("block");
      setSaved(false);
      return;
    }
    const block = createBlock(type);
    setBlocks((prev) => {
      const index = atIndex ?? prev.length;
      return [...prev.slice(0, index), block, ...prev.slice(index)];
    });
    setSelectedId(block.id);
    setRightTab("block");
    setSaved(false);
  };

  const insertBlockAt = (type: DesignBlock["type"], index: number) => {
    const block = createBlock(type);
    setBlocks((prev) => [...prev.slice(0, index), block, ...prev.slice(index)]);
    setSelectedId(block.id);
    setRightTab("block");
    setSaved(false);
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => deleteBlockDeep(prev, id));
    if (selectedId === id) setSelectedId(null);
    setSaved(false);
  };

  const addChildToSelectedSection = (type: DesignBlock["type"]) => {
    if (!selectedBlock || selectedBlock.type !== "section") return;
    const child = createBlock(type);
    setBlocks((prev) => addBlockToSection(prev, selectedBlock.id, child));
    setSelectedId(child.id);
    setSaved(false);
  };

  const nestSelectedIntoSection = (sectionId: string) => {
    if (!selectedId || selectedId === sectionId) return;
    setBlocks((prev) => moveBlockIntoSection(prev, selectedId, sectionId));
    setSaved(false);
  };

  const liftSelectedFromSection = () => {
    if (!selectedId || !selectedParentSectionId) return;
    setBlocks((prev) => moveBlockOutOfSection(prev, selectedId));
    setSaved(false);
  };

  const handleDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    if (isPaletteId(id)) setDraggingPaletteType(paletteType(id));
  };

  const handleDragOver = (e: DragOverEvent) => {
    const overId = e.over?.id ? String(e.over.id) : null;
    if (overId && (isInsertId(overId) || isSectionInsertId(overId))) {
      setActiveDropId(overId);
      setActiveSectionDropId(isSectionInsertId(overId) ? parseSectionInsertId(overId)?.sectionId ?? null : null);
    } else if (overId && isSectionDropId(overId)) {
      setActiveDropId(null);
      setActiveSectionDropId(parseSectionDropId(overId));
    } else {
      setActiveDropId(null);
      setActiveSectionDropId(null);
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setDraggingPaletteType(null);
    setActiveDropId(null);
    setActiveSectionDropId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // —— Structure tree: top-level reorder, or children within the same section ——
    if (isListBlockId(activeId)) {
      if (!isListBlockId(overId)) return;
      const activeBlockId = parseSortableBlockId(activeId);
      const overBlockId = parseSortableBlockId(overId);
      if (!activeBlockId || !overBlockId || activeBlockId === overBlockId) return;
      const activeFound = findBlockDeep(blocks, activeBlockId);
      const overFound = findBlockDeep(blocks, overBlockId);
      if (!activeFound || !overFound) return;

      if (
        activeFound.parentSectionId &&
        activeFound.parentSectionId === overFound.parentSectionId
      ) {
        setBlocks((prev) =>
          reorderSectionChildren(prev, activeFound.parentSectionId!, activeBlockId, overBlockId),
        );
        setSaved(false);
        return;
      }

      // No nesting / lifting via tree — top-level among top-level only
      if (activeFound.parentSectionId || overFound.parentSectionId) return;
      const oldIndex = blocks.findIndex((b) => b.id === activeBlockId);
      const newIndex = blocks.findIndex((b) => b.id === overBlockId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      setBlocks(arrayMove(blocks, oldIndex, newIndex));
      setSaved(false);
      return;
    }

    // —— Palette drops ——
    if (isPaletteId(activeId)) {
      const type = paletteType(activeId);
      if (type === "hero") {
        if (isInsertId(overId)) insertBlockAt(type, insertIndex(overId));
        else if (isCanvasDropId(overId)) insertBlockAt(type, blocks.length);
        return;
      }
      if (type === "section") {
        if (isSectionDropId(overId) || isSectionInsertId(overId)) return;
        if (isInsertId(overId)) insertBlockAt(type, insertIndex(overId));
        else if (isCanvasDropId(overId)) insertBlockAt(type, blocks.length);
        else {
          const idx = blocks.findIndex((b) => b.id === (parseSortableBlockId(overId) ?? overId));
          if (idx >= 0) insertBlockAt(type, idx);
        }
        return;
      }

      if (isSectionInsertId(overId)) {
        const parsed = parseSectionInsertId(overId);
        if (!parsed) return;
        const child = createBlock(type);
        setBlocks((prev) => addBlockToSectionAt(prev, parsed.sectionId, child, parsed.index));
        setSelectedId(child.id);
        setRightTab("block");
        setSaved(false);
        return;
      }

      if (isSectionDropId(overId)) {
        const sectionId = parseSectionDropId(overId);
        if (!sectionId) return;
        const child = createBlock(type);
        setBlocks((prev) => addBlockToSection(prev, sectionId, child));
        setSelectedId(child.id);
        setRightTab("block");
        setSaved(false);
        return;
      }

      if (isInsertId(overId)) {
        insertBlockAt(type, insertIndex(overId));
        return;
      }
      if (isCanvasDropId(overId)) {
        insertBlockAt(type, blocks.length);
        return;
      }
      const overBlockId = parseSortableBlockId(overId);
      if (overBlockId) {
        const overBlock = blocks.find((b) => b.id === overBlockId);
        if (overBlock?.type === "section") {
          const child = createBlock(type);
          setBlocks((prev) => addBlockToSection(prev, overBlock.id, child));
          setSelectedId(child.id);
          setRightTab("block");
          setSaved(false);
          return;
        }
        const idx = blocks.findIndex((b) => b.id === overBlockId);
        if (idx >= 0) insertBlockAt(type, idx);
      }
      return;
    }

    // —— Canvas blocks (top-level or section children) ——
    if (!isCanvasBlockId(activeId)) return;
    const activeBlockId = parseSortableBlockId(activeId);
    if (!activeBlockId) return;
    const found = findBlockDeep(blocks, activeBlockId);
    if (!found) return;
    if (found.block.type === "section") return;
    if (found.block.type === "hero" && (isSectionDropId(overId) || isSectionInsertId(overId))) return;

    if (isSectionInsertId(overId)) {
      const parsed = parseSectionInsertId(overId);
      if (!parsed) return;
      setBlocks((prev) => moveBlockIntoSectionAt(prev, activeBlockId, parsed.sectionId, parsed.index));
      setSaved(false);
      return;
    }

    if (isSectionDropId(overId)) {
      const sectionId = parseSectionDropId(overId);
      if (!sectionId || activeBlockId === sectionId) return;
      // Already in this section — body drop would only append; ignore (reorder via siblings/inserts)
      if (found.parentSectionId === sectionId) return;
      setBlocks((prev) => moveBlockIntoSection(prev, activeBlockId, sectionId));
      setSaved(false);
      return;
    }

    if (isInsertId(overId)) {
      let index = insertIndex(overId);
      setBlocks((prev) => {
        const topIndex = prev.findIndex((b) => b.id === activeBlockId);
        if (topIndex >= 0 && index > topIndex) index -= 1;
        return moveBlockToTopLevelAt(prev, activeBlockId, index);
      });
      setSaved(false);
      return;
    }

    const overBlockId = parseSortableBlockId(overId);
    if (!overBlockId || overBlockId === activeBlockId) return;
    const overFound = findBlockDeep(blocks, overBlockId);
    if (!overFound) return;

    if (
      found.parentSectionId &&
      overFound.parentSectionId &&
      found.parentSectionId === overFound.parentSectionId
    ) {
      setBlocks((prev) =>
        reorderSectionChildren(prev, found.parentSectionId!, activeBlockId, overBlockId),
      );
      setSaved(false);
      return;
    }

    if (overFound.parentSectionId) {
      const section = blocks.find((b) => b.id === overFound.parentSectionId);
      const children = section ? getSectionChildren(section) : [];
      const overIndex = children.findIndex((c) => c.id === overBlockId);
      setBlocks((prev) =>
        moveBlockIntoSectionAt(
          prev,
          activeBlockId,
          overFound.parentSectionId!,
          overIndex < 0 ? -1 : overIndex,
        ),
      );
      setSaved(false);
      return;
    }

    const oldIndex = blocks.findIndex((b) => b.id === activeBlockId);
    const newIndex = blocks.findIndex((b) => b.id === overBlockId);
    if (newIndex >= 0) {
      if (found.parentSectionId || oldIndex < 0) {
        setBlocks((prev) => moveBlockToTopLevelAt(prev, activeBlockId, newIndex));
      } else if (oldIndex !== newIndex) {
        setBlocks(arrayMove(blocks, oldIndex, newIndex));
      }
      setSaved(false);
    }
  };

  const handleDragCancel = () => {
    setDraggingPaletteType(null);
    setActiveDropId(null);
    setActiveSectionDropId(null);
  };

  const save = async (): Promise<boolean> => {
    if (!event) return false;
    setSaving(true);
    setSaveError(null);
    try {
      const designContent: DesignContent = { version: 1, blocks };
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: event.title.trim(),
          hostNames: event.hostNames ?? "",
          coverImageUrl: event.coverImageUrl ?? "",
          eventDate: event.eventDate,
          venueName: event.venueName ?? "",
          venueAddress: event.venueAddress ?? "",
          googleMapsLink: event.googleMapsLink ?? "",
          dressCode: event.dressCode ?? "",
          invitationMessage: event.invitationMessage ?? "",
          additionalInfo: event.additionalInfo ?? "",
          backgroundMusicUrl: event.backgroundMusicUrl ?? "",
          backgroundImageUrl: backgroundImageUrl || "",
          customTheme,
          designContent,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setSaveError(j?.error?.message ?? "Не вдалося зберегти");
        return false;
      }
      setSaved(true);
      return true;
    } catch {
      setSaveError("Не вдалося зберегти");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const finishSetup = async () => {
    const ok = await save();
    if (ok) onFinishSetup?.();
  };

  const openPreview = async () => {
    if (!event?.slug) return;
    await save();
    window.open(`/invite/${event.slug}?preview=1`, "_blank", "noopener,noreferrer");
  };

  const updateEventField = (field: keyof PublicInviteEvent, value: string | null) => {
    setEvent((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      setBlocks((current) => syncBlocksFromEvent(current, next));
      return next;
    });
    setSaved(false);
  };

  const updateEnvelopeIntro = (patch: Partial<EnvelopeIntroSettings>) => {
    setCustomTheme((prev) => ({
      ...prev,
      envelopeIntro: { ...prev.envelopeIntro, ...patch },
    }));
    setSaved(false);
  };

  const enterEnvelopeMode = () => {
    setCustomTheme((prev) => {
      const current = prev.envelopeIntro ?? {};
      if (Array.isArray(current.blocks) && current.blocks.length > 0) return prev;
      return {
        ...prev,
        envelopeIntro: { ...current, blocks: resolveEnvelopeBlocks(current) },
      };
    });
    setSaved(false);
    setCanvasView("envelope");
    setEnvelopePreviewKey((k) => k + 1);
    setSelectedEnvelopeBlockId(null);
  };

  if (!event || !previewEvent || !ctx) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Завантаження редактора...</div>;
  }

  const envelopeSettings = customTheme.envelopeIntro ?? {};
  const envelopeMode = canvasView === "envelope";

  const rightTabs: { id: RightTab; label: string; icon: React.ElementType }[] = [
    { id: "block", label: "Блок", icon: Settings2 },
    { id: "style", label: "Стиль", icon: Palette },
  ];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
    <div className={cn("flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm", setupMode ? "h-[calc(100vh-5rem)]" : "h-[calc(100vh-7.5rem)]")}>
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-5 py-3">
        <div>
          <h1 className="font-semibold">Редактор запрошення</h1>
          <p className="text-xs text-muted-foreground">{event.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {saveError && <span className="max-w-[180px] truncate text-xs text-destructive">{saveError}</span>}
          {saved && !saveError && <span className="text-xs text-emerald-600">Збережено</span>}
          {setupMode && onFinishSetup && (
            <Button size="sm" variant="secondary" onClick={finishSetup} disabled={saving}>
              Готово
            </Button>
          )}
          {event.slug && (
            <Button size="sm" variant="outline" onClick={openPreview} disabled={saving}>
              <ExternalLink className="h-4 w-4" /> Перегляд
            </Button>
          )}
          <Button size="sm" onClick={() => void save()} loading={saving}>
            <Save className="h-4 w-4" /> Зберегти
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(280px,320px)_minmax(0,1fr)_minmax(300px,360px)]">
        {/* LEFT — Add blocks palette OR envelope elements */}
        <aside className="overflow-y-auto border-r border-border bg-muted/20 p-5">
          {envelopeMode ? (
            <EnvelopeIntroLeftPanel
              settings={envelopeSettings}
              onChange={updateEnvelopeIntro}
              eventId={eventId}
              selectedBlockId={selectedEnvelopeBlockId}
              onSelectBlock={setSelectedEnvelopeBlockId}
            />
          ) : (
            <>
              <PanelHeader icon={Plus} title="Додати блоки" subtitle="Натисніть + або перетягніть на дизайн" />
              <div className="grid grid-cols-1 gap-1.5">
                {BLOCK_CATALOG.map((b) => (
                  <DraggablePaletteItem
                    key={b.type}
                    type={b.type}
                    icon={b.icon}
                    label={BLOCK_TYPE_LABELS[b.type] ?? b.label}
                    onAdd={() => addBlock(b.type)}
                  />
                ))}
              </div>
            </>
          )}
        </aside>

        {/* CENTER — Live preview */}
        <main className="relative flex min-h-0 flex-col overflow-hidden bg-zinc-300/80">
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-zinc-400/50 bg-zinc-200/80 px-4 py-2 text-xs text-zinc-600">
            <Eye className="h-3.5 w-3.5" />
            <div className="flex rounded-md border border-zinc-400/60 bg-white/70 p-0.5">
              <button
                type="button"
                onClick={() => setCanvasView("invite")}
                className={cn(
                  "rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
                  canvasView === "invite" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900",
                )}
              >
                Запрошення
              </button>
              <button
                type="button"
                onClick={() => enterEnvelopeMode()}
                className={cn(
                  "rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
                  canvasView === "envelope" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900",
                )}
              >
                Екран перед запрошенням
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-start justify-center overflow-y-auto bg-[#c4c4c8] p-8">
            <div className="w-full max-w-[390px]">
              <div className="overflow-hidden rounded-[2.5rem] border-[12px] border-zinc-950 bg-white shadow-[0_28px_60px_-12px_rgba(0,0,0,0.55)]">
                <div
                  className={cn(
                    "relative h-[680px]",
                    canvasView === "envelope" ? "overflow-hidden" : "overflow-y-auto",
                  )}
                  style={{ borderRadius: EDITOR_SCREEN_RADIUS }}
                >
                  {canvasView === "envelope" ? (
                    <EnvelopeIntroScreen
                      key={envelopePreviewKey}
                      embedded
                      editable
                      theme={ctx.theme}
                      monogram={ctx.monogram}
                      settings={envelopeSettings}
                      selectedBlockId={selectedEnvelopeBlockId}
                      onSelectBlock={setSelectedEnvelopeBlockId}
                      onOpen={() => {
                        setCanvasView("invite");
                        setEnvelopePreviewKey((k) => k + 1);
                      }}
                    />
                  ) : (
                    <EditorBlockCanvas
                      event={previewEvent}
                      ctx={ctx}
                      blocks={blocks}
                      selectedBlockId={selectedId}
                      onSelectBlock={selectBlock}
                      activeDropId={activeDropId}
                      activeSectionDropId={activeSectionDropId}
                      dragActive={!!draggingPaletteType || !!activeDropId || !!activeSectionDropId}
                      onUpdateBlockStyle={(id, style) => updateBlock(id, { style })}
                      onUpdateBlockData={(id, data) => updateBlock(id, { data })}
                      onDeselectBlock={() => setSelectedId(null)}
                      animationReplayKey={animationReplayKey}
                      animationReplayBlockId={selectedId}
                    />
                  )}
                </div>
              </div>
              {canvasView === "envelope" && (
                <p className="mt-3 text-center text-[11px] text-zinc-600">
                  Порядок — перетягніть у «Структура» справа · відступи блоку — зліва
                </p>
              )}
            </div>
          </div>
        </main>

        {/* RIGHT — Structure + settings OR envelope style */}
        <aside className="flex min-h-0 flex-col overflow-hidden border-l border-border bg-background">
          {envelopeMode ? (
            <>
              <EnvelopeIntroStructurePanel
                settings={envelopeSettings}
                onChange={updateEnvelopeIntro}
                selectedBlockId={selectedEnvelopeBlockId}
                onSelectBlock={setSelectedEnvelopeBlockId}
              />
              <div className="flex-1 overflow-y-auto">
                <EnvelopeIntroRightPanel
                  settings={envelopeSettings}
                  onChange={updateEnvelopeIntro}
                  enabled={envelopeSettings.enabled === true}
                  onEnabledChange={(v) => updateEnvelopeIntro({ enabled: v })}
                  selectedBlockId={selectedEnvelopeBlockId}
                />
              </div>
            </>
          ) : (
          <>
          <div className="shrink-0 border-b border-border p-4">
            <PanelHeader
              icon={Layers}
              title="Структура"
              subtitle="Перетягуйте блоки, щоб змінити порядок"
            />
            <div className="max-h-48 space-y-1.5 overflow-y-auto">
              {blocks.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">Додайте блок зліва</p>
              ) : (
                <SortableContext items={blocks.map((b) => listBlockId(b.id))} strategy={verticalListSortingStrategy}>
                  {blocks.map((block) => {
                    const children = block.type === "section" ? getSectionChildren(block) : [];
                    return (
                      <div key={block.id} className="space-y-1">
                        <SortableBlockItem
                          block={block}
                          selected={selectedId === block.id}
                          onSelect={() => selectBlock(block.id)}
                          onDelete={() => deleteBlock(block.id)}
                        />
                        {children.length > 0 && (
                          <SortableContext
                            items={children.map((c) => listBlockId(c.id))}
                            strategy={verticalListSortingStrategy}
                          >
                            {children.map((child) => (
                              <SortableBlockItem
                                key={child.id}
                                block={child}
                                nested
                                selected={selectedId === child.id}
                                onSelect={() => selectBlock(child.id)}
                                onDelete={() => deleteBlock(child.id)}
                              />
                            ))}
                          </SortableContext>
                        )}
                      </div>
                    );
                  })}
                </SortableContext>
              )}
            </div>
          </div>

          <div className="flex shrink-0 border-b border-border">
            {rightTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setRightTab(id)}
                disabled={id === "block" && !selectedBlock}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 px-2 py-3 text-xs font-medium transition-colors",
                  rightTab === id ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground",
                  id === "block" && !selectedBlock && "cursor-not-allowed opacity-40",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {rightTab === "style" && (
              <>
                <PanelHeader icon={Palette} title="Загальний стиль" subtitle="Кольори, фон і мова запрошення" />
                <div className="space-y-4">
                  <ImageUploadField
                    label="Фонове зображення"
                    value={backgroundImageUrl}
                    onChange={(url) => {
                      setBackgroundImageUrl(url);
                      setSaved(false);
                    }}
                    eventId={eventId}
                    folder="background"
                  />
                  <div>
                    <Label className="mb-2 block">Кольори</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <ColorField
                        label="Основний"
                        value={customTheme.primaryColor ?? "#7c3aed"}
                        onChange={(v) => {
                          setCustomTheme({ ...customTheme, primaryColor: v });
                          setSaved(false);
                        }}
                      />
                      <ColorField
                        label="Акцент"
                        value={customTheme.accentColor ?? "#a78bfa"}
                        onChange={(v) => {
                          setCustomTheme({ ...customTheme, accentColor: v });
                          setSaved(false);
                        }}
                      />
                      <ColorField
                        label="Фон"
                        value={customTheme.backgroundColor ?? "#fafafa"}
                        onChange={(v) => {
                          setCustomTheme({ ...customTheme, backgroundColor: v });
                          setSaved(false);
                        }}
                      />
                      <ColorField
                        label="Текст"
                        value={customTheme.textColor ?? "#2c2420"}
                        onChange={(v) => {
                          setCustomTheme({ ...customTheme, textColor: v });
                          setSaved(false);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Мова</Label>
                    <Select
                      value={customTheme.locale ?? ""}
                      onChange={(e) => {
                        setCustomTheme({ ...customTheme, locale: e.target.value as "uk" | "en" | undefined });
                        setSaved(false);
                      }}
                    >
                      <option value="">За замовчуванням</option>
                      <option value="uk">Українська</option>
                      <option value="en">English (лише для запрошень гостей)</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Стиль зворотного відліку</Label>
                    <Select
                      value={customTheme.countdownStyle ?? ""}
                      onChange={(e) => {
                        setCustomTheme({ ...customTheme, countdownStyle: e.target.value as CustomTheme["countdownStyle"] });
                        setSaved(false);
                      }}
                    >
                      <option value="">За замовчуванням</option>
                      <option value="elegant">Елегантний</option>
                      <option value="cards">Картки</option>
                      <option value="inline">В рядок</option>
                    </Select>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Екран перед запрошенням
                    </p>
                    <ToggleSwitch
                      label="Показувати гостям"
                      checked={customTheme.envelopeIntro?.enabled === true}
                      onChange={(v) => {
                        updateEnvelopeIntro({ enabled: v });
                        if (v) enterEnvelopeMode();
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => enterEnvelopeMode()}
                      className="w-full rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/10"
                    >
                      Редагувати екран-конверт
                    </button>
                    <p className="text-[10px] leading-snug text-muted-foreground">
                      Фото, тексти, кольори та розміщення — у режимі «Екран перед запрошенням».
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Відступи сторінки
                    </p>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Padding зверху</Label>
                          <Input
                            type="number"
                            min={0}
                            max={200}
                            value={customTheme.pagePaddingTop ?? 32}
                            onChange={(e) => {
                              setCustomTheme({ ...customTheme, pagePaddingTop: Number(e.target.value) });
                              setSaved(false);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Padding знизу</Label>
                          <Input
                            type="number"
                            min={0}
                            max={200}
                            value={customTheme.pagePaddingBottom ?? 32}
                            onChange={(e) => {
                              setCustomTheme({ ...customTheme, pagePaddingBottom: Number(e.target.value) });
                              setSaved(false);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Padding зліва</Label>
                          <Input
                            type="number"
                            min={0}
                            max={120}
                            value={customTheme.pagePaddingLeft ?? 16}
                            onChange={(e) => {
                              setCustomTheme({ ...customTheme, pagePaddingLeft: Number(e.target.value) });
                              setSaved(false);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Padding справа</Label>
                          <Input
                            type="number"
                            min={0}
                            max={120}
                            value={customTheme.pagePaddingRight ?? 16}
                            onChange={(e) => {
                              setCustomTheme({ ...customTheme, pagePaddingRight: Number(e.target.value) });
                              setSaved(false);
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Відстань між блоками (px)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={80}
                          value={customTheme.blockGap ?? 4}
                          onChange={(e) => {
                            setCustomTheme({ ...customTheme, blockGap: Number(e.target.value) });
                            setSaved(false);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {rightTab === "block" && selectedBlock && (
              <>
                <PanelHeader
                  icon={Settings2}
                  title={BLOCK_TYPE_LABELS[selectedBlock.type] ?? selectedBlock.label}
                  subtitle="Дані та оформлення блоку"
                />
                <div className="space-y-3">
                  <BlockEventFields
                    block={selectedBlock}
                    event={event}
                    eventId={eventId}
                    updateEventField={updateEventField}
                    updateBlock={updateBlock}
                    onQuestionsChange={(questions) => {
                      setEvent((prev) => (prev ? { ...prev, questions } : prev));
                      setSaved(false);
                    }}
                  />
                  {selectedBlock.type === "section" && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                      <p className="text-xs font-medium text-primary">Вміст секції</p>
                      <p className="text-[10px] text-muted-foreground">
                        Додайте блоки всередину кольорової смуги з рваними краями
                      </p>
                      <Select
                        value=""
                        onChange={(e) => {
                          const t = e.target.value as DesignBlock["type"];
                          if (t) addChildToSelectedSection(t);
                          e.target.value = "";
                        }}
                      >
                        <option value="">Додати блок у секцію…</option>
                        {BLOCK_CATALOG.filter((b) => b.type !== "section" && b.type !== "hero").map((b) => (
                          <option key={b.type} value={b.type}>
                            {b.icon} {BLOCK_TYPE_LABELS[b.type] ?? b.label}
                          </option>
                        ))}
                      </Select>
                      {getSectionChildren(selectedBlock).length > 0 && (
                        <ul className="space-y-1 pt-1">
                          {getSectionChildren(selectedBlock).map((child) => (
                            <li key={child.id}>
                              <button
                                type="button"
                                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-left text-xs hover:border-primary/40"
                                onClick={() => selectBlock(child.id)}
                              >
                                {BLOCK_CATALOG.find((b) => b.type === child.type)?.icon}{" "}
                                {BLOCK_TYPE_LABELS[child.type] ?? child.label}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {selectedParentSectionId && (
                    <Button type="button" size="sm" variant="outline" className="w-full" onClick={liftSelectedFromSection}>
                      Винести з секції
                    </Button>
                  )}
                  {!selectedParentSectionId &&
                    selectedBlock.type !== "section" &&
                    selectedBlock.type !== "hero" &&
                    blocks.some((b) => b.type === "section") && (
                      <div>
                        <Label className="mb-1 block text-xs text-muted-foreground">Помістити в секцію</Label>
                        <Select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) nestSelectedIntoSection(e.target.value);
                            e.target.value = "";
                          }}
                        >
                          <option value="">Оберіть секцію…</option>
                          {blocks
                            .filter((b) => b.type === "section")
                            .map((b) => (
                              <option key={b.id} value={b.id}>
                                Секція ({getSectionChildren(b).length} блоків)
                              </option>
                            ))}
                        </Select>
                      </div>
                    )}
                  {selectedBlock.type === "countdown" && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                      <p className="text-xs font-medium text-primary">Підписи таймера</p>
                      <ToggleSwitch
                        label="Показати підписи під цифрами (дні, години, хвилини, секунди)"
                        checked={selectedBlock.data.showLabels !== false}
                        onChange={(v) => updateBlock(selectedBlock.id, { data: { showLabels: v } })}
                      />
                    </div>
                  )}
                  {selectedBlock.type === "calendar" && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3">
                      <p className="text-xs font-medium text-primary">Позначення дати події</p>
                      <CalendarMarkerPicker
                        value={(selectedBlock.data.dateMarker as string) ?? "ring-classic"}
                        customSvg={(selectedBlock.data.dateMarkerSvg as string) ?? null}
                        animation={
                          (selectedBlock.data.dateMarkerAnimation as
                            | "fade"
                            | "scale"
                            | "rotate"
                            | "none"
                            | undefined) ?? "fade"
                        }
                        onChange={(patch) =>
                          updateBlock(selectedBlock.id, {
                            data: {
                              ...(patch.dateMarker !== undefined
                                ? { dateMarker: patch.dateMarker }
                                : {}),
                              ...(patch.dateMarkerSvg !== undefined
                                ? { dateMarkerSvg: patch.dateMarkerSvg }
                                : {}),
                              ...(patch.dateMarkerAnimation !== undefined
                                ? { dateMarkerAnimation: patch.dateMarkerAnimation }
                                : {}),
                            },
                          })
                        }
                      />
                      <ColorField
                        label="Колір іконки"
                        value={(selectedBlock.data.dateMarkerColor as string) || "#7c3aed"}
                        onChange={(v) =>
                          updateBlock(selectedBlock.id, { data: { dateMarkerColor: v } })
                        }
                      />
                      <ColorField
                        label="Колір вибраного дня"
                        value={
                          (selectedBlock.data.eventDayColor as string) ||
                          (selectedBlock.data.dateMarkerColor as string) ||
                          "#7c3aed"
                        }
                        onChange={(v) =>
                          updateBlock(selectedBlock.id, { data: { eventDayColor: v } })
                        }
                      />
                    </div>
                  )}
                  {selectedBlock.type === "hero" && (
                    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Вміст</p>

                      <div>
                        <Label className="mb-1.5 block text-xs text-muted-foreground">Режим обкладинки</Label>
                        <div className="grid grid-cols-3 gap-1">
                          {(
                            [
                              { id: "boxed", label: "З рамкою" },
                              { id: "edge", label: "Без рамок" },
                              { id: "fullscreen", label: "Весь екран" },
                            ] as const
                          ).map(({ id, label }) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() =>
                                updateBlock(selectedBlock.id, {
                                  data: { coverLayout: id as CoverLayout, fullScreenCover: id === "fullscreen" },
                                })
                              }
                              className={cn(
                                "rounded-md border px-1.5 py-1.5 text-[10px] font-medium transition-colors",
                                getCoverLayout(selectedBlock) === id
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground hover:border-primary/40",
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                          {getCoverLayout(selectedBlock) === "fullscreen"
                            ? "Без відступів, висота першого екрану. Маркери розміру сховані."
                            : getCoverLayout(selectedBlock) === "edge"
                              ? "Без відступів від країв, висоту змінюєте маркерами."
                              : "Звичайний блок із відступами сторінки."}
                        </p>
                      </div>

                      {getCoverLayout(selectedBlock) !== "boxed" && (
                        <div>
                          <Label className="mb-1.5 block text-xs text-muted-foreground">Нижній край</Label>
                          <CoverEdgePicker
                            value={getCoverEdgeStyle(selectedBlock.data)}
                            onChange={(coverEdge: CoverEdgeStyle) =>
                              updateBlock(selectedBlock.id, { data: { coverEdge } })
                            }
                          />
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Рваний / хвилястий край там, де обкладинка переходить у контент
                          </p>
                        </div>
                      )}

                      <div>
                        <ToggleSwitch
                          label="Назва"
                          checked={selectedBlock.data.showTitle !== false}
                          onChange={(v) => updateBlock(selectedBlock.id, { data: { showTitle: v } })}
                        />
                        {selectedBlock.data.showTitle !== false && (
                          <TextStyleEditor
                            value={(selectedBlock.data.titleStyle as TextElementStyle) ?? {}}
                            onChange={(patch) => updateTextElementStyle(selectedBlock.id, "titleStyle", patch)}
                            defaults={{ fontSize: 36, color: "#ffffff" }}
                          />
                        )}
                      </div>

                      <div>
                        <ToggleSwitch
                          label="Організатори"
                          checked={selectedBlock.data.showHosts !== false}
                          onChange={(v) => updateBlock(selectedBlock.id, { data: { showHosts: v } })}
                        />
                        {selectedBlock.data.showHosts !== false && (
                          <TextStyleEditor
                            value={(selectedBlock.data.hostsStyle as TextElementStyle) ?? {}}
                            onChange={(patch) => updateTextElementStyle(selectedBlock.id, "hostsStyle", patch)}
                            defaults={{ fontSize: 16, color: "#ffffff" }}
                          />
                        )}
                      </div>

                      <ToggleSwitch
                        label="Обкладинка"
                        checked={selectedBlock.data.showCover !== false}
                        onChange={(v) => updateBlock(selectedBlock.id, { data: { showCover: v } })}
                      />

                      <div>
                        <ToggleSwitch
                          label="Привітання"
                          checked={selectedBlock.data.showGreeting === true}
                          onChange={(v) => updateBlock(selectedBlock.id, { data: { showGreeting: v } })}
                        />
                        {selectedBlock.data.showGreeting === true && (
                          <>
                            <Input
                              className="mt-2 h-8 text-sm"
                              value={(selectedBlock.data.greetingText as string) ?? ""}
                              onChange={(e) =>
                                updateBlock(selectedBlock.id, { data: { greetingText: e.target.value } })
                              }
                              placeholder="Текст привітання"
                            />
                            <TextStyleEditor
                              value={(selectedBlock.data.greetingStyle as TextElementStyle) ?? {}}
                              onChange={(patch) => updateTextElementStyle(selectedBlock.id, "greetingStyle", patch)}
                              defaults={{ fontSize: 14, color: "#ffffff" }}
                            />
                          </>
                        )}
                      </div>

                      <div>
                        <ToggleSwitch
                          label="Музичний плеєр"
                          checked={selectedBlock.data.showMusicPlayer === true}
                          onChange={(v) => updateBlock(selectedBlock.id, { data: { showMusicPlayer: v } })}
                        />
                        {selectedBlock.data.showMusicPlayer === true && (
                          <div className="mt-2 space-y-2">
                            <Label className="mb-1.5 block text-xs text-muted-foreground">Стиль плеєра</Label>
                            <div className="grid grid-cols-3 gap-1">
                              {(
                                [
                                  { id: "overlay", label: "Overlay" },
                                  { id: "pill", label: "Pill" },
                                  { id: "disc", label: "Disc" },
                                ] as const
                              ).map(({ id, label }) => (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() =>
                                    updateBlock(selectedBlock.id, { data: { musicPlayerStyle: id } })
                                  }
                                  className={cn(
                                    "rounded-md border px-1.5 py-1.5 text-[10px] font-medium transition-colors",
                                    ((selectedBlock.data.musicPlayerStyle as string) ?? "overlay") === id
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border text-muted-foreground hover:border-primary/40",
                                  )}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                            <p className="text-[10px] leading-snug text-muted-foreground">
                              Перетягніть плеєр на обкладинці, щоб змінити позицію. Трек і метадані — у лівій панелі.
                            </p>
                            {!event?.backgroundMusicUrl && (
                              <p className="text-[10px] text-amber-700">
                                Додайте файл або URL музики в даних блоку зліва.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedBlock.type === "image" && (
                    <ImageUploadField
                      label="Зображення"
                      value={(selectedBlock.data.url as string) ?? ""}
                      onChange={(url) => updateBlock(selectedBlock.id, { data: { url } })}
                      eventId={eventId}
                      folder="media"
                      imageStyle={selectedBlock.style}
                      onImageStyleChange={(patch) => updateBlock(selectedBlock.id, { style: patch })}
                      defaultImageHeight={240}
                      fillMode={(selectedBlock.data.coverFill as "image" | "color") ?? "image"}
                      onFillModeChange={(mode) => updateBlock(selectedBlock.id, { data: { coverFill: mode } })}
                      fillColor={selectedBlock.style.backgroundColor ?? "#7c3aed"}
                      onFillColorChange={(c) => updateBlock(selectedBlock.id, { style: { backgroundColor: c } })}
                    />
                  )}
                  {selectedBlock.type === "icon" && (
                    <>
                      <div>
                        <Label>Іконка</Label>
                        <Select
                          value={(selectedBlock.data.icon as string) ?? "heart"}
                          onChange={(e) => updateBlock(selectedBlock.id, { data: { icon: e.target.value } })}
                        >
                          {["heart", "calendar", "star", "gift", "camera", "music", "map"].map((i) => (
                            <option key={i} value={i}>
                              {ICON_LABELS[i] ?? i}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label>Підпис</Label>
                        <Input
                          value={(selectedBlock.data.label as string) ?? ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { data: { label: e.target.value } })}
                        />
                      </div>
                    </>
                  )}
                  {selectedBlock.type === "button" && (
                    <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="text-xs font-medium text-primary">Дані кнопки</p>
                      <div>
                        <Label>Текст кнопки</Label>
                        <Input
                          value={(selectedBlock.data.label as string) ?? ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { data: { label: e.target.value } })}
                          placeholder="Детальніше"
                        />
                      </div>
                      <div>
                        <Label>Посилання</Label>
                        <Input
                          type="url"
                          value={(selectedBlock.data.url as string) ?? ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { data: { url: e.target.value } })}
                          placeholder="https://…"
                        />
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          https://, mailto:, tel: або адреса сайту
                        </p>
                      </div>
                      <ToggleSwitch
                        label="Відкривати в новій вкладці"
                        checked={selectedBlock.data.openInNewTab !== false}
                        onChange={(v) => updateBlock(selectedBlock.id, { data: { openInNewTab: v } })}
                      />
                    </div>
                  )}
                  {selectedBlock.type === "spacer" && (
                    <div>
                      <Label>Висота (px)</Label>
                      <Input
                        type="number"
                        value={(selectedBlock.data.height as number) ?? 32}
                        onChange={(e) => updateBlock(selectedBlock.id, { data: { height: Number(e.target.value) } })}
                      />
                    </div>
                  )}

                  <BlockLayoutSettings
                    block={selectedBlock}
                    onUpdateStyle={(style) => updateBlock(selectedBlock.id, { style })}
                    onUpdateData={(data) => updateBlock(selectedBlock.id, { data })}
                    imageUrl={getBlockImageUrl(selectedBlock, event)}
                  />

                  {!["image", "gallery", "spacer", "divider", "hero"].includes(selectedBlock.type) && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {selectedBlock.type === "button" ? "Шрифт кнопки" : "Розміщення тексту"}
                    </p>
                    <div className="space-y-3">
                      {!IMAGE_BLOCK_TYPES.has(selectedBlock.type) && (
                      <div>
                        <Label>{selectedBlock.type === "button" ? "Вирівнювання" : "Вирівнювання"}</Label>
                        <Select
                          value={selectedBlock.style.textAlign ?? "center"}
                          onChange={(e) =>
                            updateBlock(selectedBlock.id, { style: { textAlign: e.target.value as "left" | "center" | "right" } })
                          }
                        >
                          <option value="left">Ліворуч</option>
                          <option value="center">По центру</option>
                          <option value="right">Праворуч</option>
                        </Select>
                      </div>
                      )}
                      {selectedBlock.type === "calendar" ? (
                        <>
                          <div>
                            <Label>Шрифт місяця</Label>
                            <FontSelect
                              value={
                                (selectedBlock.style.monthFontFamily as InviteFontId | undefined) ??
                                (selectedBlock.style.fontFamily as InviteFontId | undefined) ??
                                "sans"
                              }
                              onChange={(monthFontFamily) =>
                                updateBlock(selectedBlock.id, { style: { monthFontFamily } })
                              }
                            />
                          </div>
                          <div>
                            <Label>Шрифт календаря</Label>
                            <FontSelect
                              value={(selectedBlock.style.fontFamily as InviteFontId | undefined) ?? "sans"}
                              onChange={(fontFamily) =>
                                updateBlock(selectedBlock.id, { style: { fontFamily } })
                              }
                            />
                          </div>
                        </>
                      ) : (
                        <div>
                          <Label>Шрифт</Label>
                          <FontSelect
                            value={(selectedBlock.style.fontFamily as InviteFontId | undefined) ?? "sans"}
                            onChange={(fontFamily) =>
                              updateBlock(selectedBlock.id, { style: { fontFamily } })
                            }
                          />
                        </div>
                      )}
                      <div>
                        <Label>Розмір шрифту</Label>
                        <Input
                          type="number"
                          value={selectedBlock.style.fontSize ?? 16}
                          onChange={(e) => updateBlock(selectedBlock.id, { style: { fontSize: Number(e.target.value) } })}
                        />
                      </div>
                      <div>
                        <Label>Жирність</Label>
                        <FontWeightSelect
                          value={(selectedBlock.style.fontWeight as FontWeight | undefined) ?? 400}
                          onChange={(fontWeight) =>
                            updateBlock(selectedBlock.id, { style: { fontWeight } })
                          }
                        />
                      </div>
                      {selectedBlock.type !== "button" && (
                      <ColorField
                        label="Колір тексту"
                        value={selectedBlock.style.color ?? "#2c2420"}
                        onChange={(v) => updateBlock(selectedBlock.id, { style: { color: v } })}
                      />
                      )}
                      {selectedBlock.type === "schedule" && (
                        <>
                          <ColorField
                            label="Колір іконок"
                            value={
                              selectedBlock.style.iconColor ||
                              selectedBlock.style.color ||
                              "#2c2420"
                            }
                            onChange={(v) =>
                              updateBlock(selectedBlock.id, { style: { iconColor: v } })
                            }
                          />
                          <div>
                            <Label>Відстань між пунктами (px)</Label>
                            <Input
                              type="number"
                              min={0}
                              max={120}
                              value={
                                typeof selectedBlock.data.itemGap === "number"
                                  ? selectedBlock.data.itemGap
                                  : 36
                              }
                              onChange={(e) =>
                                updateBlock(selectedBlock.id, {
                                  data: {
                                    itemGap: Math.max(0, Number(e.target.value) || 0),
                                  },
                                })
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  )}

                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Анімація</p>
                    {selectedBlock.type === "hero" ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-[10px] font-medium text-muted-foreground">Картинка</p>
                          <div>
                            <Label>Тип</Label>
                            <Select
                              value={(selectedBlock.data.imageAnimation as BlockAnimation) ?? "fade"}
                              onChange={(e) => {
                                updateBlock(selectedBlock.id, {
                                  data: { imageAnimation: e.target.value as BlockAnimation },
                                });
                                setAnimationReplayKey((k) => k + 1);
                              }}
                            >
                              <option value="none">Без анімації</option>
                              <option value="fade">Поява</option>
                              <option value="slideUp">Знизу вгору</option>
                              <option value="slideDown">Зверху вниз</option>
                              <option value="zoom">Масштаб</option>
                            </Select>
                          </div>
                          <div>
                            <Label>Тривалість (мс)</Label>
                            <Input
                              type="number"
                              min={0}
                              defaultValue={(selectedBlock.data.imageAnimationDuration as number) ?? DEFAULT_ANIMATION_DURATION_MS}
                              key={`img-dur-${selectedBlock.id}-${selectedBlock.data.imageAnimationDuration ?? DEFAULT_ANIMATION_DURATION_MS}`}
                              onBlur={(e) => {
                                updateBlock(selectedBlock.id, {
                                  data: { imageAnimationDuration: Math.max(0, Number(e.target.value) || 0) },
                                });
                                setAnimationReplayKey((k) => k + 1);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              }}
                            />
                          </div>
                          <div>
                            <Label>Затримка (мс)</Label>
                            <Input
                              type="number"
                              defaultValue={(selectedBlock.data.imageAnimationDelay as number) ?? 0}
                              key={`img-delay-${selectedBlock.id}-${selectedBlock.data.imageAnimationDelay ?? 0}`}
                              onBlur={(e) => {
                                updateBlock(selectedBlock.id, {
                                  data: { imageAnimationDelay: Number(e.target.value) || 0 },
                                });
                                setAnimationReplayKey((k) => k + 1);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2 border-t border-border pt-3">
                          <p className="text-[10px] font-medium text-muted-foreground">Текст</p>
                          <div>
                            <Label>Тип</Label>
                            <Select
                              value={(selectedBlock.data.textAnimation as BlockAnimation) ?? "fade"}
                              onChange={(e) => {
                                updateBlock(selectedBlock.id, {
                                  data: { textAnimation: e.target.value as BlockAnimation },
                                });
                                setAnimationReplayKey((k) => k + 1);
                              }}
                            >
                              <option value="none">Без анімації</option>
                              <option value="fade">Поява</option>
                              <option value="slideUp">Знизу вгору</option>
                              <option value="slideDown">Зверху вниз</option>
                              <option value="zoom">Масштаб</option>
                            </Select>
                          </div>
                          <div>
                            <Label>Тривалість (мс)</Label>
                            <Input
                              type="number"
                              min={0}
                              defaultValue={(selectedBlock.data.textAnimationDuration as number) ?? DEFAULT_ANIMATION_DURATION_MS}
                              key={`txt-dur-${selectedBlock.id}-${selectedBlock.data.textAnimationDuration ?? DEFAULT_ANIMATION_DURATION_MS}`}
                              onBlur={(e) => {
                                updateBlock(selectedBlock.id, {
                                  data: { textAnimationDuration: Math.max(0, Number(e.target.value) || 0) },
                                });
                                setAnimationReplayKey((k) => k + 1);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              }}
                            />
                          </div>
                          <div>
                            <Label>Затримка (мс)</Label>
                            <Input
                              type="number"
                              defaultValue={(selectedBlock.data.textAnimationDelay as number) ?? 200}
                              key={`txt-delay-${selectedBlock.id}-${selectedBlock.data.textAnimationDelay ?? 200}`}
                              onBlur={(e) => {
                                updateBlock(selectedBlock.id, {
                                  data: { textAnimationDelay: Number(e.target.value) || 0 },
                                });
                                setAnimationReplayKey((k) => k + 1);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <Label>Тип</Label>
                          <Select
                            value={selectedBlock.animation}
                            onChange={(e) =>
                              replayAnimation(selectedBlock.id, {
                                animation: e.target.value as BlockAnimation,
                              })
                            }
                          >
                            <option value="none">Без анімації</option>
                            <option value="fade">Поява</option>
                            <option value="slideUp">Знизу вгору</option>
                            <option value="slideDown">Зверху вниз</option>
                            <option value="zoom">Масштаб</option>
                          </Select>
                        </div>
                        <div>
                          <Label>Тривалість (мс)</Label>
                          <Input
                            type="number"
                            min={0}
                            defaultValue={selectedBlock.animationDuration ?? DEFAULT_ANIMATION_DURATION_MS}
                            key={`dur-${selectedBlock.id}-${selectedBlock.animationDuration ?? DEFAULT_ANIMATION_DURATION_MS}`}
                            onBlur={(e) =>
                              replayAnimation(selectedBlock.id, {
                                animationDuration: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Label>Затримка (мс)</Label>
                          <Input
                            type="number"
                            defaultValue={selectedBlock.animationDelay ?? 0}
                            key={`delay-${selectedBlock.id}-${selectedBlock.animationDelay ?? 0}`}
                            onBlur={(e) =>
                              replayAnimation(selectedBlock.id, {
                                animationDelay: Number(e.target.value) || 0,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {rightTab === "block" && !selectedBlock && (
              <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
                <Layers className="mb-2 h-8 w-8 opacity-40" />
                <p>Оберіть блок у структурі або натисніть на нього в зразку</p>
              </div>
            )}
          </div>
          </>
          )}
        </aside>
      </div>
    </div>
    <DragOverlay dropAnimation={null}>
      {draggingPaletteType && (
        <div className="flex items-center gap-2 rounded-lg border border-primary bg-background px-3 py-2 text-sm shadow-lg">
          <span>{BLOCK_CATALOG.find((b) => b.type === draggingPaletteType)?.icon}</span>
          <span>{BLOCK_TYPE_LABELS[draggingPaletteType]}</span>
        </div>
      )}
    </DragOverlay>
    </DndContext>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 shrink-0 cursor-pointer p-1" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
      </div>
    </div>
  );
}
