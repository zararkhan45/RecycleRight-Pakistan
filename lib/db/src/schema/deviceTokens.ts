import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { usersTable } from "./users";

export const devicePlatformEnum = pgEnum("device_platform", ["android", "ios", "web"]);

export const deviceTokensTable = pgTable(
  "device_tokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    platform: devicePlatformEnum("platform").notNull(),
    token: text("token").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tokenUq: uniqueIndex("device_tokens_token_uq").on(t.token),
    userIdx: index("device_tokens_user_id_idx").on(t.userId),
  }),
);

export type InsertDeviceToken = typeof deviceTokensTable.$inferInsert;
export type DeviceToken = typeof deviceTokensTable.$inferSelect;
