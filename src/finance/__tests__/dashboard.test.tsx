import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '../pages/DashboardPage';

vi.mock('../data', async () => {
  const { MockApi } = await import('../data/mockApi');
  return { getFinanceAPI: async () => new MockApi() };
});

describe('Finance Dashboard', () => {
  it('shows cash flow totals from seed (latest month)', async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText(/Cash Flow/)).toBeInTheDocument());
    // Income ~ 4200 for latest month
    expect(screen.getByText((c) => /\$?4,?200/.test(c))).toBeTruthy();
    // Expenses sum around 2218.3
    expect(screen.getByText((c) => /2,?218\.3/.test(c) || /2,?218\.30/.test(c))).toBeTruthy();
  });
});

