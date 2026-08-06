import type { QuestionType } from "@prisma/client";

/** Per-event attendance & RSVP metrics (people-aware, not just group counts). */
export interface EventAnalytics {
  totalInvitations: number;
  totalInvitedAttendees: number;
  totalRsvpResponses: number;
  totalConfirmedAttendees: number;
  totalDeclinedAttendees: number;
  totalMaybeAttendees: number;
  totalPendingAttendees: number;
  totalAdultsAttending: number;
  totalChildrenAttending: number;
  totalAttendees: number;
  responseRate: number;
  attendanceRate: number;
  totalGroups: number;
  totalResponses: number;
  attendingGroups: number;
  notAttendingGroups: number;
  maybeGroups: number;
  pendingGroups: number;
  totalAttendingPeople: number;
}

export interface DashboardAnalytics {
  totalEvents: number;
  totalInvitations: number;
  totalInvitedAttendees: number;
  totalRsvpResponses: number;
  totalConfirmedAttendees: number;
  totalAdultsAttending: number;
  totalChildrenAttending: number;
  responseRate: number;
  attendanceRate: number;
  upcomingEvents: number;
}

export interface QuestionAnalytics {
  questionId: string;
  title: string;
  type: QuestionType;
  totalAnswers: number;
  totalEligible: number;
  responseRate: number;
  optionBreakdown?: OptionBreakdown[];
  textResponses?: TextAnswerSample[];
  numberStats?: NumberStats;
  chartData: ChartDataPoint[];
}

export interface OptionBreakdown {
  optionId: string | null;
  label: string;
  count: number;
  percentage: number;
}

export interface TextAnswerSample {
  groupName: string;
  guestName: string;
  value: string;
  respondedAt: string;
}

export interface NumberStats {
  min: number;
  max: number;
  avg: number;
  count: number;
}

export interface ChartDataPoint {
  label: string;
  count: number;
  percentage: number;
  fill?: string;
}

export interface SurveyAnalyticsSummary {
  eventId: string;
  totalQuestions: number;
  totalEligibleGroups: number;
  questions: QuestionAnalytics[];
}

export type ExportType = "guests" | "rsvp" | "survey";
