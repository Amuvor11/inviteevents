"use client";

import Image from "next/image";
import { format } from "date-fns";
import { uk, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin } from "lucide-react";
import type { ScheduleItem } from "@/types";
import { AnimatedCountdown } from "@/components/invite/animated-countdown";
import { CalendarWidget } from "@/components/invite/calendar-widget";
import { GlassCard } from "@/components/invite/glass-card";
import { PhotoCarousel } from "@/components/invite/photo-carousel";
import { CoverMusicPlayer } from "@/components/invite/cover-music-player";
import { RsvpSection } from "@/components/invite/rsvp-section";
import { SectionReveal } from "@/components/invite/section-reveal";
import type { InviteLayoutProps } from "./types";
import { EVENT_TYPE_LABELS } from "@/lib/i18n/uk";

export function ClassicLayout(props: InviteLayoutProps) {
  const { event, ctx } = props;
  const { theme, invitationMessage, coverImageUrl, isSectionVisible, greeting, personalNote } = ctx;
  const layout = event.template?.layout ?? "classic";
  const isMinimal = layout === "minimal";
  const dateLocale = theme.locale === "uk" ? uk : enUS;
  const isUk = theme.locale === "uk";

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="relative">
        {event.coverImageUrl && isSectionVisible("hero") && (
          <div className="relative h-64 sm:h-96">
            <Image src={coverImageUrl ?? event.coverImageUrl!} alt={event.title} fill className="object-cover" priority />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, ${theme.backgroundColor}, transparent 60%)`,
              }}
            />
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-10 text-center ${event.coverImageUrl ? "absolute bottom-0 left-0 right-0" : ""}`}
          style={{ color: event.coverImageUrl ? "#fff" : theme.textColor }}
        >
          <p className="text-sm uppercase tracking-widest opacity-80">
            {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType.replace("_", " ")}
          </p>
          <h1
            className={`mt-2 font-bold ${isMinimal ? "text-3xl" : "text-4xl sm:text-5xl"}`}
            style={{ fontFamily: isMinimal ? theme.fontFamily : theme.serifFontFamily }}
          >
            {event.title}
          </h1>
          {ctx.guest && (
            <p className="mt-2 text-sm opacity-90">{greeting}</p>
          )}
          {event.hostNames && <p className="mt-3 text-lg opacity-90">{isUk ? "Організатори:" : "Hosted by"} {event.hostNames}</p>}
        </motion.div>
      </div>

      <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
        {isSectionVisible("countdown") && (
          <SectionReveal>
            <GlassCard opacity={theme.glassOpacity} className="p-6">
              <AnimatedCountdown
                targetDate={event.eventDate}
                style={theme.countdownStyle}
                locale={theme.locale}
                textColor={theme.textColor}
                accentColor={theme.primaryColor}
              />
            </GlassCard>
          </SectionReveal>
        )}

        {isSectionVisible("calendar") && theme.showCalendar && (
          <SectionReveal delay={0.1}>
            <GlassCard opacity={theme.glassOpacity} className="p-6">
              <CalendarWidget
                eventDate={event.eventDate}
                locale={theme.locale}
                accentColor={theme.primaryColor}
              />
            </GlassCard>
          </SectionReveal>
        )}

        {isSectionVisible("details") && (
          <SectionReveal delay={0.15}>
            <GlassCard opacity={theme.glassOpacity} className="space-y-4 p-6">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5" style={{ color: theme.primaryColor }} />
                <div style={{ color: theme.textColor }}>
                  <p className="font-medium">{format(new Date(event.eventDate), "EEEE, d MMMM yyyy", { locale: dateLocale })}</p>
                  <p className="flex items-center gap-1 text-sm opacity-70">
                    <Clock className="h-3 w-3" /> {format(new Date(event.eventDate), "HH:mm")}
                  </p>
                </div>
              </div>
              {(event.venueName || event.venueAddress) && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5" style={{ color: theme.primaryColor }} />
                  <div style={{ color: theme.textColor }}>
                    {event.venueName && <p className="font-medium">{event.venueName}</p>}
                    {event.venueAddress && <p className="text-sm opacity-70">{event.venueAddress}</p>}
                    {event.googleMapsLink && (
                      <a
                        href={event.googleMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm underline"
                        style={{ color: theme.primaryColor }}
                      >
                        {isUk ? "Відкрити на Google Maps" : "View on Google Maps"}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </GlassCard>
          </SectionReveal>
        )}

        {isSectionVisible("message") && invitationMessage && (
          <SectionReveal delay={0.2}>
            <GlassCard opacity={theme.glassOpacity} className="p-6">
              {ctx.guest && (
                <p className="mb-3 text-center text-sm uppercase tracking-widest opacity-70" style={{ color: theme.textColor }}>
                  {greeting}
                </p>
              )}
              <p className="whitespace-pre-wrap text-center leading-relaxed" style={{ color: theme.textColor }}>
                {invitationMessage}
              </p>
            </GlassCard>
          </SectionReveal>
        )}

        {isSectionVisible("schedule") && event.schedule && (event.schedule as ScheduleItem[]).length > 0 && (
          <SectionReveal delay={0.25}>
            <GlassCard opacity={theme.glassOpacity} className="p-6">
              <h3 className="mb-4 font-semibold" style={{ color: theme.textColor, fontFamily: theme.serifFontFamily }}>
                {isUk ? "Розклад" : "Schedule"}
              </h3>
              <div className="space-y-3">
                {(event.schedule as ScheduleItem[]).map((item) => (
                  <div key={item.id} className="flex gap-4 border-b border-black/10 pb-3 last:border-0">
                    <span className="font-mono text-sm opacity-60">{item.time}</span>
                    <div style={{ color: theme.textColor }}>
                      <p className="font-medium">{item.title}</p>
                      {item.description && <p className="text-sm opacity-70">{item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </SectionReveal>
        )}

        {isSectionVisible("dressCode") && event.dressCode && (
          <SectionReveal>
            <GlassCard opacity={theme.glassOpacity} className="p-4 text-center">
              <span className="rounded-full border px-4 py-1 text-sm" style={{ borderColor: theme.primaryColor, color: theme.textColor }}>
                {isUk ? "Дрес-код" : "Dress code"}: {event.dressCode}
              </span>
            </GlassCard>
          </SectionReveal>
        )}

        {isSectionVisible("media") && event.media.length > 0 && (
          <SectionReveal delay={0.1}>
            {event.media.length >= 2 ? (
              <PhotoCarousel images={event.media} className="px-4" />
            ) : (
              <div className="relative mx-auto aspect-square max-w-sm overflow-hidden rounded-2xl shadow-lg">
                <Image src={event.media[0].url} alt={event.media[0].altText ?? ""} fill className="object-cover" />
              </div>
            )}
          </SectionReveal>
        )}

        {isSectionVisible("additionalInfo") && event.additionalInfo && (
          <SectionReveal>
            <GlassCard opacity={theme.glassOpacity} className="p-6">
              <p className="whitespace-pre-wrap text-sm opacity-80" style={{ color: theme.textColor }}>
                {event.additionalInfo}
              </p>
            </GlassCard>
          </SectionReveal>
        )}

        {isSectionVisible("music") && event.backgroundMusicUrl && (
          <div className="flex justify-center">
            <CoverMusicPlayer
              src={event.backgroundMusicUrl}
              title={isUk ? "Фонова музика" : "Background music"}
              style="pill"
              loop
              autoPlay
            />
          </div>
        )}

        {personalNote && (
          <SectionReveal>
            <GlassCard opacity={theme.glassOpacity} className="p-4 text-center">
              <p className="text-sm italic opacity-80" style={{ color: theme.textColor }}>{personalNote}</p>
            </GlassCard>
          </SectionReveal>
        )}
      </div>

      <RsvpSection {...props} variant="card" />
    </div>
  );
}
