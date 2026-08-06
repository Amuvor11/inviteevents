"use client";

import { useEffect, useRef, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
} from "date-fns";
import { uk, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import type { InviteLocale } from "@/types/invite";
import { cn } from "@/lib/utils/cn";
import { BLOCK_IN_VIEW } from "@/lib/invite/motion";
import {
  CALENDAR_REVEAL,
  getCalendarMarker,
  isShapeMarker,
  markerMotion,
  type CalendarMarkerAnimation,
} from "@/lib/invite/calendar-markers";

interface CalendarWidgetProps {
  eventDate: string;
  locale?: InviteLocale;
  /** Fallback when marker/day colors are not set. */
  accentColor?: string;
  /** Color of the date marker / icon around the event day. */
  markerColor?: string;
  /** Color of the event day number. */
  eventDayColor?: string;
  textColor?: string;
  /** Font for weekday labels and day numbers. */
  fontFamily?: string;
  /** Font for the month title; falls back to fontFamily. */
  monthFontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  dateMarker?: string;
  customSvg?: string | null;
  markerAnimation?: CalendarMarkerAnimation;
  className?: string;
}

function ShapeMarker({
  marker,
  color,
  animation,
  play,
}: {
  marker: string;
  color: string;
  animation: CalendarMarkerAnimation;
  play: boolean;
}) {
  if (marker === "none") return null;
  const motionProps = markerMotion(animation, { play });

  if (marker === "circle" || marker === "square") {
    return (
      <motion.span
        {...motionProps}
        className={cn("absolute inset-[14%] z-0", marker === "circle" ? "rounded-full" : "rounded-md")}
        style={{ backgroundColor: color }}
        aria-hidden
      />
    );
  }

  if (marker === "ring") {
    return (
      <motion.span
        {...motionProps}
        className="absolute inset-[12%] z-0 rounded-full border-2"
        style={{ borderColor: color }}
        aria-hidden
      />
    );
  }

  if (marker === "underline") {
    const underlineMotion =
      animation === "none"
        ? markerMotion("none")
        : animation === "fade"
          ? markerMotion("fade", { play })
          : {
              initial: { opacity: 0, scaleX: 0.2 },
              animate: play ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.2 },
              transition: play
                ? { type: "spring" as const, stiffness: 220, damping: 18, delay: 0.05 }
                : { duration: 0 },
            };
    return (
      <motion.span
        {...underlineMotion}
        className="absolute bottom-[16%] left-[22%] right-[22%] z-0 h-0.5 origin-center rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
    );
  }

  const glyph = marker === "heart" ? "♥" : marker === "star" ? "★" : marker === "diamond" ? "◆" : "♥";
  return (
    <motion.span
      {...motionProps}
      className="absolute inset-0 z-0 flex items-center justify-center text-2xl sm:text-3xl"
      style={{ color }}
      aria-hidden
    >
      {glyph}
    </motion.span>
  );
}

function SvgMarker({
  svg,
  color,
  animation,
  play,
}: {
  svg: string;
  color: string;
  animation: CalendarMarkerAnimation;
  play: boolean;
}) {
  return (
    <motion.span
      {...markerMotion(animation, { play })}
      className="pointer-events-none absolute inset-[18%] z-0 flex items-center justify-center"
      style={{ color }}
      aria-hidden
    >
      <span
        className="block h-full w-full [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </motion.span>
  );
}

function ImageMarker({
  src,
  color,
  anchorX = 0.5,
  anchorY = 0.5,
  animation,
  play,
}: {
  src: string;
  color: string;
  anchorX?: number;
  anchorY?: number;
  animation: CalendarMarkerAnimation;
  play: boolean;
}) {
  const tx = `${(0.5 - anchorX) * 100}%`;
  const ty = `${(0.5 - anchorY) * 100}%`;

  return (
    <motion.span
      {...markerMotion(animation, { play })}
      className="pointer-events-none absolute inset-[8%] z-0 flex items-center justify-center"
      aria-hidden
    >
      <span
        className="block h-full w-full"
        style={{
          backgroundColor: color,
          WebkitMaskImage: `url("${src}")`,
          maskImage: `url("${src}")`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          transform: `translate(${tx}, ${ty})`,
        }}
      />
    </motion.span>
  );
}

