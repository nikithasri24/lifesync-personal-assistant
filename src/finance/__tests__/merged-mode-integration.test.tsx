/**
 * Integration tests for Finance merged mode functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuickAddTransaction } from '../components/QuickAddTransaction';
import { AccountModal } from '../components/AccountModal';
import GoalEditor from '../components/goals/GoalEditor';
import TransactionsPageGrouped from '../pages/TransactionsPageGrouped';
import AccountsPage from '../pages/AccountsPage';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' }
  })
}));

vi.mock('@/hooks/useFinanceQuery', () => ({
  useFinanceMergedConnectionQuery: () => ({
    data: {
      connectionId: 'conn-456',
      partnerId: 'partner-789',
      partnerName: 'Sarah'
    }
  }),
  useAccountsQuery: () => ({ data: [], isLoading: false }),
  useCategoriesQuery: () => ({ data: [], isLoading: false }),
  useTransactionsQuery: () => ({ data: [], isLoading: false }),
  useBudgetsQuery: () => ({ data: [], isLoading: false }),
  useUpsertTransactionMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpsertAccountMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
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
    it('should show owner selection in merged mode', () => {
      const { container } = render(
        <QuickAddTransaction onClose={vi.fn()} onSuccess={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      // Look for "Who made this purchase?" label
      expect(screen.getByText(/Who made this purchase/i)).toBeInTheDocument();

      // Look for Me/Sarah options
      const select = container.querySelector('select') as HTMLSelectElement;
      const options = Array.from(select.options).map(o => o.text);

      expect(options).toContain('Me');
      expect(options).toContain('Sarah');
    });

    it('should submit with selected userId', async () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      vi.spyOn(require('@/hooks/useFinanceQuery'), 'useUpsertTransactionMutation')
        .mockReturnValue({ mutateAsync: mockMutate, isPending: false });

      const { container } = render(
        <QuickAddTransaction onClose={vi.fn()} onSuccess={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      // Fill in form
      fireEvent.change(screen.getByPlaceholderText(/description/i), {
        target: { value: 'Test Transaction' }
      });
      fireEvent.change(screen.getByPlaceholderText('0.00'), {
        target: { value: '100' }
      });

      // Select partner as owner
      const ownerSelect = container.querySelector('select[value]') as HTMLSelectElement;
      fireEvent.change(ownerSelect, { target: { value: 'partner-789' } });

      // Submit
      fireEvent.click(screen.getByText(/Add Transaction/i));

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'partner-789',
            description: 'Test Transaction',
            amount: 100
          })
        );
      });
    });
  });

  describe('AccountModal', () => {
    it('should show owner selection in merged mode', () => {
      const { container } = render(
        <AccountModal onClose={vi.fn()} onSuccess={vi.fn()} />,
        { wrapper: createWrapper() }
      );

      // Look for Owner label
      expect(screen.getByText(/Owner/i)).toBeInTheDocument();

      // Look for Me/Sarah options
      const selects = container.querySelectorAll('select');
      const ownerSelect = Array.from(selects).find(select => {
        const options = Array.from(select.options).map(o => o.text);
        return options.includes('Me') && options.includes('Sarah');
      });

      expect(ownerSelect).toBeTruthy();
    });
  });

  describe('GoalEditor', () => {
    it('should show shared goal checkbox in merged mode', () => {
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
      expect(screen.getByText(/This is a shared goal/i)).toBeInTheDocument();
      expect(screen.getByText(/Sarah/i)).toBeInTheDocument(); // Partner name mentioned
    });

    it('should submit with connectionId when shared is checked', async () => {
      const mockSave = vi.fn().mockResolvedValue({});

      const { container } = render(
        <GoalEditor
          isOpen={true}
          onClose={vi.fn()}
          onSave={mockSave}
          accounts={[]}
        />,
        { wrapper: createWrapper() }
      );

      // Fill in goal details
      fireEvent.change(screen.getByLabelText(/Goal Name/i), {
        target: { value: 'House Fund' }
      });
      fireEvent.change(screen.getByLabelText(/Target Amount/i), {
        target: { value: '100000' }
      });

      // Check "shared goal"
      const sharedCheckbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
      fireEvent.click(sharedCheckbox);

      // Submit
      fireEvent.click(screen.getByText(/Save Goal/i));

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'House Fund',
            targetAmount: 100000,
            connectionId: 'conn-456',
            isShared: true
          })
        );
      });
    });
  });

  describe('OwnerFilter Integration', () => {
    it('should render OwnerFilter on TransactionsPage', () => {
      render(<TransactionsPageGrouped />, { wrapper: createWrapper() });

      // Look for filter options
      expect(screen.getByText(/All/i)).toBeInTheDocument();
      expect(screen.getByText(/Mine/i)).toBeInTheDocument();
      expect(screen.getByText(/Sarah/i)).toBeInTheDocument(); // Partner name
    });

    it('should render OwnerFilter on AccountsPage', () => {
      render(<AccountsPage />, { wrapper: createWrapper() });

      // Look for filter component
      const filterContainer = screen.getByText(/All|Mine|Sarah/i).closest('div');
      expect(filterContainer).toBeInTheDocument();
    });
  });

});

describe('Finance Non-Merged Mode', () => {
  beforeEach(() => {
    // Mock no merged connection
    vi.spyOn(require('@/hooks/useFinanceQuery'), 'useFinanceMergedConnectionQuery')
      .mockReturnValue({ data: null });
  });

  it('should NOT show owner selection in QuickAddTransaction', () => {
    render(
      <QuickAddTransaction onClose={vi.fn()} onSuccess={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText(/Who made this purchase/i)).not.toBeInTheDocument();
  });

  it('should NOT show shared goal option in GoalEditor', () => {
    render(
      <GoalEditor
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        accounts={[]}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText(/This is a shared goal/i)).not.toBeInTheDocument();
  });
});
