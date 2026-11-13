import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RecommendedActions } from '../../src/features/dashboard/RecommendedActions';
import { GuardianTracePage } from '../../src/features/guardian-trace/GuardianTracePage';
import { EscapeSimulationPage } from '../../src/features/demo/EscapeSimulationPage';
import { TopNav } from '../../src/components/layout/TopNav';
import { NetworkGraphPage } from '../../src/features/graph/NetworkGraphPage';

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

describe('Close Buttons & Collapsible Controls Project-Wide Unit Tests', () => {
  it('should dismiss recommended action items when clicking the close button', () => {
    render(
      <BrowserRouter>
        <RecommendedActions />
      </BrowserRouter>
    );

    const dismissButtons = screen.getAllByRole('button', { name: /dismiss recommendation/i });
    expect(dismissButtons.length).toBeGreaterThan(0);

    const initialCount = dismissButtons.length;
    fireEvent.click(dismissButtons[0]);

    const updatedButtons = screen.getAllByRole('button', { name: /dismiss recommendation/i });
    expect(updatedButtons.length).toBe(initialCount - 1);
  });

  it('collapses and restores emergency header in GuardianTracePage using X close button and expand toggle', () => {
    render(
      <BrowserRouter>
        <GuardianTracePage />
      </BrowserRouter>
    );

    // Initial state: emergency header is visible
    expect(screen.getByText(/Guardian Trace: Multimodal Missing Persons Search HUD/i)).toBeInTheDocument();

    // Find and click the X button to collapse emergency header
    const collapseBtn = screen.getByRole('button', { name: /Collapse emergency header/i });
    fireEvent.click(collapseBtn);

    // Header content should now be hidden and the expand pill should be rendered
    expect(screen.queryByText(/Guardian Trace: Multimodal Missing Persons Search HUD/i)).not.toBeInTheDocument();
    expect(screen.getByTitle(/Expand emergency header card/i)).toBeInTheDocument();

    // Click expand button to restore
    const expandBtn = screen.getByTitle(/Expand emergency header card/i);
    fireEvent.click(expandBtn);

    // Header is restored
    expect(screen.getByText(/Guardian Trace: Multimodal Missing Persons Search HUD/i)).toBeInTheDocument();
  }, 15000);

  it('toggles 6-sensor telemetry strip and suspect dossier dropdown in GuardianTracePage', () => {
    render(
      <BrowserRouter>
        <GuardianTracePage />
      </BrowserRouter>
    );

    // Check telemetry strip minimize button
    const telemetryToggle = screen.getByTitle(/Close Telemetry Box/i);
    expect(screen.getByText(/BATTERY DECAY/i)).toBeInTheDocument();

    // Minimize telemetry strip
    fireEvent.click(telemetryToggle);
    expect(screen.queryByText(/BATTERY DECAY/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Expand Telemetry/i)).toBeInTheDocument();

    // Restore telemetry strip
    const expandTelemetryBtn = screen.getByText(/Expand Telemetry/i);
    fireEvent.click(expandTelemetryBtn);
    expect(screen.getByText(/BATTERY DECAY/i)).toBeInTheDocument();

    // Check suspect dossier minimize toggle
    const dossierToggle = screen.getByTitle(/Collapse Dossier/i);
    expect(dossierToggle).toHaveTextContent(/Minimize/i);

    fireEvent.click(dossierToggle);
    expect(dossierToggle).toHaveTextContent(/Expand/i);
  }, 15000);

  it('opens and closes Escape Trajectory dossier preview modal in EscapeSimulationPage', () => {
    render(
      <BrowserRouter>
        <EscapeSimulationPage />
      </BrowserRouter>
    );

    // Click Preview Dossier button
    const previewBtn = screen.getByRole('button', { name: /Preview Dossier/i });
    fireEvent.click(previewBtn);

    // Modal opens with title
    expect(screen.getByText(/Fugitive Pursuit & Escape Trajectory Dossier/i)).toBeInTheDocument();

    // Find and click close modal dialog X button
    const closeBtn = screen.getByRole('button', { name: /Close modal dialog/i });
    fireEvent.click(closeBtn);

    // Modal is closed
    expect(screen.queryByText(/Fugitive Pursuit & Escape Trajectory Dossier/i)).not.toBeInTheDocument();
  }, 15000);

  it('renders TopNav with non-colliding search trigger and breadcrumb navigation', () => {
    render(
      <BrowserRouter>
        <TopNav />
      </BrowserRouter>
    );

    // Verify search trigger button is rendered with keyboard shortcut hint
    const searchTrigger = screen.getByRole('button', { name: /search/i });
    expect(searchTrigger).toBeInTheDocument();
    expect(searchTrigger).toHaveTextContent(/\//);

    // Verify system status badges render properly
    expect(screen.getByText(/ONLINE/i)).toBeInTheDocument();
  });

  it('renders NetworkGraphPage with responsive tactical toolbar controls', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <NetworkGraphPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Verify main header title
    expect(screen.getByText(/Interactive Criminal Network Topology/i)).toBeInTheDocument();

    // Verify toolbar controls
    expect(screen.getByRole('button', { name: /Zoom In/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zoom Out/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Fit/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Reset/i })[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export PNG/i })).toBeInTheDocument();
  });
});
