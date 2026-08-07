import type { QuestionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/api/errors";
import { assertEventOwner } from "./event.service";
import type { CreateQuestionInput, UpdateQuestionInput } from "@/validations/question.schema";

const CHOICE_TYPES: QuestionType[] = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "SELECT"];

function slugifyValue(label: string) {
  return label.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "") || "option";
}

export async function listQuestions(eventId: string, userId: string) {
  await assertEventOwner(eventId, userId);
  return prisma.question.findMany({
    where: { eventId },
    include: { options: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createQuestion(eventId: string, userId: string, input: CreateQuestionInput) {
  await assertEventOwner(eventId, userId);

  if (CHOICE_TYPES.includes(input.type) && (!input.options || input.options.length < 1)) {
    throw new AppError("VALIDATION_ERROR", "Питання з вибором потребують хоча б один варіант", 400);
  }
  if (!CHOICE_TYPES.includes(input.type) && input.options?.length) {
    throw new AppError("VALIDATION_ERROR", "Цей тип питання не може мати варіантів", 400);
  }

  const maxOrder = await prisma.question.aggregate({
    where: { eventId },
    _max: { sortOrder: true },
  });

  return prisma.question.create({
    data: {
      eventId,
      type: input.type,
      title: input.title,
      description: input.description?.trim() ? input.description : null,
      placeholder: input.placeholder?.trim() ? input.placeholder : null,
      defaultValue: input.defaultValue?.trim() ? input.defaultValue : null,
      required: input.required ?? false,
      sortOrder: input.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
      options: input.options
        ? {
            create: input.options.map((o, i) => ({
              label: o.label,
              value: o.value ?? slugifyValue(o.label),
              sortOrder: o.sortOrder ?? i,
            })),
          }
        : undefined,
    },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });
}

async function syncQuestionOptions(
  questionId: string,
  options: NonNullable<UpdateQuestionInput["options"]>,
) {
  const existing = await prisma.questionOption.findMany({ where: { questionId } });
  const existingIds = new Set(existing.map((o) => o.id));
  const keepIds: string[] = [];

  for (let i = 0; i < options.length; i++) {
    const o = options[i]!;
    const label = o.label.trim();
    const value = o.value ?? slugifyValue(label);
    if (o.id && existingIds.has(o.id)) {
      await prisma.questionOption.update({
        where: { id: o.id },
        data: { label, value, sortOrder: o.sortOrder ?? i },
      });
      keepIds.push(o.id);
    } else {
      const created = await prisma.questionOption.create({
        data: {
          questionId,
          label,
          value,
          sortOrder: o.sortOrder ?? i,
        },
      });
      keepIds.push(created.id);
    }
  }

  await prisma.questionOption.deleteMany({
    where: { questionId, id: { notIn: keepIds } },
  });
}

export async function updateQuestion(
  questionId: string,
  eventId: string,
  userId: string,
  input: UpdateQuestionInput
) {
  await assertEventOwner(eventId, userId);

  if (input.options) {
    await syncQuestionOptions(questionId, input.options);
  }

  return prisma.question.update({
    where: { id: questionId, eventId },
    data: {
      title: input.title,
      ...(input.description !== undefined
        ? { description: input.description?.trim() ? input.description : null }
        : {}),
      ...(input.placeholder !== undefined
        ? { placeholder: input.placeholder?.trim() ? input.placeholder : null }
        : {}),
      ...(input.defaultValue !== undefined
        ? { defaultValue: input.defaultValue?.trim() ? input.defaultValue : null }
        : {}),
      required: input.required,
      sortOrder: input.sortOrder,
      ...(input.type ? { type: input.type } : {}),
    },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function deleteQuestion(questionId: string, eventId: string, userId: string) {
  await assertEventOwner(eventId, userId);
  return prisma.question.delete({ where: { id: questionId, eventId } });
}

export async function reorderQuestions(eventId: string, userId: string, orderedIds: string[]) {
  await assertEventOwner(eventId, userId);
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.question.update({ where: { id, eventId }, data: { sortOrder: index } })
    )
  );
  return listQuestions(eventId, userId);
}

export async function addQuestionOption(
  questionId: string,
  eventId: string,
  userId: string,
  label: string,
  value?: string
) {
  await assertEventOwner(eventId, userId);
  const question = await prisma.question.findFirst({ where: { id: questionId, eventId } });
  if (!question || !CHOICE_TYPES.includes(question.type)) {
    throw new AppError("VALIDATION_ERROR", "Неможливо додати варіанти до цього типу питання", 400);
  }
  const maxOrder = await prisma.questionOption.aggregate({
    where: { questionId },
    _max: { sortOrder: true },
  });
  return prisma.questionOption.create({
    data: {
      questionId,
      label,
      value: value ?? slugifyValue(label),
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });
}

export async function deleteQuestionOption(
  optionId: string,
  questionId: string,
  eventId: string,
  userId: string
) {
  await assertEventOwner(eventId, userId);
  return prisma.questionOption.delete({ where: { id: optionId, questionId } });
}
