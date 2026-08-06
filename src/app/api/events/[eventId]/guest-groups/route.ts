import { withAuthHandler } from "@/lib/api/with-auth";
import { created, success } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { createGuestGroupSchema } from "@/validations/guest.schema";
import { createGuestGroup, guestGroupsToCsv, listGuestGroups } from "@/services/guest-group.service";

export const GET = withAuthHandler(async (userId, request, context) => {
  const { eventId } = await context!.params;
  const url = new URL(request.url);
  const format = url.searchParams.get("format");

  const groups = await listGuestGroups(eventId, userId);

  if (format === "csv") {
    const csv = guestGroupsToCsv(groups);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="guests-${eventId}.csv"`,
      },
    });
  }

  return success(groups);
});

export const POST = withAuthHandler(async (userId, request, context) => {
  const { eventId } = await context!.params;
  const input = parseBody(createGuestGroupSchema, await request.json());
  const group = await createGuestGroup(eventId, userId, input);
  return created(group);
});
