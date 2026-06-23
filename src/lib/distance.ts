// Great-circle distance between two lat/lng points (Haversine).
export function haversineMiles(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const R = 3958.7613; // Earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Friendly distance string. Uses feet under ~0.2 mi, then miles.
export function formatDistance(miles: number): string {
  if (miles < 0.19) {
    const feet = Math.round((miles * 5280) / 10) * 10;
    return `${feet} ft apart`;
  }
  if (miles < 10) return `${miles.toFixed(1)} mi apart`;
  return `${Math.round(miles).toLocaleString()} mi apart`;
}

// Relative time like "2m ago".
export function timeAgo(iso: string | null): string {
  if (!iso) return "no location yet";
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}
