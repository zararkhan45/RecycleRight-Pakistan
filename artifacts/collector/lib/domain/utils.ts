let _id = 0;

export function nextId(prefix: string): string {
  _id += 1;
  return `${prefix}_${_id}`;
}

export function resetIdsForTest() {
  _id = 0;
}

export function nowMs(): number {
  return Date.now();
}

export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  // fast approx; good enough for filtering tests
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * (Math.sin(dLng / 2) ** 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

