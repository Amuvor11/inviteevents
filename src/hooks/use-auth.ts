"use client";

import { useEffect, useState } from "react";
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, googleProvider } from "@/lib/firebase/client";
import { syncSessionCookie } from "@/lib/auth/sync-session";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    void getRedirectResult(auth).catch(() => {
      // Ignore redirect errors; popup/redirect fallback handles sign-in.
    });

    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await syncSessionCookie(firebaseUser);
      }
      setLoading(false);
    });
  }, []);

  const signInGoogle = async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase not configured");

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error
        ? String((error as { code: unknown }).code)
        : "";

      // Browsers often block OAuth popups on production domains.
      if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw error;
    }
  };

  const logout = async () => {
    const auth = getFirebaseAuth();
    await fetch("/api/auth/logout", { method: "POST" });
    if (auth) await signOut(auth);
    window.location.href = "/";
  };

  return { user, loading, signInGoogle, logout };
}
