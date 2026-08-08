"use client";

import { useContext, type CSSProperties } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { uk, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Heart,
  MapPin,
  Music,
  Star,
  Gift,
  Camera,
  type LucideIcon,
} from "lucide-react";
import type { DesignBlock } from "@/types/design";
import type { ResolvedInviteContext } from "@/lib/invite/personalization";
import type { PublicInviteEvent } from "@/types/invite";
import { AnimatedCountdown } from "@/components/invite/animated-countdown";
import { CalendarWidget } from "@/components/invite/calendar-widget";
import type { CalendarMarkerAnimation } from "@/lib/invite/calendar-markers";
import { PhotoCarousel } from "@/components/invite/photo-carousel";
import { GlassCard } from "@/components/invite/glass-card";
import { Monogram } from "@/components/invite/monogram";
import { DressCodeColors, parseColorRows, parseColorShape } from "@/components/invite/dress-code-colors";
import { RsvpFormPreview } from "@/components/invite/rsvp-form-preview";
import {
  DayProgramTimeline,
  parseDayProgramItems,
  type DayProgramItem,
} from "@/components/invite/day-program-timeline";
import { SectionContentInsetsContext, SectionFrame, SectionSurfaceContext } from "@/components/invite/section-frame";
import { SectionDropFrame } from "@/components/dashboard/design-editor/section-drop-frame";
import { getBlockBoundText, getSectionChildren, normalizeBlockLink } from "@/lib/invite/blocks";
import {
  blockWrapperStyle,
  EDITOR_SCREEN_RADIUS,
  EDITOR_VIEWPORT_HEIGHT,
  fullBleedBreakoutStyle,
  getCoverLayout,
  imageContainerStyle,
  imageFitClass,
  INVITE_CONTENT_MAX_WIDTH,
  isBleedCover,
  isEdgeToEdgeMedia,
  objectPositionToCss,
  pageLayoutMetrics,
  sectionBandStyle,
} from "@/lib/invite/block-style-utils";
import { resolveTextPosition } from "@/components/dashboard/placement-picker";
import { DraggableCoverText, resolveTextOffset } from "@/components/dashboard/draggable-cover-text";
import {
  CoverMusicPlayer,
  parseMusicPlayerStyle,
  resolveMusicOffset,
} from "@/components/invite/cover-music-player";
import {
  coverEdgeMaskStyle,
  getBottomEdgeStyle,
  getCoverEdgeStyle,
  getTopEdgeStyle,
} from "@/components/dashboard/cover-edge";
import { textElementCss } from "@/components/dashboard/text-style-editor";
import { isValidImageSrc } from "@/lib/utils/image-url";
import { fontFamilyCss } from "@/lib/invite/fonts";
import { motionFromAnimation } from "@/lib/invite/motion";
import type { BlockAnimation, TextElementStyle } from "@/types/design";
import type { InviteTheme } from "@/types/invite";

const ICONS: Record<string, LucideIcon> = {
  heart: Heart,
  calendar: Calendar,
  star: Star,
  gift: Gift,
  camera: Camera,
  music: Music,
  map: MapPin,
};

function fontFamily(style: DesignBlock["style"]) {
  return fontFamilyCss(style.fontFamily);
}

