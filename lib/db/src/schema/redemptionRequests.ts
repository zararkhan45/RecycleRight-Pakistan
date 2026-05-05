import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { usersTable } from "./users";

export const redemptionStatusEnum = pgEnum("redemption_status", [
  "pending",
  "succeeded",
  "failed",
]);

export const redemptionRequestsTable = pgTable(
  "redemption_requests",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    operator: text("operator").notNull(),
    mobileNumber: text("mobile_number").notNull(),
    amountPkr: integer("amount_pkr").notNull(),
    pointsSpent: integer("points_spent").notNull(),
    status: redemptionStatusEnum("status").notNull().default("pending"),
    providerReference: text("provider_reference"),
    providerPayload: jsonb("provider_payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => ({
    userIdx: index("redemption_requests_user_id_idx").on(t.userId),
    statusIdx: index("redemption_requests_status_idx").on(t.status),
  }),
);

export type InsertRedemptionRequest = typeof redemptionRequestsTable.$inferInsert;
export type RedemptionRequest = typeof redemptionRequestsTable.$inferSelect;
