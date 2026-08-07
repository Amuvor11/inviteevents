"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Play } from "lucide-react";
import type { EnvelopeIntroBlock, EnvelopeIntroSettings } from "@/types";
import type { InviteTheme } from "@/types/invite";
import {
  resolveEnvelopeBlocks,
  resolveEnvelopeContentAlign,
} from "@/lib/invite/envelope-blocks";
import { fontFamilyCss } from "@/lib/invite/fonts";
import { isValidImageSrc } from "@/lib/utils/image-url";
import { cn } from "@/lib/utils/cn";
import { textElementCss } from "@/components/dashboard/text-style-editor";
import type { InviteFontId } from "@/lib/invite/fonts";
import { getSharedInviteAudio, startSharedInviteAudio } from "@/lib/invite/shared-invite-audio";

export interface EnvelopeIntroScreenProps {
  theme: InviteTheme;
  monogram: string;
  settings?: EnvelopeIntroSettings | null;
  onOpen: () => void;
  embedded?: boolean;
  /** Editor: highlight/select blocks (no free drag) */
  editable?: boolean;
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string | null) => void;
  /** Warm / start background music so it continues after open */
  musicUrl?: string | null;
}

const SEAL_SIZE = { sm: "3.5rem", md: "4.6rem", lg: "5.6rem" } as const;
const ENVELOPE_WIDTH = { narrow: "14rem", normal: "18.5rem", wide: "22rem" } as const;

