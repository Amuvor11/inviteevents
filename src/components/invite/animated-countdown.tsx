"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BLOCK_IN_VIEW } from "@/lib/invite/motion";
import type { InviteLocale, CountdownStyle } from "@/types/invite";

const LABELS: Record<InviteLocale, Record<string, string>> = {
  en: { days: "days", hours: "hours", minutes: "minutes", seconds: "seconds" },
  uk: { days: "дні", hours: "годин", minutes: "хвилин", seconds: "секунди" },
};

interface AnimatedCountdownProps {
  targetDate: string;
  style?: CountdownStyle;
  locale?: InviteLocale;
  textColor?: string;
  accentColor?: string;
  className?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  showLabels?: boolean;
}

function useFitScale(deps: unknown[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const fit = () => {
      const available = container.clientWidth;
      // scrollWidth is the unscaled layout width
      const needed = content.scrollWidth;
      const next = needed > available && available > 0 ? Math.max(0.35, available / needed) : 1;
      setScale((prev) => (Math.abs(prev - next) < 0.01 ? prev : next));
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(container);
    ro.observe(content);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { containerRef, contentRef, scale };
}

export function AnimatedCountdown({
  targetDate,
  style = "cards",
  locale = "uk",
  textColor = "#ffffff",
  accentColor,
  className = "",
  fontFamily,
  fontSize,
  fontWeight = 400,
  showLabels = true,
}: AnimatedCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const { containerRef, contentRef, scale } = useFitScale([
    style,
    fontFamily,
    fontSize,
    fontWeight,
    showLabels,
    timeLeft.days,
    timeLeft.hours,
    timeLeft.minutes,
    timeLeft.seconds,
  ]);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const labels = LABELS[locale];
  const units = ["days", "hours", "minutes", "seconds"] as const;
  const values = [timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds];
  const numberFont = fontFamily ?? "var(--font-cormorant)";
  const baseSize = fontSize ?? (style === "elegant" ? 48 : style === "inline" ? 14 : 28);
  const labelSize = Math.max(10, Math.round(baseSize * 0.22));

  if (style === "elegant") {
    return (
      <div ref={containerRef} className={`w-full overflow-hidden text-center ${className}`}>
        <div
          ref={contentRef}
          className="inline-flex flex-col items-center"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center top",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-4 items-baseline"
            style={{ color: textColor, columnGap: Math.max(8, baseSize * 0.25) }}
          >
            {values.map((val, i) => (
              <span key={units[i]} className="relative flex items-baseline justify-center">
                <motion.span
                  key={val}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="tracking-wide tabular-nums"
                  style={{
                    fontFamily: numberFont,
                    fontSize: baseSize,
                    fontWeight,
                    lineHeight: 1,
                  }}
                >
                  {String(val).padStart(2, "0")}
                </motion.span>
                {i < values.length - 1 && (
                  <span
                    className="absolute -right-2 translate-x-1/2 font-extralight opacity-50 sm:-right-3"
                    style={{ fontSize: baseSize * 0.55, fontFamily: numberFont }}
                    aria-hidden
                  >
                    :
                  </span>
                )}
              </span>
            ))}
          </motion.div>
          {showLabels && (
            <div
              className="mt-3 grid grid-cols-4"
              style={{ color: textColor, columnGap: Math.max(8, baseSize * 0.25) }}
            >
              {units.map((unit) => (
                <span
                  key={unit}
                  className="text-center uppercase tracking-widest opacity-70"
                  style={{ fontSize: labelSize, fontFamily: "var(--font-geist-sans)" }}
                >
                  {labels[unit]}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (style === "inline") {
    return (
      <div ref={containerRef} className={`w-full overflow-hidden text-center ${className}`}>
        <p
          ref={contentRef}
          className="inline-block tracking-wide whitespace-nowrap"
          style={{
            color: textColor,
            fontFamily: numberFont,
            fontSize: baseSize,
            fontWeight,
            transform: `scale(${scale})`,
            transformOrigin: "center top",
          }}
        >
          {values
            .map((v, i) => (showLabels ? `${v} ${labels[units[i]]}` : String(v).padStart(2, "0")))
            .join(showLabels ? " · " : " : ")}
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`w-full overflow-hidden ${className}`}>
      <div
        ref={contentRef}
        className="grid grid-cols-4 gap-2 sm:gap-3"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center top",
        }}
      >
        {units.map((unit, i) => (
          <motion.div
            key={unit}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={BLOCK_IN_VIEW}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl p-3 text-center backdrop-blur-md sm:p-4"
            style={{
              backgroundColor: accentColor ? `${accentColor}22` : "rgba(255,255,255,0.12)",
              border: `1px solid ${accentColor ?? "rgba(255,255,255,0.2)"}`,
            }}
          >
            <motion.p
              key={values[i]}
              initial={{ scale: 1.2, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className="tabular-nums"
              style={{
                color: textColor,
                fontFamily: numberFont,
                fontSize: baseSize,
                fontWeight,
                lineHeight: 1.1,
              }}
            >
              {String(values[i]).padStart(2, "0")}
            </motion.p>
            {showLabels && (
              <p
                className="mt-1 uppercase tracking-wider opacity-70"
                style={{ color: textColor, fontSize: labelSize, fontFamily: "var(--font-geist-sans)" }}
              >
                {labels[unit]}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
