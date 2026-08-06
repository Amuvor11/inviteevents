"use client";

import Image from "next/image";
import type { DesignBlock } from "@/types/design";
import type { ResolvedInviteContext } from "@/lib/invite/personalization";
import type { PublicInviteEvent } from "@/types/invite";
import { BlockRenderer } from "@/components/invite/block-renderer";
import { blockListLayoutStyle, isBleedCover } from "@/lib/invite/block-style-utils";
import { isValidImageSrc } from "@/lib/utils/image-url";

interface BlockLayoutProps {
  event: PublicInviteEvent;
  ctx: ResolvedInviteContext;
  blocks: DesignBlock[];
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string) => void;
  preview?: boolean;
}

export function BlockLayout({
  event,
  ctx,
  blocks,
  selectedBlockId,
  onSelectBlock,
  preview = false,
}: BlockLayoutProps) {
  const { theme } = ctx;
  const bg = event.design?.backgroundImageUrl ?? null;
  const bgSrc = isValidImageSrc(bg) ? bg : null;
  const first = blocks[0];
  const bleedFirst = first ? isBleedCover(first) : false;
  const contentBlocks = bleedFirst ? blocks.slice(1) : blocks;

  return (
    <div
      className="relative min-h-full"
      style={{ backgroundColor: bgSrc ? undefined : theme.backgroundColor }}
    >
      {bgSrc && (
        <>
          <div className="pointer-events-none absolute inset-0 z-0">
            <Image
              src={bgSrc}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{ backgroundColor: `rgba(0,0,0,${(theme.backgroundOverlay ?? 0.4) * 0.4})` }}
          />
        </>
      )}
      <div className="relative z-10 w-full">
        {bleedFirst && first && (
          <BlockRenderer
            key={first.id}
            block={first}
            event={event}
            ctx={ctx}
            selected={selectedBlockId === first.id}
            selectedBlockId={selectedBlockId}
            onSelect={onSelectBlock}
            preview={preview}
          />
        )}
        <div style={blockListLayoutStyle(theme)}>
          {contentBlocks.map((block) => (
            <BlockRenderer
              key={block.id}
              block={block}
              event={event}
              ctx={ctx}
              selected={selectedBlockId === block.id}
              selectedBlockId={selectedBlockId}
              onSelect={onSelectBlock}
              preview={preview}
            />
          ))}
          {ctx.personalNote && (
            <p className="text-center text-sm italic opacity-70" style={{ color: theme.textColor }}>
              {ctx.personalNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
