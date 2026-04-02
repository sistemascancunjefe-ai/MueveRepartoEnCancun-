import { bench, describe, vi } from 'vitest';

// Mock types
interface Stop {
  id: string;
  address: string;
  lat?: number;
  lng?: number;
  status: string;
}

// Mock geocodeAddress with a simulated delay
// hit: 5ms, miss: 100ms (reduced for bench speed, but still shows difference)
async function mockGeocodeAddress(address: string, isCached: boolean) {
  await new Promise(resolve => setTimeout(resolve, isCached ? 5 : 100));
  if (address === 'fail') return null;
  return { lat: 21.1, lng: -86.8 };
}

async function mockDbPut(_store: string, _value: any) {
  await new Promise(resolve => setTimeout(resolve, 2)); // Simulate IDB write delay
}

async function mockDbPutMany(_store: string, _values: any[]) {
  await new Promise(resolve => setTimeout(resolve, 5)); // Simulate IDB bulk write delay
}

const STORES = { STOPS: 'stops' };

describe('Geocoding Loop Performance', () => {
  const numStops = 10;
  const stops: Stop[] = Array.from({ length: numStops }, (_, i) => ({
    id: `stop-${i}`,
    address: `Address ${i}`,
    status: 'pending'
  }));

  // Baseline: Sequential loop
  bench('Sequential Geocoding (mixed cache)', async () => {
    const pending = stops.filter(s => !s.lat && !s.lng && s.status !== 'completed');
    for (const stop of pending) {
      // Half cached, half not
      const isCached = parseInt(stop.id.split('-')[1]) % 2 === 0;
      const coords = await mockGeocodeAddress(stop.address, isCached);
      if (coords) {
        await mockDbPut(STORES.STOPS, { ...stop, lat: coords.lat, lng: coords.lng });
      }
    }
  });

  // Optimized candidate: Promise.all + dbPutMany
  bench('Concurrent Geocoding (mixed cache)', async () => {
    const pending = stops.filter(s => !s.lat && !s.lng && s.status !== 'completed');

    const results = await Promise.all(pending.map(async (stop) => {
      const isCached = parseInt(stop.id.split('-')[1]) % 2 === 0;
      const coords = await mockGeocodeAddress(stop.address, isCached);
      if (coords) {
        return { ...stop, lat: coords.lat, lng: coords.lng };
      }
      return null;
    }));

    const updates = results.filter((s): s is Stop => s !== null);
    if (updates.length > 0) {
      await mockDbPutMany(STORES.STOPS, updates);
    }
  });
});
