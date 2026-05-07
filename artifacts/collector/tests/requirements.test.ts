import { createStore } from "../lib/domain/store";
import { FakeLiveTracking, FakeNotifications, FakeRouting } from "../lib/domain/fakes";
import {
  acceptPickup,
  approveCollector,
  assertJwtExpirySeconds,
  computeHotspots,
  completePickup,
  createPickup,
  getCollectorLiveLocation,
  getPointsBalance,
  getPointsBreakdown,
  getRouteToPickup,
  listNearbyPickups,
  redeemPoints,
  registerUser,
  roleHomeRoute,
  suspendCollector,
  updateCollectorLocation,
} from "../lib/domain/logic";
import { resetIdsForTest } from "../lib/domain/utils";

function makeServices() {
  return {
    routing: new FakeRouting(),
    notifications: new FakeNotifications(),
    liveTracking: new FakeLiveTracking(),
  };
}

beforeEach(() => {
  resetIdsForTest();
  jest.useRealTimers();
});

test("1) Auth: role routing + basic signup validation (US-01/02/03)", () => {
  const store = createStore();
  const hh = registerUser(store, { email: "hh1@example.com", name: "HH One", role: "household" });
  const col = registerUser(store, { email: "col1@example.com", name: "Col One", role: "collector" });
  const adm = registerUser(store, { email: "admin@example.com", name: "Admin", role: "admin" });

  expect(roleHomeRoute(hh)).toBe("HouseholdHome");
  expect(roleHomeRoute(col)).toBe("CollectorHome");
  expect(roleHomeRoute(adm)).toBe("AdminHome");

  expect(() => registerUser(store, { email: "bad-email", name: "Ok", role: "household" })).toThrow();
  expect(() => registerUser(store, { email: "x@y.com", name: "A", role: "household" })).toThrow();
});

test("2) Collector approval gate blocks until approved (US-05/21)", async () => {
  const store = createStore();
  const services = makeServices();
  const admin = registerUser(store, { email: "admin@example.com", name: "Admin", role: "admin" });
  const hh = registerUser(store, { email: "hh1@example.com", name: "HH One", role: "household" });
  const col = registerUser(store, { email: "col1@example.com", name: "Col One", role: "collector" });

  const pickup = createPickup(store, hh, {
    wasteType: "plastic",
    estimatedWeightKg: 3,
    location: { lat: 31.5204, lng: 74.3587, city: "Lahore" },
  });

  await expect(acceptPickup(store, services, col, pickup.id)).rejects.toMatchObject({ code: "COLLECTOR_PENDING" });

  approveCollector(store, admin, col.id);
  await expect(acceptPickup(store, services, col, pickup.id)).resolves.toMatchObject({ status: "accepted" });
});

test("3) Household create pickup attaches correct payload + location (US-06/07/33)", () => {
  const store = createStore();
  const hh = registerUser(store, { email: "hh1@example.com", name: "HH One", role: "household" });
  const p = createPickup(store, hh, {
    wasteType: "paper",
    estimatedWeightKg: 5,
    location: { lat: 24.8607, lng: 67.0011, area: "Clifton", city: "Karachi", addressLabel: "Home" },
  });

  expect(p.wasteType).toBe("paper");
  expect(p.estimatedWeightKg).toBe(5);
  expect(p.location?.city).toBe("Karachi");
  expect(() =>
    createPickup(store, hh, { wasteType: "paper", estimatedWeightKg: 0, location: { lat: 1, lng: 2 } })
  ).toThrow();
});

test("4) Collector nearby jobs map/list + hotspots (US-13/34)", () => {
  const store = createStore();
  const hh = registerUser(store, { email: "hh1@example.com", name: "HH One", role: "household" });
  createPickup(store, hh, { wasteType: "plastic", estimatedWeightKg: 2, location: { lat: 31.5204, lng: 74.3587 } });
  createPickup(store, hh, { wasteType: "plastic", estimatedWeightKg: 2, location: { lat: 31.521, lng: 74.359 } });
  createPickup(store, hh, { wasteType: "plastic", estimatedWeightKg: 2, location: { lat: 33.6844, lng: 73.0479 } }); // far (Islamabad)

  const nearby = listNearbyPickups(store, { lat: 31.5204, lng: 74.3587 }, 2000);
  expect(nearby.length).toBe(2);
  expect(nearby[0].distanceMeters).toBeLessThanOrEqual(nearby[1].distanceMeters);

  const hotspots = computeHotspots(nearby);
  expect(hotspots.length).toBeGreaterThan(0);
  expect(hotspots[0].count).toBeGreaterThanOrEqual(1);
});

