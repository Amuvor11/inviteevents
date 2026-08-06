"use client";

import { Fragment } from "react";
import Image from "next/image";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DesignBlock, BlockStyle } from "@/types/design";
import type { ResolvedInviteContext } from "@/lib/invite/personalization";
import type { PublicInviteEvent } from "@/types/invite";
import { BlockRenderer } from "@/components/invite/block-renderer";
import { BlockResizeHandles } from "@/components/dashboard/design-editor/block-resize-handles";
import { SectionChildrenEditor } from "@/components/dashboard/design-editor/section-children-editor";
import {
  CANVAS_DROP_ID,
  canvasBlockId,
  getSectionChildren,
  insertId,
} from "@/lib/invite/blocks";
import { blockListLayoutStyle, isBleedCover, isFullScreenCover, INVITE_CONTENT_MAX_WIDTH } from "@/lib/invite/block-style-utils";
import { cn } from "@/lib/utils/cn";
import { isValidImageSrc } from "@/lib/utils/image-url";

/**
 * Zero (or minimal) flow height. Hit target overlays absolutely so
 * drag never expands gaps and shifts the canvas / section.
 */
function InsertDropZone({
  index,
  active,
  flush,
}: {
  index: number;
  active: boolean;
  dragActive?: boolean;
  flush?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: insertId(index) });
  const highlight = active || isOver;

  if (flush) {
    return (
      <div className="relative z-20 h-0 w-full">
        <div
          ref={setNodeRef}
          className={cn(
            "absolute inset-x-0 top-0 flex items-center justify-center",
            highlight ? "h-10 bg-primary/10" : "h-6",
          )}
        >
          {highlight && (
            <>
              <div className="h-0.5 w-full rounded-full bg-primary" />
              <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[10px] font-medium text-primary">
                Вставити тут
              </span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-20 h-0 w-full">
      <div
        ref={setNodeRef}
        className={cn(
          "absolute inset-x-0 top-0 flex -translate-y-1/2 items-center justify-center rounded-md",
          highlight ? "h-8 bg-primary/10" : "h-5",
        )}
      >
        {highlight && (
          <>
            <div className="h-0.5 w-full rounded-full bg-primary" />
            <span className="absolute text-[10px] font-medium text-primary">Вставити тут</span>
          </>
        )}
      </div>
    </div>
  );
}

type CanvasBlockSharedProps = {
  block: DesignBlock;
  event: PublicInviteEvent;
  ctx: ResolvedInviteContext;
  selected: boolean;
  selectedBlockId: string | null;
  onSelect: (id: string) => void;
  onUpdateStyle?: (patch: Partial<BlockStyle>) => void;
  onUpdateData?: (patch: Record<string, unknown>) => void;
  animationReplayKey?: number;
  activeSectionDropId?: string | null;
  activeDropId: string | null;
  dragActive: boolean;
  animationReplayBlockId?: string | null;
};

/** Section on canvas: droppable only — reorder via structure tree. */
function StaticSectionCanvasBlock({
  block,
  event,
  ctx,
  selectedBlockId,
  onSelect,
  onUpdateBlockStyle,
  activeSectionDropId,
  activeDropId,
  dragActive,
  animationReplayKey,
  animationReplayBlockId,
}: CanvasBlockSharedProps & {
  onUpdateBlockStyle?: (blockId: string, patch: Partial<BlockStyle>) => void;
}) {
  return (
    <div className="relative" data-editor-block data-section-shell={block.id}>
      <BlockRenderer
        block={block}
        event={event}
        ctx={ctx}
        selected={selectedBlockId === block.id}
        selectedBlockId={selectedBlockId}
        onSelect={onSelect}
        preview
        animationReplayKey={animationReplayKey}
        sectionDroppable
        activeSectionDropId={activeSectionDropId}
        sectionChildrenSlot={
          <SectionChildrenEditor
            sectionId={block.id}
            childrenBlocks={getSectionChildren(block)}
            event={event}
            ctx={ctx}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelect}
            onUpdateBlockStyle={onUpdateBlockStyle}
            activeDropId={activeDropId}
            dragActive={dragActive}
            animationReplayKey={animationReplayKey}
            animationReplayBlockId={animationReplayBlockId}
            emptyHint="Перетягніть блок сюди з полотна"
          />
        }
      />
    </div>
  );
}

function SortableCanvasBlock({
  block,
  event,
  ctx,
  selected,
  selectedBlockId,
  onSelect,
  onUpdateStyle,
  onUpdateData,
  animationReplayKey,
  activeSectionDropId,
  activeDropId,
  dragActive,
  animationReplayBlockId,
}: CanvasBlockSharedProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: canvasBlockId(block.id),
    data: { type: "top-level" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
      }}
      className="group relative"
      data-editor-block
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className={cn(
          "absolute -left-1 top-1/2 z-30 -translate-y-1/2 cursor-grab rounded bg-background/95 p-1 text-muted-foreground shadow-sm active:cursor-grabbing",
          selected ? "flex" : "hidden group-hover:flex",
        )}
        aria-label="Перетягнути блок"
        title="Перетягніть, щоб змінити порядок або вкинути в секцію"
      >
        ⋮⋮
      </button>
      {selected && onUpdateStyle && !isFullScreenCover(block) && (
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
        onUpdateData={onUpdateData}
        activeSectionDropId={activeSectionDropId}
      />
    </div>
  );
}

function CanvasDropArea({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: CANVAS_DROP_ID });
  return (
    <div ref={setNodeRef} className="relative min-h-full">
      {children}
    </div>
  );
}

