"use client";

import type { User } from "firebase/auth";

export async function syncSessionCookie(user: User): Promise<boolean> {
  try {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
