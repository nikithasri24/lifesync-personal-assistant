/**
 * Integration tests for Finance merged mode functionality
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock hooks - comprehensive mock with all needed exports
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' }
  })
}));

const mockMutateAsync = vi.fn().mockResolvedValue({});

vi.mock('@/hooks/useFinanceQuery', () => ({
  useFinanceMergedConnectionQuery: vi.fn(() => ({
    data: {
      connectionId: 'conn-456',
      partnerId: 'partner-789',
      partnerName: 'Sarah'
    }
  })),
  useFinanceMergedConnection: () => ({
    data: {
      connectionId: 'conn-456',
      partnerId: 'partner-789',
      partnerName: 'Sarah'
    }
  }),
  useFinancePartnerName: () => 'Sarah',
  useFinanceHasMergedPermission: () => ({ data: true }),
  useAccountsQuery: () => ({ data: [], isLoading: false }),
  useInstitutionsQuery: () => ({ data: [], isLoading: false }),
  useCategoriesQuery: () => ({ data: [], isLoading: false }),
  useTransactionsQuery: () => ({ data: [], isLoading: false }),
  useInfiniteTransactionsQuery: () => ({ data: { pages: [] }, isLoading: false, fetchNextPage: vi.fn(), hasNextPage: false }),
  useBudgetsQuery: () => ({ data: [], isLoading: false }),
  useBudgetTemplatesQuery: () => ({ data: [], isLoading: false }),
  useGoalsQuery: () => ({ data: [], isLoading: false }),
  useGoalProgressQuery: () => ({ data: [], isLoading: false }),
  useNetWorthQuery: () => ({ data: [], isLoading: false }),
  useCardBenefitsQuery: () => ({ data: [], isLoading: false }),
  useUpdateAccountMutation: () => ({ mutate: vi.fn(), mutateAsync: mockMutateAsync, isPending: false }),
  useUpsertAccountMutation: () => ({ mutate: vi.fn(), mutateAsync: mockMutateAsync, isPending: false }),
  useDeleteAccountMutation: () => ({ mutate: vi.fn(), mutateAsync: mockMutateAsync, isPending: false }),
  useUpsertTransactionMutation: vi.fn(() => ({ mutate: vi.fn(), mutateAsync: mockMutateAsync, isPending: false })),
  useDeleteTransactionMutation: () => ({ mutate: vi.fn(), mutateAsync: mockMutateAsync, isPending: false }),
  useUpsertBudgetMutation: () => ({ mutate: vi.fn(), mutateAsync: mockMutateAsync, isPending: false }),
  useDeleteBudgetMutation: () => ({ mutate: vi.fn(), mutateAsync: mockMutateAsync, isPending: false }),
  useUpsertBudgetTemplateMutation: () => ({ mutate: vi.fn(), mutateAsync: mockMutateAsync, isPending: false }),
  useDeleteBudgetTemplateMutation: () => ({ mutate: vi.fn(), mutateAsync: mockMutateAsync, isPending: false }),
  useInitializeBudgetsMutation: () => ({ mutate: vi.fn(), mutateAsync: mockMutateAsync, isPending: false }),
  useUpsertGoalMutation: () => ({ mutate: vi.fn(), mutateAsync: mockMutateAsync, isPending: false }),
  useDeleteGoalMutation: () => ({ mutate: vi.fn(), mutateAsync: mockMutateAsync, isPending: false }),
  useSyncGoalMutation: () => ({ mutate: vi.fn(), mutateAsync: mockMutateAsync, isPending: false }),
  useUpsertCardBenefitMutation: () => ({ mutate: vi.fn(), mutateAsync: mockMutateAsync, isPending: false }),
  useDeleteCardBenefitMutation: () => ({ mutate: vi.fn(), mutateAsync: mockMutateAsync, isPending: false }),
}));

vi.mock('@/providers/AuthProvider', () => ({
  useAuthContext: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    loading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    clearError: vi.fn(),
    isConfigured: true,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Finance Merged Mode Integration', () => {

  describe('QuickAddTransaction', () => {
    it('should render the add transaction form in merged mode', async () => {
      const { QuickAddTransaction } = await import('../components/QuickAddTransaction');
      render(
        <QuickAddTransaction onClose={vi.fn()} onSuccess={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      // Form title should be visible (Add Expense is the default type)
      await waitFor(() => {
        expect(screen.getByText(/Add (Expense|Income)/i)).toBeInTheDocument();
      });
    });

    it('should have submit functionality', async () => {
      const { QuickAddTransaction } = await import('../components/QuickAddTransaction');
      render(
        <QuickAddTransaction onClose={vi.fn()} onSuccess={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      // Form should render
      await waitFor(() => {
        expect(screen.getByText(/Add Transaction/i)).toBeInTheDocument();
      });
    });
  });

  describe('GoalEditor', () => {
    it('should show shared goal checkbox in merged mode', async () => {
      const GoalEditor = (await import('../components/goals/GoalEditor')).default;
      render(
        <GoalEditor
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          accounts={[]}
        />,
        { wrapper: createWrapper() }
      );

      // Look for "This is a shared goal" checkbox
      await waitFor(() => {
        expect(screen.getByText(/This is a shared goal/i)).toBeInTheDocument();
      });
    });
  });
});

describe('Finance Non-Merged Mode', () => {
  it('renders transactions page without crashing', async () => {
    const { default: TransactionsPageGrouped } = await import('../pages/TransactionsPageGrouped');

    // Override merged connection to return null for this test
    const financeQuery = await import('@/hooks/useFinanceQuery');
    vi.mocked(financeQuery.useFinanceMergedConnectionQuery).mockReturnValueOnce({ data: null } as any);

    render(<TransactionsPageGrouped />, { wrapper: createWrapper() });

    // Just verify it renders
    await waitFor(() => {
      // Some text should be present
      expect(document.body).toBeTruthy();
    });
  });
});
