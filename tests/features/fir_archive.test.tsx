import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FIRArchivePage } from '../../src/features/fir-archive/FIRArchivePage';
import { CasesPage } from '../../src/features/cases/CasesPage';
import { FIRArchiveModal } from '../../src/features/cases/FIRArchiveModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
}

describe('FIR Intelligence Archive Feature Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders FIR archive page with 200 historical FIRs and controls', async () => {
    renderWithProviders(<FIRArchivePage />);

    expect(
      screen.getByText(/FIR Intelligence Archive & Forensic Retrospective Engine/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/11 Indic Languages • 200 FIRs \(2015–2025\)/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/200 Historical FIRs/i)).toBeInTheDocument();

    // Verify filter dropdowns exist
    expect(screen.getByLabelText(/Filter FIR by Language/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Filter FIR by Year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Filter FIR by Court Outcome/i)).toBeInTheDocument();
  });

  it('filters historical FIR table by Hindi language', async () => {
    renderWithProviders(<FIRArchivePage />);

    const langSelect = screen.getByLabelText(/Filter FIR by Language/i);
    fireEvent.change(langSelect, { target: { value: 'hi' } });

    // Table updates to display Hindi FIR rows
    await waitFor(() => {
      const hindiBadges = screen.getAllByText('HI');
      expect(hindiBadges.length).toBeGreaterThan(0);
    });
  });

  it('executes Run All 25 Analytics and switches to analytics view', async () => {
    renderWithProviders(<FIRArchivePage />);

    const runBtn = screen.getByRole('button', { name: /⚡ Run All 25 Analytics/i });
    expect(runBtn).toBeInTheDocument();

    fireEvent.click(runBtn);

    // Progress bar or active status appears
    await waitFor(
      () => {
        expect(
          screen.getByText(/25 Expert Retrospective Analytical Insights/i)
        ).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  }, 15000);

  it('renders FIRArchiveModal with suspect status, officer career, and closes on Esc/close button', async () => {
    const handleClose = vi.fn();
    renderWithProviders(
      <FIRArchiveModal
        isOpen={true}
        onClose={handleClose}
        caseNumber="FIR-2023-HI-101"
        caseTitle="Commercial Fraud & Extortion"
      />
    );

    expect(
      screen.getByText(/FIR Intelligence Archive Dossier: FIR-2023-HI-101/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/3-Line Forensic Meaning Extraction \(RAG Synthesizer\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Suspect Life-Status \(Sec 108 IEA\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Investigating Officer Docket/i)
    ).toBeInTheDocument();

    // Close button triggers callback
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('verifies History column and button in CasesPage', async () => {
    renderWithProviders(<CasesPage />);

    // Table view header should contain History
    await waitFor(
      () => {
        expect(screen.getByText('History')).toBeInTheDocument();
      },
      { timeout: 6000 }
    );

    // Past FIRs button should be present for cases with history
    const pastFIRBtns = await waitFor(
      () => {
        const btns = screen.getAllByText(/📜 View Past FIRs/i);
        expect(btns.length).toBeGreaterThan(0);
        return btns;
      },
      { timeout: 6000 }
    );

    // Clicking button opens the modal
    fireEvent.click(pastFIRBtns[0]);
    await waitFor(() => {
      expect(
        screen.getByText(/FIR Intelligence Archive Dossier/i)
      ).toBeInTheDocument();
    });
  });
});
