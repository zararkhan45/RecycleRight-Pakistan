export const JOB_STATUSES = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  EN_ROUTE: "en_route",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return new Date(value).toISOString();
  try {
    return new Date(String(value)).toISOString();
  } catch {
    return null;
  }
}

export function backendJobToUi(job: any) {
  const pickup = job.pickup;
  const loc = job.location;

  const createdAt = toIso(pickup.createdAt) || new Date().toISOString();
  const acceptedAt = toIso(pickup.acceptedAt);
  const completedAt = toIso(pickup.completedAt);

  const status = pickup.status === "in_progress" ? JOB_STATUSES.EN_ROUTE : pickup.status;

  const estimatedWeightKg =
    pickup.estimatedWeightKg === null || pickup.estimatedWeightKg === undefined
      ? 0
      : pickup.estimatedWeightKg;

  // UI expects "items" array; backend currently supports single waste type per pickup.
  const items = [
    {
      wasteType: pickup.wasteType,
      estimatedWeightKg,
    },
  ];

  const pickupAddress = {
    label: loc.addressLabel || "Pickup location",
    area: loc.area || "—",
    city: loc.city || "—",
    latitude: loc.lat,
    longitude: loc.lng,
  };

  return {
    id: String(pickup.id),
    pickupId: pickup.id,
    status,
    requestedAt: createdAt,
    scheduledFor: createdAt,
    acceptedAt,
    completedAt,
    customer: {
      id: `HH-${pickup.householdUserId}`,
      name: "Household",
      phone: "",
      rating: 0,
    },
    pickupAddress,
    distanceKm: typeof job.distanceKm === "number" ? job.distanceKm : 0,
    estimatedDurationMin: 15,
    items,
    estimatedEarningsPKR: 0,
    notes: "",
    photos: [],
  };
}

