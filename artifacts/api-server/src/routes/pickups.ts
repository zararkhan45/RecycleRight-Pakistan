import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";

import {
  CreatePickupBody,
  GetPickupByIdParams,
  GetPickupByIdResponse,
  ListMyPickupsResponseItem,
  ListMyPickupsResponse,
} from "@workspace/api-zod";
import {
  db,
  pickupAssignmentsTable,
  pickupLocationsTable,
  pickupRequestsTable,
  receiptsTable,
} from "@workspace/db";

import { mapPickup, mapReceipt } from "../lib/dbMappers";
import { forbidden, notFound } from "../lib/httpErrors";
import { requireAuth, requireRole, type AuthContext } from "../middleware/auth";

const router: IRouter = Router();

router.post(
  "/pickups",
  requireAuth,
  requireRole("household", "admin"),
  async (req, res, next) => {
    try {
      const auth = res.locals.auth as AuthContext;
      const body = CreatePickupBody.parse(req.body);

      const created = await db.transaction(async (tx) => {
        const insertedPickups = await tx
          .insert(pickupRequestsTable)
          .values({
            householdUserId: auth.userId,
            wasteType: body.wasteType,
            estimatedWeightKg:
              body.estimatedWeightKg === null || body.estimatedWeightKg === undefined
                ? null
                : String(body.estimatedWeightKg),
            status: "pending",
          })
          .returning();

        const pickup = insertedPickups[0];
        if (!pickup) throw new Error("Failed to create pickup");

        await tx.insert(pickupLocationsTable).values({
          pickupRequestId: pickup.id,
          lat: body.location.lat,
          lng: body.location.lng,
          addressLabel: body.location.addressLabel ?? null,
          area: body.location.area ?? null,
          city: body.location.city ?? null,
        });

        return pickup;
      });

      const data = ListMyPickupsResponseItem.parse(mapPickup(created, null));
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  },
);

router.get("/pickups/mine", requireAuth, async (_req, res, next) => {
  try {
    const auth = res.locals.auth as AuthContext;

    const rows = await db
      .select({
        pickup: pickupRequestsTable,
        assignedCollectorUserId: pickupAssignmentsTable.collectorUserId,
      })
      .from(pickupRequestsTable)
      .leftJoin(
        pickupAssignmentsTable,
        eq(pickupAssignmentsTable.pickupRequestId, pickupRequestsTable.id),
      )
      .where(eq(pickupRequestsTable.householdUserId, auth.userId))
      .orderBy(desc(pickupRequestsTable.createdAt));

    const data = ListMyPickupsResponse.parse(
      rows.map((r) => mapPickup(r.pickup, r.assignedCollectorUserId ?? null)),
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/pickups/:id", requireAuth, async (req, res, next) => {
  try {
    const auth = res.locals.auth as AuthContext;
    const params = GetPickupByIdParams.parse(req.params);

    const pickupRows = await db
      .select({
        pickup: pickupRequestsTable,
        assignmentCollectorUserId: pickupAssignmentsTable.collectorUserId,
        location: pickupLocationsTable,
        receipt: receiptsTable,
      })
      .from(pickupRequestsTable)
      .leftJoin(
        pickupAssignmentsTable,
        eq(pickupAssignmentsTable.pickupRequestId, pickupRequestsTable.id),
      )
      .leftJoin(pickupLocationsTable, eq(pickupLocationsTable.pickupRequestId, pickupRequestsTable.id))
      .leftJoin(receiptsTable, eq(receiptsTable.pickupRequestId, pickupRequestsTable.id))
      .where(eq(pickupRequestsTable.id, params.id))
      .limit(1);

    const row = pickupRows[0];
    if (!row) throw notFound("Pickup not found");

    const pickup = row.pickup;
    const assignedCollectorUserId = row.assignmentCollectorUserId ?? null;

    const isHouseholdOwner = pickup.householdUserId === auth.userId;
    const isAssignedCollector = assignedCollectorUserId === auth.userId;
    const isAdmin = auth.role === "admin";
    if (!isAdmin && !isHouseholdOwner && !isAssignedCollector) throw forbidden();

    const data = GetPickupByIdResponse.parse({
      pickup: mapPickup(pickup, assignedCollectorUserId),
      location: row.location
        ? {
            lat: row.location.lat,
            lng: row.location.lng,
            addressLabel: row.location.addressLabel ?? null,
            area: row.location.area ?? null,
            city: row.location.city ?? null,
          }
        : null,
      receipt: row.receipt ? mapReceipt(row.receipt) : null,
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;

