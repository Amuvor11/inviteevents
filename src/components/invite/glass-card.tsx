"use client";

import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { BLOCK_IN_VIEW, DEFAULT_ANIMATION_DURATION_MS } from "@/lib/invite/motion";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  opacity?: number;
  style?: CSSProperties;
  /** Skip own entrance — parent BlockWrapper already animates. */
  disableMotion?: boolean;
}

export function GlassCard({
  children,
  className = "",
  opacity = 0.85,
  style,
  disableMotion = false,
}: GlassCardProps) {
  const shared = {
    className: `rounded-2xl border border-white/30 shadow-xl backdrop-blur-xl ${className}`,
    style: {
      backgroundColor: `rgba(255, 255, 255, ${opacity})`,
      ...style,
    } as CSSProperties,
  };

  if (disableMotion) {
    return <div {...shared}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={BLOCK_IN_VIEW}
      transition={{ duration: DEFAULT_ANIMATION_DURATION_MS / 1000, ease: "easeOut" }}
      {...shared}
    >
      {children}
    </motion.div>
  );
}
