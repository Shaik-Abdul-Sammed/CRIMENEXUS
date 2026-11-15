import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock fetch for all test suites
global.fetch = vi.fn().mockImplementation((url: string) => {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => {
      if (url.includes('/api/v1/intelligence/fusion-search')) {
        return Promise.resolve({
          query: 'test',
          sources_queried: ['PostgreSQL', 'Neo4j', 'ChromaDB'],
          total_matches: 1,
          grouped_results: { cases: [], persons: [], phones: [], vehicles: [], semantic_matches: [] },
          statutory_basis: 'Sec 91 CrPC'
        });
      }
      if (url.includes('/api/v1/risk-scoring')) {
        return Promise.resolve({
          person_id: 'LB-01',
          name: 'Lawrence Bishnoi',
          risk_score: 94.5,
          risk_tier: 'EXTREME_RECIDIVISM_RISK',
          shap_contributions: { prior_fir_count: 42.0, network_centrality: 28.5, transaction_anomalies: 24.0 },
          shap_sum_check: 94.5,
          statutory_advisory: 'Section 480 BNSS bail opposition'
        });
      }
      if (url.includes('/api/v1/forecast/hotspots')) {
        return Promise.resolve({
          district: 'South Delhi',
          forecast_date: '2026-02-15',
          hotspots: []
        });
      }
      if (url.includes('/api/v1/sna/gangs')) {
        return Promise.resolve({
          gang_id: 'GANG-NCR-01',
          name: 'Lawrence Bishnoi Trans-State Syndicate',
          operating_area: 'Delhi-NCR',
          threat_level: 'LEVEL_1_CRITICAL',
          raw_graph: { nodes: [], edges: [] },
          network_metrics: { total_nodes: 8, total_edges: 10, density: 0.35, initial_components: 1 },
          cut_points: ['GB-02'],
          removal_impact: []
        });
      }
      if (url.includes('/api/v1/rtcc/events')) {
        return Promise.resolve({
          alerts: [],
          anpr: [],
          cdr: [],
          markers: []
        });
      }
      if (url.includes('/api/v1/route-analysis')) {
        return Promise.resolve({
          offender_id: 'SUSP-01',
          anchor_nodes: [],
          corridors: [],
          buffer_radius_km: 2.5,
          total_crimes: 3,
          crimes_inside_buffer: 2,
          crime_overlap_percentage: 66.7,
          directional_bias: 'NORTH_EAST_CORRIDOR',
          theory_validation: 'STRONG_CORRIDOR_CONGRUENCE',
          crimes_analyzed: []
        });
      }
      if (url.includes('/api/v1/near-repeat')) {
        return Promise.resolve({
          district: 'South Delhi',
          total_origin_events: 1,
          active_contagion_zones_count: 1,
          spatial_bandwidth_m: 350.0,
          temporal_window_days: 14,
          methodology: 'Knox-Mantel',
          zones: []
        });
      }
      if (url.includes('/api/v1/forensics/records')) {
        return Promise.resolve([]);
      }
      if (url.includes('/api/v1/interpol/notices')) {
        return Promise.resolve({ notices: [] });
      }
      if (url.includes('/api/v1/sar/benchmark-cases')) {
        return Promise.resolve([]);
      }
      if (url.includes('/api/v1/threat/framework-metadata')) {
        return Promise.resolve({ proximal_warning_behaviors: [], distal_characteristics: [] });
      }
      if (url.includes('/api/v1/threat/assess')) {
        return Promise.resolve({
          subject_id: 'SUBJ-01',
          subject_name: 'Target Subject',
          threat_index: 84.5,
          priority_tier: 'LEVEL_1_CRITICAL',
          proximal_behaviors_count: 3,
          distal_characteristics_count: 3,
          proximal_matches: [],
          distal_matches: [],
          recommended_action: 'Immediate targeted preventative surveillance',
          statutory_compliance: 'Section 170 BNSS'
        });
      }
      if (url.includes('/api/v1/osint/alerts')) {
        return Promise.resolve({ alerts: [] });
      }
      if (url.includes('/api/v1/imsi/sessions')) {
        return Promise.resolve({ sessions: [] });
      }
      if (url.includes('/api/v1/gun-intelligence/traces')) {
        return Promise.resolve({ traces: [] });
      }
      if (url.includes('/api/v1/ibis/specimens')) {
        return Promise.resolve([]);
      }
      if (url.includes('/api/v1/dv/questions')) {
        return Promise.resolve([]);
      }
      if (url.includes('/api/v1/dv/assess')) {
        return Promise.resolve({
          case_id: 'DV-CASE-01',
          victim_alias: 'Victim Protected',
          lethality_score: 88.0,
          risk_tier: 'EXTREME_DANGER',
          strangulation_flag: true,
          weapon_access_flag: true,
          safety_protocol: 'Deploy emergency ex-parte magistrate restraining order',
          statutory_relief: 'Section 18 PWDVA 2005'
        });
      }
      if (url.includes('/api/v1/geofence/warrants')) {
        return Promise.resolve([]);
      }
      if (url.includes('/api/v1/blockchain/ledger')) {
        return Promise.resolve({ blocks: [], integrity: { is_valid: true } });
      }
      if (url.includes('/api/v1/triage/queue')) {
        return Promise.resolve([]);
      }
      return Promise.resolve({});
    }
  });
});

