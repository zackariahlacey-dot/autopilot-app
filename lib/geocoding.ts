/**
 * Mock geocoding helper
 * Converts addresses to approximate coordinates for demo purposes
 * In production, use a real geocoding API like Google Maps or Mapbox
 */

export function mockGeocode(address: string): { lat: number; lng: number } {
  // Create a hash from the address string
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash) + address.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Use hash to generate coordinates in a reasonable area
  // Center around Los Angeles area (34.05, -118.24)
  const baseLat = 34.05;
  const baseLng = -118.24;
  
  // Spread businesses within ~10 mile radius
  const latOffset = ((hash % 200) - 100) / 1000; // ±0.1 degrees (~7 miles)
  const lngOffset = (((hash >> 8) % 200) - 100) / 1000;

  return {
    lat: baseLat + latOffset,
    lng: baseLng + lngOffset,
  };
}
