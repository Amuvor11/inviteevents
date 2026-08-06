import { clearSessionCookie } from "@/lib/auth/session";
import { success } from "@/lib/api/response";

export async function POST() {
  await clearSessionCookie();
  return success({ ok: true });
}
