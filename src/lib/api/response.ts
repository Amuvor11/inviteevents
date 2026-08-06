import { NextResponse } from "next/server";
import { isAppError } from "./errors";

export function success<T>(data: T, status = 200, meta?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) }, { status });
}

export function created<T>(data: T): NextResponse {
  return success(data, 201);
}

export function errorResponse(error: unknown): NextResponse {
  if (isAppError(error)) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status }
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Щось пішло не так" } },
    { status: 500 }
  );
}
