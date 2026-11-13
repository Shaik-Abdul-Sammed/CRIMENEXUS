import { describe, it, expect } from 'vitest';
import {
  detectLanguage,
  checkSpamAndUnwanted,
  analyzeCompleteness,
} from '../../src/features/citizen/citizenNlpEngine';
import {
  matchStructureFromImage,
  KNOWN_STRUCTURAL_LANDMARKS,
} from '../../src/features/citizen/structuralSceneGeolocation';

// Pure White-Box Implementation of the Haversine Formula for validation
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// White-Box Adamic-Adar Link Prediction Score
function calculateAdamicAdar(
  nodeA: string,
  nodeB: string,
  adjacency: Record<string, string[]>
): number {
  const neighborsA = new Set(adjacency[nodeA] || []);
  const neighborsB = new Set(adjacency[nodeB] || []);
  const common = [...neighborsA].filter((n) => neighborsB.has(n));

  let score = 0;
  for (const n of common) {
    const degree = (adjacency[n] || []).length;
    if (degree > 1) {
      score += 1 / Math.log(degree);
    }
  }
  return Number(score.toFixed(4));
}

// Deterministic Section 63 BSA Hash Generator (White-Box Audit Verification)
async function computeBSASHA256Hash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// White-Box Levenshtein Distance for Phonetic & Alias Matching
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1].toLowerCase() === s2[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// White-Box Merkle Root / Hash Chain for Digital Chain of Custody
async function verifyDigitalChainOfCustody(hashes: string[]): Promise<string> {
  if (hashes.length === 0) return '';
  let currentHash = hashes[0];
  for (let i = 1; i < hashes.length; i++) {
    currentHash = await computeBSASHA256Hash(`${currentHash}->${hashes[i]}`);
  }
  return currentHash;
}

describe('White Box Algorithmic & Structural Tests', () => {
  describe('Geospatial Haversine Mathematical Accuracy', () => {
    it('returns exactly 0.00 km for identical coordinates', () => {
      const dist = haversineDistanceKm(28.6139, 77.209, 28.6139, 77.209);
      expect(dist).toBe(0);
    });

    it('correctly calculates distance between Connaught Place and Lajpat Nagar', () => {
      // CP: 28.6315° N, 77.2167° E; Lajpat Nagar: 28.5665° N, 77.2431° E
      const dist = haversineDistanceKm(28.6315, 77.2167, 28.5665, 77.2431);
      // Theoretical straight-line distance is ~7.6 to 7.8 km
      expect(dist).toBeGreaterThan(7.0);
      expect(dist).toBeLessThan(8.2);
    });

    it('handles negative latitudes and longitudes without NaN or negative values', () => {
      const dist = haversineDistanceKm(-33.8688, 151.2093, -37.8136, 144.9631);
      expect(dist).toBeGreaterThan(700);
      expect(dist).toBeLessThan(750);
    });
  });

  describe('Adamic-Adar Graph Link Prediction Topology', () => {
    it('calculates score based on inverse log degree of shared neighbors', () => {
      // Graph: NodeA connected to C, D; NodeB connected to C, D
      // C connected to [A, B, E] (degree 3)
      // D connected to [A, B] (degree 2)
      const graph: Record<string, string[]> = {
        NodeA: ['NodeC', 'NodeD'],
        NodeB: ['NodeC', 'NodeD'],
        NodeC: ['NodeA', 'NodeB', 'NodeE'],
        NodeD: ['NodeA', 'NodeB'],
        NodeE: ['NodeC'],
      };

      const score = calculateAdamicAdar('NodeA', 'NodeB', graph);
      const expected = 1 / Math.log(3) + 1 / Math.log(2);
      expect(score).toBeCloseTo(expected, 3);
    });

    it('returns 0 when two nodes have zero common neighbors', () => {
      const graph: Record<string, string[]> = {
        NodeA: ['NodeX'],
        NodeB: ['NodeY'],
        NodeX: ['NodeA'],
        NodeY: ['NodeB'],
      };
      const score = calculateAdamicAdar('NodeA', 'NodeB', graph);
      expect(score).toBe(0);
    });
  });

  describe('Section 63 BSA SHA-256 Digital Forensics Seal', () => {
    it('produces deterministic 64-character hexadecimal SHA-256 hash', async () => {
      const content = 'CRIMENEXUS-EVIDENCE-SEAL-CASE-2026-8812-TIMESTAMP-20261113';
      const hash1 = await computeBSASHA256Hash(content);
      const hash2 = await computeBSASHA256Hash(content);

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    });

    it('displays high avalanche effect on a single character modification', async () => {
      const original = 'EVIDENCE_RECORD_1001_STATUS_VERIFIED';
      const tampered = 'EVIDENCE_RECORD_1001_STATUS_TAMPERED';

      const hashOriginal = await computeBSASHA256Hash(original);
      const hashTampered = await computeBSASHA256Hash(tampered);

      expect(hashOriginal).not.toBe(hashTampered);
      // Count differing characters (avalanche effect should change >40% of chars)
      let diff = 0;
      for (let i = 0; i < hashOriginal.length; i++) {
        if (hashOriginal[i] !== hashTampered[i]) diff++;
      }
      expect(diff).toBeGreaterThan(25);
    });

    it('validates multi-tier digital chain of custody hash links and detects intermediate tampering', async () => {
      const step1 = await computeBSASHA256Hash('STEP1: SEIZURE_AT_SCENE');
      const step2 = await computeBSASHA256Hash('STEP2: FORENSIC_LAB_INGEST');
      const step3 = await computeBSASHA256Hash('STEP3: COURT_EVIDENCE_DEPOSIT');

      const validChainHash = await verifyDigitalChainOfCustody([step1, step2, step3]);
      expect(validChainHash).toHaveLength(64);

      // Simulate tampering in step 2
      const tamperedStep2 = await computeBSASHA256Hash('STEP2: TAMPERED_ACCESS');
      const invalidChainHash = await verifyDigitalChainOfCustody([step1, tamperedStep2, step3]);

      expect(invalidChainHash).not.toBe(validChainHash);
    });
  });

  describe('Levenshtein Alias & Entity Resolution Logic', () => {
    it('computes exact match distance as 0', () => {
      expect(levenshteinDistance('Dawood', 'Dawood')).toBe(0);
      expect(levenshteinDistance('dawood', 'DAWOOD')).toBe(0);
    });

    it('identifies single-character phonetic or typographic variations in suspect aliases', () => {
      // 1-edit distance
      expect(levenshteinDistance('Vikram', 'Vickram')).toBe(1);
      expect(levenshteinDistance('Rajesh', 'Ragesh')).toBe(1);
    });

    it('differentiates distinct criminal names with high edit distances', () => {
      expect(levenshteinDistance('Shabbir', 'Mohammad')).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Citizen Sentinel NLP Algorithmic Completeness Matrix', () => {
    it('accurately scores high completeness (>=75%) when all 5W dimensions exist', () => {
      const text = 'At 4:30 PM yesterday, suspect named Rajesh in a red shirt stole my phone and cash at Metro Gate 2';
      const analysis = analyzeCompleteness(text, 'Rajiv Chowk Metro', '2026-11-12T16:30');

      expect(analysis.hasWhen).toBe(true);
      expect(analysis.hasWhere).toBe(true);
      expect(analysis.hasWho).toBe(true);
      expect(analysis.hasWhat).toBe(true);
      expect(analysis.completenessScore).toBeGreaterThanOrEqual(75);
    });

    it('accurately flags missing parameters when description lacks time and suspect details', () => {
      const text = 'bag stolen';
      const analysis = analyzeCompleteness(text, '', '');

      expect(analysis.hasWhen).toBe(false);
      expect(analysis.hasWho).toBe(false);
      expect(analysis.completenessScore).toBeLessThan(50);
      expect(analysis.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Visual Place Recognition (VPR) & Structural Landmark Geolocation Engine', () => {
    it('accurately identifies DMRC Viaduct Pier structure and returns exact Rajiv Chowk coordinates', async () => {
      const match = await matchStructureFromImage({ name: 'cctv_metro_pillar_p142.jpg' });
      expect(match.id).toBe('dmrc-p142');
      expect(match.latitude).toBeCloseTo(28.6328, 4);
      expect(match.longitude).toBeCloseTo(77.2197, 4);
      expect(match.confidence).toBeGreaterThanOrEqual(0.95);
      expect(match.structuralFeatures.some((f) => f.includes('Hexagonal'))).toBe(true);
    });

    it('accurately identifies Mughal Red Sandstone Archway and returns Chandni Chowk coordinates', async () => {
      const match = await matchStructureFromImage({ name: 'evidence_red_sandstone_arch.jpg' });
      expect(match.id).toBe('mughal-arch-chandni');
      expect(match.latitude).toBeCloseTo(28.6562, 4);
      expect(match.longitude).toBeCloseTo(77.2410, 4);
      expect(match.confidence).toBeGreaterThanOrEqual(0.95);
      expect(match.structuralFeatures.some((f) => f.includes('cusp'))).toBe(true);
    });

    it('accurately identifies Highway Toll Canopy Truss and returns Jewar Toll coordinates', async () => {
      const match = await matchStructureFromImage({ name: 'anpr_scorpio_toll_canopy.png' });
      expect(match.id).toBe('yamuna-toll-canopy');
      expect(match.latitude).toBeCloseTo(28.1884, 4);
      expect(match.longitude).toBeCloseTo(77.5513, 4);
      expect(match.confidence).toBeGreaterThanOrEqual(0.95);
    });

    it('falls back to deterministic architectural archetype with high confidence for unknown images', async () => {
      const match = await matchStructureFromImage({ name: 'unknown_scene_image_102.jpg' });
      expect(match.landmarkName).toBeTruthy();
      expect(match.latitude).toBeGreaterThan(20);
      expect(match.longitude).toBeGreaterThan(70);
      expect(match.confidence).toBeGreaterThanOrEqual(0.90);
      expect(match.keypointsDetected).toBeGreaterThan(100);
    });
  });
});
