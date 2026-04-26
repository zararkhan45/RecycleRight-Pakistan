import {
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { usersTable } from "./users";

export const pickupStatusEnum = pgEnum("pickup_status", [
  "pending",
  "accepted",
  "in_progress",
  "completed",
  "cancelled",
]);

export const pickupRequestsTable = pgTable(
  "pickup_requests",
  {
    id: serial("id").primaryKey(),

    householdUserId: integer("household_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),

    wasteType: text("waste_type").notNull(),
    estimatedWeightKg: numeric("estimated_weight_kg", { precision: 10, scale: 2 }),

    status: pickupStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => ({
    statusIdx: index("pickup_requests_status_idx").on(t.status),
    createdAtIdx: index("pickup_requests_created_at_idx").on(t.createdAt),
    householdIdx: index("pickup_requests_household_user_id_idx").on(t.householdUserId),
  }),
);

export type InsertPickupRequest = typeof pickupRequestsTable.$inferInsert;
export type PickupRequest = typeof pickupRequestsTable.$inferSelect;

