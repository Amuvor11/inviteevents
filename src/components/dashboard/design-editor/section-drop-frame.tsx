"use client";

import { useDroppable } from "@dnd-kit/core";
import { SectionFrame } from "@/components/invite/section-frame";
import { sectionDropId } from "@/lib/invite/blocks";
import { cn } from "@/lib/utils/cn";
import type { ComponentProps } from "react";

type SectionFrameProps = ComponentProps<typeof SectionFrame>;

interface SectionDropFrameProps extends Omit<SectionFrameProps, "containerRef" | "className"> {
  sectionId: string;
  dropActive?: boolean;
}

/**
 * Droppable wrapper stays outside SectionFrame so hit-testing is stable.
 */
export function SectionDropFrame({ sectionId, dropActive, children, ...frameProps }: SectionDropFrameProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: sectionDropId(sectionId),
    data: { type: "section-drop", sectionId },
  });

  return (
    <div
      ref={setNodeRef}
      data-section-drop={sectionId}
      className={cn(
        "relative min-h-20",
        (isOver || dropActive) && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <SectionFrame {...frameProps}>{children}</SectionFrame>
    </div>
  );
}
