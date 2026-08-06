"use client";

import { useEffect } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { syncSessionCookie } from "@/lib/auth/sync-session";

/** Keeps the server session cookie in sync with Firebase while the user is active. */
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    const refresh = () => {
      const user = auth.currentUser;
      if (user) void syncSessionCookie(user);
    };

    const unsub = onIdTokenChanged(auth, (user) => {
      if (user) void syncSessionCookie(user);
    });

    const onFocus = () => refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      unsub();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return children;
}
