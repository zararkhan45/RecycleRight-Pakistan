import { index, integer, jsonb, pgEnum, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { pickupRequestsTable } from "./pickupRequests";

export const pickupEventTypeEnum = pgEnum("pickup_event_type", [
  "created",
  "accepted",
  "started",
  "weight_entered",
  "completed",
  "cancelled",
]);

export const pickupEventsTable = pgTable(
  "pickup_events",
  {
    id: serial("id").primaryKey(),
    pickupRequestId: integer("pickup_request_id")
      .notNull()
      .references(() => pickupRequestsTable.id, { onDelete: "cascade" }),
    type: pickupEventTypeEnum("type").notNull(),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pickupIdx: index("pickup_events_pickup_request_id_idx").on(t.pickupRequestId),
    createdAtIdx: index("pickup_events_created_at_idx").on(t.createdAt),
  }),
);

export type InsertPickupEvent = typeof pickupEventsTable.$inferInsert;
export type PickupEvent = typeof pickupEventsTable.$inferSelect;

