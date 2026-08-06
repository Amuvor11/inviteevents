import { withAuthHandler } from "@/lib/api/with-auth";
import { success } from "@/lib/api/response";
import { getEventAnalytics } from "@/services/event-analytics.service";

export const GET = withAuthHandler(async (userId, _request, context) => {
  const { eventId } = await context.params;
  const analytics = await getEventAnalytics(eventId, userId);
  return success(analytics);
});
