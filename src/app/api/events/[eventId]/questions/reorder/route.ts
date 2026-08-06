import { withAuthHandler } from "@/lib/api/with-auth";
import { success } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { reorderQuestionsSchema } from "@/validations/question.schema";
import { reorderQuestions } from "@/services/question.service";

export const PUT = withAuthHandler(async (userId, request, context) => {
  const { eventId } = await context!.params;
  const { orderedIds } = parseBody(reorderQuestionsSchema, await request.json());
  const questions = await reorderQuestions(eventId, userId, orderedIds);
  return success(questions);
});
