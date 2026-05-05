import { Router, type IRouter } from "express";
import { and, eq, gte, isNull, lte } from "drizzle-orm";

import {
  AcceptPickupParams,
  AcceptPickupResponse,
  CompletePickupParams,
  CompletePickupResponse,
  EnterPickupWeightBody,
  EnterPickupWeightParams,
  EnterPickupWeightResponse,
  ListNearbyJobsQueryParams,
  ListNearbyJobsResponse,
} from "@workspace/api-zod";
import {
  collectorProfilesTable,
  db,
  pointsLedgerTable,
  pickupAssignmentsTable,
  pickupEventsTable,
  pickupLocationsTable,
  pickupRequestsTable,
  receiptsTable,
} from "@workspace/db";

import { mapPickup, mapReceipt } from "../lib/dbMappers";
import { conflict, forbidden, notFound } from "../lib/httpErrors";
import { notifyUserByFcm } from "../lib/pushNotifications";
import { calculatePickupPoints } from "../lib/rewards";
import { requireAuth, requireRole, type AuthContext } from "../middleware/auth";

const router: IRouter = Router();

function boundingBox(lat: number, lng: number, radiusKm: number) {
  // Very rough bounding box; good enough for MVP list filtering.
  const latDelta = radiusKm / 111.0;
  const lngDelta = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

router.get(
  "/jobs/nearby",
  requireAuth,
  requireRole("collector", "admin"),
  async (req, res, next) => {
    try {
      const query = ListNearbyJobsQueryParams.parse(req.query);
      const box = boundingBox(query.lat, query.lng, query.radiusKm);

      const rows = await db
        .select({
          pickup: pickupRequestsTable,
          location: pickupLocationsTable,
          assignedCollectorUserId: pickupAssignmentsTable.collectorUserId,
        })
        .from(pickupRequestsTable)
        .innerJoin(
          pickupLocationsTable,
          eq(pickupLocationsTable.pickupRequestId, pickupRequestsTable.id),
        )
        .leftJoin(
          pickupAssignmentsTable,
          eq(pickupAssignmentsTable.pickupRequestId, pickupRequestsTable.id),
        )
        .where(
          and(
            eq(pickupRequestsTable.status, "pending"),
            gte(pickupLocationsTable.lat, box.minLat),
            lte(pickupLocationsTable.lat, box.maxLat),
            gte(pickupLocationsTable.lng, box.minLng),
            lte(pickupLocationsTable.lng, box.maxLng),
            isNull(pickupAssignmentsTable.pickupRequestId),
          ),
        );

      const data = ListNearbyJobsResponse.parse(
        rows.map((r) => ({
          pickup: mapPickup(r.pickup, r.assignedCollectorUserId ?? null),
          location: {
            lat: r.location.lat,
            lng: r.location.lng,
            addressLabel: r.location.addressLabel ?? null,
            area: r.location.area ?? null,
            city: r.location.city ?? null,
          },
          distanceKm: null,
        })),
      );

      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/pickups/:id/accept",
  requireAuth,
  requireRole("collector", "admin"),
  async (req, res, next) => {
    try {
      const auth = res.locals.auth as AuthContext;
      const params = AcceptPickupParams.parse(req.params);

      const result = await db.transaction(async (tx) => {
        const pickupRows = await tx
          .select()
          .from(pickupRequestsTable)
          .where(eq(pickupRequestsTable.id, params.id))
          .limit(1);
        const pickup = pickupRows[0];
        if (!pickup) throw notFound("Pickup not found");
        if (pickup.status !== "pending") throw conflict("Pickup is not available");

        const assignmentExisting = await tx
          .select({ pickupRequestId: pickupAssignmentsTable.pickupRequestId })
          .from(pickupAssignmentsTable)
          .where(eq(pickupAssignmentsTable.pickupRequestId, params.id))
          .limit(1);
        if (assignmentExisting.length) throw conflict("Pickup already accepted");

        await tx.insert(pickupAssignmentsTable).values({
          pickupRequestId: params.id,
          collectorUserId: auth.userId,
        });

        const updated = await tx
          .update(pickupRequestsTable)
          .set({ status: "accepted", acceptedAt: new Date() })
          .where(eq(pickupRequestsTable.id, params.id))
          .returning();

        const updatedPickup = updated[0];
        if (!updatedPickup) throw new Error("Failed to accept pickup");

        await tx.insert(pickupEventsTable).values({
          pickupRequestId: params.id,
          type: "accepted",
          payload: { collectorUserId: auth.userId },
        });

        return updatedPickup;
      });

      const data = AcceptPickupResponse.parse(mapPickup(result, auth.userId));

      void notifyUserByFcm({
        userId: result.householdUserId,
        title: "Pickup accepted",
        body: "A collector has accepted your request and is on the way.",
        data: { pickupId: String(result.id), event: "pickup_accepted" },
      });

      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/pickups/:id/weight",
  requireAuth,
  requireRole("collector", "admin"),
  async (req, res, next) => {
    try {
      const auth = res.locals.auth as AuthContext;
      const params = EnterPickupWeightParams.parse(req.params);
      const body = EnterPickupWeightBody.parse(req.body);

      const pickup = await db.transaction(async (tx) => {
        const assignment = await tx
          .select()
          .from(pickupAssignmentsTable)
          .where(eq(pickupAssignmentsTable.pickupRequestId, params.id))
          .limit(1);
        const a = assignment[0];
        if (!a) throw forbidden("Pickup is not assigned");
        if (a.collectorUserId !== auth.userId && auth.role !== "admin") throw forbidden();

        const updated = await tx
          .update(pickupRequestsTable)
          .set({ status: "in_progress" })
          .where(eq(pickupRequestsTable.id, params.id))
          .returning();
        const p = updated[0];
        if (!p) throw notFound("Pickup not found");

        await tx.insert(pickupEventsTable).values({
          pickupRequestId: params.id,
          type: "weight_entered",
          payload: { finalWeightKg: body.finalWeightKg },
        });

        // We don't persist weight on pickup itself in the schema; receipt will store final weight.
        return p;
      });

      const data = EnterPickupWeightResponse.parse(mapPickup(pickup, auth.userId));
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/pickups/:id/complete",
  requireAuth,
  requireRole("collector", "admin"),
  async (req, res, next) => {
    try {
      const auth = res.locals.auth as AuthContext;
      const params = CompletePickupParams.parse(req.params);

      const out = await db.transaction(async (tx) => {
        const assignmentRows = await tx
          .select()
          .from(pickupAssignmentsTable)
          .where(eq(pickupAssignmentsTable.pickupRequestId, params.id))
          .limit(1);
        const assignment = assignmentRows[0];
        if (!assignment) throw forbidden("Pickup is not assigned");
        if (assignment.collectorUserId !== auth.userId && auth.role !== "admin") throw forbidden();

        const pickupRows = await tx
          .select()
          .from(pickupRequestsTable)
          .where(eq(pickupRequestsTable.id, params.id))
          .limit(1);
        const pickup = pickupRows[0];
        if (!pickup) throw notFound("Pickup not found");
        if (pickup.status === "completed" || pickup.status === "cancelled")
          throw conflict("Pickup is already finalized");

        // Determine final weight from last weight_entered event if present.
        const lastWeightEvent = await tx
          .select({ payload: pickupEventsTable.payload })
          .from(pickupEventsTable)
          .where(
            and(
              eq(pickupEventsTable.pickupRequestId, params.id),
              eq(pickupEventsTable.type, "weight_entered"),
            ),
          );

        let finalWeightKg = 0;
        const last = lastWeightEvent.at(-1)?.payload as { finalWeightKg?: number } | null | undefined;
        if (last?.finalWeightKg !== undefined) finalWeightKg = last.finalWeightKg;

        const locationRows = await tx
          .select({ city: pickupLocationsTable.city })
          .from(pickupLocationsTable)
          .where(eq(pickupLocationsTable.pickupRequestId, params.id))
          .limit(1);

        const collectorCityRows = await tx
          .select({ city: collectorProfilesTable.city })
          .from(collectorProfilesTable)
          .where(eq(collectorProfilesTable.userId, assignment.collectorUserId))
          .limit(1);

        const rewardCity =
          locationRows[0]?.city ?? collectorCityRows[0]?.city ?? null;

        const { pointsAwarded, pointsPerKg } = await calculatePickupPoints({
          wasteType: pickup.wasteType,
          finalWeightKg,
          city: rewardCity,
        });

        const receiptInserted = await tx
          .insert(receiptsTable)
          .values({
            pickupRequestId: params.id,
            finalWeightKg: String(finalWeightKg),
            pointsAwarded,
          })
          .onConflictDoNothing()
          .returning();
        const receipt = receiptInserted[0] ?? null;

        if (receipt) {
          const existingEarnedRows = await tx
            .select({ id: pointsLedgerTable.id })
            .from(pointsLedgerTable)
            .where(
              and(
                eq(pointsLedgerTable.userId, pickup.householdUserId),
                eq(pointsLedgerTable.type, "earned"),
                eq(pointsLedgerTable.pickupRequestId, params.id),
              ),
            )
            .limit(1);

          if (!existingEarnedRows[0]) {
            await tx.insert(pointsLedgerTable).values({
              userId: pickup.householdUserId,
              pickupRequestId: params.id,
              type: "earned",
              points: pointsAwarded,
              metadata: {
                wasteType: pickup.wasteType,
                finalWeightKg,
                pointsPerKg,
              },
            });
          }
        }

        const updatedPickup = await tx
          .update(pickupRequestsTable)
          .set({ status: "completed", completedAt: new Date() })
          .where(eq(pickupRequestsTable.id, params.id))
          .returning();
        const p = updatedPickup[0];
        if (!p) throw new Error("Failed to complete pickup");

        await tx.insert(pickupEventsTable).values({
          pickupRequestId: params.id,
          type: "completed",
          payload: { pointsAwarded },
        });

        // Privacy: delete location once pickup is finalized.
        await tx
          .delete(pickupLocationsTable)
          .where(eq(pickupLocationsTable.pickupRequestId, params.id));

        return { pickup: p, receipt };
      });

      const data = CompletePickupResponse.parse({
        pickup: mapPickup(out.pickup, auth.userId),
        location: null,
        receipt: out.receipt ? mapReceipt(out.receipt) : null,
      });

      if (out.receipt) {
        void notifyUserByFcm({
          userId: out.pickup.householdUserId,
          title: "Pickup completed",
          body: `You earned ${out.receipt.pointsAwarded} Green Points.`,
          data: { pickupId: String(out.pickup.id), event: "pickup_completed" },
        });
      }

      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

export default router;

