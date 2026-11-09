import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MobileExtractionModal } from '../../src/features/forensics/MobileExtractionModal';

describe('Mobile Extraction Legal Gate UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with statutory basis selections and default Warrant mode', () => {
    render(<MobileExtractionModal isOpen={true} onClose={() => {}} caseNumber="FIR-2026-8812" />);

    expect(screen.getByText(/Mobile Device Forensic Ingestion Gate/i)).toBeInTheDocument();
    expect(screen.getByText('Judicial Warrant')).toBeInTheDocument();
    expect(screen.getByText('Civilian Consent')).toBeInTheDocument();
    expect(screen.getByText('Sec 105 BNSS')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. WAR-CMM-DEL-2026-904/i)).toBeInTheDocument();
  });

  it('shows error if warrant number is omitted in Warrant basis', async () => {
    render(<MobileExtractionModal isOpen={true} onClose={() => {}} caseNumber="FIR-2026-8812" />);

    const warrantInput = screen.getByPlaceholderText(/e.g. WAR-CMM-DEL-2026-904/i);
    fireEvent.change(warrantInput, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: /Authorize Mobile Extraction/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Valid Magistrate Search Warrant number is mandatory/i)).toBeInTheDocument();
    });
  });

  it('switches to Civilian Consent mode and validates consent agreement toggle', async () => {
    render(<MobileExtractionModal isOpen={true} onClose={() => {}} caseNumber="FIR-2026-8812" />);

    // Click Consent basis button
    const consentBtn = screen.getByText('Civilian Consent');
    fireEvent.click(consentBtn);

    expect(screen.getByText(/Civilian signed statutory consent form under Section 17\(b\) DPDP Act 2023/i)).toBeInTheDocument();

    // Submit without checking box
    const submitBtn = screen.getByRole('button', { name: /Authorize Mobile Extraction/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Verified civilian consent form must be uploaded/i)).toBeInTheDocument();
    });
  });

  it('submits valid warrant and renders compliance hash pass', async () => {
    vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        status: 'SUCCESS',
        gate_pass: {
          authorized: true,
          legal_basis: 'WARRANT',
          device_imei: '860123456789012',
          compliance_hash: '3f7a1e8c9d0b2f4a6e8b0d2c4e6a8b0d2c4e6a8b0d2c4e6a8b0d2c4e6a8b0d2c',
        },
      },
    });

    render(<MobileExtractionModal isOpen={true} onClose={() => {}} caseNumber="FIR-2026-8812" />);

    const warrantInput = screen.getByPlaceholderText(/e.g. WAR-CMM-DEL-2026-904/i);
    fireEvent.change(warrantInput, { target: { value: 'WAR-CMM-DEL-2026-904' } });

    const submitBtn = screen.getByRole('button', { name: /Authorize Mobile Extraction/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Statutory Legal Gate Passed • Extraction Authorized/i)).toBeInTheDocument();
      expect(screen.getByText(/3f7a1e8c9d0b2f4a6e8b0d2c4e6a8b0d2c4e6a8b0d2c4e6a8b0d2c4e6a8b0d2c/i)).toBeInTheDocument();
    });
  });
});
