import { withAuthHandler } from "@/lib/api/with-auth";
import { success } from "@/lib/api/response";
import { listUserEvents, createEvent } from "@/services/event.service";
import { parseBody } from "@/lib/api/validate";
import { createEventSchema } from "@/validations/event.schema";

export const GET = withAuthHandler(async (userId) => {
  const events = await listUserEvents(userId);
  return success(events);
});

export const POST = withAuthHandler(async (userId, request) => {
  const input = parseBody(createEventSchema, await request.json());
  const event = await createEvent(userId, input);
  return success(event, 201);
});
