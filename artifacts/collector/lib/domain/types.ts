export type Role = "household" | "collector" | "admin";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type CollectorStatus = "pending" | "approved" | "suspended";

export type CollectorProfile = {
  userId: string;
  status: CollectorStatus;
};

export type LatLng = { lat: number; lng: number };

export type Location = LatLng & {
  addressLabel?: string;
  area?: string;
  city?: string;
};

export type WasteType = "plastic" | "paper" | "metal" | "glass" | "organic" | "mixed";

export type PickupStatus = "pending" | "accepted" | "en_route" | "completed" | "cancelled";

export type PickupRequest = {
  id: string;
  householdUserId: string;
  collectorUserId: string | null;
  status: PickupStatus;
  wasteType: WasteType;
  estimatedWeightKg: number;
  actualWeightKg: number | null;
  location: Location | null; // privacy: may be removed after completion
  createdAt: number;
  acceptedAt: number | null;
  completedAt: number | null;
};

export type Receipt = {
  id: string;
  pickupId: string;
  householdUserId: string;
  collectorUserId: string;
  wasteType: WasteType;
  weightKg: number;
  pointsAwarded: number;
  createdAt: number;
};

export type PointsLedgerEntry = {
  id: string;
  userId: string;
  type: "credit" | "debit";
  points: number;
  reference: { kind: "pickup" | "redeem"; id: string };
  createdAt: number;
};

export type NotificationEvent =
  | { type: "pickup.accepted"; pickupId: string; collectorUserId: string }
  | { type: "pickup.completed"; pickupId: string; receiptId: string };