function BlockWrapper({
  block,
  children,
  selected,
  onClick,
  preview,
  theme,
  inSection = false,
}: {
  block: DesignBlock;
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  preview?: boolean;
  theme: InviteTheme;
  inSection?: boolean;
}) {
  const sectionInsets = useContext(SectionContentInsetsContext);
  const anim = block.type === "hero" ? "none" : block.animation;
  const delayMs = block.animationDelay ?? 0;
  const durationMs = block.animationDuration ?? 550;
  const bleed = isBleedCover(block);
  const edgeToEdge = isEdgeToEdgeMedia(block);
  const coverLayout = getCoverLayout(block);
  const isSection = block.type === "section";
  const isButton = block.type === "button";
  const isRsvp = block.type === "rsvp";
  const radius = bleed || isSection || edgeToEdge || isButton ? 0 : block.style.borderRadius;
  const metrics = pageLayoutMetrics(theme);
  const bottomEdge = bleed || isSection || inSection || isButton ? "none" : getBottomEdgeStyle(block.data);
  const hasBottomEdge = bottomEdge !== "none";
  const sectionStyles =
    bleed || isSection || inSection || edgeToEdge || isButton
      ? {}
      : sectionBandStyle(block.style, {
          pagePaddingLeft: metrics.pagePaddingLeft,
          pagePaddingRight: metrics.pagePaddingRight,
          blockGap: metrics.blockGap,
          hasBottomEdge,
        });
  const edgeBreakout = edgeToEdge
    ? {
        ...(sectionInsets
          ? fullBleedBreakoutStyle(sectionInsets.left, sectionInsets.right)
          : fullBleedBreakoutStyle(metrics.pagePaddingLeft, metrics.pagePaddingRight)),
        ...(hasBottomEdge ? { marginBottom: -(metrics.blockGap) } : null),
      }
    : null;
  const edgeMask = hasBottomEdge ? coverEdgeMaskStyle(bottomEdge) : undefined;
  const motionProps = motionFromAnimation(anim, { delayMs, durationMs, preview });

  const selectionRadius =
    !preview || !bleed
      ? undefined
      : coverLayout === "edge"
        ? `${EDITOR_SCREEN_RADIUS} ${EDITOR_SCREEN_RADIUS} 0 0`
        : EDITOR_SCREEN_RADIUS;

  const wrapperBase = bleed || edgeToEdge
    ? {
        ...block.style,
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
        marginTop: edgeToEdge ? block.style.marginTop : 0,
        marginBottom: edgeToEdge ? block.style.marginBottom : 0,
        marginLeft: 0,
        marginRight: 0,
        maxWidth: 100,
        backgroundColor: edgeToEdge ? block.style.backgroundColor : undefined,
        borderRadius: edgeToEdge ? 0 : block.style.borderRadius,
      }
    : isSection
      ? {
          ...block.style,
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
          backgroundColor: undefined,
          borderRadius: 0,
          maxWidth: 100,
        }
      : isButton || isRsvp
        ? {
            ...block.style,
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: 0,
            paddingRight: 0,
            backgroundColor: undefined,
            borderRadius: isRsvp ? block.style.borderRadius : 0,
            maxWidth: undefined,
          }
        : block.style;

  const useInsetSelection = selected && (isSection || inSection || edgeToEdge);

  return (
    <motion.div
      {...motionProps}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`relative ${onClick ? "cursor-pointer" : ""} ${
        selected && !bleed && !isSection && !edgeToEdge && !isButton ? "ring-2 ring-offset-2" : ""
      }`}
      style={{
        ...blockWrapperStyle(wrapperBase),
        ...sectionStyles,
        ...edgeBreakout,
        ...edgeMask,
        borderRadius: hasBottomEdge || isSection || edgeToEdge || isButton ? 0 : radius,
        width: bleed || isSection ? "100%" : edgeBreakout?.width ?? sectionStyles.width ?? undefined,
        overflow: isButton ? "visible" : undefined,
        ...(selected && !bleed && !isSection && !edgeToEdge && !isButton
          ? { ["--tw-ring-color" as string]: "#7c3aed" }
          : null),
        ...(useInsetSelection && !isButton ? { boxShadow: "inset 0 0 0 2px #7c3aed" } : null),
        ...(selected && isButton
          ? { boxShadow: "0 0 0 2px #7c3aed" }
          : null),
      }}
    >
      {children}
      {selected && bleed && (
        <div
          className="pointer-events-none absolute inset-0 z-40"
          style={{
            borderRadius: selectionRadius,
            boxShadow: "inset 0 0 0 3px #7c3aed",
          }}
          aria-hidden
        />
      )}
    </motion.div>
  );
}

