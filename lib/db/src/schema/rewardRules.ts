import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const rewardRulesTable = pgTable(
  "reward_rules",
  {
    id: serial("id").primaryKey(),
    wasteType: text("waste_type").notNull(),
    city: text("city"),
    pointsPerKg: integer("points_per_kg").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    wasteTypeCityUq: uniqueIndex("reward_rules_waste_type_city_uq").on(t.wasteType, t.city),
  }),
);

export type InsertRewardRule = typeof rewardRulesTable.$inferInsert;
export type RewardRule = typeof rewardRulesTable.$inferSelect;