// Import all 20 pages
import { IntelligenceFusionPage } from '../../src/features/intelligence/IntelligenceFusionPage';
import { PersonRiskPage } from '../../src/features/risk/PersonRiskPage';
import { HotspotForecastPage } from '../../src/features/forecast/HotspotForecastPage';
import { SNAGangsPage } from '../../src/features/sna/SNAGangsPage';
import { RTCCDashboard } from '../../src/features/rtcc/RTCCDashboard';
import { RouteAnalysisPage } from '../../src/features/route/RouteAnalysisPage';
import { NearRepeatAlertsPage } from '../../src/features/alerts/NearRepeatAlertsPage';
import { ForensicDBPage } from '../../src/features/forensics/ForensicDBPage';
import { InterpolSyncPage } from '../../src/features/interpol/InterpolSyncPage';
import { SARAnalyticsPage } from '../../src/features/sar/SARAnalyticsPage';
import { ThreatAssessmentPage } from '../../src/features/threat/ThreatAssessmentPage';
import { OSINTMonitorPage } from '../../src/features/osint/OSINTMonitorPage';
import { IMSICatcherPage } from '../../src/features/imsi/IMSICatcherPage';
import { GunIntelligencePage } from '../../src/features/gun/GunIntelligencePage';
import { IBISPage } from '../../src/features/ballistics/IBISPage';
import { DVRiskPage } from '../../src/features/dv/DVRiskPage';
import { InterceptTranslatePage } from '../../src/features/intercept/InterceptTranslatePage';
import { GeofencePage } from '../../src/features/geofence/GeofencePage';
import { BlockchainEvidencePage } from '../../src/features/blockchain/BlockchainEvidencePage';
import { CaseTriagePage } from '../../src/features/triage/CaseTriagePage';

describe('International Police Intelligence & Analytics Frontend Pages (Features 1-20)', () => {
  it('Feature 1: renders IntelligenceFusionPage correctly', () => {
    const { container } = render(<IntelligenceFusionPage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Conjunctive Analytic Platform/i)).toBeDefined();
  });

  it('Feature 2: renders PersonRiskPage correctly', () => {
    const { container } = render(<PersonRiskPage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Person-Based Predictive/i)).toBeDefined();
  });

  it('Feature 3: renders HotspotForecastPage correctly', () => {
    const { container } = render(<HotspotForecastPage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Place-Based Micro-Hotspot Forecasting/i)).toBeDefined();
  });

  it('Feature 4: renders SNAGangsPage correctly', () => {
    const { container } = render(<SNAGangsPage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Social Network Analysis/i)).toBeDefined();
  });

  it('Feature 5: renders RTCCDashboard correctly', () => {
    const { container } = render(<RTCCDashboard />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Real-Time Crime Center/i)).toBeDefined();
  });

  it('Feature 6: renders RouteAnalysisPage correctly', () => {
    const { container } = render(<RouteAnalysisPage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Crime Pattern Theory Route Analysis/i)).toBeDefined();
  });

  it('Feature 7: renders NearRepeatAlertsPage correctly', () => {
    const { container } = render(<NearRepeatAlertsPage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Near-Repeat Victimization/i)).toBeDefined();
  });

  it('Feature 8: renders ForensicDBPage correctly', () => {
    const { container } = render(<ForensicDBPage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Forensic Intelligence Database/i)).toBeDefined();
  });

  it('Feature 9: renders InterpolSyncPage correctly', () => {
    const { container } = render(<InterpolSyncPage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Interpol I-24\/7/i)).toBeDefined();
  });

  it('Feature 10: renders SARAnalyticsPage correctly', () => {
    const { container } = render(<SARAnalyticsPage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Automated Suspicious Activity Reporting/i)).toBeDefined();
  });

  it('Feature 11: renders ThreatAssessmentPage correctly', () => {
    const { container } = render(<ThreatAssessmentPage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Threat Assessment & Targeted Violence Protocol/i)).toBeDefined();
  });

  it('Feature 12: renders OSINTMonitorPage correctly', () => {
    const { container } = render(<OSINTMonitorPage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Open Source Intelligence/i)).toBeDefined();
  });

  it('Feature 13: renders IMSICatcherPage correctly', () => {
    const { container } = render(<IMSICatcherPage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Cell-Site Simulator/i)).toBeDefined();
  });

  it('Feature 14: renders GunIntelligencePage correctly', () => {
    const { container } = render(<GunIntelligencePage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Crime Gun Intelligence Center/i)).toBeDefined();
  });

  it('Feature 15: renders IBISPage correctly', () => {
    const { container } = render(<IBISPage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Integrated Ballistics Identification System/i)).toBeDefined();
  });

  it('Feature 16: renders DVRiskPage correctly', () => {
    const { container } = render(<DVRiskPage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Domestic Violence Fatality Risk Assessment/i)).toBeDefined();
  });

  it('Feature 17: renders InterceptTranslatePage correctly', () => {
    const { container } = render(<InterceptTranslatePage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Real-Time Intercept Translation/i)).toBeDefined();
  });

  it('Feature 18: renders GeofencePage correctly', () => {
    const { container } = render(<GeofencePage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Reverse-Location Geofence Warrants/i)).toBeDefined();
  });

  it('Feature 19: renders BlockchainEvidencePage correctly', () => {
    const { container } = render(<BlockchainEvidencePage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Blockchain Evidence Chain-of-Custody/i)).toBeDefined();
  });

  it('Feature 20: renders CaseTriagePage correctly', () => {
    const { container } = render(<CaseTriagePage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/AI-Powered Case Solvability & Priority Triage/i)).toBeDefined();
  });
});
