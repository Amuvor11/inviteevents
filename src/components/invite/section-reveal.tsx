"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { BLOCK_IN_VIEW, DEFAULT_ANIMATION_DURATION_MS } from "@/lib/invite/motion";

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  durationMs?: number;
}

export function SectionReveal({
  children,
  className = "",
  delay = 0,
  durationMs = DEFAULT_ANIMATION_DURATION_MS,
}: SectionRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={BLOCK_IN_VIEW}
      transition={{ duration: durationMs / 1000, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
