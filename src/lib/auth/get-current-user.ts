import { createFirebaseSessionCookie, verifySessionToken } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";
import { getSessionToken } from "./session";

export async function getCurrentUser() {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    const decoded = await verifySessionToken(token);
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });
    return user;
  } catch {
    return null;
  }
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
