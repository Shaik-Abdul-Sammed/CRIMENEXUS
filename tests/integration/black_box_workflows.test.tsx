import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { CitizenReportingPage } from '../../src/features/citizen/CitizenReportingPage';
import { EscapeSimulationPage } from '../../src/features/demo/EscapeSimulationPage';
import { DashboardPage } from '../../src/features/dashboard/DashboardPage';

// Mock maplibre-gl
vi.mock('maplibre-gl', () => {
  const mockMarker = {
    setLngLat: vi.fn().mockReturnThis(),
    setPopup: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
    on: vi.fn().mockReturnThis(),
    getLngLat: vi.fn(() => ({ lng: 77.2197, lat: 28.6328 })),
  };

  const mockMap = {
    on: vi.fn((event, callback) => {
      if (event === 'load') callback();
    }),
    remove: vi.fn(),
    addControl: vi.fn(),
    getSource: vi.fn(),
    addSource: vi.fn(),
    getLayer: vi.fn(),
    addLayer: vi.fn(),
    flyTo: vi.fn(),
    fitBounds: vi.fn(),
    isStyleLoaded: vi.fn(() => true),
    setLayoutProperty: vi.fn(),
    setPaintProperty: vi.fn(),
  };

  return {
    default: {
      Map: vi.fn(() => mockMap),
      Marker: vi.fn(() => mockMarker),
      Popup: vi.fn(() => ({
        setHTML: vi.fn().mockReturnThis(),
        setLngLat: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
      })),
      NavigationControl: vi.fn(),
      LngLatBounds: vi.fn(() => ({
        extend: vi.fn().mockReturnThis(),
        isEmpty: vi.fn(() => false),
        getCenter: vi.fn(() => ({ lng: 77.2, lat: 28.6 })),
      })),
    },
    Map: vi.fn(() => mockMap),
    Marker: vi.fn(() => mockMarker),
    Popup: vi.fn(() => ({
      setHTML: vi.fn().mockReturnThis(),
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
    })),
    NavigationControl: vi.fn(),
    LngLatBounds: vi.fn(() => ({
      extend: vi.fn().mockReturnThis(),
      isEmpty: vi.fn(() => false),
      getCenter: vi.fn(() => ({ lng: 77.2, lat: 28.6 })),
    })),
  };
});

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('Black-Box End-to-End User Journeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Citizen Persona: Anonymous Incident Reporting Workflow', () => {
    it('allows a citizen to complete the end-to-end report workflow with anonymity enabled', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          status: 'SUCCESS',
          report_number: 'PUB-2026-BB01',
          submission_id: 101,
          nearest_station_name: 'Hauz Khas Police Station',
          distance_to_station_km: 1.2,
          ai_verdict: 'SATELLITE_VERIFIED',
          satellite_verified: true,
          satellite_confidence: 0.98,
          layers: {},
          submitted_at: new Date().toISOString(),
        },
      });

      renderWithRouter(<CitizenReportingPage />);

      // Step 1: User sees the portal and identifies DPDP compliance
      expect(screen.getByText(/Report a Crime Safely & Directly to Police/i)).toBeInTheDocument();

      // Step 2: User selects Theft category
      const theftCard = screen.getByText('Theft & Snatching');
      fireEvent.click(theftCard);

      // Step 3: User activates anonymous mode
      const anonToggle = screen.getByRole('checkbox');
      fireEvent.click(anonToggle);
      expect(screen.getByText(/Informant Privilege Active/i)).toBeInTheDocument();

      // Step 4: User inputs location and narrative
      const addressInput = screen.getByPlaceholderText(/e\.g\. Connaught Place Block B \/ Metro Gate 3/i);
      fireEvent.change(addressInput, { target: { value: 'Green Park Metro Station Exit 2' } });

      const narrativeInput = screen.getByPlaceholderText(/Provide objective facts in any language or slang/i);
      fireEvent.change(narrativeInput, {
        target: { value: 'Black motorcycle TS07EF9999 snatched gold necklace from pedestrian at 17:30.' },
      });

      // Step 5: User submits report
      const submitBtn = screen.getByRole('button', { name: /Submit Crime Report with Proof/i });
      fireEvent.click(submitBtn);

      // Step 6: User sees formal receipt with tracking docket
      await waitFor(() => {
        expect(screen.getByText('PUB-2026-BB01')).toBeInTheDocument();
        expect(screen.getByText(/Hauz Khas Police Station/i)).toBeInTheDocument();
        expect(screen.getByText(/Crime Report Successfully Submitted/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    }, 15000);
  });

  describe('Police Commander Persona: Escape Simulation & Intercept Workflow', () => {
    it('allows commander to launch escape demo, advance simulation attacks, and inspect containment nodes', async () => {
      renderWithRouter(<EscapeSimulationPage />);

      // Step 1: Commander sees simulation tactical HUD
      expect(screen.getByText(/Operation Shatter: Criminal Escape Simulation/i)).toBeInTheDocument();
      expect(screen.getByText(/Play Full 3-Step Demo/i)).toBeInTheDocument();

      // Step 2: Inspect 3 attack vector scenario buttons
      expect(screen.getByText(/The Vehicle Swap/i)).toBeInTheDocument();
      expect(screen.getByText(/The Smurfing Liquidation/i)).toBeInTheDocument();
      expect(screen.getByText(/The Safehouse Hideout/i)).toBeInTheDocument();

      // Step 3: Switch scenario to Mule Smurfing
      const muleTab = screen.getByText(/The Smurfing Liquidation/i);
      fireEvent.click(muleTab);
      expect(screen.getByText(/10 mule accounts frozen under Sec 106 BNSS/i)).toBeInTheDocument();

      // Step 4: Switch scenario to Safehouse Hideout
      const safehouseTab = screen.getByText(/The Safehouse Hideout/i);
      fireEvent.click(safehouseTab);
      expect(screen.getAllByText(/Attempt 3/i).length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Investigating Officer Persona: Executive Dashboard & Incident Tripwire Triage', () => {
    it('allows an investigator to review active syndicate alerts and inspect command options', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <DashboardPage />
          </BrowserRouter>
        </QueryClientProvider>
      );

      // Step 1: Commander assesses Operational Command Center
      expect(screen.getByText(/Operational Command Center & Case Synthesis/i)).toBeInTheDocument();

      // Step 2: Critical Financial Tripwire banner is visible
      expect(screen.getByText(/CRITICAL FINANCIAL TRIPWIRE/i)).toBeInTheDocument();
      expect(screen.getByText(/Freeze Account Now/i)).toBeInTheDocument();

      // Step 3: Quick Navigation actions are accessible
      expect(screen.getByRole('button', { name: /Run Criminal Escape Simulation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Guardian Trace/i })).toBeInTheDocument();
    }, 15000);
  });
});
