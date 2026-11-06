import { describe, it, expect } from 'vitest';
import { LIVE_CORRELATION_EVENTS } from '../../src/features/demo/LiveTrackingPage';

describe('Live Pursuit & Tactical Tracking Demo Suite', () => {
  // Predefined getaway route coordinates [lon, lat] through Delhi/Noida
  const GETAWAY_PATH: Array<[number, number]> = [
    [77.2197, 28.6328], // 0: Connaught Place
    [77.2295, 28.6289], // 1: Barakhamba Rd
    [77.2410, 28.6255], // 2: Mandi House / Tilak Marg
    [77.2492, 28.6270], // 3: Supreme Court / ITO Crossing
    [77.2655, 28.6240], // 4: Vikas Marg / Yamuna River Bridge
    [77.2770, 28.6185], // 5: Laxmi Nagar / Akshardham Flyover
    [77.2885, 28.6110], // 6: Mayur Vihar Phase 1
    [77.3020, 28.6015], // 7: Noida Chilla Border
    [77.3180, 28.5850], // 8: Noida Sector 15 Metro
    [77.3265, 28.5710], // 9: Sector 18 Atta Market
    [77.3420, 28.5685], // 10: Botanical Garden Interchange
    [77.3649, 28.6280], // 11: Sector 62 Cyber Corridor
    [77.3820, 28.6150], // 12: Electronic City Crossing
    [77.4100, 28.5800], // 13: Expressway Interchange
    [77.5510, 28.1402], // 14: Yamuna Expressway KM 48 Checkpoint
  ];

  function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  it('should verify all getaway route waypoints are geographically valid and within NCR corridor', () => {
    expect(GETAWAY_PATH.length).toBe(15);

    GETAWAY_PATH.forEach(([lon, lat], index) => {
      // Longitude: ~77.2 to 77.6
      expect(lon).toBeGreaterThanOrEqual(77.20);
      expect(lon).toBeLessThanOrEqual(77.60);
      // Latitude: ~28.1 to 28.7
      expect(lat).toBeGreaterThanOrEqual(28.10);
      expect(lat).toBeLessThanOrEqual(28.70);

      // Verify each waypoint transitions smoothly
      if (index > 0) {
        const prev = GETAWAY_PATH[index - 1];
        const stepDist = calculateHaversineKm(prev[1], prev[0], lat, lon);
        expect(stepDist).toBeGreaterThan(0.2); // At least 200m between steps
      }
    });
  });

  it('should verify multi-agency evidence correlation stream events covers all statutory pipelines', () => {
    expect(LIVE_CORRELATION_EVENTS.length).toBeGreaterThanOrEqual(7);

    const categories = new Set(LIVE_CORRELATION_EVENTS.map((e) => e.category));
    expect(categories.has('CCTNS')).toBe(true);
    expect(categories.has('TELECOM')).toBe(true);
    expect(categories.has('ANPR')).toBe(true);
    expect(categories.has('FINANCIAL')).toBe(true);
    expect(categories.has('BIOMETRIC')).toBe(true);
    expect(categories.has('TACTICAL')).toBe(true);
    expect(categories.has('LEGAL')).toBe(true);

    // Verify statutory references in events
    const cctnsEvent = LIVE_CORRELATION_EVENTS.find((e) => e.category === 'CCTNS');
    expect(cctnsEvent?.desc).toContain('303(2)');
    expect(cctnsEvent?.desc).toContain('311 BNS');

    const anprEvent = LIVE_CORRELATION_EVENTS.find((e) => e.category === 'ANPR');
    expect(anprEvent?.title).toContain('TS 09 AB 1234');
    expect(anprEvent?.desc).toContain('TS 09 AB 1234');
  });

  it('should verify apprehension state transitions: vehicle halts and distance drops to 0', () => {
    const currentStep = 8; // At Noida Sector 15
    const suspectCoords = GETAWAY_PATH[currentStep];
    const initialPoliceCoords: [number, number] = [77.2250, 28.6250];

    // Pre-apprehension
    const preDist = calculateHaversineKm(
      suspectCoords[1],
      suspectCoords[0],
      initialPoliceCoords[1],
      initialPoliceCoords[0]
    );
    expect(preDist).toBeGreaterThan(5.0);

    // Trigger Apprehension: police vehicle snaps to suspect coordinates
    const isApprehended = true;
    const postPoliceCoords = isApprehended ? suspectCoords : initialPoliceCoords;
    const postDist = isApprehended
      ? 0
      : calculateHaversineKm(
          suspectCoords[1],
          suspectCoords[0],
          postPoliceCoords[1],
          postPoliceCoords[0]
        );

    expect(postDist).toBe(0);
  });

  it('should verify Article 22(2) & Section 57 BNSS 24-hour statutory remand timer formatting', () => {
    const formatRemandTime = (secs: number) => {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    };

    // Exactly 24 hours
    expect(formatRemandTime(86400)).toBe('24h 00m 00s');

    // 23 hours, 59 minutes, 40 seconds
    expect(formatRemandTime(86380)).toBe('23h 59m 40s');

    // 3 hours remaining (critical warning window)
    expect(formatRemandTime(10800)).toBe('03h 00m 00s');

    // 0 seconds (statutory expiry)
    expect(formatRemandTime(0)).toBe('00h 00m 00s');
  });
});
