"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
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
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    const auth = getFirebaseAuth();
    await fetch("/api/auth/logout", { method: "POST" });
    if (auth) await signOut(auth);
    window.location.href = "/";
  };

  return { user, loading, signInGoogle, logout };
}
