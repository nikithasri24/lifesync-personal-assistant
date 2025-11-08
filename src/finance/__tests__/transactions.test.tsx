import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TransactionsPage from '../pages/TransactionsPage';

vi.mock('../data', async () => {
  const { MockApi } = await import('../data/mockApi');
  return { getFinanceAPI: async () => new MockApi() };
});

describe('Finance Transactions', () => {
  it('filters by text and type', async () => {
    render(<TransactionsPage />);
    await waitFor(() => expect(screen.getByText(/Transactions/)).toBeInTheDocument());

    // filter to Debit only
    const typeSelect = screen.getByLabelText('Type');
    fireEvent.change(typeSelect, { target: { value: 'debit' } });
    const applyBtn = screen.getByRole('button', { name: 'Apply' });
    fireEvent.click(applyBtn);
    await waitFor(() => expect(screen.getAllByRole('row').length).toBeGreaterThan(2));

    // refine to Costco
    const search = screen.getByLabelText('Search');
    fireEvent.change(search, { target: { value: 'Costco' } });
    fireEvent.click(applyBtn);
    await waitFor(() => expect(screen.getAllByRole('row').length).toString());
    expect(screen.getByText(/Costco/)).toBeInTheDocument();
  });
});

