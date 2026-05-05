import { eq } from "drizzle-orm";
import { db, deviceTokensTable } from "@workspace/db";
import { logger } from "./logger";

let messagingReady = false;

async function ensureMessagingReady(): Promise<boolean> {
  if (messagingReady) return true;

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!projectId || !clientEmail || !privateKey) {
    return false;
  }

  try {
    const { initializeApp, cert, getApps } = await import("firebase-admin/app");
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
    messagingReady = true;
    return true;
  } catch (err) {
    logger.error({ err }, "Failed to initialize Firebase Admin SDK");
    return false;
  }
}

export async function notifyUserByFcm(input: {
  userId: number;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  const ready = await ensureMessagingReady();
  if (!ready) return;

  const rows = await db
    .select({ id: deviceTokensTable.id, token: deviceTokensTable.token })
    .from(deviceTokensTable)
    .where(eq(deviceTokensTable.userId, input.userId));

  if (!rows.length) return;

  try {
    const { getMessaging } = await import("firebase-admin/messaging");
    const message = {
      notification: {
        title: input.title,
        body: input.body,
      },
      data: input.data ?? {},
      tokens: rows.map((row) => row.token),
    };

    const response = await getMessaging().sendEachForMulticast(message);
    const invalidTokenIndexes: number[] = [];
    for (let i = 0; i < response.responses.length; i += 1) {
      const r = response.responses[i];
      if (!r.success && r.error?.code === "messaging/registration-token-not-registered") {
        invalidTokenIndexes.push(i);
      }
    }

    if (invalidTokenIndexes.length) {
      const invalidIds = invalidTokenIndexes
        .map((idx) => rows[idx]?.id)
        .filter((v): v is number => typeof v === "number");
      if (invalidIds.length) {
        for (const id of invalidIds) {
          await db.delete(deviceTokensTable).where(eq(deviceTokensTable.id, id));
        }
      }
    }
  } catch (err) {
    logger.warn({ err, userId: input.userId }, "Failed to send FCM notification");
  }
}
