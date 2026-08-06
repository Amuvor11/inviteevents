import { prisma } from "@/lib/prisma";
import { assertEventOwner } from "./event.service";
import type { ExportType } from "@/types/analytics";

function escapeCsv(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export async function exportGuestListCsv(eventId: string, userId: string): Promise<string> {
  await assertEventOwner(eventId, userId);

  const groups = await prisma.guestGroup.findMany({
    where: { eventId },
    include: {
      guests: { orderBy: { sortOrder: "asc" } },
      response: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return toCsv(
    [
      "Group Name",
      "Attendee Count",
      "Guest Name",
      "Email",
      "Phone",
      "Attendee Type",
      "Is Primary",
      "Invite Status",
      "RSVP Status",
      "RSVP Message",
      "Responded At",
    ],
    groups.flatMap((group) =>
      group.guests.map((guest) => [
        group.groupName ?? "",
        group.attendeeCount,
        guest.name,
        guest.email ?? "",
        guest.phone ?? "",
        guest.attendeeType,
        guest.isPrimary ? "Yes" : "No",
        group.inviteStatus,
        group.response?.response ?? "NO_RESPONSE",
        group.response?.message ?? "",
        group.response?.respondedAt?.toISOString() ?? "",
      ])
    )
  );
}

export async function exportRsvpResponsesCsv(eventId: string, userId: string): Promise<string> {
  await assertEventOwner(eventId, userId);

  const groups = await prisma.guestGroup.findMany({
    where: { eventId },
    include: {
      guests: { orderBy: { sortOrder: "asc" } },
      response: true,
      primaryGuest: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return toCsv(
    [
      "Group Name",
      "Primary Guest",
      "Attendee Count",
      "Adults",
      "Children",
      "RSVP Status",
      "Message",
      "Dietary Restrictions",
      "Responded At",
      "All Attendees",
    ],
    groups.map((group) => {
      const adults = group.guests.filter((g) => g.attendeeType === "ADULT").length;
      const children = group.guests.filter((g) => g.attendeeType === "CHILD").length;
      const primary = group.primaryGuest?.name ?? group.guests.find((g) => g.isPrimary)?.name ?? "";
      return [
        group.groupName ?? primary,
        primary,
        group.attendeeCount,
        adults,
        children,
        group.response?.response ?? "NO_RESPONSE",
        group.response?.message ?? "",
        group.response?.dietaryRestrictions ?? "",
        group.response?.respondedAt?.toISOString() ?? "",
        group.guests.map((g) => `${g.name} (${g.attendeeType})`).join("; "),
      ];
    })
  );
}

export async function exportSurveyAnswersCsv(eventId: string, userId: string): Promise<string> {
  await assertEventOwner(eventId, userId);

  const answers = await prisma.guestAnswer.findMany({
    where: { eventId },
    include: {
      question: true,
      option: true,
      guest: true,
      group: { include: { guests: true, response: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rowMap = new Map<string, Record<string, unknown>>();

  for (const answer of answers) {
    const key = `${answer.groupId}:${answer.questionId}`;
    const groupName =
      answer.group.groupName ??
      answer.group.guests.find((g) => g.isPrimary)?.name ??
      "Guest";
    const primaryGuest = answer.guest?.name ?? answer.group.guests.find((g) => g.isPrimary)?.name ?? "";

    if (!rowMap.has(key)) {
      rowMap.set(key, {
        groupName,
        primaryGuest,
        questionTitle: answer.question.title,
        questionType: answer.question.type,
        rsvpStatus: answer.group.response?.response ?? "NO_RESPONSE",
        respondedAt: answer.group.response?.respondedAt?.toISOString() ?? answer.createdAt.toISOString(),
        values: [] as string[],
      });
    }

    const row = rowMap.get(key)!;
    const values = row.values as string[];

    if (answer.textValue) values.push(answer.textValue);
    else if (answer.numberValue != null) values.push(String(answer.numberValue));
    else if (answer.boolValue != null) values.push(answer.boolValue ? "Yes" : "No");
    else if (answer.option) values.push(answer.option.label);
  }

  return toCsv(
    ["Group Name", "Primary Guest", "Question", "Question Type", "Answer(s)", "RSVP Status", "Responded At"],
    Array.from(rowMap.values()).map((row) => [
      row.groupName,
      row.primaryGuest,
      row.questionTitle,
      row.questionType,
      (row.values as string[]).join("; "),
      row.rsvpStatus,
      row.respondedAt,
    ])
  );
}

export async function exportEventData(
  eventId: string,
  userId: string,
  type: ExportType
): Promise<{ csv: string; filename: string }> {
  const filenames: Record<ExportType, string> = {
    guests: `guests-${eventId}.csv`,
    rsvp: `rsvp-responses-${eventId}.csv`,
    survey: `survey-answers-${eventId}.csv`,
  };

  const exporters: Record<ExportType, () => Promise<string>> = {
    guests: () => exportGuestListCsv(eventId, userId),
    rsvp: () => exportRsvpResponsesCsv(eventId, userId),
    survey: () => exportSurveyAnswersCsv(eventId, userId),
  };

  const csv = await exporters[type]();
  return { csv, filename: filenames[type] };
}
