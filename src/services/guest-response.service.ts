import type { Question, QuestionOption, QuestionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/api/errors";
import { assertEventOwner } from "./event.service";
import type { SubmitAnswerInput, SubmitRsvpInput } from "@/validations/rsvp.schema";

const CHOICE_TYPES: QuestionType[] = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "SELECT"];

function validateAnswers(
  questions: (Question & { options: QuestionOption[] })[],
  answers: SubmitAnswerInput[]
) {
  for (const question of questions) {
    const answer = answers.filter((a) => a.questionId === question.id);

    if (question.required && answer.length === 0) {
      throw new AppError("VALIDATION_ERROR", `Обов'язкове питання без відповіді: ${question.title}`, 400);
    }

    if (answer.length === 0) continue;

    switch (question.type) {
      case "TEXT":
      case "TEXTAREA":
        if (!answer[0]?.textValue?.trim()) {
          throw new AppError("VALIDATION_ERROR", `Невірна відповідь: ${question.title}`, 400);
        }
        break;
      case "NUMBER":
        if (answer[0]?.numberValue === undefined) {
          throw new AppError("VALIDATION_ERROR", `Невірне число: ${question.title}`, 400);
        }
        break;
      case "YES_NO":
        if (answer[0]?.boolValue === undefined) {
          throw new AppError("VALIDATION_ERROR", `Невірна відповідь так/ні: ${question.title}`, 400);
        }
        break;
      case "SINGLE_CHOICE":
      case "SELECT":
        if (!answer[0]?.optionId || !question.options.some((o) => o.id === answer[0].optionId)) {
          throw new AppError("VALIDATION_ERROR", `Невірний варіант: ${question.title}`, 400);
        }
        break;
      case "MULTIPLE_CHOICE": {
        const ids = answer[0]?.optionIds ?? [];
        if (!ids.length || !ids.every((id) => question.options.some((o) => o.id === id))) {
          throw new AppError("VALIDATION_ERROR", `Невірні варіанти: ${question.title}`, 400);
        }
        break;
      }
    }
  }
}

function buildAnswerRows(
  groupId: string,
  eventId: string,
  guestResponseId: string,
  primaryGuestId: string | null,
  questions: Question[],
  answers: SubmitAnswerInput[]
) {
  const rows: {
    groupId: string;
    guestId: string | null;
    questionId: string;
    eventId: string;
    guestResponseId: string;
    optionId?: string;
    textValue?: string;
    numberValue?: number;
    boolValue?: boolean;
  }[] = [];

  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) continue;

    if (question.type === "MULTIPLE_CHOICE" && answer.optionIds) {
      for (const optionId of answer.optionIds) {
        rows.push({ groupId, guestId: primaryGuestId, questionId: question.id, eventId, guestResponseId, optionId });
      }
    } else if (CHOICE_TYPES.includes(question.type) && answer.optionId) {
      rows.push({ groupId, guestId: primaryGuestId, questionId: question.id, eventId, guestResponseId, optionId: answer.optionId });
    } else if (question.type === "YES_NO") {
      rows.push({ groupId, guestId: primaryGuestId, questionId: question.id, eventId, guestResponseId, boolValue: answer.boolValue });
    } else if (question.type === "NUMBER") {
      rows.push({ groupId, guestId: primaryGuestId, questionId: question.id, eventId, guestResponseId, numberValue: answer.numberValue });
    } else {
      rows.push({ groupId, guestId: primaryGuestId, questionId: question.id, eventId, guestResponseId, textValue: answer.textValue });
    }
  }

  return rows;
}