interface BlockRendererProps {
  block: DesignBlock;
  event: PublicInviteEvent;
  ctx: ResolvedInviteContext;
  selected?: boolean;
  selectedBlockId?: string | null;
  onSelect?: (id: string) => void;
  preview?: boolean;
  animationReplayKey?: number;
  onUpdateData?: (patch: Record<string, unknown>) => void;
  inSection?: boolean;
  /** When true (editor canvas), section accepts dragged blocks. */
  sectionDroppable?: boolean;
  activeSectionDropId?: string | null;
  /** Editor override for nested children (sortable UI). */
  sectionChildrenSlot?: React.ReactNode;
}

export function BlockRenderer({
  block,
  event,
  ctx,
  selected,
  selectedBlockId,
  onSelect,
  preview,
  animationReplayKey,
  onUpdateData,
  inSection = false,
  sectionDroppable = false,
  activeSectionDropId = null,
  sectionChildrenSlot,
}: BlockRendererProps) {
  const { theme } = ctx;
  const dateLocale = theme.locale === "uk" ? uk : enUS;
  const color = block.style.color ?? theme.textColor;
  const ff = fontFamily(block.style);
  const sectionSurface = useContext(SectionSurfaceContext);

  const wrap = (content: React.ReactNode) => (
    <BlockWrapper
      key={
        preview
          ? `${block.id}-${block.animation}-${block.animationDelay ?? 0}-${block.animationDuration ?? 550}-${block.data.imageAnimation}-${block.data.textAnimation}-${block.data.imageAnimationDelay}-${block.data.textAnimationDelay}-${block.data.imageAnimationDuration}-${block.data.textAnimationDuration}-${animationReplayKey ?? 0}`
          : block.id
      }
      block={block}
      selected={selected}
      onClick={onSelect ? () => onSelect(block.id) : undefined}
      preview={preview}
      theme={theme}
      inSection={inSection}
    >
      {content}
    </BlockWrapper>
  );

  switch (block.type) {
    case "hero": {
      const showCover = block.data.showCover !== false;
      const coverFill = (block.data.coverFill as "image" | "color") ?? "image";
      const rawCover = ctx.coverImageUrl ?? event.coverImageUrl;
      const cover = coverFill === "image" && isValidImageSrc(rawCover) ? rawCover : null;
      const fillColor = block.style.backgroundColor ?? theme.primaryColor;
      const { x: posX } = resolveTextPosition(block.data);
      const textOffset = resolveTextOffset(block.data);
      const showGreeting = block.data.showGreeting === true;
      const greetingText = (block.data.greetingText as string)?.trim();
      const greeting = showGreeting ? greetingText || ctx.greeting : null;
      const hasMedia = showCover && (cover || coverFill === "color");
      const layout = getCoverLayout(block);
      const fullScreen = layout === "fullscreen";
      const bleed = layout === "edge" || layout === "fullscreen";
      const coverEdge = bleed ? getCoverEdgeStyle(block.data) : "none";
      const edgeMask = coverEdgeMaskStyle(coverEdge);
      const textColor = hasMedia ? "#ffffff" : color;
      const textAlign = posX === "left" ? "left" : posX === "right" ? "right" : "center";
      const titleStyle = block.data.titleStyle as TextElementStyle | undefined;
      const hostsStyle = block.data.hostsStyle as TextElementStyle | undefined;
      const greetingStyle = block.data.greetingStyle as TextElementStyle | undefined;
      const coverHeight = fullScreen
        ? preview
          ? EDITOR_VIEWPORT_HEIGHT
          : "100dvh"
        : (block.style.imageHeight ?? 256);

      const imageAnim = (block.data.imageAnimation as BlockAnimation) ?? "fade";
      const textAnim = (block.data.textAnimation as BlockAnimation) ?? "fade";
      const imageDelayMs = (block.data.imageAnimationDelay as number) ?? 0;
      const textDelayMs = (block.data.textAnimationDelay as number) ?? 200;
      const imageDurationMs = (block.data.imageAnimationDuration as number) ?? 550;
      const textDurationMs = (block.data.textAnimationDuration as number) ?? 550;
      const replay = animationReplayKey ?? 0;
      const canDragText = Boolean(preview && onUpdateData);
      const musicUrl = event.backgroundMusicUrl?.trim() || "";
      const showMusicPlayer = block.data.showMusicPlayer === true && Boolean(musicUrl);
      const musicOffset = resolveMusicOffset(block.data);
      const musicStyle = parseMusicPlayerStyle(block.data.musicPlayerStyle);
      const musicTitle = (block.data.musicTitle as string) ?? "";
      const musicArtist = (block.data.musicArtist as string) ?? "";
      const musicLoop = block.data.musicLoop !== false;
      const canDragMusic = Boolean(preview && onUpdateData && showMusicPlayer);

      const musicPlayerNode = showMusicPlayer ? (
        <DraggableCoverText
          offset={musicOffset}
          enabled={canDragMusic}
          onOffsetChange={
            onUpdateData
              ? (o) =>
                  onUpdateData({
                    musicOffsetX: Math.round(o.x * 10) / 10,
                    musicOffsetY: Math.round(o.y * 10) / 10,
                  })
              : undefined
          }
          className="z-30"
        >
          <CoverMusicPlayer
            src={musicUrl}
            title={musicTitle}
            artist={musicArtist}
            style={musicStyle}
            loop={musicLoop}
            autoPlay={!preview}
          />
          {canDragMusic && selected && (
            <p className="mt-1 text-center text-[10px] font-medium tracking-wide text-white/70">
              Перетягніть плеєр
            </p>
          )}
        </DraggableCoverText>
      ) : null;

      const titleText = event.title?.trim() ?? "";
      const hostsText = event.hostNames?.trim() ?? "";
      const showHostsLine = block.data.showHosts !== false && Boolean(hostsText);
      // Avoid duplicate lines when title was synced from host names
      const showTitleLine =
        block.data.showTitle !== false && Boolean(titleText) && !(showHostsLine && titleText === hostsText);

      const textInner = (
        <div className="w-full min-w-[12rem] max-w-[min(100%,22rem)] px-3 py-2" style={{ textAlign }}>
          {showTitleLine && (
            <h1
              className="overflow-hidden text-ellipsis whitespace-nowrap"
              style={textElementCss(titleStyle, {
                fontSize: block.style.fontSize ?? 36,
                color: textColor,
                fontFamily: block.style.fontFamily ?? "cormorant",
              })}
            >
              {titleText}
            </h1>
          )}
          {showHostsLine && (
            <p
              className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap"
              style={textElementCss(hostsStyle, { fontSize: 16, color: textColor, fontFamily: "sans" })}
            >
              {hostsText}
            </p>
          )}
          {greeting && (
            <p
              className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap"
              style={textElementCss(greetingStyle, { fontSize: 14, color: textColor, fontFamily: "sans" })}
            >
              {greeting}
            </p>
          )}
          {canDragText && selected && (
            <p className="mt-1 text-center text-[10px] font-medium tracking-wide text-white/70">
              Перетягніть текст
            </p>
          )}
        </div>
      );

      const textBlock = (
        <motion.div
          key={`text-${replay}`}
          {...motionFromAnimation(textAnim, {
            delayMs: textDelayMs,
            durationMs: textDurationMs,
            preview,
          })}
        >
          {textInner}
        </motion.div>
      );

      if (!hasMedia) {
        if (fullScreen || bleed) {
          return wrap(
            <div
              className="relative overflow-hidden"
              style={{
                width: "100%",
                height: fullScreen ? coverHeight : (block.style.imageHeight ?? 256),
                backgroundColor: theme.backgroundColor,
                ...edgeMask,
              }}
            >
              <DraggableCoverText
                offset={textOffset}
                enabled={canDragText}
                onOffsetChange={
                  onUpdateData
                    ? (o) => onUpdateData({ textOffsetX: o.x, textOffsetY: o.y })
                    : undefined
                }
              >
                {textBlock}
              </DraggableCoverText>
              {musicPlayerNode}
            </div>,
          );
        }
        return wrap(
          <>
            {textBlock}
            {musicPlayerNode ? (
              <div className="relative mt-4 min-h-[5rem]">
                {musicPlayerNode}
              </div>
            ) : null}
          </>,
        );
      }

      const gradientClass =
        textOffset.y < 35
          ? "absolute inset-0 bg-gradient-to-b from-black/50 to-transparent"
          : textOffset.y > 65
            ? "absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
            : "absolute inset-0 bg-black/25";

      return wrap(
        <div
          className="relative overflow-hidden"
          style={{
            ...imageContainerStyle({
              ...block.style,
              imageWidth: 100,
              imageHeight: typeof coverHeight === "number" ? coverHeight : undefined,
              borderRadius: bleed ? 0 : block.style.borderRadius,
            }),
            height: coverHeight,
            width: "100%",
            ...edgeMask,
          }}
        >
          <motion.div
            key={`img-${replay}`}
            className="absolute inset-0"
            style={{ backgroundColor: coverFill === "color" ? fillColor : undefined }}
            {...motionFromAnimation(imageAnim, {
              delayMs: imageDelayMs,
              durationMs: imageDurationMs,
              preview,
            })}
          >
            {cover && (
              <Image
                src={cover}
                alt={event.title}
                fill
                className={imageFitClass(block.style.objectFit)}
                style={{ objectPosition: objectPositionToCss(block.style.objectPosition) }}
                priority={fullScreen}
              />
            )}
            {(cover || coverFill === "color") && <div className={gradientClass} />}
          </motion.div>
          <DraggableCoverText
            offset={textOffset}
            enabled={canDragText}
            onOffsetChange={
              onUpdateData
                ? (o) => onUpdateData({ textOffsetX: Math.round(o.x * 10) / 10, textOffsetY: Math.round(o.y * 10) / 10 })
                : undefined
            }
          >
            {textBlock}
          </DraggableCoverText>
          {musicPlayerNode}
        </div>,
      );
    }

    case "monogram":
      return wrap(
        <Monogram
          text={(block.data.text as string) || ctx.monogram}
          color={color}
          fontFamily={ff}
          fontWeight={block.style.fontWeight ?? 400}
          fontSize={block.style.fontSize}
        />,
      );

    case "heading":
      return wrap(
        <h2
          style={{
            fontFamily: ff,
            fontSize: block.style.fontSize ?? 28,
            color,
            fontWeight: block.style.fontWeight ?? 400,
          }}
        >
          {getBlockBoundText(block, event) ?? (block.data.text as string) ?? ""}
        </h2>,
      );

    case "text":
      return wrap(
        <p
          className="whitespace-pre-wrap leading-relaxed"
          style={{
            fontFamily: ff,
            fontSize: block.style.fontSize,
            color,
            fontWeight: block.style.fontWeight ?? 400,
          }}
        >
          {getBlockBoundText(block, event) ?? (block.data.text as string) ?? ""}
        </p>,
      );

    case "image": {
      const coverFill = (block.data.coverFill as "image" | "color") ?? "image";
      const url = block.data.url as string;
      const edgeToEdge = isEdgeToEdgeMedia(block);
      const imgBox = {
        ...imageContainerStyle(
          edgeToEdge ? { ...block.style, imageWidth: 100, borderRadius: 0 } : block.style,
        ),
        height: block.style.imageHeight ?? 240,
        ...(edgeToEdge ? { width: "100%", maxWidth: "none", marginLeft: 0, marginRight: 0 } : null),
      };

      if (coverFill === "color") {
        return wrap(
          <div
            className="relative overflow-hidden"
            style={{
              ...imgBox,
              backgroundColor: block.style.backgroundColor ?? theme.primaryColor,
            }}
          />,
        );
      }

      if (!isValidImageSrc(url)) {
        return wrap(
          <div className="rounded-xl border border-dashed border-border py-12 text-sm text-muted-foreground">
            Завантажте фото або оберіть колір
          </div>,
        );
      }
      return wrap(
        <div className="relative overflow-hidden" style={imgBox}>
          <Image
            src={url}
            alt={(block.data.alt as string) ?? ""}
            fill
            sizes={`${INVITE_CONTENT_MAX_WIDTH}px`}
            className={imageFitClass(block.style.objectFit)}
            style={{ objectPosition: objectPositionToCss(block.style.objectPosition) }}
          />
        </div>,
      );
    }

    case "icon": {
      const Icon = ICONS[(block.data.icon as string) ?? "heart"] ?? Heart;
      return wrap(
        <div className="flex flex-col items-center gap-1">
          <Icon className="h-6 w-6" style={{ color: theme.primaryColor }} />
          <span
            style={{
              fontFamily: ff,
              fontSize: block.style.fontSize,
              color,
              fontWeight: block.style.fontWeight ?? 400,
            }}
          >
            {block.data.label as string}
          </span>
        </div>,
      );
    }

    case "button": {
      const label = ((block.data.label as string) || "Кнопка").trim();
      const href = normalizeBlockLink(block.data.url);
      const openInNewTab = block.data.openInNewTab !== false;
      const fullWidth = block.data.fullWidth === true;
      const borderW = Math.max(0, Number(block.style.borderWidth) || 0);
      const bg =
        block.style.backgroundColor === "transparent"
          ? "transparent"
          : (block.style.backgroundColor ?? theme.primaryColor);
      const borderColor =
        block.style.borderColor && block.style.borderColor !== "transparent"
          ? block.style.borderColor
          : bg === "transparent"
            ? (block.style.color ?? "#ffffff")
            : bg;
      const radius = Number(block.style.borderRadius);
      const resolvedRadius = Number.isFinite(radius) ? radius : 12;
      // Inset shadow draws the stroke inside the box so parent overflow can't clip it
      const stroke =
        borderW > 0 ? `inset 0 0 0 ${borderW}px ${borderColor}` : undefined;
      const btnStyle: CSSProperties = {
        display: fullWidth ? "flex" : "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        // Hug label text — never squeeze it into wrapping/clipping
        width: fullWidth ? "100%" : "max-content",
        maxWidth: "100%",
        minWidth: fullWidth ? 0 : "max-content",
        fontFamily: ff,
        fontSize: block.style.fontSize ?? 15,
        fontWeight: block.style.fontWeight ?? 600,
        lineHeight: 1.2,
        color: block.style.color ?? "#ffffff",
        backgroundColor: bg,
        borderRadius: resolvedRadius,
        border: "none",
        boxShadow: stroke,
        paddingTop: Math.max(block.style.paddingTop ?? 12, borderW + 8),
        paddingBottom: Math.max(block.style.paddingBottom ?? 12, borderW + 8),
        paddingLeft: Math.max(block.style.paddingLeft ?? 24, 20),
        paddingRight: Math.max(block.style.paddingRight ?? 24, 20),
        textDecoration: "none",
        textAlign: "center",
        whiteSpace: "nowrap",
        overflow: "visible",
        WebkitAppearance: "none",
        outline: "none",
      };
      const align =
        block.style.textAlign === "left"
          ? "flex-start"
          : block.style.textAlign === "right"
            ? "flex-end"
            : "center";

      return wrap(
        <div
          className="flex w-full overflow-visible"
          style={{
            justifyContent: fullWidth ? "stretch" : align,
            paddingTop: Math.max(2, borderW),
            paddingBottom: Math.max(2, borderW),
          }}
        >
          {href && !preview ? (
            <a
              href={href}
              target={openInNewTab ? "_blank" : undefined}
              rel={openInNewTab ? "noopener noreferrer" : undefined}
              style={btnStyle}
            >
              {label}
            </a>
          ) : (
            <span
              role="link"
              style={{ ...btnStyle, cursor: preview ? "default" : "pointer", opacity: href ? 1 : 0.7 }}
              title={preview ? (href ?? "Додайте посилання") : undefined}
            >
              {label}
            </span>
          )}
        </div>,
      );
    }

    case "countdown":
      return wrap(
        <AnimatedCountdown
          targetDate={event.eventDate}
          style={(block.data.style as "elegant" | "cards" | "inline") ?? theme.countdownStyle}
          locale={theme.locale}
          textColor={color}
          accentColor={theme.accentColor}
          fontFamily={ff}
          fontSize={block.style.fontSize}
          fontWeight={block.style.fontWeight ?? 400}
          showLabels={block.data.showLabels !== false}
        />,
      );

    case "calendar":
      return wrap(
        <CalendarWidget
          eventDate={event.eventDate}
          locale={theme.locale}
          accentColor={theme.primaryColor}
          markerColor={(block.data.dateMarkerColor as string) || theme.primaryColor}
          eventDayColor={
            (block.data.eventDayColor as string) ||
            (block.data.dateMarkerColor as string) ||
            theme.primaryColor
          }
          textColor={color}
          fontFamily={ff}
          monthFontFamily={fontFamilyCss(block.style.monthFontFamily ?? block.style.fontFamily)}
          fontWeight={block.style.fontWeight ?? 400}
          fontSize={block.style.fontSize ?? 16}
          dateMarker={(block.data.dateMarker as string) ?? "ring-classic"}
          customSvg={(block.data.dateMarkerSvg as string) ?? null}
          markerAnimation={
            (block.data.dateMarkerAnimation as CalendarMarkerAnimation | undefined) ?? "fade"
          }
        />,
      );

    case "details":
      return wrap(
        <GlassCard
          opacity={theme.glassOpacity}
          className="space-y-3 p-4"
          disableMotion
          style={{ fontFamily: ff, fontWeight: block.style.fontWeight ?? 400, color }}
        >
          <div className="flex items-start justify-center gap-2">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0" style={{ color: theme.primaryColor }} />
            <div>
              <p className="font-medium">{format(new Date(event.eventDate), "EEEE, d MMMM yyyy", { locale: dateLocale })}</p>
              <p className="flex items-center gap-1 text-sm opacity-70">
                <Clock className="h-3 w-3" /> {format(new Date(event.eventDate), "HH:mm")}
              </p>
            </div>
          </div>
          {(event.venueName || event.venueAddress) && (
            <div className="flex items-start justify-center gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: theme.primaryColor }} />
              <div>
                {event.venueName && <p className="font-medium">{event.venueName}</p>}
                {event.venueAddress && <p className="text-sm opacity-70">{event.venueAddress}</p>}
              </div>
            </div>
          )}
        </GlassCard>,
      );

    case "gallery": {
      const images = event.media.length > 0 ? event.media : ctx.coverImageUrl ? [{ id: "c", url: ctx.coverImageUrl, altText: null }] : [];
      if (!images.length) return wrap(<div className="py-8 text-sm text-muted-foreground">Ще немає фото</div>);
      return wrap(
        <PhotoCarousel
          images={images}
          height={block.style.imageHeight ?? 320}
          width={block.style.imageWidth ?? 100}
          borderRadius={block.style.borderRadius ?? 24}
          objectFit={block.style.objectFit}
          objectPosition={block.style.objectPosition}
          align={block.style.textAlign}
          rotation={block.style.imageRotation}
        />,
      );
    }

    case "dressCode": {
      const colors = ((block.data.colors as string[] | undefined) ?? []).filter(Boolean);
      const label = event.dressCode?.trim();
      const rowSizes = parseColorRows(block.data.colorRows, colors.length);
      if (!colors.length && !label) {
        if (preview) {
          return wrap(
            <div className="rounded-xl border border-dashed border-border py-4 text-sm text-muted-foreground">
              Дрес-код — додайте кольори зліва
            </div>,
          );
        }
        return null;
      }
      return wrap(
        <div
          className="flex flex-col items-center gap-3"
          style={{
            fontFamily: ff,
            fontWeight: block.style.fontWeight ?? 400,
            fontSize: block.style.fontSize,
            color,
          }}
        >
          {label && (
            <p className="text-center leading-snug">
              {theme.locale === "uk" ? "Дрес-код" : "Dress code"}
              {label ? `: ${label}` : ""}
            </p>
          )}
          {colors.length > 0 && (
            <DressCodeColors
              colors={colors}
              rowSizes={rowSizes}
              shape={parseColorShape(block.data.colorShape)}
              size={Math.max(16, Math.min(120, (block.data.colorSize as number) ?? 44))}
              preview={preview}
              staggerMs={(block.data.colorStaggerMs as number) ?? 120}
              durationMs={block.animationDuration ?? 550}
              replayKey={animationReplayKey ?? 0}
            />
          )}
        </div>,
      );
    }

    case "schedule": {
      const fromBlock = parseDayProgramItems(block.data.items);
      const fromEvent = ((event.schedule as { id: string; time: string; title: string }[] | null) ?? []).map(
        (s): DayProgramItem => ({
          id: s.id,
          title: s.title,
          time: s.time,
          icon: "star",
        }),
      );
      const items = fromBlock.length ? fromBlock : fromEvent;
      if (!items.length) {
        if (preview) {
          return wrap(
            <div className="rounded-xl border border-dashed border-border py-4 text-sm text-muted-foreground">
              Програма дня — додайте пункти зліва
            </div>,
          );
        }
        return null;
      }
      const surface =
        block.style.backgroundColor && block.style.backgroundColor !== "transparent"
          ? block.style.backgroundColor
          : sectionSurface || theme.backgroundColor;
      return wrap(
        <DayProgramTimeline
          items={items}
          color={color}
          iconColor={block.style.iconColor || color}
          fontFamily={ff}
          fontWeight={block.style.fontWeight ?? 400}
          fontSize={block.style.fontSize ?? 16}
          itemGap={
            typeof block.data.itemGap === "number"
              ? block.data.itemGap
              : undefined
          }
          surfaceColor={surface}
        />,
      );
    }

    case "divider":
      return wrap(
        <div className="flex justify-center">
          {(block.data.variant as string) === "dots" ? (
            <span className="tracking-[0.5em] opacity-40">• • •</span>
          ) : (
            <div className="h-px w-24 bg-current opacity-20" style={{ color }} />
          )}
        </div>,
      );

    case "spacer":
      return wrap(<div style={{ height: block.data.height as number }} />);

    case "rsvp":
      if (preview) {
        return wrap(
          <RsvpFormPreview theme={theme} block={block} questions={event.questions} />,
        );
      }
      return null;

    case "section": {
      const children = getSectionChildren(block);
      const bg = block.style.backgroundColor ?? "#6b7280";
      const frameProps = {
        backgroundColor: bg,
        topEdge: getTopEdgeStyle(block.data),
        bottomEdge: getBottomEdgeStyle(block.data),
        style: block.style,
        theme,
      };
      const inner =
        sectionChildrenSlot ??
        (children.length === 0 ? (
          <p className="py-6 text-center text-sm opacity-70" style={{ color: block.style.color ?? "#fff" }}>
            {sectionDroppable
              ? "Перетягніть блок сюди або додайте зі списку"
              : "Порожня секція — додайте блоки всередину"}
          </p>
        ) : (
          children.map((child) => (
            <BlockRenderer
              key={child.id}
              block={child}
              event={event}
              ctx={ctx}
              selected={selectedBlockId === child.id}
              selectedBlockId={selectedBlockId}
              onSelect={onSelect}
              preview={preview}
              animationReplayKey={selectedBlockId === child.id ? animationReplayKey : undefined}
              inSection
            />
          ))
        ));

      return wrap(
        sectionDroppable ? (
          <SectionDropFrame
            sectionId={block.id}
            dropActive={activeSectionDropId === block.id}
            {...frameProps}
          >
            {inner}
          </SectionDropFrame>
        ) : (
          <SectionFrame {...frameProps}>{inner}</SectionFrame>
        ),
      );
    }

    default:
      return null;
  }
}