export function EnvelopeIntroScreen({
  theme,
  monogram,
  settings,
  onOpen,
  embedded = false,
  editable = false,
  selectedBlockId,
  onSelectBlock,
  musicUrl,
}: EnvelopeIntroScreenProps) {
  const [opening, setOpening] = useState(false);
  const isUk = theme.locale === "uk";
  const s = settings ?? {};
  const blocks = resolveEnvelopeBlocks(s).filter((b) => b.visible !== false);
  const contentAlign = resolveEnvelopeContentAlign(s);
  const music = musicUrl?.trim() || "";

  const sealLetters = (s.monogram?.trim() || monogram || "♥").slice(0, 3).toUpperCase();
  const bg = s.backgroundColor?.trim() || "#f3eee6";
  const sealColor = s.sealColor?.trim() || "#c62828";
  const textColor = s.textColor?.trim() || theme.textColor || "#1a1a1a";
  const envelopeColor = s.envelopeColor?.trim() || "#f0ebe3";
  const flapColor = s.flapColor?.trim() || "#fbf9f6";
  const titleItalic = s.titleItalic !== false;
  const titleSize = s.titleSize ?? 36;
  const titleFontId = (s.titleFont || "cormorant") as InviteFontId;
  const titleFont = fontFamilyCss(titleFontId);
  const sealSize = s.sealSize ?? "md";
  const envelopeWidth = s.envelopeWidth ?? "normal";
  const envelopeStyle = s.envelopeStyle ?? (s.envelopeImageUrl ? "photo" : "classic");
  // Photo artwork: hide seal/play unless explicitly enabled after upload
  const showSeal = s.envelopeImageUrl ? s.showSeal === true : s.showSeal !== false;
  const showPlayIcon = s.envelopeImageUrl ? s.showPlayIcon === true : s.showPlayIcon !== false;
  const paddingTop = s.paddingTop ?? 48;
  const paddingBottom = s.paddingBottom ?? 48;
  const paddingX = s.paddingX ?? 24;
  const bgImage = s.backgroundImageUrl?.trim() && isValidImageSrc(s.backgroundImageUrl) ? s.backgroundImageUrl : null;
  const envelopeImage =
    s.envelopeImageUrl?.trim() && isValidImageSrc(s.envelopeImageUrl) ? s.envelopeImageUrl : null;
  const overlay = s.backgroundOverlay ?? (bgImage ? 0.35 : 0);

  const justify =
    contentAlign === "top" ? "flex-start" : contentAlign === "bottom" ? "flex-end" : "center";

  const beginOpen = () => {
    if (editable) return;
    if (opening) return;
    setOpening(true);
    window.setTimeout(() => {
      onOpen();
      if (embedded) setOpening(false);
    }, 720);
  };

  const handleOpen = () => {
    if (editable) return;
    // Start music inside the user gesture so autoplay policies allow it.
    if (music) void startSharedInviteAudio(music, true);
    beginOpen();
  };

  const autoOpenSeconds = typeof s.autoOpenSeconds === "number" ? s.autoOpenSeconds : 0;
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  // Preload audio while guest waits; with auto-open try muted start early.
  useEffect(() => {
    if (editable || !music) return;
    getSharedInviteAudio(music, true);
    if (autoOpenSeconds > 0) {
      void startSharedInviteAudio(music, true);
    }
  }, [editable, music, autoOpenSeconds]);

  // Auto-open: try to start music, then open invite.
  useEffect(() => {
    if (editable || autoOpenSeconds <= 0) return;
    const timer = window.setTimeout(() => {
      void (async () => {
        if (music) await startSharedInviteAudio(music, true);
        setOpening((already) => {
          if (already) return already;
          window.setTimeout(() => {
            onOpenRef.current();
            if (embedded) setOpening(false);
          }, 720);
          return true;
        });
      })();
    }, autoOpenSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [editable, autoOpenSeconds, embedded, music]);

  // If autoplay stayed muted/blocked, unmute or start on first gesture while still on envelope.
  useEffect(() => {
    if (editable || !music || autoOpenSeconds <= 0) return;
    const unlock = () => {
      void startSharedInviteAudio(music, true);
    };
    const opts = { capture: true } as const;
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("touchstart", unlock, opts);
    return () => {
      window.removeEventListener("pointerdown", unlock, opts);
      window.removeEventListener("touchstart", unlock, opts);
    };
  }, [editable, music, autoOpenSeconds]);

  const blockText = (block: EnvelopeIntroBlock, fallback: string) =>
    block.text?.trim() || fallback;

  return (
    <AnimatePresence>
      <motion.div
        key="envelope-intro"
        className={cn(
          "z-[100] overflow-hidden",
          embedded ? "absolute inset-0 h-full w-full" : "fixed inset-0 h-dvh w-screen",
        )}
        style={{ backgroundColor: bg, color: textColor }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        onClick={() => editable && onSelectBlock?.(null)}
      >
        {bgImage && (
          <>
            <Image src={bgImage} alt="" fill className="object-cover" priority sizes="100vw" />
            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />
          </>
        )}

        <motion.div
          className="relative z-[1] flex h-full w-full flex-col overflow-hidden"
          style={{
            paddingTop,
            paddingBottom,
            paddingLeft: paddingX,
            paddingRight: paddingX,
            justifyContent: justify,
          }}
          animate={opening ? { opacity: 0, scale: 0.97 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {blocks.map((block) => {
            const selected = selectedBlockId === block.id;
            const align = block.align ?? "center";
            const alignSelf =
              align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
            const textAlign = align;

            const inner = (() => {
              switch (block.type) {
                case "title":
                  return (
                    <h1
                      className="max-w-[18rem] leading-tight"
                      style={{
                        ...textElementCss(block.textStyle, {
                          fontFamily: titleFontId,
                          fontSize: titleSize,
                          color: textColor,
                          fontWeight: 500,
                        }),
                        fontStyle: block.textStyle?.fontStyle ?? (titleItalic ? "italic" : "normal"),
                        textAlign,
                      }}
                    >
                      {blockText(block, s.title?.trim() || "Wedding Invitation")}
                    </h1>
                  );
                case "subtitle":
                  return (
                    <p
                      className="max-w-[16rem] leading-snug"
                      style={{
                        ...textElementCss(block.textStyle, {
                          fontFamily: "sans",
                          fontSize: 14,
                          color: textColor,
                          fontWeight: 400,
                        }),
                        opacity: block.textStyle?.color ? 1 : 0.7,
                        textAlign,
                      }}
                    >
                      {blockText(block, s.subtitle?.trim() || (isUk ? "Анна & Дмитро" : "Ann & John"))}
                    </p>
                  );
                case "cta":
                  return (
                    <p
                      className="uppercase tracking-[0.35em]"
                      style={{
                        ...textElementCss(block.textStyle, {
                          fontFamily: "sans",
                          fontSize: 11,
                          color: textColor,
                          fontWeight: 500,
                        }),
                        textAlign,
                      }}
                    >
                      {blockText(block, s.ctaLabel?.trim() || (isUk ? "тисни сюди" : "tap here"))}
                    </p>
                  );
                case "arrow":
                  return (
                    <motion.div
                      className="opacity-35"
                      style={{ color: textColor }}
                      animate={editable ? undefined : { y: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                    >
                      <ChevronDown className="h-5 w-5" strokeWidth={1.5} />
                    </motion.div>
                  );
                case "envelope":
                  return (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (editable) {
                          onSelectBlock?.(block.id);
                          return;
                        }
                        handleOpen();
                      }}
                      aria-label={isUk ? "Відкрити запрошення" : "Open invitation"}
                      className="group relative focus:outline-none"
                      style={{ width: ENVELOPE_WIDTH[envelopeWidth] }}
                    >
                      <EnvelopeGraphic
                        opening={opening}
                        sealColor={sealColor}
                        monogram={sealLetters}
                        serifFont={titleFont}
                        envelopeColor={envelopeColor}
                        flapColor={flapColor}
                        envelopeImage={envelopeStyle === "minimal" ? null : envelopeImage}
                        envelopeStyle={envelopeStyle}
                        showSeal={showSeal}
                        showPlayIcon={showPlayIcon}
                        sealSize={SEAL_SIZE[sealSize]}
                      />
                    </button>
                  );
                default:
                  return null;
              }
            })();

            return (
              <div
                key={block.id}
                onClick={(e) => {
                  if (!editable) return;
                  e.stopPropagation();
                  onSelectBlock?.(block.id);
                }}
                className={cn(
                  "relative shrink-0",
                  editable && "rounded-lg",
                  editable && selected && "ring-2 ring-primary ring-offset-2",
                  editable && "cursor-pointer",
                )}
                style={{
                  marginTop: block.pinBottom ? "auto" : `${block.marginTop ?? 0}dvh`,
                  marginBottom: `${block.marginBottom ?? 0}dvh`,
                  alignSelf,
                }}
              >
                {inner}
              </div>
            );
          })}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function EnvelopeGraphic({
  opening,
  sealColor,
  monogram,
  serifFont,
  envelopeColor,
  flapColor,
  envelopeImage,
  envelopeStyle,
  showSeal,
  showPlayIcon,
  sealSize,
}: {
  opening: boolean;
  sealColor: string;
  monogram: string;
  serifFont: string;
  envelopeColor: string;
  flapColor: string;
  envelopeImage: string | null;
  envelopeStyle: "classic" | "photo" | "minimal";
  showSeal: boolean;
  showPlayIcon: boolean;
  sealSize: string;
}) {
  if (envelopeStyle === "minimal") {
    return (
      <div className="relative mx-auto flex aspect-square w-[70%] items-center justify-center select-none">
        {showSeal && (
          <Seal
            opening={opening}
            sealColor={sealColor}
            monogram={monogram}
            serifFont={serifFont}
            showPlayIcon={showPlayIcon}
            sealSize={sealSize}
            className="relative left-auto top-auto translate-x-0 translate-y-0"
          />
        )}
      </div>
    );
  }

  // Uploaded photo = full envelope artwork (no CSS flap).
  if (envelopeImage) {
    return (
      <motion.div
        className="relative mx-auto aspect-[1.45/1] w-full select-none overflow-hidden rounded-md"
        animate={opening ? { scale: 0.96, opacity: 0.85 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image src={envelopeImage} alt="" fill className="object-cover" sizes="360px" priority />
        {showSeal && (
          <Seal
            opening={opening}
            sealColor={sealColor}
            monogram={monogram}
            serifFont={serifFont}
            showPlayIcon={showPlayIcon}
            sealSize={sealSize}
          />
        )}
      </motion.div>
    );
  }

  return (
    <div className="relative mx-auto aspect-[1.45/1] w-full select-none">
      <div
        className="absolute inset-x-0 bottom-0 top-[18%] overflow-hidden rounded-sm"
        style={{
          background: `linear-gradient(160deg, ${lighten(envelopeColor, 12)} 0%, ${envelopeColor} 55%, ${darken(envelopeColor, 8)} 100%)`,
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="absolute inset-x-[10%] top-[28%] h-[55%] rounded-sm opacity-70"
          style={{ background: "linear-gradient(180deg, #fffefb, #f7f2ea)" }}
        />
      </div>

      <motion.div
        className="absolute inset-x-0 top-0 origin-top"
        style={{ height: "42%", perspective: 800 }}
        animate={opening ? { rotateX: -150, opacity: 0.85 } : { rotateX: 0, opacity: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="h-full w-full"
          style={{
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            background: `linear-gradient(180deg, ${lighten(flapColor, 4)} 0%, ${darken(flapColor, 8)} 100%)`,
          }}
        />
      </motion.div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[18%]"
        style={{
          background:
            "linear-gradient(105deg, rgba(0,0,0,0.04) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.04) 100%)",
        }}
      />

      {showSeal && (
        <Seal
          opening={opening}
          sealColor={sealColor}
          monogram={monogram}
          serifFont={serifFont}
          showPlayIcon={showPlayIcon}
          sealSize={sealSize}
        />
      )}
    </div>
  );
}

function Seal({
  opening,
  sealColor,
  monogram,
  serifFont,
  showPlayIcon,
  sealSize,
  className,
}: {
  opening: boolean;
  sealColor: string;
  monogram: string;
  serifFont: string;
  showPlayIcon: boolean;
  sealSize: string;
  className?: string;
}) {
  return (
    <motion.div
      className={cn(
        "absolute left-1/2 top-[46%] z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full",
        "shadow-[0_8px_20px_rgba(160,20,20,0.35),inset_0_2px_6px_rgba(255,255,255,0.25),inset_0_-4px_10px_rgba(0,0,0,0.25)]",
        className,
      )}
      style={{
        width: sealSize,
        height: sealSize,
        background: `radial-gradient(circle at 35% 30%, ${lighten(sealColor, 18)}, ${sealColor} 55%, ${darken(sealColor, 12)})`,
      }}
      animate={opening ? { scale: 0.7, opacity: 0 } : { scale: 1, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <span
        className="relative z-[2] text-[1.35rem] font-medium tracking-wide text-white drop-shadow-md"
        style={{ fontFamily: serifFont }}
      >
        {monogram}
      </span>
      {showPlayIcon && (
        <span className="pointer-events-none absolute bottom-2 right-2 z-[2] flex h-5 w-5 items-center justify-center rounded-full bg-black/25">
          <Play className="ml-px h-2.5 w-2.5 fill-white text-white" />
        </span>
      )}
      <span
        className="pointer-events-none absolute inset-[8%] z-[1] rounded-full opacity-40"
        style={{
          background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55), transparent 45%)",
        }}
      />
    </motion.div>
  );
}

function lighten(hex: string, amount: number): string {
  const c = parseHex(hex);
  if (!c) return hex;
  return `rgb(${Math.min(255, c.r + amount)}, ${Math.min(255, c.g + amount)}, ${Math.min(255, c.b + amount)})`;
}

function darken(hex: string, amount: number): string {
  const c = parseHex(hex);
  if (!c) return hex;
  return `rgb(${Math.max(0, c.r - amount)}, ${Math.max(0, c.g - amount)}, ${Math.max(0, c.b - amount)})`;
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function isEnvelopeIntroEnabled(settings?: EnvelopeIntroSettings | null): boolean {
  return settings?.enabled === true;
}
