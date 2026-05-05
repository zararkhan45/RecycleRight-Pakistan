import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

import { pickupRequestsTable } from "./pickupRequests";
import { usersTable } from "./users";

export const pointsTransactionTypeEnum = pgEnum("points_transaction_type", [
  "earned",
  "redeemed",
  "adjustment",
  "expired",
]);

export const pointsLedgerTable = pgTable(
  "points_ledger",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    pickupRequestId: integer("pickup_request_id").references(() => pickupRequestsTable.id, {
      onDelete: "set null",
    }),
    type: pointsTransactionTypeEnum("type").notNull(),
    points: integer("points").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("points_ledger_user_id_idx").on(t.userId),
    pickupIdx: index("points_ledger_pickup_request_id_idx").on(t.pickupRequestId),
    typeIdx: index("points_ledger_type_idx").on(t.type),
  }),
);

export type InsertPointsLedger = typeof pointsLedgerTable.$inferInsert;
export type PointsLedger = typeof pointsLedgerTable.$inferSelect;
