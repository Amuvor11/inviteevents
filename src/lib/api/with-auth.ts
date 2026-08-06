import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { AppError } from "@/lib/api/errors";
import { errorResponse } from "@/lib/api/response";

type RouteContext = { params: Promise<Record<string, string>> };

type AuthedHandler = (
  userId: string,
  request: NextRequest,
  context: RouteContext
) => Promise<Response>;

export function withAuthHandler(handler: AuthedHandler) {
  return async (request: NextRequest, context: RouteContext): Promise<Response> => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new AppError("UNAUTHORIZED", "Потрібна автентифікація", 401);
      return await handler(user.id, request, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function withAuth(handler: (userId: string) => Promise<Response>) {
  return async (): Promise<Response> => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new AppError("UNAUTHORIZED", "Потрібна автентифікація", 401);
      return await handler(user.id);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
