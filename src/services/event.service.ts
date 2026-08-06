import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/api/errors";
import { generateUniqueEventSlug } from "@/lib/utils/slug";
import { createDefaultDesign } from "@/lib/invite/blocks";
import type { CreateEventInput, UpdateEventInput } from "@/validations/event.schema";

export async function assertEventOwner(eventId: string, userId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, userId, deletedAt: null },
  });
  if (!event) throw new AppError("NOT_FOUND", "Подію не знайдено", 404);
  return event;
}

export async function listUserEvents(userId: string) {
  return prisma.event.findMany({
    where: { userId, deletedAt: null },
    include: {
      template: { select: { id: true, name: true, slug: true, layout: true } },
      guestGroups: {
        include: {
          guests: true,
          response: true,
        },
      },
      _count: { select: { media: true, questions: true } },
    },
    orderBy: { eventDate: "asc" },
  });
}

export async function getEventById(eventId: string, userId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, userId, deletedAt: null },
    include: {
      template: true,
      design: true,
      media: { orderBy: { sortOrder: "asc" } },
      questions: {
        orderBy: { sortOrder: "asc" },
        include: { options: { orderBy: { sortOrder: "asc" } } },
      },
      guestGroups: {
        include: { guests: { orderBy: { sortOrder: "asc" } }, response: true },
      },
    },
  });
  if (!event) throw new AppError("NOT_FOUND", "Подію не знайдено", 404);
  return event;
}

export async function createEvent(userId: string, input: CreateEventInput) {
  const slug = await generateUniqueEventSlug(input.title, input.eventType);
  const template = input.templateId
    ? await prisma.template.findUnique({ where: { id: input.templateId } })
    : null;
  const defaultDesign = createDefaultDesign({
    title: input.title,
    hostNames: input.hostNames,
    invitationMessage: input.invitationMessage,
    template: template ? { layout: template.layout } : null,
  });

  return prisma.event.create({
    data: {
      userId,
      slug,
      eventType: input.eventType,
      title: input.title,
      hostNames: input.hostNames,
      eventDate: new Date(input.eventDate),
      eventEndDate: input.eventEndDate ? new Date(input.eventEndDate) : undefined,
      timezone: input.timezone,
      venueName: input.venueName,
      venueAddress: input.venueAddress,
      invitationMessage: input.invitationMessage,
      additionalInfo: input.additionalInfo,
      dressCode: input.dressCode,
      schedule: input.schedule ?? [],
      googleMapsLink: input.googleMapsLink || null,
      backgroundMusicUrl: input.backgroundMusicUrl || null,
      templateId: input.templateId,
      customTheme: input.customTheme,
      coverImageUrl: input.coverImageUrl,
      coverImagePublicId: input.coverImagePublicId,
      design: {
        create: { content: defaultDesign as unknown as Prisma.InputJsonValue },
      },
    },
    include: { template: true, design: true },
  });
}

export async function updateEvent(eventId: string, userId: string, input: UpdateEventInput) {
  await assertEventOwner(eventId, userId);

  if (input.slug) {
    const existing = await prisma.event.findFirst({
      where: { slug: input.slug, NOT: { id: eventId } },
    });
    if (existing) throw new AppError("CONFLICT", "Це посилання вже використовується", 409);
  }

  const { eventDate, eventEndDate, googleMapsLink, backgroundMusicUrl, backgroundImageUrl, designContent, ...rest } = input;

  return prisma.event.update({
    where: { id: eventId },
    data: {
      ...rest,
      eventDate: eventDate ? new Date(eventDate) : undefined,
      eventEndDate: eventEndDate ? new Date(eventEndDate) : undefined,
      googleMapsLink: googleMapsLink === "" ? null : googleMapsLink,
      backgroundMusicUrl: backgroundMusicUrl === "" ? null : backgroundMusicUrl,
      ...(backgroundImageUrl !== undefined || designContent !== undefined
        ? {
            design: {
              upsert: {
                create: {
                  content: (designContent ?? { version: 1, blocks: [] }) as Prisma.InputJsonValue,
                  backgroundImageUrl: backgroundImageUrl ?? null,
                },
                update: {
                  ...(designContent !== undefined && { content: designContent as Prisma.InputJsonValue }),
                  ...(backgroundImageUrl !== undefined && { backgroundImageUrl: backgroundImageUrl || null }),
                },
              },
            },
          }
        : {}),
    } satisfies Prisma.EventUpdateInput,
    include: { template: true, design: true, media: true },
  });
}

export async function deleteEvent(eventId: string, userId: string) {
  await assertEventOwner(eventId, userId);
  return prisma.event.update({
    where: { id: eventId },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  });
}

