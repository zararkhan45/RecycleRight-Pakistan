import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { usersTable } from "./users";

export const collectorProfilesTable = pgTable("collector_profiles", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  approvedBy: integer("approved_by").references(() => usersTable.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),

  city: text("city"),
  zone: text("zone"),
});

export type InsertCollectorProfile = typeof collectorProfilesTable.$inferInsert;
export type CollectorProfile = typeof collectorProfilesTable.$inferSelect;

