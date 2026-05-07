import type { LatLng, NotificationEvent } from "./types";
import type { LiveTrackingService, NotificationService, RoutingService, RouteResult } from "./services";
import { distanceMeters, nextId } from "./utils";

export class FakeNotifications implements NotificationService {
  events: Array<{ id: string; householdUserId: string; event: NotificationEvent }> = [];

  async publishToHousehold(householdUserId: string, event: NotificationEvent): Promise<void> {
    this.events.push({ id: nextId("evt"), householdUserId, event });
  }
}

export class FakeLiveTracking implements LiveTrackingService {
  private lastByCollector = new Map<string, LatLng>();

  start(_pickupId: string, _collectorUserId: string) {
    return { stop() {} };
  }

  getLastLocation(collectorUserId: string): LatLng | null {
    return this.lastByCollector.get(collectorUserId) ?? null;
  }

  setCollectorLocation(collectorUserId: string, loc: LatLng): void {
    this.lastByCollector.set(collectorUserId, loc);
  }
}

export class FakeRouting implements RoutingService {
  async getRoute(input: { from: LatLng; to: LatLng; hasValidMapsKey: boolean }): Promise<RouteResult> {
    const dist = distanceMeters(input.from, input.to);
    const etaSeconds = Math.max(60, Math.round(dist / 1.2)); // ~walking speed-ish for determinism
    const polyline: LatLng[] = input.hasValidMapsKey
      ? [input.from, { lat: (input.from.lat + input.to.lat) / 2, lng: (input.from.lng + input.to.lng) / 2 }, input.to]
      : [input.from, input.to];

    return {
      polyline,
      etaSeconds,
      distanceMeters: Math.round(dist),
      source: input.hasValidMapsKey ? "maps" : "fallback",
    };
  }
}

