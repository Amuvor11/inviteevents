import { getCurrentUser } from "@/lib/auth/get-current-user";
import { AppError } from "@/lib/api/errors";
import { success, errorResponse } from "@/lib/api/response";
import { getDashboardAnalytics } from "@/services/event-analytics.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AppError("UNAUTHORIZED", "Authentication required", 401);
    const analytics = await getDashboardAnalytics(user.id);
    return success(analytics);
  } catch (error) {
    return errorResponse(error);
  }
}
