import type {
  AttendeeType,
  EventStatus,
  EventType,
  GuestInviteStatus,
  QuestionType,
  RsvpResponse,
} from "@prisma/client";

export type {
  AttendeeType,
  EventStatus,
  EventType,
  GuestInviteStatus,
  QuestionType,
  RsvpResponse,
};

export type { EventAnalytics, DashboardAnalytics, QuestionAnalytics, SurveyAnalyticsSummary } from "./analytics";

import type { TextElementStyle } from "@/types/design";

export type EnvelopeIntroBlockType = "title" | "subtitle" | "cta" | "arrow" | "envelope";

export interface EnvelopeIntroBlock {
  id: string;
  type: EnvelopeIntroBlockType;
  visible?: boolean;
  /** Optional text override for title / subtitle / cta */
  text?: string;
  /** Typography for text blocks */
  textStyle?: TextElementStyle;
  /** Margin top as % of screen height (dvh) */
  marginTop?: number;
  /** Margin bottom as % of screen height (dvh) */
  marginBottom?: number;
  /** Horizontal alignment within the screen */
  align?: "left" | "center" | "right";
  /** Push this block (and following flow) toward the bottom via margin-top: auto */
  pinBottom?: boolean;
  /** @deprecated free-drag positions — ignored in layout mode */
  offsetX?: number;
  offsetY?: number;
}

export interface EnvelopeIntroSettings {
  enabled?: boolean;
  /** Auto-open invitation after N seconds (0 / unset = only on tap) */
  autoOpenSeconds?: number;
  /** Vertical packing of the block stack */
  contentAlign?: "top" | "center" | "bottom";
  /** Screen padding (px) */
  paddingTop?: number;
  paddingBottom?: number;
  paddingX?: number;
  /** @deprecated use contentAlign */
  layout?: "top" | "center" | "bottom";
  /** Ordered stacked elements on the intro screen */
  blocks?: EnvelopeIntroBlock[];
  title?: string;
  showTitle?: boolean;
  titleFont?: string;
  titleSize?: number;
  titleItalic?: boolean;
  textColor?: string;
  ctaLabel?: string;
  showCta?: boolean;
  showArrow?: boolean;
  subtitle?: string;
  showSubtitle?: boolean;
  /** Override seal initials; falls back to theme/event monogram */
  monogram?: string;
  showSeal?: boolean;
  showPlayIcon?: boolean;
  sealColor?: string;
  sealSize?: "sm" | "md" | "lg";
  backgroundColor?: string;
  backgroundImageUrl?: string;
  backgroundOverlay?: number;
  envelopeColor?: string;
  flapColor?: string;
  /** Photo shown on the envelope body */
  envelopeImageUrl?: string;
  envelopeStyle?: "classic" | "photo" | "minimal";
  envelopeWidth?: "narrow" | "normal" | "wide";
  contentGap?: number;
}

export interface CustomTheme {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  backgroundColor?: string;
  accentColor?: string;
  textColor?: string;
  serifFontFamily?: string;
  monogram?: string;
  showCalendar?: boolean;
  countdownStyle?: "cards" | "elegant" | "inline";
  locale?: "en" | "uk";
  glassOpacity?: number;
  backgroundOverlay?: number;
  pagePaddingTop?: number;
  pagePaddingBottom?: number;
  pagePaddingLeft?: number;
  pagePaddingRight?: number;
  blockGap?: number;
  envelopeIntro?: EnvelopeIntroSettings;
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  description?: string;
}

export interface AttendeeInput {
  name: string;
  attendeeType: AttendeeType;
  email?: string;
  phone?: string;
}

export interface SubmitAnswerInput {
  questionId: string;
  textValue?: string;
  numberValue?: number;
  boolValue?: boolean;
  optionId?: string;
  optionIds?: string[];
}

/** @deprecated Use EventAnalytics from ./analytics */
export interface EventStats {
  totalGroups: number;
  totalInvitedAttendees: number;
  totalResponses: number;
  attendingGroups: number;
  notAttendingGroups: number;
  maybeGroups: number;
  pendingGroups: number;
  totalAttendingPeople: number;
  totalAdultsAttending: number;
  totalChildrenAttending: number;
  attendanceRate: number;
}

export interface DashboardStats {
  totalEvents: number;
  totalGuests: number;
  totalResponses: number;
  attendanceRate: number;
  upcomingEvents: number;
}
