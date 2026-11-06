import { describe, it, expect } from 'vitest';

describe('Map Intelligence Spatial Geo Suite', () => {
  // Haversine formula implementation
  function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in KM
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }

  // Police stations in Delhi-NCR tactical zone
  const policeStations = [
    { name: 'Parliament Street PS', lat: 28.6231, lon: 77.2140 },
    { name: 'Connaught Place PS', lat: 28.6328, lon: 77.2197 },
    { name: 'Mayur Vihar Phase 1 PS', lat: 28.6110, lon: 77.2885 },
    { name: 'Sector 20 Noida PS', lat: 28.5850, lon: 77.3180 },
    { name: 'Greater Noida Expressway Checkpoint PS', lat: 28.4744, lon: 77.5040 },
  ];

  it('should accurately calculate distance between Delhi Connaught Place and Noida Sector 20', () => {
    const cp = { lat: 28.6328, lon: 77.2197 };
    const noidaSec20 = { lat: 28.5850, lon: 77.3180 };

    const distanceKm = calculateHaversineKm(cp.lat, cp.lon, noidaSec20.lat, noidaSec20.lon);
    // Real physical geodesic distance between CP and Sector 20 Noida is ~11.0 to 11.2 km
    expect(distanceKm).toBeGreaterThan(10.0);
    expect(distanceKm).toBeLessThan(12.5);
  });

  it('should resolve the closest police station for a moving suspect coordinate', () => {
    // Suspect currently passing Mayur Vihar / Chilla Border (lat: 28.6015, lon: 77.3020)
    const suspectCoord = { lat: 28.6015, lon: 77.3020 };

    let closestStation = policeStations[0];
    let minDistance = Infinity;

    policeStations.forEach((station) => {
      const dist = calculateHaversineKm(suspectCoord.lat, suspectCoord.lon, station.lat, station.lon);
      if (dist < minDistance) {
        minDistance = dist;
        closestStation = station;
      }
    });

    // Closest station to Mayur Vihar / Chilla Border should be Mayur Vihar PS or Sector 20 Noida
    expect(['Mayur Vihar Phase 1 PS', 'Sector 20 Noida PS']).toContain(closestStation.name);
    expect(minDistance).toBeLessThan(3.0); // Within 3 km
  });

  it('should validate tactical map bounding box for Delhi-NCR zone', () => {
    const ncrBounds = {
      minLat: 28.10,
      maxLat: 28.90,
      minLon: 76.80,
      maxLon: 77.70,
    };

    policeStations.forEach((station) => {
      expect(station.lat).toBeGreaterThanOrEqual(ncrBounds.minLat);
      expect(station.lat).toBeLessThanOrEqual(ncrBounds.maxLat);
      expect(station.lon).toBeGreaterThanOrEqual(ncrBounds.minLon);
      expect(station.lon).toBeLessThanOrEqual(ncrBounds.maxLon);
    });
  });

  it('should correctly filter crime scene evidence pins within a 5 km tactical radius', () => {
    const incidentSpot = { lat: 28.6250, lon: 77.2250 }; // Barakhamba corridor
    const evidencePins = [
      { id: 'ev-1', title: 'CCTV Camera Footage', lat: 28.6289, lon: 77.2295 }, // ~0.6 km
      { id: 'ev-2', title: 'Abandoned Burner SIM', lat: 28.6328, lon: 77.2197 }, // ~1.0 km
      { id: 'ev-3', title: 'Faraway Warehouse', lat: 28.4000, lon: 77.1000 }, // ~28 km away
    ];

    const radiusKm = 5.0;
    const withinRadius = evidencePins.filter((pin) => {
      const dist = calculateHaversineKm(incidentSpot.lat, incidentSpot.lon, pin.lat, pin.lon);
      return dist <= radiusKm;
    });

    expect(withinRadius.length).toBe(2);
    expect(withinRadius.map((p) => p.id)).toEqual(['ev-1', 'ev-2']);
  });

  it('should auto-calculate multi-point cumulative distance along a pursuit trajectory', () => {
    function calculateTotalHaversineKm(pts: [number, number][]): number {
      if (pts.length < 2) return 0;
      let total = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        total += calculateHaversineKm(pts[i][1], pts[i][0], pts[i + 1][1], pts[i + 1][0]);
      }
      return Math.round(total * 100) / 100;
    }

    // Points: [lon, lat]
    const p1: [number, number] = [77.2197, 28.6328]; // CP
    const p2: [number, number] = [77.2885, 28.6110]; // Mayur Vihar
    const p3: [number, number] = [77.3180, 28.5850]; // Sector 20 Noida

    const d12 = calculateHaversineKm(p1[1], p1[0], p2[1], p2[0]);
    const d23 = calculateHaversineKm(p2[1], p2[0], p3[1], p3[0]);
    const totalDist = calculateTotalHaversineKm([p1, p2, p3]);

    expect(totalDist).toBeCloseTo(d12 + d23, 1);
    expect(totalDist).toBeGreaterThan(10);
  });
});
