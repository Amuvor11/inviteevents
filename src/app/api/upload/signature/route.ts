import { withAuthHandler } from "@/lib/api/with-auth";
import { success } from "@/lib/api/response";
import { AppError } from "@/lib/api/errors";
import { assertEventOwner } from "@/services/event.service";
import { generateUploadSignature } from "@/lib/cloudinary/signature";

export const GET = withAuthHandler(async (userId, request) => {
  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId");
  const folder = url.searchParams.get("folder");

  if (!eventId || !folder) {
    throw new AppError("VALIDATION_ERROR", "eventId and folder are required", 400);
  }

  await assertEventOwner(eventId, userId);

  if (!folder.startsWith(`events/${eventId}`)) {
    throw new AppError("FORBIDDEN", "Invalid upload folder", 403);
  }

  return success(generateUploadSignature(folder));
});
