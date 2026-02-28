import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    loading: false,
  }),
}));

vi.mock('@/hooks/useFinanceQuery', () => ({
  useFinanceMergedConnectionQuery: () => ({ data: null }),
  useBudgetsQuery: () => ({
    data: [
      {
        id: 'budget-1',
        userId: 'test-user',
        categoryId: 'cat-transport',
        month: new Date().toISOString().slice(0, 7),
        limit: 50,
      },
    ],
    isLoading: false,
  }),
  useUpsertBudgetMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteBudgetMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useCategoriesQuery: () => ({
    data: [
      { id: 'cat-transport', name: 'Transport', icon: '🚗', color: '#3B82F6', userId: 'test-user' },
    ],
    isLoading: false,
  }),
  useTransactionsQuery: () => ({
    data: [
      {
        id: 'txn-1',
        userId: 'test-user',
        accountId: 'acc-1',
        dateISO: new Date().toISOString().split('T')[0],
        description: 'Bus ticket',
        categoryId: 'cat-transport',
        amount: 60.10,
        type: 'debit',
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/finance/store/useFinanceFilters', () => ({
  default: () => ({
    ownerFilter: 'all',
    setOwnerFilter: vi.fn(),
  }),
}));

// Also mock with relative path (might be imported differently)
vi.mock('../store/useFinanceFilters', () => ({
  default: () => ({
    ownerFilter: 'all',
    setOwnerFilter: vi.fn(),
  }),
}));

describe('Finance Budgets', () => {
  it('renders the budgets page with budget data', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const { default: BudgetsPage } = await import('../pages/BudgetsPage');

    render(
      <QueryClientProvider client={queryClient}>
        <BudgetsPage />
      </QueryClientProvider>
    );

    // Just verify the page renders without crashing
    const budgetHeadings = screen.getAllByText(/Budgets/i);
    expect(budgetHeadings.length).toBeGreaterThan(0);
  });
});
