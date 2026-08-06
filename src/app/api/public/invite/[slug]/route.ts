import { success, errorResponse } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPublicInviteWithToken } from "@/services/event.service";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const isPreview = url.searchParams.get("preview") === "1";

    let previewUserId: string | null = null;
    if (isPreview) {
      const user = await getCurrentUser();
      previewUserId = user?.id ?? null;
    }

    const event = await getPublicInviteWithToken(slug, token, { previewUserId });
    return success(event);
  } catch (error) {
    return errorResponse(error);
  }
}