export function CalendarWidget({
  eventDate,
  locale = "uk",
  accentColor = "#8b2942",
  markerColor,
  eventDayColor,
  textColor,
  fontFamily,
  monthFontFamily,
  fontWeight = 400,
  fontSize = 16,
  dateMarker = "heart",
  customSvg,
  markerAnimation = "fade",
  className = "",
}: CalendarWidgetProps) {
  const date = new Date(eventDate);
  const dateLocale = locale === "uk" ? uk : enUS;
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = (getDay(monthStart) + 6) % 7;
  const iconColor = markerColor || accentColor;
  const dayColor = eventDayColor || markerColor || accentColor;

  const weekDays =
    locale === "uk"
      ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"]
      : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const markerId = dateMarker || "heart";
  const catalogItem = markerId === "custom" ? undefined : getCalendarMarker(markerId);
  const iconSvg =
    markerId === "custom" && customSvg
      ? customSvg
      : catalogItem?.kind === "icon" && catalogItem.svg
        ? catalogItem.svg
        : undefined;
  const iconImage = catalogItem?.image;
  const imageAnchorX = catalogItem?.imageAnchorX ?? 0.5;
  const imageAnchorY = catalogItem?.imageAnchorY ?? 0.5;
  const shapeId = isShapeMarker(markerId) ? markerId : undefined;

  const [markerPlay, setMarkerPlay] = useState(markerAnimation === "none");
  const calendarReadyRef = useRef(false);

  useEffect(() => {
    if (markerAnimation === "none") {
      setMarkerPlay(true);
      return;
    }
    setMarkerPlay(false);
    if (!calendarReadyRef.current) return;
    const id = requestAnimationFrame(() => setMarkerPlay(true));
    return () => cancelAnimationFrame(id);
  }, [markerAnimation, markerId, eventDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={BLOCK_IN_VIEW}
      transition={CALENDAR_REVEAL}
      onAnimationComplete={() => {
        calendarReadyRef.current = true;
        setMarkerPlay(true);
      }}
      className={`text-center ${className}`}
      style={{ color: textColor, fontSize, fontWeight }}
    >
      <p
        className="mb-4 capitalize"
        style={{ fontFamily: monthFontFamily || fontFamily, fontSize: fontSize * 1.15, fontWeight }}
      >
        {format(date, "LLLL yyyy", { locale: dateLocale })}
      </p>
      <div
        className="grid grid-cols-7 gap-1"
        style={{ fontFamily, fontSize: fontSize * 0.85 }}
      >
        {weekDays.map((d) => (
          <div key={d} className="py-1 font-medium opacity-50">
            {d}
          </div>
        ))}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const isEvent = isSameDay(day, date);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "relative flex aspect-square items-center justify-center overflow-visible",
                isEvent ? "font-semibold" : "opacity-70",
              )}
            >
              {isEvent && iconImage && (
                <ImageMarker
                  src={iconImage}
                  color={iconColor}
                  anchorX={imageAnchorX}
                  anchorY={imageAnchorY}
                  animation={markerAnimation}
                  play={markerPlay}
                />
              )}
              {isEvent && iconSvg && !iconImage && (
                <SvgMarker
                  svg={iconSvg}
                  color={iconColor}
                  animation={markerAnimation}
                  play={markerPlay}
                />
              )}
              {isEvent && shapeId && !iconSvg && !iconImage && (
                <ShapeMarker
                  marker={shapeId}
                  color={iconColor}
                  animation={markerAnimation}
                  play={markerPlay}
                />
              )}
              <span
                className="relative z-10"
                style={isEvent ? { color: dayColor } : undefined}
              >
                {format(day, "d")}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
