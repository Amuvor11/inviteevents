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

function authErrorMessage(error: unknown): string {
  if (typeof error === "object" && error && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  if (error instanceof Error) return error.message;
  return "unknown-error";
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function establishSession(firebaseUser: User) {
      const sync = await syncSessionCookie(firebaseUser);
      if (cancelled) return;
      if (!sync.ok) {
        setSessionReady(false);
        setAuthError(sync.error ?? "session-sync-failed");
        return;
      }
      setSessionReady(true);
      setAuthError(null);
    }

    async function init() {
      try {
        const redirectResult = await getRedirectResult(auth!);
        if (!cancelled && redirectResult?.user) {
          setUser(redirectResult.user);
          await establishSession(redirectResult.user);
        }
      } catch (error) {
        if (!cancelled) setAuthError(authErrorMessage(error));
      }

      const unsub = onAuthStateChanged(auth!, async (firebaseUser) => {
        if (cancelled) return;
        setUser(firebaseUser);
        if (firebaseUser) {
          await establishSession(firebaseUser);
        } else {
          setSessionReady(false);
        }
        setLoading(false);
      });

      return unsub;
    }

    let unsub: (() => void) | undefined;
    void init().then((fn) => {
      unsub = fn;
    });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  const signInGoogle = async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase not configured");

    // IMPORTANT: open the popup before any React setState.
    // setState can break the user-gesture chain and cause auth/popup-blocked.
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      setSigningIn(true);
      setAuthError(null);
      setUser(credential.user);
      const sync = await syncSessionCookie(credential.user);
      if (!sync.ok) {
        setAuthError(sync.error ?? "session-sync-failed");
        setSigningIn(false);
        return;
      }
      setSessionReady(true);
    } catch (error) {
      const code = authErrorMessage(error);
      if (code === "auth/popup-blocked") {
        setAuthError("popup-blocked");
        return;
      }
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setAuthError("Вікно Google було закрито до завершення входу");
        return;
      }
      setAuthError(code);
    } finally {
      setSigningIn(false);
    }
  };

  const signInGoogleRedirect = async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase not configured");
    // Call redirect immediately from the click handler (no prior setState).
    await signInWithRedirect(auth, googleProvider);
  };

  const logout = async () => {
    const auth = getFirebaseAuth();
    await fetch("/api/auth/logout", { method: "POST" });
    if (auth) await signOut(auth);
    window.location.href = "/";
  };

  return {
    user,
    sessionReady,
    loading,
    signingIn,
    authError,
    signInGoogle,
    signInGoogleRedirect,
    logout,
  };
}
