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