interface EditorBlockCanvasProps {
  event: PublicInviteEvent;
  ctx: ResolvedInviteContext;
  blocks: DesignBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  activeDropId: string | null;
  activeSectionDropId?: string | null;
  dragActive?: boolean;
  onUpdateBlockStyle?: (blockId: string, patch: Partial<BlockStyle>) => void;
  onUpdateBlockData?: (blockId: string, patch: Record<string, unknown>) => void;
  onDeselectBlock?: () => void;
  animationReplayKey?: number;
  animationReplayBlockId?: string | null;
}

export function EditorBlockCanvas({
  event,
  ctx,
  blocks,
  selectedBlockId,
  onSelectBlock,
  activeDropId,
  activeSectionDropId = null,
  dragActive = false,
  onUpdateBlockStyle,
  onUpdateBlockData,
  onDeselectBlock,
  animationReplayKey = 0,
  animationReplayBlockId = null,
}: EditorBlockCanvasProps) {
  const { theme } = ctx;
  const bg = event.design?.backgroundImageUrl ?? null;
  const bgSrc = isValidImageSrc(bg) ? bg : null;
  const first = blocks[0];
  const bleedFirst = first ? isBleedCover(first) : false;
  const contentBlocks = bleedFirst ? blocks.slice(1) : blocks;

  const sortableIds = blocks.filter((b) => b.type !== "section").map((b) => canvasBlockId(b.id));

  const shared = (block: DesignBlock): CanvasBlockSharedProps => ({
    block,
    event,
    ctx,
    selected: selectedBlockId === block.id || getSectionChildren(block).some((c) => c.id === selectedBlockId),
    selectedBlockId,
    onSelect: onSelectBlock,
    onUpdateStyle: onUpdateBlockStyle ? (patch) => onUpdateBlockStyle(block.id, patch) : undefined,
    onUpdateData: onUpdateBlockData ? (patch) => onUpdateBlockData(block.id, patch) : undefined,
    animationReplayKey:
      animationReplayBlockId === block.id ||
      getSectionChildren(block).some((c) => c.id === animationReplayBlockId)
        ? animationReplayKey
        : undefined,
    activeSectionDropId,
    activeDropId,
    dragActive,
    animationReplayBlockId,
  });

  const renderBlock = (block: DesignBlock) =>
    block.type === "section" ? (
      <StaticSectionCanvasBlock
        key={block.id}
        {...shared(block)}
        onUpdateBlockStyle={onUpdateBlockStyle}
      />
    ) : (
      <SortableCanvasBlock key={block.id} {...shared(block)} />
    );

  return (
    <CanvasDropArea>
      <div
        className="relative min-h-full"
        style={{ backgroundColor: bgSrc ? undefined : theme.backgroundColor }}
        onClick={(e) => {
          if (!(e.target as Element).closest("[data-editor-block]")) {
            onDeselectBlock?.();
          }
        }}
      >
        {bgSrc && (
          <>
            <div className="pointer-events-none absolute inset-0 z-0">
              <Image src={bgSrc} alt="" fill className="object-cover" sizes="390px" priority />
            </div>
            <div
              className="pointer-events-none absolute inset-0 z-[1]"
              style={{ backgroundColor: `rgba(0,0,0,${(theme.backgroundOverlay ?? 0.4) * 0.4})` }}
            />
          </>
        )}
        <div className="relative z-10 mx-auto w-full" style={{ maxWidth: INVITE_CONTENT_MAX_WIDTH }}>
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {bleedFirst && first ? (
              <>
                <InsertDropZone
                  index={0}
                  active={activeDropId === insertId(0)}
                  dragActive={dragActive}
                  flush
                />
                {renderBlock(first)}
                <InsertDropZone index={1} active={activeDropId === insertId(1)} dragActive={dragActive} />
                <div style={blockListLayoutStyle(theme)}>
                  {contentBlocks.map((block, index) => (
                    <Fragment key={block.id}>
                      {renderBlock(block)}
                      <InsertDropZone
                        index={index + 2}
                        active={activeDropId === insertId(index + 2)}
                        dragActive={dragActive}
                      />
                    </Fragment>
                  ))}
                </div>
              </>
            ) : (
              <div style={blockListLayoutStyle(theme)}>
                <InsertDropZone index={0} active={activeDropId === insertId(0)} dragActive={dragActive} />
                {blocks.map((block, index) => (
                  <Fragment key={block.id}>
                    {renderBlock(block)}
                    <InsertDropZone
                      index={index + 1}
                      active={activeDropId === insertId(index + 1)}
                      dragActive={dragActive}
                    />
                  </Fragment>
                ))}
              </div>
            )}
          </SortableContext>
        </div>
      </div>
    </CanvasDropArea>
  );
}
