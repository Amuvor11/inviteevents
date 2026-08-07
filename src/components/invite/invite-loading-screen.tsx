"use client";

import { motion } from "framer-motion";

interface InviteLoadingScreenProps {
  title?: string;
  monogram?: string;
  backgroundColor?: string;
  sealColor?: string;
  serifFont?: string;
  message?: string;
}

/** Elegant full-screen loader shown while the public invite is fetching. */
export function InviteLoadingScreen({
  title = "InviteEvents",
  monogram = "♥",
  backgroundColor = "#f3eee6",
  sealColor = "#c62828",
  serifFont = "var(--font-cormorant), Georgia, serif",
  message = "Завантаження запрошення…",
}: InviteLoadingScreenProps) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ backgroundColor }}
    >
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="relative flex h-20 w-20 items-center justify-center rounded-full shadow-[0_10px_28px_rgba(160,20,20,0.28)]"
          style={{
            background: `radial-gradient(circle at 35% 30%, #e57373, ${sealColor} 55%, #8b1515)`,
          }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        >
          <span
            className="text-2xl font-medium tracking-wide text-white drop-shadow"
            style={{ fontFamily: serifFont }}
          >
            {monogram.slice(0, 3).toUpperCase()}
          </span>
          <span
            className="pointer-events-none absolute inset-[10%] rounded-full opacity-45"
            style={{
              background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55), transparent 45%)",
            }}
          />
        </motion.div>

        <p
          className="mt-7 text-center text-xl italic"
          style={{ fontFamily: serifFont, color: "#2c2420" }}
        >
          {title}
        </p>

        <div className="mt-5 flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-[#2c2420]/35"
              animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1.15, 0.85] }}
              transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.18 }}
            />
          ))}
        </div>

        <p className="mt-3 text-center text-[11px] tracking-[0.2em] text-[#2c2420]/55 uppercase">
          {message}
        </p>
      </motion.div>
    </div>
  );
}
