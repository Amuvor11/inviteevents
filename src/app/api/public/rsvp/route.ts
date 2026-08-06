import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/api/errors";
import { created, errorResponse } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { submitRsvpSchema } from "@/validations/rsvp.schema";
import { submitRsvp } from "@/services/guest-response.service";
import { generateInviteToken } from "@/lib/utils/token";
import { z } from "zod";

const openRsvpSchema = submitRsvpSchema.extend({ slug: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const body = parseBody(openRsvpSchema, await request.json());
    const { slug, ...input } = body;

    const event = await prisma.event.findFirst({
      where: { slug, status: "PUBLISHED", deletedAt: null, rsvpClosed: false },
    });
    if (!event) throw new AppError("NOT_FOUND", "Event not found or RSVP closed", 404);

    const token = generateInviteToken();
    await prisma.guestGroup.create({
      data: { eventId: event.id, inviteToken: token, groupName: input.groupName },
    });

    const result = await submitRsvp(token, input);
    return created(result);
  } catch (error) {
    return errorResponse(error);
  }
}
