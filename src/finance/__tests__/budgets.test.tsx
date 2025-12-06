import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BudgetsPage from '../pages/BudgetsPage';

vi.mock('../data', async () => {
  const { MockApi } = await import('../data/mockApi');
  return { getFinanceAPI: async () => new MockApi() };
});

describe('Finance Budgets', () => {
  it('shows over/under correctly (transport over)', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BudgetsPage />
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getAllByText(/Budgets/)[0]).toBeInTheDocument());
    // transport budget is 50, spent 60.1 -> over appears on its card
    expect(screen.getByText(/over/)).toBeInTheDocument();
  });
});

