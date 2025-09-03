export interface Coordinates {
  lat: number;
  lon: number;
}

export const KENYAN_LOCATIONS: Record<string, Coordinates> = {
  'nairobi': { lat: -1.286389, lon: 36.817223 },
  'mombasa': { lat: -4.043477, lon: 39.658871 },
  'kisumu': { lat: -0.091702, lon: 34.767956 },
  'nakuru': { lat: -0.303099, lon: 36.080025 },
  'eldoret': { lat: 0.514277, lon: 35.269779 },
  'thika': { lat: -1.033415, lon: 37.069264 },
  'malindi': { lat: -3.219948, lon: 40.116767 },
  'kitale': { lat: 1.015300, lon: 35.006000 },
  'meru': { lat: 0.046900, lon: 37.656200 },
  'nyeri': { lat: -0.426100, lon: 36.951500 }
};

export function getLocationCoordinates(location: string): Coordinates | null {
  return KENYAN_LOCATIONS[location.toLowerCase()] || null;
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}