export async function duplicateEvent(eventId: string, userId: string) {
  const event = await getEventById(eventId, userId);
  const slug = await generateUniqueEventSlug(`${event.title}-copy`, event.eventType);

  return prisma.$transaction(async (tx) => {
    const newEvent = await tx.event.create({
      data: {
        userId,
        slug,
        eventType: event.eventType,
        title: `${event.title} (Copy)`,
        hostNames: event.hostNames,
        description: event.description,
        invitationMessage: event.invitationMessage,
        additionalInfo: event.additionalInfo,
        dressCode: event.dressCode,
        schedule: event.schedule ?? undefined,
        googleMapsLink: event.googleMapsLink,
        backgroundMusicUrl: event.backgroundMusicUrl,
        eventDate: event.eventDate,
        eventEndDate: event.eventEndDate,
        timezone: event.timezone,
        venueName: event.venueName,
        venueAddress: event.venueAddress,
        coverImageUrl: event.coverImageUrl,
        coverImagePublicId: event.coverImagePublicId,
        customTheme: event.customTheme ?? undefined,
        templateId: event.templateId,
        status: "DRAFT",
        design: event.design
          ? { create: { content: event.design.content as object, backgroundImageUrl: event.design.backgroundImageUrl, backgroundImagePublicId: event.design.backgroundImagePublicId } }
          : { create: { content: { version: 1, blocks: [] } } },
      },
    });

    if (event.questions.length) {
      for (const q of event.questions) {
        const newQ = await tx.question.create({
          data: {
            eventId: newEvent.id,
            type: q.type,
            title: q.title,
            description: q.description,
            required: q.required,
            sortOrder: q.sortOrder,
          },
        });
        if (q.options.length) {
          await tx.questionOption.createMany({
            data: q.options.map((o) => ({
              questionId: newQ.id,
              label: o.label,
              value: o.value,
              sortOrder: o.sortOrder,
            })),
          });
        }
      }
    }

    return newEvent;
  });
}

export async function publishEvent(eventId: string, userId: string) {
  const event = await assertEventOwner(eventId, userId);
  if (!event.title || !event.eventDate) {
    throw new AppError("VALIDATION_ERROR", "Подія повинна мати назву та дату", 400);
  }
  return prisma.event.update({
    where: { id: eventId },
    data: { status: "PUBLISHED" },
  });
}

const publicEventInclude = {
  template: true,
  design: true,
  media: { orderBy: { sortOrder: "asc" as const } },
  questions: {
    orderBy: { sortOrder: "asc" as const },
    include: { options: { orderBy: { sortOrder: "asc" as const } } },
  },
};

export async function getPublicEventBySlug(slug: string) {
  const event = await prisma.event.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null, isPublic: true },
    include: publicEventInclude,
  });
  if (!event) throw new AppError("NOT_FOUND", "Запрошення не знайдено", 404);
  return event;
}

/** Owner draft/unpublished preview — requires authenticated owner. */
export async function getOwnerPreviewEventBySlug(slug: string, userId: string) {
  const event = await prisma.event.findFirst({
    where: { slug, userId, deletedAt: null },
    include: publicEventInclude,
  });
  if (!event) throw new AppError("NOT_FOUND", "Запрошення не знайдено", 404);
  return event;
}

export async function getPublicInviteWithToken(
  slug: string,
  token?: string | null,
  options?: { previewUserId?: string | null },
) {
  const event = options?.previewUserId
    ? await getOwnerPreviewEventBySlug(slug, options.previewUserId).catch(() => getPublicEventBySlug(slug))
    : await getPublicEventBySlug(slug);

  if (!token) {
    return { ...event, guest: null };
  }

  const group = await prisma.guestGroup.findFirst({
    where: { inviteToken: token, eventId: event.id },
    include: { guests: { orderBy: { sortOrder: "asc" } } },
  });

  if (!group) throw new AppError("NOT_FOUND", "Невірне посилання на запрошення", 404);

  const nextStatus =
    group.inviteStatus === "PENDING" || group.inviteStatus === "SENT"
      ? "OPENED"
      : group.inviteStatus;

  await prisma.guestGroup.update({
    where: { id: group.id },
    data: {
      openedAt: group.openedAt ?? new Date(),
      lastOpenedAt: new Date(),
      inviteStatus: nextStatus,
    },
  });

  return {
    ...event,
    guest: {
      groupId: group.id,
      inviteToken: group.inviteToken,
      groupName: group.groupName,
      guests: group.guests.map((g) => ({
        id: g.id,
        name: g.name,
        email: g.email,
        attendeeType: g.attendeeType,
        isPrimary: g.isPrimary,
      })),
      personalization: group.personalization,
    },
  };
}

export async function getDashboardStats(userId: string) {
  const events = await prisma.event.findMany({
    where: { userId, deletedAt: null },
    include: {
      guestGroups: {
        include: { guests: true, response: true },
      },
    },
  });

  const now = new Date();
  let totalGuests = 0;
  let totalResponses = 0;
  let totalAttending = 0;

  for (const event of events) {
    totalGuests += event.guestGroups.reduce((s, g) => s + g.guests.length, 0);
    for (const group of event.guestGroups) {
      if (group.response) {
        totalResponses++;
        if (group.response.response === "ATTENDING") {
          totalAttending += group.guests.length;
        }
      }
    }
  }

  return {
    totalEvents: events.length,
    totalGuests,
    totalResponses,
    attendanceRate: totalGuests > 0 ? Math.round((totalAttending / totalGuests) * 100) : 0,
    upcomingEvents: events.filter((e) => e.eventDate > now && e.status === "PUBLISHED").length,
  };
}
