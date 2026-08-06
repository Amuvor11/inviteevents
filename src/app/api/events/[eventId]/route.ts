import { withAuthHandler } from "@/lib/api/with-auth";
import { success } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { updateEventSchema } from "@/validations/event.schema";
import { deleteEvent, getEventById, updateEvent } from "@/services/event.service";

export const GET = withAuthHandler(async (userId, _request, context) => {
  const { eventId } = await context!.params;
  const event = await getEventById(eventId, userId);
  return success(event);
});

export const PATCH = withAuthHandler(async (userId, request, context) => {
  const { eventId } = await context!.params;
  const input = parseBody(updateEventSchema, await request.json());
  const event = await updateEvent(eventId, userId, input);
  return success(event);
});

export const DELETE = withAuthHandler(async (userId, _request, context) => {
  const { eventId } = await context!.params;
  await deleteEvent(eventId, userId);
  return success({ ok: true });
});
