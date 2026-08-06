import { z } from "zod";

export const questionOptionSchema = z.object({
  label: z.string().min(1).max(200),
  value: z.string().max(200).optional(),
  sortOrder: z.number().int().optional(),
});

export const createQuestionSchema = z.object({
  type: z.enum([
    "TEXT",
    "TEXTAREA",
    "SINGLE_CHOICE",
    "MULTIPLE_CHOICE",
    "YES_NO",
    "NUMBER",
    "SELECT",
  ]),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  required: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  options: z.array(questionOptionSchema).optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const reorderQuestionsSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
