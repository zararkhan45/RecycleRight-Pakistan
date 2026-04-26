import { doublePrecision, index, integer, pgTable, text } from "drizzle-orm/pg-core";

import { pickupRequestsTable } from "./pickupRequests";

export const pickupLocationsTable = pgTable(
  "pickup_locations",
  {
    pickupRequestId: integer("pickup_request_id")
      .primaryKey()
      .references(() => pickupRequestsTable.id, { onDelete: "cascade" }),

    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),

    addressLabel: text("address_label"),
    area: text("area"),
    city: text("city"),
  },
  (t) => ({
    latLngIdx: index("pickup_locations_lat_lng_idx").on(t.lat, t.lng),
  }),
);

export type InsertPickupLocation = typeof pickupLocationsTable.$inferInsert;
export type PickupLocation = typeof pickupLocationsTable.$inferSelect;

