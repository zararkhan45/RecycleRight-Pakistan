import { index, integer, pgTable, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { pickupRequestsTable } from "./pickupRequests";
import { usersTable } from "./users";

export const pickupAssignmentsTable = pgTable(
  "pickup_assignments",
  {
    pickupRequestId: integer("pickup_request_id")
      .notNull()
      .references(() => pickupRequestsTable.id, { onDelete: "cascade" }),
    collectorUserId: integer("collector_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pickupUq: uniqueIndex("pickup_assignments_pickup_request_id_uq").on(t.pickupRequestId),
    collectorIdx: index("pickup_assignments_collector_user_id_idx").on(t.collectorUserId),
  }),
);

export type InsertPickupAssignment = typeof pickupAssignmentsTable.$inferInsert;
export type PickupAssignment = typeof pickupAssignmentsTable.$inferSelect;

