import type { BlockAnimation } from "@/types/design";

export const DEFAULT_ANIMATION_DURATION_MS = 550;

/**
 * Trigger as soon as any part enters the viewport.
 * Avoid a large negative bottom margin — on phones (dynamic URL bar + short
 * last blocks like dress-code swatches) it left content stuck at opacity 0.
 */
export const BLOCK_IN_VIEW = {
  once: true,
  amount: "some" as const,
  margin: "0px 0px 80px 0px",
};

/**
 * For content near the page bottom — expands the hit area downward so
 * last blocks still animate when you can't scroll further.
 */
export const BLOCK_IN_VIEW_END = {
  once: true,
  amount: 0.05 as const,
  margin: "0px 0px 140px 0px",
};

export function motionFromAnimation(
  anim: BlockAnimation,
  opts: {
    delayMs?: number;
    durationMs?: number;
    preview?: boolean;
  } = {},
) {
  if (anim === "none") return {};
  const initial = {
    opacity: 0,
    y: anim === "slideDown" ? -24 : anim === "slideUp" ? 24 : 0,
    scale: anim === "zoom" ? 0.92 : 1,
  };
  const visible = { opacity: 1, y: 0, scale: 1 };
  const transition = {
    duration: (opts.durationMs ?? DEFAULT_ANIMATION_DURATION_MS) / 1000,
    delay: (opts.delayMs ?? 0) / 1000,
  };
  return opts.preview
    ? { initial, animate: visible, transition }
    : { initial, whileInView: visible, viewport: BLOCK_IN_VIEW, transition };
}
