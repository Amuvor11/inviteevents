"use client";

import Image from "next/image";
import { format } from "date-fns";
import { uk, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import { AnimatedCountdown } from "@/components/invite/animated-countdown";
import { PhotoCarousel } from "@/components/invite/photo-carousel";
import { RsvpSection } from "@/components/invite/rsvp-section";
import { SectionReveal } from "@/components/invite/section-reveal";
import type { InviteLayoutProps } from "./types";

export function ElegantLayout(props: InviteLayoutProps) {
  const { event, ctx } = props;
  const { theme, greeting, invitationMessage, backgroundImageUrl, coverImageUrl, isSectionVisible, personalNote } = ctx;
  const dateLocale = theme.locale === "uk" ? uk : enUS;
  const carouselImages =
    event.media.length > 0
      ? event.media
      : coverImageUrl
        ? [{ id: "cover", url: coverImageUrl, altText: event.title }]
        : [];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {backgroundImageUrl && isSectionVisible("hero") && (
        <div className="fixed inset-0 -z-10">
          <Image src={backgroundImageUrl} alt="" fill className="scale-110 object-cover blur-2xl" priority />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0,0,0,${theme.backgroundOverlay})` }}
          />
        </div>
      )}

      <div className="relative px-4 py-12 sm:py-16">
        {isSectionVisible("hero") && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="mb-2 text-sm uppercase tracking-[0.25em] text-white/70">{greeting}</p>
            <h1
              className="text-3xl font-light sm:text-4xl"
              style={{ fontFamily: theme.serifFontFamily, color: "#ffffff" }}
            >
              {event.title}
            </h1>
            {event.hostNames && (
              <p className="mt-2 text-sm tracking-widest text-white/70 uppercase">
                {event.hostNames}
              </p>
            )}
          </motion.div>
        )}

        {isSectionVisible("countdown") && (
          <SectionReveal className="mx-auto mt-10 max-w-xl">
            <AnimatedCountdown
              targetDate={event.eventDate}
              style="elegant"
              locale={theme.locale}
              textColor="#ffffff"
            />
          </SectionReveal>
        )}

        {isSectionVisible("media") && carouselImages.length > 0 && (
          <SectionReveal className="mx-auto mt-12 max-w-md px-8" delay={0.15}>
            <PhotoCarousel images={carouselImages} />
          </SectionReveal>
        )}

        {isSectionVisible("message") && invitationMessage && (
          <SectionReveal className="mx-auto mt-10 max-w-md text-center" delay={0.2}>
            <p className="whitespace-pre-wrap leading-relaxed text-white/90">
              {invitationMessage}
            </p>
          </SectionReveal>
        )}

        {isSectionVisible("details") && (
          <SectionReveal className="mx-auto mt-8 max-w-md space-y-3 text-center text-white/85" delay={0.25}>
            <p className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              {format(new Date(event.eventDate), "EEEE, d MMMM yyyy · HH:mm", { locale: dateLocale })}
            </p>
            {(event.venueName || event.venueAddress) && (
              <p className="flex items-start justify-center gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {event.venueName}
                  {event.venueAddress && ` · ${event.venueAddress}`}
                </span>
              </p>
            )}
            {event.googleMapsLink && (
              <a href={event.googleMapsLink} target="_blank" rel="noopener noreferrer" className="text-sm underline">
                {theme.locale === "uk" ? "Відкрити на карті" : "Open in maps"}
              </a>
            )}
          </SectionReveal>
        )}

        {isSectionVisible("dressCode") && event.dressCode && (
          <SectionReveal className="mt-6 text-center">
            <span className="rounded-full border border-white/30 px-4 py-1 text-sm text-white/80">
              {event.dressCode}
            </span>
          </SectionReveal>
        )}

        {personalNote && (
          <SectionReveal className="mx-auto mt-6 max-w-md text-center">
            <p className="text-sm italic text-white/75">{personalNote}</p>
          </SectionReveal>
        )}

        <RsvpSection {...props} variant="glass" />
      </div>
    </div>
  );
}
