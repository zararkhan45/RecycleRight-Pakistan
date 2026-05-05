import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db, deviceTokensTable } from "@workspace/db";

import { badRequest } from "../lib/httpErrors";
import { requireAuth, type AuthContext } from "../middleware/auth";

const router: IRouter = Router();

const RegisterDeviceTokenBody = z.object({
  token: z.string().min(8),
  platform: z.enum(["android", "ios", "web"]),
});

const RouteQuery = z.object({
  originLat: z.coerce.number(),
  originLng: z.coerce.number(),
  destinationLat: z.coerce.number(),
  destinationLng: z.coerce.number(),
});

router.post("/notifications/device-token", requireAuth, async (req, res, next) => {
  try {
    const auth = res.locals.auth as AuthContext;
    const body = RegisterDeviceTokenBody.parse(req.body);

    const now = new Date();
    const existing = await db
      .select({ id: deviceTokensTable.id })
      .from(deviceTokensTable)
      .where(eq(deviceTokensTable.token, body.token))
      .limit(1);

    if (existing[0]) {
      const updated = await db
        .update(deviceTokensTable)
        .set({
          userId: auth.userId,
          platform: body.platform,
          updatedAt: now,
        })
        .where(eq(deviceTokensTable.id, existing[0].id))
        .returning();
      res.json(updated[0]);
      return;
    }

    const inserted = await db
      .insert(deviceTokensTable)
      .values({
        userId: auth.userId,
        platform: body.platform,
        token: body.token,
        updatedAt: now,
      })
      .returning();

    res.status(201).json(inserted[0]);
  } catch (err) {
    next(err);
  }
});

router.get("/maps/route", requireAuth, async (req, res, next) => {
  try {
    const query = RouteQuery.parse(req.query);
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
    if (!googleApiKey) {
      throw badRequest("GOOGLE_MAPS_API_KEY is not configured");
    }

    const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleApiKey,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: {
              latitude: query.originLat,
              longitude: query.originLng,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: query.destinationLat,
              longitude: query.destinationLng,
            },
          },
        },
        travelMode: "DRIVE",
      }),
    });

    const raw = await response.text();
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (!response.ok) {
      res.status(502).json({
        error: "google_routes_failed",
        details: parsed,
      });
      return;
    }

    const route =
      parsed &&
      typeof parsed === "object" &&
      "routes" in parsed &&
      Array.isArray((parsed as { routes?: unknown[] }).routes)
        ? (parsed as { routes: Array<any> }).routes[0]
        : null;

    if (!route) {
      res.status(404).json({
        error: "route_not_found",
      });
      return;
    }

    const durationSeconds = (() => {
      const duration = route.duration;
      if (typeof duration !== "string") return null;
      const n = Number(duration.replace("s", ""));
      return Number.isFinite(n) ? n : null;
    })();

    res.json({
      distanceMeters: typeof route.distanceMeters === "number" ? route.distanceMeters : null,
      durationSeconds,
      encodedPolyline: route?.polyline?.encodedPolyline ?? null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