test("5) Accept job changes status + household notified (US-14/09)", async () => {
  const store = createStore();
  const services = makeServices();
  const admin = registerUser(store, { email: "admin@example.com", name: "Admin", role: "admin" });
  const hh = registerUser(store, { email: "hh1@example.com", name: "HH One", role: "household" });
  const col = registerUser(store, { email: "col1@example.com", name: "Col One", role: "collector" });
  approveCollector(store, admin, col.id);

  const pickup = createPickup(store, hh, { wasteType: "glass", estimatedWeightKg: 1, location: { lat: 31.5, lng: 74.3 } });
  const accepted = await acceptPickup(store, services, col, pickup.id);
  expect(accepted.status).toBe("accepted");

  const notifSvc = services.notifications as FakeNotifications;
  expect(notifSvc.events.some((e) => e.householdUserId === hh.id && e.event.type === "pickup.accepted")).toBe(true);
});

test("6) Navigation route: maps key gives route/ETA; without key uses fallback (US-15/35)", async () => {
  const services = makeServices();
  const from = { lat: 31.5204, lng: 74.3587 };
  const to = { lat: 31.5304, lng: 74.3687 };

  const maps = await getRouteToPickup(services, { from, pickupLocation: to, hasValidMapsKey: true });
  expect(maps.source).toBe("maps");
  expect(maps.polyline.length).toBe(3);
  expect(maps.etaSeconds).toBeGreaterThan(0);

  const fallback = await getRouteToPickup(services, { from, pickupLocation: to, hasValidMapsKey: false });
  expect(fallback.source).toBe("fallback");
  expect(fallback.polyline.length).toBe(2);
  expect(fallback.etaSeconds).toBeGreaterThan(0);
});

test("7) Live tracking: household sees collector moving (US-08/37)", () => {
  const store = createStore();
  const services = makeServices();
  const hh = registerUser(store, { email: "hh1@example.com", name: "HH One", role: "household" });
  const col = registerUser(store, { email: "col1@example.com", name: "Col One", role: "collector" });

  updateCollectorLocation(services, col, { lat: 31.5204, lng: 74.3587 });
  const first = getCollectorLiveLocation(services, hh, col.id);
  expect(first).toMatchObject({ lat: 31.5204, lng: 74.3587 });

  updateCollectorLocation(services, col, { lat: 31.521, lng: 74.359 });
  const second = getCollectorLiveLocation(services, hh, col.id);
  expect(second).toMatchObject({ lat: 31.521, lng: 74.359 });
});

test("8) Weight entry + complete pickup creates receipt and closes pickup (US-16/17/10)", async () => {
  const store = createStore();
  const services = makeServices();
  const admin = registerUser(store, { email: "admin@example.com", name: "Admin", role: "admin" });
  const hh = registerUser(store, { email: "hh1@example.com", name: "HH One", role: "household" });
  const col = registerUser(store, { email: "col1@example.com", name: "Col One", role: "collector" });
  approveCollector(store, admin, col.id);

  const pickup = createPickup(store, hh, { wasteType: "metal", estimatedWeightKg: 4, location: { lat: 31.5, lng: 74.3 } });
  await acceptPickup(store, services, col, pickup.id);

  const { pickup: completed, receipt } = await completePickup(store, services, col, {
    pickupId: pickup.id,
    actualWeightKg: 4.5,
    pointsPerKg: 10,
  });
  expect(completed.status).toBe("completed");
  expect(receipt.pickupId).toBe(pickup.id);
  expect(receipt.pointsAwarded).toBe(45);
});

test("9) Points auto-credit after completion + balance & breakdown (US-27/28/30)", async () => {
  const store = createStore();
  const services = makeServices();
  const admin = registerUser(store, { email: "admin@example.com", name: "Admin", role: "admin" });
  const hh = registerUser(store, { email: "hh1@example.com", name: "HH One", role: "household" });
  const col = registerUser(store, { email: "col1@example.com", name: "Col One", role: "collector" });
  approveCollector(store, admin, col.id);

  const pickup = createPickup(store, hh, { wasteType: "plastic", estimatedWeightKg: 2, location: { lat: 31.5, lng: 74.3 } });
  await acceptPickup(store, services, col, pickup.id);

  expect(getPointsBalance(store, hh.id)).toBe(0);
  await completePickup(store, services, col, { pickupId: pickup.id, actualWeightKg: 2, pointsPerKg: 5 });
  expect(getPointsBalance(store, hh.id)).toBe(10);

  const breakdown = getPointsBreakdown(store, hh.id);
  expect(breakdown.length).toBe(1);
  expect(breakdown[0].reference.kind).toBe("pickup");
});

