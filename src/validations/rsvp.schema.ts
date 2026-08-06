import { z } from "zod";
import { attendeeSchema } from "./guest.schema";

export const submitAnswerSchema = z.object({
  questionId: z.string(),
  textValue: z.string().optional(),
  numberValue: z.number().optional(),
  boolValue: z.boolean().optional(),
  optionId: z.string().optional(),
  optionIds: z.array(z.string()).optional(),
});

export const submitRsvpSchema = z.object({
  response: z.enum(["ATTENDING", "NOT_ATTENDING", "MAYBE"]),
  groupName: z.string().max(200).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  message: z.string().max(2000).optional(),
  dietaryRestrictions: z.string().max(1000).optional(),
  attendees: z.array(attendeeSchema).min(1),
  answers: z.array(submitAnswerSchema).default([]),
});

export type SubmitAnswerInput = z.output<typeof submitAnswerSchema>;
export type SubmitRsvpInput = z.output<typeof submitRsvpSchema>;
