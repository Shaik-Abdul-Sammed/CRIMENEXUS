import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import { CitizenReportingPage } from '../../src/features/citizen/CitizenReportingPage';
import { PublicReportsQueue } from '../../src/features/police/PublicReportsQueue';

// Mock maplibre-gl for jsdom
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
    },
    Map: vi.fn(() => mockMap),
    Marker: vi.fn(() => mockMarker),
    Popup: vi.fn(() => ({
      setHTML: vi.fn().mockReturnThis(),
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
    })),
    NavigationControl: vi.fn(),
  };
});

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('Citizen-to-Police Live Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('integrates citizen report transmission with API response contract', async () => {
    const mockApiResponse = {
      status: 'SUCCESS',
      report_number: 'PUB-2026-9999',
      submission_id: 99,
      nearest_station_name: 'Connaught Place Police Station',
      distance_to_station_km: 0.85,
      ai_verdict: 'SATELLITE_VERIFIED',
      satellite_verified: true,
      satellite_confidence: 0.96,
      layers: {
        exif: { notes: 'EXIF metadata verified' },
        spectral: { notes: 'Optical match confirmed' },
      },
      submitted_at: new Date().toISOString(),
    };

    vi.spyOn(axios, 'post').mockResolvedValueOnce({ data: mockApiResponse });

    renderWithRouter(<CitizenReportingPage />);

    // Select Cyber Crime category
    const cyberCard = screen.getByText('Cyber Financial Fraud');
    fireEvent.click(cyberCard);

    // Enter address and description
    const addressInput = screen.getByPlaceholderText(/e\.g\. Connaught Place Block B \/ Metro Gate 3/i);
    fireEvent.change(addressInput, { target: { value: 'Connaught Place Inner Circle' } });

    const descInput = screen.getByPlaceholderText(/Provide objective facts in any language or slang/i);
    fireEvent.change(descInput, {
      target: { value: 'Victim lost Rs 45,000 via fraudulent UPI link spoofing electricity board at 14:15.' },
    });

    const submitBtn = screen.getByRole('button', { name: /Submit Crime Report with Proof/i });
    fireEvent.click(submitBtn);

    // Assert that the confirmation receipt renders the integrated station & report number
    await waitFor(() => {
      expect(screen.getByText('PUB-2026-9999')).toBeInTheDocument();
      expect(screen.getByText(/Connaught Place Police Station/i)).toBeInTheDocument();
      expect(screen.getByText(/0.85 km/i)).toBeInTheDocument();
      expect(screen.getByText(/Satellite Verified/i)).toBeInTheDocument();
    });
  }, 15000);

  it('renders PublicReportsQueue with filter controls and handles report status preview', async () => {
    renderWithRouter(<PublicReportsQueue />);

    // Verify queue header is present
    await waitFor(() => {
      expect(screen.getByText(/Citizen Sentinel • Public Reports Verification Queue/i)).toBeInTheDocument();
    });

    // Verify filter badges and counts are rendered
    expect(screen.getByRole('button', { name: 'ALL' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PENDING' })).toBeInTheDocument();
  }, 15000);
});
