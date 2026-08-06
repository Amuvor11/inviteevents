import { withAuthHandler } from "@/lib/api/with-auth";
import { created, success } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { createQuestionSchema } from "@/validations/question.schema";
import { createQuestion, listQuestions } from "@/services/question.service";

export const GET = withAuthHandler(async (userId, _request, context) => {
  const { eventId } = await context!.params;
  const questions = await listQuestions(eventId, userId);
  return success(questions);
});

export const POST = withAuthHandler(async (userId, request, context) => {
  const { eventId } = await context!.params;
  const input = parseBody(createQuestionSchema, await request.json());
  const question = await createQuestion(eventId, userId, input);
  return created(question);
});
