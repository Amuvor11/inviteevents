import type { ScheduleItem } from "@/types";
import type { EnvelopeIntroSettings } from "@/types";
import type { GuestInviteContext, InviteSection } from "@/types/personalization";

export type CountdownStyle = "cards" | "elegant" | "inline";
export type InviteLocale = "en" | "uk";

export interface InviteTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  serifFontFamily: string;
  monogram?: string;
  showCalendar: boolean;
  countdownStyle: CountdownStyle;
  locale: InviteLocale;
  glassOpacity: number;
  backgroundOverlay: number;
  pagePaddingTop?: number;
  pagePaddingBottom?: number;
  pagePaddingLeft?: number;
  pagePaddingRight?: number;
  blockGap?: number;
  envelopeIntro?: EnvelopeIntroSettings;
}

export interface PublicInviteEvent {
  id: string;
  slug: string;
  title: string;
  hostNames: string | null;
  eventType: string;
  eventDate: string;
  venueName: string | null;
  venueAddress: string | null;
  invitationMessage: string | null;
  additionalInfo: string | null;
  dressCode: string | null;
  schedule: ScheduleItem[] | null;
  googleMapsLink: string | null;
  backgroundMusicUrl: string | null;
  coverImageUrl: string | null;
  rsvpClosed: boolean;
  customTheme: (Partial<InviteTheme> & { hiddenSections?: InviteSection[] }) | null;
  template: { layout: string } | null;
  design: {
    backgroundImageUrl: string | null;
    content?: { version: number; blocks: unknown[] } | null;
  } | null;
  media: { id: string; url: string; altText: string | null }[];
  questions: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    placeholder?: string | null;
    defaultValue?: string | null;
    required: boolean;
    options: { id: string; label: string }[];
  }[];
  guest?: GuestInviteContext | null;
}

export interface RsvpAttendee {
  name: string;
  attendeeType: "ADULT" | "CHILD";
  email: string;
}
