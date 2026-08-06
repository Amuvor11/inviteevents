import { withAuthHandler } from "@/lib/api/with-auth";
import { success } from "@/lib/api/response";
import { getSurveyAnalytics } from "@/services/survey-analytics.service";

export const GET = withAuthHandler(async (userId, request, context) => {
  const { eventId } = await context.params;
  const questionId = new URL(request.url).searchParams.get("questionId") ?? undefined;
  const summary = await getSurveyAnalytics(eventId, userId, questionId);
  return success(summary);
});
