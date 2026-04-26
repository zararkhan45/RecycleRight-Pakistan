import { integer, numeric, pgTable, serial, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { pickupRequestsTable } from "./pickupRequests";

export const receiptsTable = pgTable(
  "receipts",
  {
    id: serial("id").primaryKey(),
    pickupRequestId: integer("pickup_request_id")
      .notNull()
      .references(() => pickupRequestsTable.id, { onDelete: "cascade" }),
    finalWeightKg: numeric("final_weight_kg", { precision: 10, scale: 2 }).notNull(),
    pointsAwarded: integer("points_awarded").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pickupUq: uniqueIndex("receipts_pickup_request_id_uq").on(t.pickupRequestId),
  }),
);

export type InsertReceipt = typeof receiptsTable.$inferInsert;
export type Receipt = typeof receiptsTable.$inferSelect;

