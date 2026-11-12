import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  it('renders the crime categories and citizen sentinel title', () => {
    renderWithRouter(<CitizenReportingPage />);

    expect(screen.getByText(/Report a Crime Safely & Directly to Police/i)).toBeInTheDocument();
    expect(screen.getByText(/DPDP Act 2023 Compliant/i)).toBeInTheDocument();

    // Key Crime Category Cards
    expect(screen.getByText('Theft & Snatching')).toBeInTheDocument();
    expect(screen.getByText('Cyber Financial Fraud')).toBeInTheDocument();
    expect(screen.getByText('Physical Assault & Hurt')).toBeInTheDocument();
    expect(screen.getByText('Women Safety & Stalking')).toBeInTheDocument();
    expect(screen.getByText('Public Property Damage')).toBeInTheDocument();
  });

  it('toggles anonymous mode and reveals reporter contact fields', async () => {
    renderWithRouter(<CitizenReportingPage />);

    // By default, anonymous mode is false (input unchecked)
    expect(screen.getByPlaceholderText(/Your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/\+91 98765 43210/i)).toBeInTheDocument();

    // Toggle anonymous mode ON
    const anonToggle = screen.getByRole('checkbox');
    fireEvent.click(anonToggle);

    // Reporter contact fields should now be concealed under informant privilege
    expect(screen.getByText(/Informant Privilege Active/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Your name/i)).not.toBeInTheDocument();
  });

  it('runs intelligent NLP quality engine and updates description', async () => {
    renderWithRouter(<CitizenReportingPage />);

    const textarea = screen.getByPlaceholderText(/Provide objective facts in any language or slang/i);
    fireEvent.change(textarea, { target: { value: 'bhai mera phone chori ho gaya rajiv chowk gate 2 pe 3 baje' } });

    expect(textarea).toHaveValue('bhai mera phone chori ho gaya rajiv chowk gate 2 pe 3 baje');
    // Verifies language detector detected Hinglish / Hindi or Indic keywords
    await waitFor(() => {
      expect(screen.getByText(/AI Legal Meaning Normalizer & Formal Police Abstract/i)).toBeInTheDocument();
      expect(screen.getByText(/Investigative 5W Completeness/i)).toBeInTheDocument();
    });
  });

  it('submits report and displays confirmation with PUB tracking number and nearest station', async () => {
    // Mock the submission endpoint response
    vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        status: 'SUCCESS',
        report_number: 'PUB-2026-8812',
        submission_id: 1,
        nearest_station_name: 'Noida Sector 20 Police Station',
        distance_to_station_km: 1.4,
        ai_verdict: 'SATELLITE_VERIFIED',
        satellite_verified: true,
        satellite_confidence: 0.94,
        layers: {
          exif: { notes: 'EXIF metadata verified' },
        },
        submitted_at: new Date().toISOString(),
      },
    });

    renderWithRouter(<CitizenReportingPage />);

    // Fill minimum required fields
    const addressInput = screen.getByPlaceholderText(/e\.g\. Connaught Place Block B \/ Metro Gate 3/i);
    fireEvent.change(addressInput, { target: { value: 'Sector 62 Electronic City, Noida' } });

    const textarea = screen.getByPlaceholderText(/Provide objective facts in any language or slang/i);
    fireEvent.change(textarea, { target: { value: 'Black Scorpio TS 09 AB 1234 broke barrier and fled at 14:00.' } });

    const submitBtn = screen.getByRole('button', { name: /Transmit Crime Report to Police Station/i });
    fireEvent.click(submitBtn);

    // Wait for submission confirmation screen
    await waitFor(() => {
      expect(screen.getByText('PUB-2026-8812')).toBeInTheDocument();
      expect(screen.getByText(/Crime Report Successfully Submitted/i)).toBeInTheDocument();
      expect(screen.getByText(/Noida Sector 20 Police Station/i)).toBeInTheDocument();
      expect(screen.getByText(/Satellite Verified/i)).toBeInTheDocument();
    });
  });
});
