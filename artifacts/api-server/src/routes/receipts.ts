import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";

import { GetReceiptByPickupIdParams, GetReceiptByPickupIdResponse } from "@workspace/api-zod";
import { db, receiptsTable } from "@workspace/db";

import { mapReceipt } from "../lib/dbMappers";
import { notFound } from "../lib/httpErrors";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

router.get("/receipts/:pickupId", requireAuth, async (req, res, next) => {
  try {
    const params = GetReceiptByPickupIdParams.parse(req.params);

    const rows = await db
      .select()
      .from(receiptsTable)
      .where(eq(receiptsTable.pickupRequestId, params.pickupId))
      .limit(1);

    const receipt = rows[0];
    if (!receipt) throw notFound("Receipt not found");

    const data = GetReceiptByPickupIdResponse.parse(mapReceipt(receipt));
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;

