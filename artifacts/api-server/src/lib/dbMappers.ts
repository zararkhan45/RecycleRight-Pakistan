import type { PickupRequest, Receipt, User } from "@workspace/db";

export function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function mapUser(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
  };
}

export function mapPickup(
  p: PickupRequest,
  assignedCollectorUserId: number | null,
) {
  return {
    id: p.id,
    householdUserId: p.householdUserId,
    wasteType: p.wasteType,
    estimatedWeightKg: toNumberOrNull(p.estimatedWeightKg),
    status: p.status,
    createdAt: p.createdAt,
    acceptedAt: p.acceptedAt,
    completedAt: p.completedAt,
    assignedCollectorUserId,
  };
}

export function mapReceipt(r: Receipt) {
  return {
    id: r.id,
    pickupRequestId: r.pickupRequestId,
    finalWeightKg: toNumberOrNull(r.finalWeightKg) ?? 0,
    pointsAwarded: r.pointsAwarded,
    issuedAt: r.issuedAt,
  };
}

