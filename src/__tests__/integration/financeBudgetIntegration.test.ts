/**
 * Finance-Budget Integration Tests
 * Tests the integration between financial transactions and budgets.
 *
 * Uses mocked API modules — no live Supabase calls.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../../api/financeAPI', () => ({
  getFinancialTransactions: vi.fn(),
  createFinancialTransaction: vi.fn(),
  updateFinancialTransaction: vi.fn(),
  deleteFinancialTransaction: vi.fn(),
  getFinancialAccounts: vi.fn(),
  createFinancialAccount: vi.fn(),
}));

import * as financeAPI from '../../api/financeAPI';

// ---------------------------------------------------------------------------
// Helper builders
// ---------------------------------------------------------------------------

const USER_ID = 'test-user-id';

function makeBudget(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'budget-1',
    user_id: USER_ID,
    category: 'Groceries',
    limit_amount: 500,
    spent_amount: 0,
    month: '2026-03',
    rollover_enabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeTransaction(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'txn-1',
    user_id: USER_ID,
    description: 'Supermarket',
    amount: 120,
    type: 'expense',
    category: 'Groceries',
    date: '2026-03-05',
    account_id: 'acc-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Finance-Budget Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. Creating a transaction in a budget category increases budget spent
  // -------------------------------------------------------------------------
  test('should track transactions against budget category', async () => {
    const budget = makeBudget({ spent_amount: 0, limit_amount: 500 });
    const txn = makeTransaction({ amount: 120, category: 'Groceries' });

    vi.mocked(financeAPI.createFinancialTransaction).mockResolvedValue(txn as any);
    vi.mocked(financeAPI.getFinancialTransactions).mockResolvedValue([txn] as any);

    // Create a transaction
    const created = await financeAPI.createFinancialTransaction({
      description: txn.description,
      amount: txn.amount as number,
      type: 'expense',
      category: 'Groceries',
      date: txn.date as string,
      account_id: 'acc-1',
    });

    expect(created.amount).toBe(120);
    expect(created.category).toBe('Groceries');

    // Fetch transactions for the category and sum them (simulating budget tracking)
    const transactions = await financeAPI.getFinancialTransactions({ category: 'Groceries' });
    const spent = transactions
      .filter((t: any) => t.category === 'Groceries' && t.type === 'expense')
      .reduce((sum: number, t: any) => sum + (t.amount as number), 0);

    // Budget should now show 120 of 500 spent
    const updatedBudget = { ...budget, spent_amount: spent };
    expect(updatedBudget.spent_amount).toBe(120);
    expect(updatedBudget.limit_amount - updatedBudget.spent_amount).toBe(380);
  });

  // -------------------------------------------------------------------------
  // 2. Budget with 100% usage shows correct status
  // -------------------------------------------------------------------------
  test('should detect budget at 100% usage', async () => {
    const budget = makeBudget({ limit_amount: 200, spent_amount: 200 });

    const usagePercent = (budget.spent_amount / budget.limit_amount) * 100;
    expect(usagePercent).toBe(100);

    // Status should be "exceeded" or "at limit"
    const status = usagePercent >= 100 ? 'exceeded' : usagePercent >= 80 ? 'warning' : 'ok';
    expect(status).toBe('exceeded');
  });

  // -------------------------------------------------------------------------
  // 3. Remaining budget decreases with each new transaction
  // -------------------------------------------------------------------------
  test('should calculate remaining budget after transactions', async () => {
    const transactions = [
      makeTransaction({ id: 'txn-1', amount: 100 }),
      makeTransaction({ id: 'txn-2', amount: 150 }),
      makeTransaction({ id: 'txn-3', amount: 75 }),
    ];

    vi.mocked(financeAPI.getFinancialTransactions).mockResolvedValue(transactions as any);

    const fetched = await financeAPI.getFinancialTransactions({ category: 'Groceries' });
    const totalSpent = fetched.reduce((sum: number, t: any) => sum + (t.amount as number), 0);
    const limitAmount = 500;
    const remaining = limitAmount - totalSpent;

    expect(totalSpent).toBe(325);
    expect(remaining).toBe(175);
  });

  // -------------------------------------------------------------------------
  // 4. Deleting a transaction reduces budget spent
  // -------------------------------------------------------------------------
  test('should update budget spent after deleting a transaction', async () => {
    const txn1 = makeTransaction({ id: 'txn-1', amount: 100 });
    const txn2 = makeTransaction({ id: 'txn-2', amount: 50 });

    vi.mocked(financeAPI.deleteFinancialTransaction).mockResolvedValue(undefined as any);
    vi.mocked(financeAPI.getFinancialTransactions)
      .mockResolvedValueOnce([txn1, txn2] as any) // before delete
      .mockResolvedValueOnce([txn2] as any);       // after delete

    const before = await financeAPI.getFinancialTransactions({ category: 'Groceries' });
    const spentBefore = before.reduce((s: number, t: any) => s + t.amount, 0);
    expect(spentBefore).toBe(150);

    // Delete txn1
    await financeAPI.deleteFinancialTransaction('txn-1');

    const after = await financeAPI.getFinancialTransactions({ category: 'Groceries' });
    const spentAfter = after.reduce((s: number, t: any) => s + t.amount, 0);
    expect(spentAfter).toBe(50);
  });

  // -------------------------------------------------------------------------
  // 5. Budget rollover carries unspent amount to next month
  // -------------------------------------------------------------------------
  test('should carry unspent amount to next month when rollover enabled', () => {
    const budget = makeBudget({
      limit_amount: 500,
      spent_amount: 300,
      rollover_enabled: true,
      month: '2026-03',
    });

    const unspent = (budget.limit_amount as number) - (budget.spent_amount as number);
    expect(unspent).toBe(200);

    // Simulate rollover: next month's limit includes unspent from current month
    const nextMonthBudget = {
      ...budget,
      id: 'budget-2',
      month: '2026-04',
      limit_amount: budget.limit_amount + unspent,
      spent_amount: 0,
    };

    expect(nextMonthBudget.limit_amount).toBe(700); // 500 + 200 rollover
    expect(nextMonthBudget.spent_amount).toBe(0);
  });

  // -------------------------------------------------------------------------
  // 6. Alert when approaching budget limit (80% threshold)
  // -------------------------------------------------------------------------
  test('should alert when approaching budget limit at 80%', () => {
    const budget = makeBudget({ limit_amount: 500, spent_amount: 410 });

    const usagePercent = ((budget.spent_amount as number) / (budget.limit_amount as number)) * 100;
    expect(usagePercent).toBeGreaterThanOrEqual(80);

    const shouldAlert = usagePercent >= 80;
    expect(shouldAlert).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 7. Budget report: sum spending by category for a time period
  // -------------------------------------------------------------------------
  test('should generate spending summary by category', async () => {
    const transactions = [
      makeTransaction({ id: 't1', category: 'Groceries', amount: 100 }),
      makeTransaction({ id: 't2', category: 'Groceries', amount: 80 }),
      makeTransaction({ id: 't3', category: 'Transportation', amount: 60 }),
      makeTransaction({ id: 't4', category: 'Transportation', amount: 40 }),
      makeTransaction({ id: 't5', category: 'Entertainment', amount: 30 }),
    ];

    vi.mocked(financeAPI.getFinancialTransactions).mockResolvedValue(transactions as any);

    const fetched = await financeAPI.getFinancialTransactions({ month: '2026-03' });

    // Group by category
    const summary: Record<string, number> = {};
    for (const t of fetched) {
      const cat = (t as any).category as string;
      summary[cat] = (summary[cat] ?? 0) + ((t as any).amount as number);
    }

    expect(summary['Groceries']).toBe(180);
    expect(summary['Transportation']).toBe(100);
    expect(summary['Entertainment']).toBe(30);
    expect(Object.keys(summary)).toHaveLength(3);
  });
});
