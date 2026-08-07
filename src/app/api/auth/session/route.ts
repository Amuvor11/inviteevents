import { createFirebaseSessionCookie, verifyIdToken } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth/session";
import { parseBody } from "@/lib/api/validate";
import { created, errorResponse } from "@/lib/api/response";
import { z } from "zod";

const schema = z.object({ idToken: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const { idToken } = parseBody(schema, await request.json());
    const decoded = await verifyIdToken(idToken);
    const email = decoded.email ?? `${decoded.uid}@firebase.local`;

    // Match by firebaseUid first, then by email (handles re-auth / UID changes).
    let user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });
    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });
    }

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firebaseUid: decoded.uid,
          email,
          displayName: decoded.name ?? user.displayName,
          photoUrl: decoded.picture ?? user.photoUrl,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email,
          displayName: decoded.name ?? null,
          photoUrl: decoded.picture ?? null,
        },
      });
    }

    const sessionCookie = await createFirebaseSessionCookie(idToken);
    await setSessionCookie(sessionCookie);
    return created({ user: { id: user.id, email: user.email, displayName: user.displayName, photoUrl: user.photoUrl } });
  } catch (error) {
    console.error("[auth/session]", error);
    const message = error instanceof Error ? error.message : "session-failed";
    // Surface config/DB issues so the login page can show a useful error.
    if (
      message.includes("Firebase Admin") ||
      message.includes("DATABASE") ||
      message.includes("Environment") ||
      message.includes("private key") ||
      message.includes("credential") ||
      message.includes("Unique constraint")
    ) {
      return Response.json(
        { error: { code: "AUTH_CONFIG_ERROR", message } },
        { status: 500 }
      );
    }
    return errorResponse(error);
  }
}
