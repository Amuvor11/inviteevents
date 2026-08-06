import { withAuthHandler } from "@/lib/api/with-auth";
import { AppError } from "@/lib/api/errors";
import { exportEventData } from "@/services/export.service";
import type { ExportType } from "@/types/analytics";
import { z } from "zod";

const exportQuerySchema = z.enum(["guests", "rsvp", "survey"]);

export const GET = withAuthHandler(async (userId, request, context) => {
  const { eventId } = await context.params;
  const typeParam = new URL(request.url).searchParams.get("type");

  const parsed = exportQuerySchema.safeParse(typeParam);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Query param 'type' is required: guests | rsvp | survey",
      400
    );
  }

  const { csv, filename } = await exportEventData(eventId, userId, parsed.data as ExportType);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
