import type { Guest, GuestGroup, GuestResponse, RsvpResponse } from "@prisma/client";
import type { EventAnalytics } from "@/types";

export type GroupWithGuests = GuestGroup & {
  guests: Guest[];
  response: GuestResponse | null;
};

function guestsByResponse(groups: GroupWithGuests[], response: RsvpResponse | "PENDING") {
  if (response === "PENDING") {
    return groups.filter((g) => !g.response).flatMap((g) => g.guests);
  }
  return groups
    .filter((g) => g.response?.response === response)
    .flatMap((g) => g.guests);
}

export function computeEventAnalytics(groups: GroupWithGuests[]): EventAnalytics {
  const totalInvitations = groups.length;
  const totalInvitedAttendees = groups.reduce((sum, g) => sum + g.guests.length, 0);

  const respondedGroups = groups.filter((g) => g.response);
  const totalRsvpResponses = respondedGroups.length;

  const confirmedGuests = guestsByResponse(groups, "ATTENDING");
  const declinedGuests = guestsByResponse(groups, "NOT_ATTENDING");
  const maybeGuests = guestsByResponse(groups, "MAYBE");
  const pendingGuests = guestsByResponse(groups, "PENDING");

  const totalConfirmedAttendees = confirmedGuests.length;
  const totalDeclinedAttendees = declinedGuests.length;
  const totalMaybeAttendees = maybeGuests.length;
  const totalPendingAttendees = pendingGuests.length;

  const totalAdultsAttending = confirmedGuests.filter((g) => g.attendeeType === "ADULT").length;
  const totalChildrenAttending = confirmedGuests.filter((g) => g.attendeeType === "CHILD").length;

  const responseRate =
    totalInvitations > 0 ? Math.round((totalRsvpResponses / totalInvitations) * 100) : 0;

  const attendanceRate =
    totalInvitedAttendees > 0
      ? Math.round((totalConfirmedAttendees / totalInvitedAttendees) * 100)
      : 0;

  return {
    totalInvitations,
    totalInvitedAttendees,
    totalRsvpResponses,
    totalConfirmedAttendees,
    totalDeclinedAttendees,
    totalMaybeAttendees,
    totalPendingAttendees,
    totalAdultsAttending,
    totalChildrenAttending,
    totalAttendees: totalConfirmedAttendees,
    responseRate,
    attendanceRate,
    // Legacy aliases for backward compatibility
    totalGroups: totalInvitations,
    totalResponses: totalRsvpResponses,
    attendingGroups: groups.filter((g) => g.response?.response === "ATTENDING").length,
    notAttendingGroups: groups.filter((g) => g.response?.response === "NOT_ATTENDING").length,
    maybeGroups: groups.filter((g) => g.response?.response === "MAYBE").length,
    pendingGroups: groups.filter((g) => !g.response).length,
    totalAttendingPeople: totalConfirmedAttendees,
  };
}

/** @deprecated Use computeEventAnalytics */
export const computeEventStats = computeEventAnalytics;

export function filterGroupsByResponse(
  groups: GroupWithGuests[],
  filter: "ALL" | RsvpResponse | "NO_RESPONSE"
) {
  if (filter === "ALL") return groups;
  if (filter === "NO_RESPONSE") return groups.filter((g) => !g.response);
  return groups.filter((g) => g.response?.response === filter);
}

export function searchGroups(groups: GroupWithGuests[], query: string) {
  const q = query.toLowerCase();
  return groups.filter(
    (g) =>
      g.groupName?.toLowerCase().includes(q) ||
      g.guests.some(
        (guest) =>
          guest.name.toLowerCase().includes(q) ||
          guest.email?.toLowerCase().includes(q) ||
          guest.phone?.toLowerCase().includes(q)
      )
  );
}

export function syncAttendeeCount(guestCount: number) {
  return { attendeeCount: guestCount };
}
