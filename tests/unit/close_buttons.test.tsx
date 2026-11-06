import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RecommendedActions } from '../../src/features/dashboard/RecommendedActions';

describe('Close Buttons Project-Wide Unit Tests', () => {
  it('should dismiss recommended action items when clicking the close button', () => {
    render(
      <BrowserRouter>
        <RecommendedActions />
      </BrowserRouter>
    );

    // Initial state has default recommended actions
    const dismissButtons = screen.getAllByRole('button', { name: /dismiss recommendation/i });
    expect(dismissButtons.length).toBeGreaterThan(0);

    const initialCount = dismissButtons.length;
    // Click the first dismiss button
    fireEvent.click(dismissButtons[0]);

    // Check count decreased by 1
    const updatedButtons = screen.getAllByRole('button', { name: /dismiss recommendation/i });
    expect(updatedButtons.length).toBe(initialCount - 1);
  });
});
