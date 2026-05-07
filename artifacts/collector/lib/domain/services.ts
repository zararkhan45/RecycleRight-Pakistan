import type { LatLng, NotificationEvent } from "./types";

export type RouteResult = {
  polyline: LatLng[];
  etaSeconds: number;
  distanceMeters: number;
  source: "maps" | "fallback";
};

export type RoutingService = {
  getRoute(input: { from: LatLng; to: LatLng; hasValidMapsKey: boolean }): Promise<RouteResult>;
};

export type NotificationService = {
  publishToHousehold(householdUserId: string, event: NotificationEvent): Promise<void>;
};

export type LiveTrackingService = {
  start(pickupId: string, collectorUserId: string): { stop(): void };
  getLastLocation(collectorUserId: string): LatLng | null;
  setCollectorLocation(collectorUserId: string, loc: LatLng): void;
};

