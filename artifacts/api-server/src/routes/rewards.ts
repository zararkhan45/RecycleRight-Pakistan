import { Router, type IRouter } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import {
  db,
  pointsLedgerTable,
  redemptionRequestsTable,
  rewardRulesTable,
} from "@workspace/db";

import { badRequest, conflict } from "../lib/httpErrors";
import { notifyUserByFcm } from "../lib/pushNotifications";
import { getPointsBalance } from "../lib/rewards";
import { redeemMobileTopup } from "../lib/topupProvider";
import { requireAuth, requireRole, type AuthContext } from "../middleware/auth";

const router: IRouter = Router();

const RedeemPointsBody = z.object({
  operator: z.enum(["jazz", "zong", "telenor", "ufone"]),
  mobileNumber: z
    .string()
    .regex(/^(03\d{9}|\+923\d{9})$/, "Use Pakistan mobile format (03XXXXXXXXX or +923XXXXXXXXX)"),
  amountPkr: z.number().int().min(10).max(5000),
});

const RewardRuleBody = z.object({
  wasteType: z.string().min(1),
  city: z.string().trim().min(1).optional().nullable(),
  pointsPerKg: z.number().int().min(1).max(500),
  isActive: z.boolean().optional(),
});

router.get("/rewards/balance", requireAuth, async (_req, res, next) => {
  try {
    const auth = res.locals.auth as AuthContext;
    const balance = await getPointsBalance(auth.userId);
    res.json({ userId: auth.userId, balance });
  } catch (err) {
    next(err);
  }
});

router.get("/rewards/rules", requireAuth, requireRole("admin"), async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(rewardRulesTable)
      .orderBy(rewardRulesTable.wasteType, rewardRulesTable.city);

    res.json(
      rows.map((row) => ({
        id: row.id,
        wasteType: row.wasteType,
        city: row.city,
        pointsPerKg: row.pointsPerKg,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
    );
  } catch (err) {
    next(err);
  }
});

router.post("/rewards/rules", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const body = RewardRuleBody.parse(req.body);
    const normalizedWasteType = body.wasteType.trim().toLowerCase();
    const normalizedCity = body.city?.trim() || null;

    const existing = await db
      .select({ id: rewardRulesTable.id })
      .from(rewardRulesTable)
      .where(
        normalizedCity
          ? and(eq(rewardRulesTable.wasteType, normalizedWasteType), eq(rewardRulesTable.city, normalizedCity))
          : and(eq(rewardRulesTable.wasteType, normalizedWasteType), isNull(rewardRulesTable.city)),
      )
      .limit(1);

    const now = new Date();
    if (existing[0]) {
      const updated = await db
        .update(rewardRulesTable)
        .set({
          pointsPerKg: body.pointsPerKg,
          isActive: body.isActive ?? true,
          updatedAt: now,
        })
        .where(eq(rewardRulesTable.id, existing[0].id))
        .returning();

      res.json(updated[0]);
      return;
    }

    const inserted = await db
      .insert(rewardRulesTable)
      .values({
        wasteType: normalizedWasteType,
        city: normalizedCity,
        pointsPerKg: body.pointsPerKg,
        isActive: body.isActive ?? true,
        updatedAt: now,
      })
      .returning();

    res.status(201).json(inserted[0]);
  } catch (err) {
    next(err);
  }
});

router.post("/rewards/redeem", requireAuth, requireRole("household", "admin"), async (req, res, next) => {
  try {
    const auth = res.locals.auth as AuthContext;
    const body = RedeemPointsBody.parse(req.body);

    const pointsPerPkr = Number(process.env.REDEMPTION_POINTS_PER_PKR ?? "10");
    if (!Number.isFinite(pointsPerPkr) || pointsPerPkr <= 0) {
      throw badRequest("REDEMPTION_POINTS_PER_PKR must be a positive number");
    }

    const pointsSpent = Math.round(body.amountPkr * pointsPerPkr);
    const currentBalance = await getPointsBalance(auth.userId);
    if (currentBalance < pointsSpent) {
      throw conflict("Insufficient Green Points");
    }

    const created = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(redemptionRequestsTable)
        .values({
          userId: auth.userId,
          operator: body.operator,
          mobileNumber: body.mobileNumber,
          amountPkr: body.amountPkr,
          pointsSpent,
          status: "pending",
        })
        .returning();

      const redemption = inserted[0];
      if (!redemption) throw new Error("Failed to create redemption request");

      await tx.insert(pointsLedgerTable).values({
        userId: auth.userId,
        type: "redeemed",
        points: -pointsSpent,
        metadata: {
          redemptionRequestId: redemption.id,
          operator: body.operator,
          mobileNumber: body.mobileNumber,
          amountPkr: body.amountPkr,
        },
      });

      return redemption;
    });

    const providerResult = await redeemMobileTopup({
      operator: body.operator,
      mobileNumber: body.mobileNumber,
      amountPkr: body.amountPkr,
      reference: `rr-${created.id}`,
    });

    if (!providerResult.succeeded) {
      await db.transaction(async (tx) => {
        await tx
          .update(redemptionRequestsTable)
          .set({
            status: "failed",
            providerReference: providerResult.providerReference,
            providerPayload: providerResult.payload,
            completedAt: new Date(),
          })
          .where(eq(redemptionRequestsTable.id, created.id));

        await tx.insert(pointsLedgerTable).values({
          userId: auth.userId,
          type: "adjustment",
          points: pointsSpent,
          metadata: {
            reason: "redeem_failed_refund",
            redemptionRequestId: created.id,
          },
        });
      });

      void notifyUserByFcm({
        userId: auth.userId,
        title: "Top-up redemption failed",
        body: "Your points were refunded. Please try again.",
        data: { redemptionId: String(created.id), event: "redeem_failed" },
      });

      res.status(502).json({
        id: created.id,
        status: "failed",
        pointsSpent,
      });
      return;
    }

    await db
      .update(redemptionRequestsTable)
      .set({
        status: "succeeded",
        providerReference: providerResult.providerReference,
        providerPayload: providerResult.payload,
        completedAt: new Date(),
      })
      .where(eq(redemptionRequestsTable.id, created.id));

    const balance = await getPointsBalance(auth.userId);
    void notifyUserByFcm({
      userId: auth.userId,
      title: "Top-up redeemed",
      body: `PKR ${body.amountPkr} has been redeemed successfully.`,
      data: { redemptionId: String(created.id), event: "redeem_succeeded" },
    });

    res.status(201).json({
      id: created.id,
      status: "succeeded",
      pointsSpent,
      balance,
      providerReference: providerResult.providerReference,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
