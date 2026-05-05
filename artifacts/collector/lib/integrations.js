import { getAuthToken } from './authStorage';

function getApiBaseUrl() {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!raw || !raw.trim()) return null;
  return raw.trim().replace(/\/+$/, '');
}

async function authHeaders() {
  const token = await getAuthToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function authedRequest(path, init = {}) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new Error('EXPO_PUBLIC_API_BASE_URL is not configured');

  const headers = {
    ...(await authHeaders()),
    ...(init.headers || {}),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

export async function registerDeviceToken(input) {
  return authedRequest('/api/notifications/device-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

function decodePolyline(encoded) {
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  const coordinates = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    latitude += deltaLat;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    longitude += deltaLng;

    coordinates.push({
      latitude: latitude / 1e5,
      longitude: longitude / 1e5,
    });
  }

  return coordinates;
}

export async function fetchDrivingRoute(origin, destination) {
  const query =
    `originLat=${encodeURIComponent(String(origin.latitude))}` +
    `&originLng=${encodeURIComponent(String(origin.longitude))}` +
    `&destinationLat=${encodeURIComponent(String(destination.latitude))}` +
    `&destinationLng=${encodeURIComponent(String(destination.longitude))}`;

  const response = await authedRequest(`/api/maps/route?${query}`);
  return {
    distanceKm:
      typeof response.distanceMeters === 'number' ? response.distanceMeters / 1000 : null,
    durationMin:
      typeof response.durationSeconds === 'number'
        ? Math.max(1, Math.round(response.durationSeconds / 60))
        : null,
    coordinates:
      typeof response.encodedPolyline === 'string' && response.encodedPolyline.length > 0
        ? decodePolyline(response.encodedPolyline)
        : [],
  };
}
