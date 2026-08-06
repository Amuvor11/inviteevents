import { z, type ZodTypeAny } from "zod";
import { AppError } from "./errors";

export function parseBody<S extends ZodTypeAny>(schema: S, body: unknown): z.output<S> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new AppError("VALIDATION_ERROR", "Невірне тіло запиту", 400, result.error.flatten());
  }
  return result.data;
}

export function parseQuery<S extends ZodTypeAny>(
  schema: S,
  query: Record<string, string | string[] | undefined>
): z.output<S> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params[key] = Array.isArray(value) ? value[0] : value;
  }
  const result = schema.safeParse(params);
  if (!result.success) {
    throw new AppError("VALIDATION_ERROR", "Невірні параметри запиту", 400, result.error.flatten());
  }
  return result.data;
}
