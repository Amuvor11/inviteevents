import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAdminApp(): App | null {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) return null;

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export async function verifyIdToken(token: string) {
  const app = getAdminApp();
  if (!app) throw new Error("Firebase Admin not configured");
  return getAuth(app).verifyIdToken(token);
}

const SESSION_COOKIE_EXPIRY_MS = 60 * 60 * 24 * 14 * 1000; // 14 days

export async function createFirebaseSessionCookie(idToken: string) {
  const app = getAdminApp();
  if (!app) throw new Error("Firebase Admin not configured");
  return getAuth(app).createSessionCookie(idToken, { expiresIn: SESSION_COOKIE_EXPIRY_MS });
}

export async function verifySessionCookie(sessionCookie: string) {
  const app = getAdminApp();
  if (!app) throw new Error("Firebase Admin not configured");
  return getAuth(app).verifySessionCookie(sessionCookie, true);
}

/** Supports new session cookies and legacy ID-token cookies. */
export async function verifySessionToken(token: string) {
  try {
    return await verifySessionCookie(token);
  } catch {
    return verifyIdToken(token);
  }
}
