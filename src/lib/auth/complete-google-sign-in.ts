"use client";

import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { syncSessionCookie } from "@/lib/auth/sync-session";

export async function completeGoogleIdTokenSignIn(idToken: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase not configured");

  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  const sync = await syncSessionCookie(result.user);
  if (!sync.ok) {
    throw new Error(sync.error ?? "session-sync-failed");
  }
  return result.user;
}
