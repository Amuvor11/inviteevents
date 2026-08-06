import type { InviteLocale, CountdownStyle } from "./invite";

export type InviteSection =
  | "hero"
  | "countdown"
  | "calendar"
  | "details"
  | "message"
  | "schedule"
  | "dressCode"
  | "media"
  | "additionalInfo"
  | "music"
  | "rsvp"
  | "questions";

export interface GuestGroupPersonalization {
  customGreeting?: string;
  personalMessage?: string;
  invitationMessageOverride?: string;
  accentNote?: string;
  monogram?: string;
  locale?: InviteLocale;
  showRsvp?: boolean;
  hiddenSections?: InviteSection[];
  shownSections?: InviteSection[];
  coverImageUrl?: string;
  backgroundImageUrl?: string;
  customTheme?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    monogram?: string;
    showCalendar?: boolean;
    countdownStyle?: CountdownStyle;
    locale?: InviteLocale;
    glassOpacity?: number;
    backgroundOverlay?: number;
  };
}

export interface GuestInviteContext {
  groupId: string;
  inviteToken: string;
  groupName: string | null;
  guests: { id: string; name: string; email: string | null; attendeeType: string; isPrimary: boolean }[];
  personalization: GuestGroupPersonalization | null;
}
