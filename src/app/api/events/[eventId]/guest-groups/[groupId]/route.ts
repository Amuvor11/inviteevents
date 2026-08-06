import { withAuthHandler } from "@/lib/api/with-auth";
import { success } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { updateGuestGroupSchema } from "@/validations/guest.schema";
import { deleteGuestGroup, updateGuestGroup } from "@/services/guest-group.service";

export const PATCH = withAuthHandler(async (userId, request, context) => {
  const { eventId, groupId } = await context!.params;
  const input = parseBody(updateGuestGroupSchema, await request.json());
  const group = await updateGuestGroup(groupId, eventId, userId, input);
  return success(group);
});

export const DELETE = withAuthHandler(async (userId, _request, context) => {
  const { eventId, groupId } = await context!.params;
  await deleteGuestGroup(groupId, eventId, userId);
  return success({ ok: true });
});
