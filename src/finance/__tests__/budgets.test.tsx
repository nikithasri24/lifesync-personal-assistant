import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import BudgetsPage from '../pages/BudgetsPage';

vi.mock('../data', async () => {
  const { MockApi } = await import('../data/mockApi');
  return { getFinanceAPI: async () => new MockApi() };
});

describe('Finance Budgets', () => {
  it('shows over/under correctly (transport over)', async () => {
    render(<BudgetsPage />);
    await waitFor(() => expect(screen.getByText(/Budgets/)).toBeInTheDocument());
    // transport budget is 50, spent 60.1 -> over appears on its card
    expect(screen.getByText(/over/)).toBeInTheDocument();
  });
});

