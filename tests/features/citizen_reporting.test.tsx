import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import { CitizenReportingPage } from '../../src/features/citizen/CitizenReportingPage';

// Wrap component in BrowserRouter for routing
function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('CitizenReportingPage Feature Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the 6 primary crime categories and title', () => {
    renderWithRouter(<CitizenReportingPage />);

    expect(screen.getByText(/Report a Crime Safely & Anonymously/i)).toBeInTheDocument();
    expect(screen.getByText(/DPDP Act 2023 Compliant/i)).toBeInTheDocument();

    // 6 Crime Category Cards
    expect(screen.getByText('Theft / Burglary')).toBeInTheDocument();
    expect(screen.getByText('Assault / Violence')).toBeInTheDocument();
    expect(screen.getByText('Cyber Fraud')).toBeInTheDocument();
    expect(screen.getByText('Harassment / Stalking')).toBeInTheDocument();
    expect(screen.getByText('Vandalism / Property')).toBeInTheDocument();
    expect(screen.getByText('Other Cognizable Offence')).toBeInTheDocument();
  });

  it('toggles anonymous mode and hides personal contact fields', async () => {
    renderWithRouter(<CitizenReportingPage />);

    // By default, anonymous mode is true (safety by default)
    expect(screen.getByText(/Anonymous Reporting Active/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Inspector Vikram or Civilian Name/i)).not.toBeInTheDocument();

    // Toggle anonymous mode off to reveal personal contact fields
    const anonToggle = screen.getByRole('checkbox', { name: /toggle-anonymous-reporting/i });
    fireEvent.click(anonToggle);

    // Reporter contact fields should now be visible
    expect(screen.getByPlaceholderText(/Inspector Vikram or Civilian Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/10-digit mobile number/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your.email@example.com/i)).toBeInTheDocument();
  });

  it('enforces character count and updates description', async () => {
    renderWithRouter(<CitizenReportingPage />);

    const textarea = screen.getByPlaceholderText(/Provide chronological details/i);
    fireEvent.change(textarea, { target: { value: 'Suspicious vehicle observed near Sector 62 bank ATM.' } });

    expect(textarea).toHaveValue('Suspicious vehicle observed near Sector 62 bank ATM.');
    expect(screen.getByText(/\/ 1000 characters/i)).toBeInTheDocument();
  });

  it('submits report and displays confirmation with PUB tracking number and nearest station', async () => {
    // Mock the submission endpoint response
    vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        status: 'SUCCESS',
        report_number: 'PUB-2026-8812',
        nearest_station: {
          id: 'PS-NOIDA-SEC20',
          name: 'Noida Sector 20 Police Station',
          distance_km: 1.4,
          phone: '0120-2525100',
        },
        satellite_verdict: {
          verified: true,
          confidence: 0.88,
          verdict: 'SATELLITE_VERIFIED',
          layers: {
            exif: { score: 1.0, exif_found: true, distance_km: 0.05 },
            timestamp: { score: 1.0, delta_hours: 1.2 },
            location_type: { score: 0.9 },
          },
        },
        tracking_url: '/citizen/track?ref=PUB-2026-8812',
      },
    });

    renderWithRouter(<CitizenReportingPage />);

    // Fill minimum required fields
    const addressInput = screen.getByPlaceholderText(/Street address, landmark/i);
    fireEvent.change(addressInput, { target: { value: 'Sector 62 Electronic City, Noida' } });

    const textarea = screen.getByPlaceholderText(/Provide chronological details/i);
    fireEvent.change(textarea, { target: { value: 'Black Scorpio TS 09 AB 1234 broke barrier and fled.' } });

    const submitBtn = screen.getByRole('button', { name: /Transmit Crime Report to Nearest Station/i });
    fireEvent.click(submitBtn);

    // Wait for submission confirmation screen
    await waitFor(() => {
      expect(screen.getByText('PUB-2026-8812')).toBeInTheDocument();
      expect(screen.getByText(/Crime Report Successfully Dispatched/i)).toBeInTheDocument();
      expect(screen.getByText(/Noida Sector 20 Police Station/i)).toBeInTheDocument();
      expect(screen.getByText(/Satellite Verified/i)).toBeInTheDocument();
    });
  });
});
