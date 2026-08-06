import { withAuthHandler } from "@/lib/api/with-auth";
import { success } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { addQuestionOption } from "@/services/question.service";
import { z } from "zod";

const optionSchema = z.object({ label: z.string().min(1), value: z.string().optional() });

export const POST = withAuthHandler(async (userId, request, context) => {
  const { eventId, questionId } = await context.params;
  const { label, value } = parseBody(optionSchema, await request.json());
  const option = await addQuestionOption(questionId, eventId, userId, label, value);
  return success(option);
});
