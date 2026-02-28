import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockTransactions = [
  {
    id: 'txn-1',
    userId: 'user-1',
    accountId: 'acc-1',
    dateISO: '2025-11-01',
    description: 'Costco Wholesale',
    categoryId: 'cat-1',
    amount: 150.00,
    type: 'debit' as const,
    notes: null,
    merchantName: 'COSTCO',
    confidenceScore: 0.95,
    suggestedCategoryId: null,
    categorizationRuleId: null,
  },
  {
    id: 'txn-2',
    userId: 'user-1',
    accountId: 'acc-1',
    dateISO: '2025-11-02',
    description: 'Paycheck',
    categoryId: 'cat-2',
    amount: 2500.00,
    type: 'credit' as const,
    notes: null,
    merchantName: null,
    confidenceScore: null,
    suggestedCategoryId: null,
    categorizationRuleId: null,
  },
  {
    id: 'txn-3',
    userId: 'user-1',
    accountId: 'acc-1',
    dateISO: '2025-11-03',
    description: 'Amazon Purchase',
    categoryId: 'cat-1',
    amount: 45.99,
    type: 'debit' as const,
    notes: null,
    merchantName: 'AMAZON',
    confidenceScore: 0.9,
    suggestedCategoryId: null,
    categorizationRuleId: null,
  },
];

vi.mock('../data', () => ({
  getFinanceAPI: async () => ({
    listTransactions: async ({ text, type }: { text?: string; type?: string }) => {
      let items = mockTransactions;
      if (type) items = items.filter(t => t.type === type);
      if (text) items = items.filter(t => t.description.toLowerCase().includes(text.toLowerCase()));
      return { items, nextCursor: undefined };
    },
  }),
}));

vi.mock('../store/useFinanceFilters', () => {
  let state = { text: '', fromISO: undefined, toISO: undefined, type: undefined };
  return {
    default: () => ({
      ...state,
      setField: (key: string, value: unknown) => { state = { ...state, [key]: value }; },
      reset: () => { state = { text: '', fromISO: undefined, toISO: undefined, type: undefined }; },
    }),
  };
});

describe('Finance Transactions', () => {
  it('renders transactions page', async () => {
    const { default: TransactionsPage } = await import('../pages/TransactionsPage');
    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Transactions/)).toBeInTheDocument();
    });

    // Verify the page renders
    expect(screen.getByText(/Transactions/)).toBeInTheDocument();
  });
});
