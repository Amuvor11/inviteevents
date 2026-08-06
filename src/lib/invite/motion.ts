import type { BlockAnimation } from "@/types/design";

export const DEFAULT_ANIMATION_DURATION_MS = 550;

/**
 * Start when ~100px of the block has entered the viewport.
 * Bottom rootMargin insets the trigger line 100px above the screen bottom.
 */
export const BLOCK_IN_VIEW = {
  once: true,
  amount: "some" as const,
  margin: "0px 0px -100px 0px",
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
