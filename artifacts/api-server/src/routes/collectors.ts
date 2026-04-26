import { Router, type IRouter } from "express";
import { and, eq, gte } from "drizzle-orm";

import { GetMyEarningsQueryParams, GetMyEarningsResponse } from "@workspace/api-zod";
import { db, pickupAssignmentsTable, pickupRequestsTable, receiptsTable } from "@workspace/db";

import { requireAuth, requireRole, type AuthContext } from "../middleware/auth";

const router: IRouter = Router();

router.get(
  "/collectors/me/earnings",
  requireAuth,
  requireRole("collector", "admin"),
  async (req, res, next) => {
    try {
      const auth = res.locals.auth as AuthContext;
      const query = GetMyEarningsQueryParams.parse(req.query);

      const now = new Date();
      const from = new Date(now);
      if (query.range === "daily") {
        from.setDate(now.getDate() - 1);
      } else {
        from.setDate(now.getDate() - 7);
      }

      const rows = await db
        .select({
          pointsAwarded: receiptsTable.pointsAwarded,
        })
        .from(receiptsTable)
        .innerJoin(
          pickupRequestsTable,
          eq(pickupRequestsTable.id, receiptsTable.pickupRequestId),
        )
        .innerJoin(
          pickupAssignmentsTable,
          eq(pickupAssignmentsTable.pickupRequestId, pickupRequestsTable.id),
        )
        .where(
          and(
            eq(pickupAssignmentsTable.collectorUserId, auth.userId),
            gte(receiptsTable.issuedAt, from),
          ),
        );

      const pointsTotal = rows.reduce((sum, r) => sum + (r.pointsAwarded ?? 0), 0);

      const data = GetMyEarningsResponse.parse({
        range: query.range,
        pointsTotal,
        pickupsCompleted: rows.length,
        from,
        to: now,
      });

      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

export default router;

