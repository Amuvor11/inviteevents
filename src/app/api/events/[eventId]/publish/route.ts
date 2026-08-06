import { withAuthHandler } from "@/lib/api/with-auth";
import { success } from "@/lib/api/response";
import { publishEvent } from "@/services/event.service";

export const POST = withAuthHandler(async (userId, _request, context) => {
  const { eventId } = await context!.params;
  const event = await publishEvent(eventId, userId);
  return success(event);
});
