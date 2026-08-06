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

    const user = await prisma.user.upsert({
      where: { firebaseUid: decoded.uid },
      create: {
        firebaseUid: decoded.uid,
        email: decoded.email ?? `${decoded.uid}@firebase.local`,
        displayName: decoded.name ?? null,
        photoUrl: decoded.picture ?? null,
      },
      update: {
        email: decoded.email ?? undefined,
        displayName: decoded.name ?? null,
        photoUrl: decoded.picture ?? null,
      },
    });

    const sessionCookie = await createFirebaseSessionCookie(idToken);
    await setSessionCookie(sessionCookie);
    return created({ user: { id: user.id, email: user.email, displayName: user.displayName, photoUrl: user.photoUrl } });
  } catch (error) {
    return errorResponse(error);
  }
}
