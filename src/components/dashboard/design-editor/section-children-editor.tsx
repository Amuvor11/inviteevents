"use client";

import { Fragment } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  defaultAnimateLayoutChanges,
  type AnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BlockRenderer } from "@/components/invite/block-renderer";
import { BlockResizeHandles } from "@/components/dashboard/design-editor/block-resize-handles";
import { canvasBlockId, sectionInsertId } from "@/lib/invite/blocks";
import { cn } from "@/lib/utils/cn";
import type { DesignBlock, BlockStyle } from "@/types/design";
import type { ResolvedInviteContext } from "@/lib/invite/personalization";
import type { PublicInviteEvent } from "@/types/invite";

/** Avoid layout animations that resize the section while dragging. */
const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  args.isSorting || args.wasDragging ? false : defaultAnimateLayoutChanges(args);

/**
 * Zero-height in document flow. Hit target is an absolute overlay so
 * expanding/highlighting never changes section height (no "shake").
 */
function SectionInsertZone({
  sectionId,
  index,
  active,
}: {
  sectionId: string;
  index: number;
  active: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: sectionInsertId(sectionId, index) });
  const highlight = active || isOver;

  return (
    <div className="relative z-10 h-0 w-full">
      <div
        ref={setNodeRef}
        className={cn(
          "absolute inset-x-0 top-0 flex -translate-y-1/2 items-center justify-center rounded-md",
          highlight ? "h-8 bg-white/25" : "h-5 bg-transparent",
        )}
      >
        {highlight && (
          <span className="pointer-events-none text-[10px] font-medium text-white/90">Вставити тут</span>
        )}
      </div>
    </div>
  );
}

function SortableSectionChild({
  block,
  sectionId,
  event,
  ctx,
  selected,
  selectedBlockId,
  onSelect,
  onUpdateStyle,
  animationReplayKey,
}: {
  block: DesignBlock;
  sectionId: string;
  event: PublicInviteEvent;
  ctx: ResolvedInviteContext;
  selected: boolean;
  selectedBlockId: string | null;
  onSelect: (id: string) => void;
  onUpdateStyle?: (patch: Partial<BlockStyle>) => void;
  animationReplayKey?: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: canvasBlockId(block.id),
    data: { sectionId, type: "section-child" },
    animateLayoutChanges,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        // Only translate the dragged item; skip transform on placeholders that
        // would visually shove siblings and resize the section shell.
        transform: isDragging ? undefined : CSS.Transform.toString(transform),
        transition: isDragging ? undefined : transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="group/child relative"
      data-editor-block
      data-section-child={sectionId}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className={cn(
          "absolute -left-1 top-1/2 z-30 -translate-y-1/2 cursor-grab rounded bg-background/95 p-1 text-muted-foreground shadow-sm active:cursor-grabbing",
          selected ? "flex" : "hidden group-hover/child:flex",
        )}
        aria-label="Перетягнути блок у секції"
        title="Перетягніть усередині секції або назовні"
      >
        ⋮⋮
      </button>
      {selected && onUpdateStyle && (
        <BlockResizeHandles block={block} onUpdateStyle={onUpdateStyle} />
      )}
      <BlockRenderer
        block={block}
        event={event}
        ctx={ctx}
        selected={selected}
        selectedBlockId={selectedBlockId}
        onSelect={onSelect}
        preview
        animationReplayKey={animationReplayKey}
        inSection
      />
    </div>
  );
}

interface SectionChildrenEditorProps {
  sectionId: string;
  childrenBlocks: DesignBlock[];
  event: PublicInviteEvent;
  ctx: ResolvedInviteContext;
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onUpdateBlockStyle?: (blockId: string, patch: Partial<BlockStyle>) => void;
  activeDropId: string | null;
  dragActive?: boolean;
  animationReplayKey?: number;
  animationReplayBlockId?: string | null;
  emptyHint?: string;
}

export function SectionChildrenEditor({
  sectionId,
  childrenBlocks,
  event,
  ctx,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlockStyle,
  activeDropId,
  animationReplayKey = 0,
  animationReplayBlockId = null,
  emptyHint = "Перетягніть блок сюди з полотна",
}: SectionChildrenEditorProps) {
  if (childrenBlocks.length === 0) {
    return (
      <div className="relative flex min-h-[4.5rem] flex-col justify-center">
        <SectionInsertZone
          sectionId={sectionId}
          index={0}
          active={activeDropId === sectionInsertId(sectionId, 0)}
        />
        <p className="pointer-events-none py-4 text-center text-sm opacity-70 text-white">{emptyHint}</p>
      </div>
    );
  }

  return (
    <SortableContext
      items={childrenBlocks.map((b) => canvasBlockId(b.id))}
      strategy={verticalListSortingStrategy}
    >
      <SectionInsertZone
        sectionId={sectionId}
        index={0}
        active={activeDropId === sectionInsertId(sectionId, 0)}
      />
      {childrenBlocks.map((child, index) => (
        <Fragment key={child.id}>
          <SortableSectionChild
            block={child}
            sectionId={sectionId}
            event={event}
            ctx={ctx}
            selected={selectedBlockId === child.id}
            selectedBlockId={selectedBlockId}
            onSelect={onSelectBlock}
            onUpdateStyle={
              onUpdateBlockStyle ? (patch) => onUpdateBlockStyle(child.id, patch) : undefined
            }
            animationReplayKey={
              animationReplayBlockId === child.id ? animationReplayKey : undefined
            }
          />
          <SectionInsertZone
            sectionId={sectionId}
            index={index + 1}
            active={activeDropId === sectionInsertId(sectionId, index + 1)}
          />
        </Fragment>
      ))}
    </SortableContext>
  );
}
