import { z } from "zod";

export const questionOptionSchema = z.object({
  id: z.string().optional(),
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
  title: z.string().max(500),
  description: z.string().max(2000).nullable().optional(),
  placeholder: z.string().max(500).nullable().optional(),
  /** Text/number default, option id for choice, "yes"|"no" for YES_NO, comma-separated option ids for MULTIPLE_CHOICE */
  defaultValue: z.string().max(2000).nullable().optional(),
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
