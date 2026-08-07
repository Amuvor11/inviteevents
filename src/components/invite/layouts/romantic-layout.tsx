"use client";

import Image from "next/image";
import { format } from "date-fns";
import { uk, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { AnimatedCountdown } from "@/components/invite/animated-countdown";
import { CalendarWidget } from "@/components/invite/calendar-widget";
import { GlassCard } from "@/components/invite/glass-card";
import { Monogram } from "@/components/invite/monogram";
import { RsvpSection } from "@/components/invite/rsvp-section";
import { SectionReveal } from "@/components/invite/section-reveal";
import type { InviteLayoutProps } from "./types";

export function RomanticLayout(props: InviteLayoutProps) {
  const { event, ctx } = props;
  const { theme, greeting, invitationMessage, monogram, backgroundImageUrl, isSectionVisible, personalNote } = ctx;

  const dateParts = theme.locale === "uk"
    ? {
        weekday: format(new Date(event.eventDate), "EEEE", { locale: uk }).toUpperCase(),
        day: format(new Date(event.eventDate), "d"),
        month: format(new Date(event.eventDate), "LLLL", { locale: uk }).toUpperCase(),
      }
    : {
        weekday: format(new Date(event.eventDate), "EEEE", { locale: enUS }).toUpperCase(),
        day: format(new Date(event.eventDate), "d"),
        month: format(new Date(event.eventDate), "MMMM", { locale: enUS }).toUpperCase(),
      };

  return (
    <div className="relative min-h-screen">
      {backgroundImageUrl && isSectionVisible("hero") && (
        <div className="fixed inset-0 -z-10">
          <Image src={backgroundImageUrl} alt="" fill className="object-cover" priority />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0,0,0,${theme.backgroundOverlay})` }}
          />
        </div>
      )}

      <div className="relative px-4 pb-8 pt-16 sm:pt-24">
        {isSectionVisible("hero") && monogram && (
          <Monogram text={monogram} color="#ffffff" className="mb-8" />
        )}

        {(isSectionVisible("message") || isSectionVisible("calendar")) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="mx-auto max-w-lg"
          >
            <GlassCard opacity={theme.glassOpacity} className="overflow-hidden p-8 sm:p-10">
              {isSectionVisible("message") && (
                <>
                  <p
                    className="text-center text-sm uppercase tracking-[0.3em]"
                    style={{ color: theme.textColor, fontFamily: theme.serifFontFamily }}
                  >
                    {greeting}
                  </p>
                  <div className="mx-auto my-4 h-px w-16 bg-current opacity-20" style={{ color: theme.textColor }} />
                </>
              )}

              {isSectionVisible("message") && invitationMessage && (
                <p
                  className="whitespace-pre-wrap text-center leading-relaxed"
                  style={{ color: theme.textColor, fontFamily: theme.fontFamily }}
                >
                  {invitationMessage}
                </p>
              )}

              {isSectionVisible("details") && (
                <div
                  className="mt-8 flex items-center justify-center gap-3 text-center"
                  style={{ fontFamily: theme.serifFontFamily, color: theme.textColor }}
                >
                  <span className="text-sm uppercase tracking-widest">{dateParts.weekday}</span>
                  <span className="text-3xl font-light">|</span>
                  <span className="text-4xl font-light">{dateParts.day}</span>
                  <span className="text-3xl font-light">|</span>
                  <span className="text-sm uppercase tracking-widest">{dateParts.month}</span>
                </div>
              )}

              {isSectionVisible("calendar") && theme.showCalendar && (
                <CalendarWidget
                  eventDate={event.eventDate}
                  locale={theme.locale}
                  accentColor={theme.primaryColor}
                  className="mt-8"
                />
              )}
            </GlassCard>
          </motion.div>
        )}

        {isSectionVisible("countdown") && (
          <SectionReveal className="mx-auto mt-10 max-w-lg px-2" delay={0.15}>
            <AnimatedCountdown
              targetDate={event.eventDate}
              style={theme.countdownStyle}
              locale={theme.locale}
              textColor="#ffffff"
              accentColor={theme.accentColor}
            />
          </SectionReveal>
        )}

        {isSectionVisible("details") && (event.venueName || event.venueAddress) && (
          <SectionReveal className="mx-auto mt-8 max-w-lg text-center text-white/90" delay={0.2}>
            <div className="flex items-start justify-center gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                {event.venueName && <p className="font-medium">{event.venueName}</p>}
                {event.venueAddress && <p className="text-sm opacity-80">{event.venueAddress}</p>}
                {event.googleMapsLink && (
                  <a href={event.googleMapsLink} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm underline">
                    {theme.locale === "uk" ? "На карті" : "View on map"}
                  </a>
                )}
              </div>
            </div>
          </SectionReveal>
        )}

        {isSectionVisible("dressCode") && event.dressCode && (
          <SectionReveal className="mx-auto mt-6 max-w-lg text-center">
            <span className="rounded-full border border-white/40 px-4 py-1.5 text-sm text-white/90">
              {theme.locale === "uk" ? "Дрес-код" : "Dress code"}: {event.dressCode}
            </span>
          </SectionReveal>
        )}

        {personalNote && (
          <SectionReveal className="mx-auto mt-6 max-w-lg text-center">
            <p className="text-sm italic text-white/80">{personalNote}</p>
          </SectionReveal>
        )}

        <RsvpSection {...props} />
      </div>
    </div>
  );
}