export async function getRsvpFormData(token: string) {
  const group = await prisma.guestGroup.findUnique({
    where: { inviteToken: token },
    include: {
      guests: { orderBy: { sortOrder: "asc" } },
      response: true,
      event: {
        include: {
          questions: {
            orderBy: { sortOrder: "asc" },
            include: { options: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
    },
  });

  if (!group) throw new AppError("NOT_FOUND", "Невірне посилання на запрошення", 404);
  if (group.event.rsvpClosed) throw new AppError("RSVP_CLOSED", "Прийом RSVP закрито", 403);
  if (group.event.status !== "PUBLISHED") throw new AppError("NOT_FOUND", "Подія недоступна", 404);

  return group;
}

export async function submitRsvp(token: string, input: SubmitRsvpInput) {
  const group = await getRsvpFormData(token);
  const { event } = group;

  if (event.rsvpDeadline && new Date() > event.rsvpDeadline) {
    throw new AppError("RSVP_CLOSED", "Термін RSVP минув", 403);
  }

  const questions = event.questions;
  validateAnswers(questions, input.answers);

  // Prevent duplicate by email within event (for walk-in RSVPs)
  const primaryEmail = input.email || input.attendees[0]?.email;
  if (primaryEmail) {
    const duplicate = await prisma.guest.findFirst({
      where: {
        eventId: event.id,
        email: primaryEmail,
        NOT: { groupId: group.id },
      },
    });
    if (duplicate) {
      throw new AppError("CONFLICT", "Відповідь з цим email вже існує", 409);
    }
  }

  return prisma.$transaction(async (tx) => {
    const groupId = group.id;

    await tx.guest.deleteMany({ where: { groupId } });

    let primaryGuestId: string | undefined;
    for (const [index, attendee] of input.attendees.entries()) {
      const guest = await tx.guest.create({
        data: {
          groupId,
          eventId: event.id,
          name: attendee.name,
          email: input.email || attendee.email || null,
          phone: input.phone || attendee.phone || null,
          isPrimary: index === 0,
          attendeeType: attendee.attendeeType,
          sortOrder: index,
        },
      });
      if (index === 0) primaryGuestId = guest.id;
    }

    await tx.guestGroup.update({
      where: { id: groupId },
      data: {
        groupName: input.groupName ?? group.groupName,
        primaryGuestId,
        attendeeCount: input.attendees.length,
        inviteStatus: "RESPONDED",
      },
    });

    const guestResponse = await tx.guestResponse.upsert({
      where: { groupId },
      create: {
        groupId,
        eventId: event.id,
        response: input.response,
        message: input.message,
        dietaryRestrictions: input.dietaryRestrictions,
      },
      update: {
        response: input.response,
        message: input.message,
        dietaryRestrictions: input.dietaryRestrictions,
        respondedAt: new Date(),
      },
    });

    await tx.guestAnswer.deleteMany({ where: { groupId } });

    const answerRows = buildAnswerRows(
      groupId,
      event.id,
      guestResponse.id,
      primaryGuestId ?? null,
      questions,
      input.answers
    );

    if (answerRows.length) {
      await tx.guestAnswer.createMany({ data: answerRows });
    }

    return tx.guestGroup.findUnique({
      where: { id: groupId },
      include: { guests: true, response: true, answers: { include: { question: true, option: true } } },
    });
  });
}

export async function listEventAnswers(eventId: string, userId: string, filters?: {
  questionId?: string;
  response?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  await assertEventOwner(eventId, userId);

  const page = filters?.page ?? 1;
  const limit = Math.min(filters?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const groups = await prisma.guestGroup.findMany({
    where: {
      eventId,
      ...(filters?.response && filters.response !== "ALL"
        ? filters.response === "NO_RESPONSE"
          ? { response: null }
          : { response: { response: filters.response as "ATTENDING" | "NOT_ATTENDING" | "MAYBE" } }
        : {}),
    },
    include: {
      guests: true,
      response: true,
      answers: {
        where: filters?.questionId ? { questionId: filters.questionId } : undefined,
        include: { question: true, option: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  let filtered = groups;
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = groups.filter(
      (g) =>
        g.groupName?.toLowerCase().includes(q) ||
        g.guests.some((guest) => guest.name.toLowerCase().includes(q) || guest.email?.toLowerCase().includes(q))
    );
  }

  const total = filtered.length;
  const data = filtered.slice(skip, skip + limit);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
