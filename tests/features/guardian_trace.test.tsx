import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { GuardianTracePage } from '../../src/features/guardian-trace/GuardianTracePage';

// Mock maplibre-gl to avoid WebGL / Canvas errors in JSDOM
vi.mock('maplibre-gl', () => {
  const mockMarker = {
    setLngLat: vi.fn().mockReturnThis(),
    setPopup: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
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

describe('GuardianTracePage Feature Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Guardian Trace HUD with emergency mandate and missing child details', () => {
    renderWithRouter(<GuardianTracePage />);

    expect(screen.getByText(/Guardian Trace: Multimodal Missing Persons Search HUD/i)).toBeInTheDocument();
    expect(screen.getByText(/CRITICAL EMERGENCY \(AGE < 12\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Aanya Sharma \(8\)/i)).toBeInTheDocument();
    expect(screen.getByText(/PS Lajpat Nagar/i)).toBeInTheDocument();
  });

  it('renders split-screen components: metrics, top 3 predictions, and sighting feed', () => {
    renderWithRouter(<GuardianTracePage />);

    // 4 Live Metric Pills
    expect(screen.getByText(/Last Seen/i)).toBeInTheDocument();
    expect(screen.getByText(/12 Multimodal/i)).toBeInTheDocument();
    expect(screen.getByText(/10 km Ring/i)).toBeInTheDocument();

    // Top Predictions
    expect(screen.getByText(/AI Next-Location Predictions \(Top 3\)/i)).toBeInTheDocument();
    expect(screen.getByText(/New Delhi Railway Station/i)).toBeInTheDocument();

    // Sightings Feed
    expect(screen.getByText(/Multimodal Sighting & Digital Exhaust Stream/i)).toBeInTheDocument();
  });

  it('launches interactive animated demo player on button click', () => {
    renderWithRouter(<GuardianTracePage />);

    const playDemoBtn = screen.getByRole('button', { name: /▶ Play Live Demo/i });
    expect(playDemoBtn).toBeInTheDocument();

    fireEvent.click(playDemoBtn);

    // Modal or demo player opens with 90s simulation content
    expect(screen.getByText(/Guardian Trace: 90-Second Operational Scenario/i)).toBeInTheDocument();
    expect(screen.getByText(/Operation Aanya/i)).toBeInTheDocument();
  });

  it('interacts with timeline slider and controls', () => {
    renderWithRouter(<GuardianTracePage />);

    const slider = screen.getByRole('slider', { name: /Investigation Timeline Scrubber/i });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue('18');

    // Change slider hour to 6 hours
    fireEvent.change(slider, { target: { value: '6' } });
    expect(slider).toHaveValue('6');

    // Play/Pause timeline animation toggle
    const playTimelineBtn = screen.getByRole('button', { name: /Auto-play timeline/i });
    expect(playTimelineBtn).toBeInTheDocument();
    fireEvent.click(playTimelineBtn);
  });

  it('opens emergency community broadcast modal with DPDP compliance notice', () => {
    renderWithRouter(<GuardianTracePage />);

    const broadcastBtn = screen.getByRole('button', { name: /🚨 Broadcast Alert/i });
    expect(broadcastBtn).toBeInTheDocument();

    fireEvent.click(broadcastBtn);

    expect(screen.getByText(/Trigger Emergency Community Broadcast Alert/i)).toBeInTheDocument();
    expect(screen.getByText(/DPDP Emergency Exemption Sec 17\(b\)/i)).toBeInTheDocument();
    expect(screen.getByText(/~14,200 Registered Users/i)).toBeInTheDocument();

    const confirmBroadcastBtn = screen.getByRole('button', { name: /Confirm & Broadcast Alert/i });
    fireEvent.click(confirmBroadcastBtn);
  });
});
