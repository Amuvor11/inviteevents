import { success } from "@/lib/api/response";
import { listTemplates } from "@/services/template.service";

export async function GET() {
  const templates = await listTemplates();
  return success(templates);
}