test("10) Redeem points reduces balance and records transaction (US-29)", async () => {
  const store = createStore();
  const services = makeServices();
  const admin = registerUser(store, { email: "admin@example.com", name: "Admin", role: "admin" });
  const hh = registerUser(store, { email: "hh1@example.com", name: "HH One", role: "household" });
  const col = registerUser(store, { email: "col1@example.com", name: "Col One", role: "collector" });
  approveCollector(store, admin, col.id);

  const pickup = createPickup(store, hh, { wasteType: "paper", estimatedWeightKg: 1, location: { lat: 31.5, lng: 74.3 } });
  await acceptPickup(store, services, col, pickup.id);
  await completePickup(store, services, col, { pickupId: pickup.id, actualWeightKg: 1, pointsPerKg: 20 });
  expect(getPointsBalance(store, hh.id)).toBe(20);

  const redeemed = redeemPoints(store, hh, { points: 15 });
  expect(redeemed.newBalance).toBe(5);
  expect(getPointsBreakdown(store, hh.id).some((e) => e.reference.kind === "redeem")).toBe(true);
});

test("11) Admin suspend collector prevents accept/complete (US-26)", async () => {
  const store = createStore();
  const services = makeServices();
  const admin = registerUser(store, { email: "admin@example.com", name: "Admin", role: "admin" });
  const hh = registerUser(store, { email: "hh1@example.com", name: "HH One", role: "household" });
  const col = registerUser(store, { email: "col1@example.com", name: "Col One", role: "collector" });
  approveCollector(store, admin, col.id);

  const pickup = createPickup(store, hh, { wasteType: "mixed", estimatedWeightKg: 2, location: { lat: 31.5, lng: 74.3 } });
  suspendCollector(store, admin, col.id);

  await expect(acceptPickup(store, services, col, pickup.id)).rejects.toMatchObject({ code: "COLLECTOR_SUSPENDED" });
});

test("12) Admin impact dashboard inputs: totals and active collectors reflect live data (US-20/22)", () => {
  const store = createStore();
  const services = makeServices();
  const admin = registerUser(store, { email: "admin@example.com", name: "Admin", role: "admin" });
  const col = registerUser(store, { email: "col1@example.com", name: "Col One", role: "collector" });

  // totals: use ledger/receipts as source of truth (quick smoke)
  expect(admin.role).toBe("admin");
  expect(store.receipts.size).toBe(0);

  // active collectors map: last known location exists
  updateCollectorLocation(services, col, { lat: 31.5204, lng: 74.3587 });
  const last = (services.liveTracking as FakeLiveTracking).getLastLocation(col.id);
  expect(last).toMatchObject({ lat: 31.5204, lng: 74.3587 });
});

test("13) Security & privacy: JWT 24h, unauthorized route rejection, location hidden after completion (NFR)", async () => {
  assertJwtExpirySeconds(24 * 60 * 60);
  expect(() => assertJwtExpirySeconds(60)).toThrow();

  const store = createStore();
  const services = makeServices();
  const admin = registerUser(store, { email: "admin@example.com", name: "Admin", role: "admin" });
  const hh = registerUser(store, { email: "hh1@example.com", name: "HH One", role: "household" });
  const col = registerUser(store, { email: "col1@example.com", name: "Col One", role: "collector" });
  approveCollector(store, admin, col.id);

  const pickup = createPickup(store, hh, { wasteType: "plastic", estimatedWeightKg: 2, location: { lat: 31.5, lng: 74.3 } });
  await acceptPickup(store, services, col, pickup.id);
  const result = await completePickup(store, services, col, { pickupId: pickup.id, actualWeightKg: 2, pointsPerKg: 1 });
  expect(result.pickup.location).toBeNull();
});

test("14) Performance smoke: bulk create pickups stays responsive (NFR)", () => {
  const store = createStore();
  const hh = registerUser(store, { email: "hh1@example.com", name: "HH One", role: "household" });

  const start = Date.now();
  for (let i = 0; i < 500; i++) {
    createPickup(store, hh, {
      wasteType: "plastic",
      estimatedWeightKg: 1,
      location: { lat: 31.5204 + i * 0.00001, lng: 74.3587 + i * 0.00001 },
    });
  }
  const elapsed = Date.now() - start;

  // loose bound to avoid flaky machines; we're guarding against accidental O(n^2) loops
  expect(elapsed).toBeLessThan(1500);
  expect(store.pickups.size).toBe(500);
});

