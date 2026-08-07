"use client";

import type { User } from "firebase/auth";

export async function syncSessionCookie(user: User): Promise<{ ok: boolean; error?: string }> {
  try {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (res.ok) return { ok: true };

    const payload = (await res.json().catch(() => null)) as
      | { error?: { code?: string; message?: string } }
      | null;
    return {
      ok: false,
      error: payload?.error?.code ?? payload?.error?.message ?? `session-http-${res.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "session-sync-failed",
    };
  }
}
