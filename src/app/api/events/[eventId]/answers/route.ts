import { withAuthHandler } from "@/lib/api/with-auth";
import { success } from "@/lib/api/response";
import { listEventAnswers } from "@/services/guest-response.service";

export const GET = withAuthHandler(async (userId, request, context) => {
  const { eventId } = await context!.params;
  const url = new URL(request.url);
  const result = await listEventAnswers(eventId, userId, {
    questionId: url.searchParams.get("questionId") ?? undefined,
    response: url.searchParams.get("response") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    page: Number(url.searchParams.get("page") ?? 1),
    limit: Number(url.searchParams.get("limit") ?? 20),
  });
  return success(result.data, 200, result.meta);
});
