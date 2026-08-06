import { withAuthHandler } from "@/lib/api/with-auth";
import { getQuestionAnalytics } from "@/services/survey-analytics.service";
import { success } from "@/lib/api/response";

export const GET = withAuthHandler(async (userId, _request, context) => {
  const { eventId, questionId } = await context.params;
  const analytics = await getQuestionAnalytics(eventId, userId, questionId);
  return success(analytics);
});
