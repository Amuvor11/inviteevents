import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/api/errors";
import { generateInviteToken } from "@/lib/utils/token";
import { assertEventOwner } from "./event.service";
import type { CreateGuestGroupInput, UpdateGuestGroupInput } from "@/validations/guest.schema";

export async function listGuestGroups(eventId: string, userId: string) {
  await assertEventOwner(eventId, userId);
  return prisma.guestGroup.findMany({
    where: { eventId },
    include: {
      guests: { orderBy: { sortOrder: "asc" } },
      response: true,
      answers: {
        include: { question: true, option: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function createGroupWithAttendees(
  eventId: string,
  input: CreateGuestGroupInput,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
) {
  const inviteToken = generateInviteToken();
  const group = await tx.guestGroup.create({
    data: {
      eventId,
      groupName: input.groupName,
      inviteToken,
      notes: input.notes,
      personalization: input.personalization ?? undefined,
    },
  });

  let primaryId: string | undefined;
  const guests = await Promise.all(
    input.attendees.map(async (attendee, index) => {
      const guest = await tx.guest.create({
        data: {
          groupId: group.id,
          eventId,
          name: attendee.name,
          email: attendee.email || null,
          phone: attendee.phone || null,
          isPrimary: attendee.isPrimary ?? index === 0,
          attendeeType: attendee.attendeeType,
          sortOrder: index,
        },
      });
      if (attendee.isPrimary || index === 0) primaryId = guest.id;
      return guest;
    })
  );

  if (primaryId) {
    await tx.guestGroup.update({
      where: { id: group.id },
      data: { primaryGuestId: primaryId, attendeeCount: guests.length },
    });
  } else {
    await tx.guestGroup.update({
      where: { id: group.id },
      data: { attendeeCount: guests.length },
    });
  }

  return { group, guests };
}

export async function createGuestGroup(eventId: string, userId: string, input: CreateGuestGroupInput) {
  await assertEventOwner(eventId, userId);

  return prisma.$transaction(async (tx) => {
    const { group } = await createGroupWithAttendees(eventId, input, tx);
    return tx.guestGroup.findUnique({
      where: { id: group.id },
      include: { guests: true, response: true },
    });
  });
}

export async function updateGuestGroup(
  groupId: string,
  eventId: string,
  userId: string,
  input: UpdateGuestGroupInput
) {
  await assertEventOwner(eventId, userId);

  const group = await prisma.guestGroup.findFirst({ where: { id: groupId, eventId } });
  if (!group) throw new AppError("NOT_FOUND", "Групу гостей не знайдено", 404);

  return prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = {};
    if (input.groupName !== undefined) updateData.groupName = input.groupName;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.personalization !== undefined) updateData.personalization = input.personalization;
    if (input.markSent) {
      updateData.sentAt = new Date();
      updateData.inviteStatus = "SENT";
    }

    if (Object.keys(updateData).length > 0) {
      await tx.guestGroup.update({ where: { id: groupId }, data: updateData });
    }

    if (input.attendees) {
      await tx.guest.deleteMany({ where: { groupId } });
      let primaryId: string | undefined;
      for (const [index, attendee] of input.attendees.entries()) {
        const guest = await tx.guest.create({
          data: {
            groupId,
            eventId,
            name: attendee.name,
            email: attendee.email || null,
            phone: attendee.phone || null,
            isPrimary: attendee.isPrimary ?? index === 0,
            attendeeType: attendee.attendeeType ?? "ADULT",
            sortOrder: index,
          },
        });
        if (attendee.isPrimary || index === 0) primaryId = guest.id;
      }
      if (primaryId) {
        await tx.guestGroup.update({
          where: { id: groupId },
          data: { primaryGuestId: primaryId, attendeeCount: input.attendees.length },
        });
      } else if (input.attendees.length) {
        await tx.guestGroup.update({
          where: { id: groupId },
          data: { attendeeCount: input.attendees.length },
        });
      }
    }

    return tx.guestGroup.findUnique({
      where: { id: groupId },
      include: { guests: true, response: true },
    });
  });
}

export async function deleteGuestGroup(groupId: string, eventId: string, userId: string) {
  await assertEventOwner(eventId, userId);
  return prisma.guestGroup.delete({ where: { id: groupId, eventId } });
}

export function guestGroupsToCsv(
  groups: Awaited<ReturnType<typeof listGuestGroups>>
): string {
  const headers = [
    "Group",
    "Guest Name",
    "Email",
    "Phone",
    "Type",
    "RSVP Status",
    "Message",
    "Responded At",
  ];
  const rows = groups.flatMap((group) =>
    group.guests.map((guest) => [
      group.groupName ?? "",
      guest.name,
      guest.email ?? "",
      guest.phone ?? "",
      guest.attendeeType,
      group.response?.response ?? "NO_RESPONSE",
      group.response?.message ?? "",
      group.response?.respondedAt?.toISOString() ?? "",
    ])
  );
  return [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}
