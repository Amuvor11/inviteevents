import { prisma } from "@/lib/prisma";
import { computeEventAnalytics } from "@/lib/analytics/event-stats";
import { assertEventOwner } from "./event.service";
import type { DashboardAnalytics, EventAnalytics } from "@/types/analytics";

const groupInclude = {
  guests: true,
  response: true,
} as const;

export async function getEventAnalytics(eventId: string, userId: string): Promise<EventAnalytics> {
  await assertEventOwner(eventId, userId);

  const groups = await prisma.guestGroup.findMany({
    where: { eventId },
    include: groupInclude,
  });

  return computeEventAnalytics(groups);
}

export async function getDashboardAnalytics(userId: string): Promise<DashboardAnalytics> {
  const events = await prisma.event.findMany({
    where: { userId, deletedAt: null },
    include: {
      guestGroups: { include: groupInclude },
    },
  });

  const now = new Date();
  let totalInvitations = 0;
  let totalInvitedAttendees = 0;
  let totalRsvpResponses = 0;
  let totalConfirmedAttendees = 0;
  let totalAdultsAttending = 0;
  let totalChildrenAttending = 0;

  for (const event of events) {
    const analytics = computeEventAnalytics(event.guestGroups);
    totalInvitations += analytics.totalInvitations;
    totalInvitedAttendees += analytics.totalInvitedAttendees;
    totalRsvpResponses += analytics.totalRsvpResponses;
    totalConfirmedAttendees += analytics.totalConfirmedAttendees;
    totalAdultsAttending += analytics.totalAdultsAttending;
    totalChildrenAttending += analytics.totalChildrenAttending;
  }

  return {
    totalEvents: events.length,
    totalInvitations,
    totalInvitedAttendees,
    totalRsvpResponses,
    totalConfirmedAttendees,
    totalAdultsAttending,
    totalChildrenAttending,
    responseRate:
      totalInvitations > 0 ? Math.round((totalRsvpResponses / totalInvitations) * 100) : 0,
    attendanceRate:
      totalInvitedAttendees > 0
        ? Math.round((totalConfirmedAttendees / totalInvitedAttendees) * 100)
        : 0,
    upcomingEvents: events.filter((e) => e.eventDate > now && e.status === "PUBLISHED").length,
  };
}
