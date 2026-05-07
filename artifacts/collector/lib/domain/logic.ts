import { DomainError, invariant } from "./errors";
import type {
  CollectorProfile,
  LatLng,
  Location,
  NotificationEvent,
  PickupRequest,
  Receipt,
  User,
  WasteType,
} from "./types";
import type { LiveTrackingService, NotificationService, RoutingService, RouteResult } from "./services";
import type { Store } from "./store";
import { distanceMeters, nextId, nowMs } from "./utils";

export type Services = {
  routing: RoutingService;
  notifications: NotificationService;
  liveTracking: LiveTrackingService;
};

export function registerUser(store: Store, input: { email: string; name: string; role: User["role"] }): User {
  invariant(input.email.includes("@"), "VALIDATION_EMAIL", "Invalid email");
  invariant(input.name.trim().length >= 2, "VALIDATION_NAME", "Name too short");
  const id = nextId("user");
  const user: User = { id, email: input.email.trim().toLowerCase(), name: input.name.trim(), role: input.role };
  store.users.set(id, user);
  if (input.role === "collector") {
    const profile: CollectorProfile = { userId: id, status: "pending" };
    store.collectors.set(id, profile);
  }
  return user;
}

export function approveCollector(store: Store, admin: User, collectorUserId: string) {
  invariant(admin.role === "admin", "AUTHZ_ADMIN", "Admin required");
  const prof = store.collectors.get(collectorUserId);
  invariant(prof, "NOT_FOUND_COLLECTOR", "Collector not found");
  prof.status = "approved";
}

export function suspendCollector(store: Store, admin: User, collectorUserId: string) {
  invariant(admin.role === "admin", "AUTHZ_ADMIN", "Admin required");
  const prof = store.collectors.get(collectorUserId);
  invariant(prof, "NOT_FOUND_COLLECTOR", "Collector not found");
  prof.status = "suspended";
}

export function createPickup(
  store: Store,
  household: User,
  input: { wasteType: WasteType; estimatedWeightKg: number; location: Location }
): PickupRequest {
  invariant(household.role === "household", "AUTHZ_HOUSEHOLD", "Household required");
  invariant(input.estimatedWeightKg > 0, "VALIDATION_WEIGHT", "Estimated weight must be > 0");
  invariant(Number.isFinite(input.location.lat) && Number.isFinite(input.location.lng), "VALIDATION_LOCATION", "Invalid location");

  const pickup: PickupRequest = {
    id: nextId("pickup"),
    householdUserId: household.id,
    collectorUserId: null,
    status: "pending",
    wasteType: input.wasteType,
    estimatedWeightKg: input.estimatedWeightKg,
    actualWeightKg: null,
    location: { ...input.location },
    createdAt: nowMs(),
    acceptedAt: null,
    completedAt: null,
  };
  store.pickups.set(pickup.id, pickup);
  return pickup;
}

export function listNearbyPickups(store: Store, collectorLoc: LatLng, radiusMeters: number): Array<{ pickup: PickupRequest; distanceMeters: number }> {
  const out: Array<{ pickup: PickupRequest; distanceMeters: number }> = [];
  for (const p of store.pickups.values()) {
    if (p.status !== "pending") continue;
    if (!p.location) continue;
    const d = distanceMeters(collectorLoc, p.location);
    if (d <= radiusMeters) out.push({ pickup: p, distanceMeters: Math.round(d) });
  }
  out.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return out;
}

export function computeHotspots(nearby: Array<{ pickup: PickupRequest; distanceMeters: number }>) {
  // simple aggregation by rounding coordinates
  const buckets = new Map<string, { key: string; lat: number; lng: number; count: number }>();
  for (const { pickup } of nearby) {
    if (!pickup.location) continue;
    const lat = Math.round(pickup.location.lat * 100) / 100;
    const lng = Math.round(pickup.location.lng * 100) / 100;
    const key = `${lat},${lng}`;
    const b = buckets.get(key) ?? { key, lat, lng, count: 0 };
    b.count += 1;
    buckets.set(key, b);
  }
  return [...buckets.values()].sort((a, b) => b.count - a.count);
}

function requireCollectorApproved(store: Store, collector: User) {
  invariant(collector.role === "collector", "AUTHZ_COLLECTOR", "Collector required");
  const prof = store.collectors.get(collector.id);
  invariant(prof, "NOT_FOUND_COLLECTOR", "Collector profile missing");
  invariant(prof.status !== "pending", "COLLECTOR_PENDING", "Collector not approved");
  invariant(prof.status !== "suspended", "COLLECTOR_SUSPENDED", "Collector suspended");
}

