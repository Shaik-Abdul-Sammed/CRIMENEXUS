import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../../src/components/common/ErrorBoundary';
import { SkeletonLoader } from '../../src/components/common/SkeletonLoader';
import { Modal } from '../../src/components/ui/Modal';

// Problematic component that simulates a WebGL/canvas crash
function CrashingComponent({ shouldCrash }: { shouldCrash: boolean }) {
  if (shouldCrash) {
    throw new Error('WebGL context loss simulation');
  }
  return <div data-testid="live-canvas">Live Cytoscape / MapLibre Canvas</div>;
}

describe('CRIMENEXUS WCAG 2.1 AA Accessibility & Reliability Tests', () => {
  // Test 1: ErrorBoundary catches WebGL/canvas crash and renders accessible fallback
  it('ErrorBoundary should isolate WebGL crashes with role="alert" and reload button', () => {
    // Suppress console.error in test runner output for expected caught error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallbackTitle="Graph Topology View Error">
        <CrashingComponent shouldCrash={true} />
      </ErrorBoundary>
    );

    const alertRegion = screen.getByRole('alert');
    expect(alertRegion).toBeInTheDocument();
    expect(alertRegion).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByText('Graph Topology View Error')).toBeInTheDocument();

    const reloadButton = screen.getByRole('button', { name: /retry rendering/i });
    expect(reloadButton).toBeInTheDocument();

    spy.mockRestore();
  });

  // Test 2: SkeletonLoader renders with correct WCAG loading semantics
  it('SkeletonLoader should render role="status" with polite aria-live and aria-busy', () => {
    render(<SkeletonLoader variant="card" count={2} aria-label="Loading intelligence alerts..." />);

    const statusElement = screen.getByRole('status');
    expect(statusElement).toBeInTheDocument();
    expect(statusElement).toHaveAttribute('aria-live', 'polite');
    expect(statusElement).toHaveAttribute('aria-busy', 'true');
    expect(statusElement).toHaveAttribute('aria-label', 'Loading intelligence alerts...');
  });

  // Test 3: Modal dialog complies with aria-modal and handles Escape key dismissal
  it('Modal dialog should have role="dialog", aria-modal="true", and close on Escape key', () => {
    const handleClose = vi.fn();

    render(
      <Modal
        isOpen={true}
        onClose={handleClose}
        title="Statutory Evidence Inspection"
        description="Review chain of custody before transmission"
      >
        <div>Case Details Content</div>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
