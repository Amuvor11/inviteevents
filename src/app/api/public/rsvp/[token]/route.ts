import { created, errorResponse, success } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { submitRsvpSchema } from "@/validations/rsvp.schema";
import { getRsvpFormData, submitRsvp } from "@/services/guest-response.service";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const group = await getRsvpFormData(token);
    return success(group);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const input = parseBody(submitRsvpSchema, await request.json());
    const result = await submitRsvp(token, input);
    return created(result);
  } catch (error) {
    return errorResponse(error);
  }
}