export async function acceptPickup(store: Store, services: Services, collector: User, pickupId: string): Promise<PickupRequest> {
  requireCollectorApproved(store, collector);
  const p = store.pickups.get(pickupId);
  invariant(p, "NOT_FOUND_PICKUP", "Pickup not found");
  invariant(p.status === "pending", "PICKUP_NOT_PENDING", "Pickup not available");

  p.status = "accepted";
  p.collectorUserId = collector.id;
  p.acceptedAt = nowMs();

  const event: NotificationEvent = { type: "pickup.accepted", pickupId: p.id, collectorUserId: collector.id };
  await services.notifications.publishToHousehold(p.householdUserId, event);
  return p;
}

export async function getRouteToPickup(
  services: Services,
  input: { from: LatLng; pickupLocation: LatLng; hasValidMapsKey: boolean }
): Promise<RouteResult> {
  return services.routing.getRoute({ from: input.from, to: input.pickupLocation, hasValidMapsKey: input.hasValidMapsKey });
}

export function updateCollectorLocation(services: Services, collector: User, loc: LatLng) {
  invariant(collector.role === "collector", "AUTHZ_COLLECTOR", "Collector required");
  services.liveTracking.setCollectorLocation(collector.id, loc);
}

export function getCollectorLiveLocation(services: Services, household: User, assignedCollectorUserId: string): LatLng | null {
  invariant(household.role === "household", "AUTHZ_HOUSEHOLD", "Household required");
  return services.liveTracking.getLastLocation(assignedCollectorUserId);
}

export async function completePickup(
  store: Store,
  services: Services,
  collector: User,
  input: { pickupId: string; actualWeightKg: number; pointsPerKg: number }
): Promise<{ pickup: PickupRequest; receipt: Receipt }> {
  requireCollectorApproved(store, collector);
  invariant(input.actualWeightKg > 0, "VALIDATION_WEIGHT", "Actual weight must be > 0");
  invariant(input.pointsPerKg > 0, "VALIDATION_POINTS", "Points per kg must be > 0");

  const p = store.pickups.get(input.pickupId);
  invariant(p, "NOT_FOUND_PICKUP", "Pickup not found");
  invariant(p.collectorUserId === collector.id, "AUTHZ_ASSIGNED_COLLECTOR", "Not assigned to this pickup");
  invariant(p.status === "accepted" || p.status === "en_route", "PICKUP_NOT_ACTIVE", "Pickup not active");

  p.status = "completed";
  p.actualWeightKg = input.actualWeightKg;
  p.completedAt = nowMs();

  const pointsAwarded = Math.round(input.actualWeightKg * input.pointsPerKg);
  const receipt: Receipt = {
    id: nextId("rcpt"),
    pickupId: p.id,
    householdUserId: p.householdUserId,
    collectorUserId: collector.id,
    wasteType: p.wasteType,
    weightKg: input.actualWeightKg,
    pointsAwarded,
    createdAt: p.completedAt,
  };
  store.receipts.set(receipt.id, receipt);

  // credit points to household
  store.ledger.push({
    id: nextId("led"),
    userId: p.householdUserId,
    type: "credit",
    points: pointsAwarded,
    reference: { kind: "pickup", id: p.id },
    createdAt: p.completedAt,
  });

  // privacy requirement: hide/delete precise location after completion
  p.location = null;

  await services.notifications.publishToHousehold(p.householdUserId, {
    type: "pickup.completed",
    pickupId: p.id,
    receiptId: receipt.id,
  });

  return { pickup: p, receipt };
}

export function getPointsBalance(store: Store, userId: string): number {
  return store.ledger
    .filter((e) => e.userId === userId)
    .reduce((sum, e) => sum + (e.type === "credit" ? e.points : -e.points), 0);
}

export function getPointsBreakdown(store: Store, userId: string) {
  return store.ledger.filter((e) => e.userId === userId).slice().sort((a, b) => a.createdAt - b.createdAt);
}

export function redeemPoints(store: Store, household: User, input: { points: number }): { redemptionId: string; newBalance: number } {
  invariant(household.role === "household", "AUTHZ_HOUSEHOLD", "Household required");
  invariant(input.points > 0, "VALIDATION_POINTS", "Points must be > 0");
  const bal = getPointsBalance(store, household.id);
  invariant(bal >= input.points, "INSUFFICIENT_POINTS", "Insufficient points");
  const redemptionId = nextId("redeem");
  store.ledger.push({
    id: nextId("led"),
    userId: household.id,
    type: "debit",
    points: input.points,
    reference: { kind: "redeem", id: redemptionId },
    createdAt: nowMs(),
  });
  return { redemptionId, newBalance: getPointsBalance(store, household.id) };
}

export function roleHomeRoute(user: User): "HouseholdHome" | "CollectorHome" | "AdminHome" {
  if (user.role === "household") return "HouseholdHome";
  if (user.role === "collector") return "CollectorHome";
  return "AdminHome";
}

export function assertJwtExpirySeconds(seconds: number) {
  // requirement: 24h expiry
  const expected = 24 * 60 * 60;
  if (seconds !== expected) throw new DomainError("JWT_EXPIRY_INVALID", `Expected ${expected}s, got ${seconds}s`);
}

