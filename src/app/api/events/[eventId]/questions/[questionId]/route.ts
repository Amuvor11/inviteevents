import { withAuthHandler } from "@/lib/api/with-auth";
import { success } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { updateQuestionSchema } from "@/validations/question.schema";
import { deleteQuestion, updateQuestion } from "@/services/question.service";

export const PATCH = withAuthHandler(async (userId, request, context) => {
  const { eventId, questionId } = await context.params;
  const input = parseBody(updateQuestionSchema, await request.json());
  const question = await updateQuestion(questionId, eventId, userId, input);
  return success(question);
});

export const DELETE = withAuthHandler(async (userId, _request, context) => {
  const { eventId, questionId } = await context.params;
  await deleteQuestion(questionId, eventId, userId);
  return success({ ok: true });
});
