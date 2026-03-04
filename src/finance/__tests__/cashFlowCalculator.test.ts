/**
 * Unit tests for cashFlowCalculator.ts
 *
 * These cover the core business logic that powers the Dashboard, Sankey chart,
 * and all cash flow metrics. A bug here silently corrupts every finance number.
 * These tests would have caught the Sankey/transfer-filtering regressions in
 * commits ec8ff07 and 187f644.
 */

import { describe, it, expect } from 'vitest';
import {
  filterTransfers,
  calculateCashFlow,
  calculateCashFlowByCategory,
  calculateCashFlowTrend,
  prepareSankeyData,
  TRANSFER_CATEGORY_NAMES,
} from '../utils/cashFlowCalculator';
import type { Transaction } from '../types';
import type { Paystub } from '../data';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const CAT_GROCERIES = { id: 'cat-groceries', name: 'Groceries' };
const CAT_SALARY    = { id: 'cat-salary',    name: 'Salary' };
const CAT_CC_PAY    = { id: 'cat-cc-pay',    name: 'Credit Card Payments' };
const CAT_DINING    = { id: 'cat-dining',    name: 'Food & Dining' };
const categories    = [CAT_GROCERIES, CAT_SALARY, CAT_CC_PAY, CAT_DINING];

function makeTxn(overrides: Partial<Transaction>): Transaction {
  return {
    id: `txn-${Math.random()}`,
    userId: 'user-1',
    accountId: 'acc-1',
    amount: 100,
    type: 'debit',
    description: 'Test',
    dateISO: '2026-03-01',
    categoryId: null,
    transferId: null,
    tags: [],
    notes: null,
    merchantName: null,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

// ─── filterTransfers ─────────────────────────────────────────────────────────

describe('filterTransfers', () => {
  it('keeps regular expense transactions', () => {
    const txns = [makeTxn({ categoryId: CAT_GROCERIES.id })];
    expect(filterTransfers(txns, categories)).toHaveLength(1);
  });

  it('removes transactions in Credit Card Payments category', () => {
    const txns = [
      makeTxn({ categoryId: CAT_GROCERIES.id }),
      makeTxn({ categoryId: CAT_CC_PAY.id }),
    ];
    const result = filterTransfers(txns, categories);
    expect(result).toHaveLength(1);
    expect(result[0].categoryId).toBe(CAT_GROCERIES.id);
  });

  it('removes transactions with a transferId regardless of category', () => {
    const txns = [
      makeTxn({ transferId: 'transfer-abc', categoryId: null }),
      makeTxn({ transferId: null, categoryId: null }),
    ];
    const result = filterTransfers(txns, categories);
    expect(result).toHaveLength(1);
    expect(result[0].transferId).toBeNull();
  });

  it('removes transaction that has BOTH transferId and CC category', () => {
    const txns = [makeTxn({ transferId: 'x', categoryId: CAT_CC_PAY.id })];
    expect(filterTransfers(txns, categories)).toHaveLength(0);
  });

  it('keeps income transactions (salary, credit type)', () => {
    const txns = [makeTxn({ type: 'credit', categoryId: CAT_SALARY.id })];
    expect(filterTransfers(txns, categories)).toHaveLength(1);
  });

  it('handles unknown categories gracefully', () => {
    const txns = [makeTxn({ categoryId: 'unknown-cat-id' })];
    expect(filterTransfers(txns, categories)).toHaveLength(1);
  });

  it('handles empty transaction list', () => {
    expect(filterTransfers([], categories)).toHaveLength(0);
  });

  it('handles empty categories list', () => {
    // When categories is empty, no category IDs are in the transfer set,
    // so only transferId-based filtering applies.
    const txns = [
      makeTxn({ categoryId: CAT_CC_PAY.id, transferId: null }),
      makeTxn({ transferId: 'x', categoryId: null }),
    ];
    const result = filterTransfers(txns, []);
    // transferId txn is removed; CC category txn kept (no category lookup matches)
    expect(result).toHaveLength(1);
    expect(result[0].categoryId).toBe(CAT_CC_PAY.id);
  });

  it('TRANSFER_CATEGORY_NAMES includes Credit Card Payments', () => {
    expect(TRANSFER_CATEGORY_NAMES.has('Credit Card Payments')).toBe(true);
  });
});

// ─── calculateCashFlow ───────────────────────────────────────────────────────

describe('calculateCashFlow', () => {
  it('correctly sums income (credit) and expenses (debit)', () => {
    const txns = [
      makeTxn({ type: 'credit', amount: 5000 }),
      makeTxn({ type: 'debit',  amount: 200  }),
      makeTxn({ type: 'debit',  amount: 150  }),
    ];
    const result = calculateCashFlow(txns);
    expect(result.totalIncome).toBe(5000);
    expect(result.totalExpenses).toBe(350);
    expect(result.netCashFlow).toBe(4650);
  });

  it('returns zero totals for empty list', () => {
    const result = calculateCashFlow([]);
    expect(result.totalIncome).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.netCashFlow).toBe(0);
  });

  it('returns negative net when expenses exceed income', () => {
    const txns = [
      makeTxn({ type: 'credit', amount: 100 }),
      makeTxn({ type: 'debit',  amount: 300 }),
    ];
    expect(calculateCashFlow(txns).netCashFlow).toBe(-200);
  });

  it('separates incomeTransactions and expenseTransactions correctly', () => {
    const txns = [
      makeTxn({ type: 'credit', amount: 5000, description: 'Paycheck' }),
      makeTxn({ type: 'debit',  amount: 80,   description: 'Groceries' }),
    ];
    const result = calculateCashFlow(txns);
    expect(result.incomeTransactions).toHaveLength(1);
    expect(result.expenseTransactions).toHaveLength(1);
    expect(result.incomeTransactions[0].description).toBe('Paycheck');
  });

  it('handles decimal amounts without floating-point errors', () => {
    const txns = [
      makeTxn({ type: 'credit', amount: 1234.56 }),
      makeTxn({ type: 'debit',  amount: 56.78  }),
    ];
    const result = calculateCashFlow(txns);
    expect(result.totalIncome).toBeCloseTo(1234.56, 2);
    expect(result.totalExpenses).toBeCloseTo(56.78, 2);
  });
});

// ─── calculateCashFlowByCategory ─────────────────────────────────────────────

describe('calculateCashFlowByCategory', () => {
  it('groups transactions by category and sorts by amount descending', () => {
    const txns = [
      makeTxn({ categoryId: CAT_DINING.id,    amount: 200, type: 'debit' }),
      makeTxn({ categoryId: CAT_GROCERIES.id, amount: 500, type: 'debit' }),
      makeTxn({ categoryId: CAT_DINING.id,    amount: 100, type: 'debit' }),
    ];
    const result = calculateCashFlowByCategory(txns, categories, 'debit');
    expect(result[0].categoryName).toBe('Groceries');
    expect(result[0].amount).toBe(500);
    expect(result[1].categoryName).toBe('Food & Dining');
    expect(result[1].amount).toBe(300);
  });

  it('calculates percentages correctly', () => {
    const txns = [
      makeTxn({ categoryId: CAT_GROCERIES.id, amount: 300, type: 'debit' }),
      makeTxn({ categoryId: CAT_DINING.id,    amount: 700, type: 'debit' }),
    ];
    const result = calculateCashFlowByCategory(txns, categories, 'debit');
    const dining = result.find(r => r.categoryName === 'Food & Dining')!;
    expect(dining.percentage).toBeCloseTo(70, 1);
    const groceries = result.find(r => r.categoryName === 'Groceries')!;
    expect(groceries.percentage).toBeCloseTo(30, 1);
  });

  it('filters by type when type="debit" — excludes credit transactions', () => {
    const txns = [
      makeTxn({ type: 'debit',  amount: 100, categoryId: CAT_GROCERIES.id }),
      makeTxn({ type: 'credit', amount: 500, categoryId: CAT_SALARY.id    }),
    ];
    const result = calculateCashFlowByCategory(txns, categories, 'debit');
    expect(result).toHaveLength(1);
    expect(result[0].categoryName).toBe('Groceries');
  });

  it('labels unknown category as Uncategorized', () => {
    const txns = [makeTxn({ categoryId: 'unknown-id', amount: 100, type: 'debit' })];
    const result = calculateCashFlowByCategory(txns, categories, 'debit');
    expect(result[0].categoryName).toBe('Uncategorized');
  });

  it('labels null categoryId as Uncategorized', () => {
    const txns = [makeTxn({ categoryId: null, amount: 50, type: 'debit' })];
    const result = calculateCashFlowByCategory(txns, categories, 'debit');
    expect(result[0].categoryName).toBe('Uncategorized');
  });

  it('returns 0% for all items when total is 0', () => {
    // No items means no division by zero
    const result = calculateCashFlowByCategory([], categories, 'debit');
    expect(result).toHaveLength(0);
  });
});

// ─── calculateCashFlowTrend ───────────────────────────────────────────────────

describe('calculateCashFlowTrend', () => {
  it('calculates percentage change correctly when previous period has data', () => {
    const current  = [makeTxn({ type: 'credit', amount: 6000 }), makeTxn({ type: 'debit', amount: 2000 })];
    const previous = [makeTxn({ type: 'credit', amount: 5000 }), makeTxn({ type: 'debit', amount: 2500 })];

    const result = calculateCashFlowTrend(current, previous);
    expect(result.incomeChangePercent).toBeCloseTo(20, 1);   // 6k vs 5k = +20%
    expect(result.expensesChangePercent).toBeCloseTo(-20, 1); // 2k vs 2.5k = -20%
  });

  it('returns 0% change when previous period income is 0 (no division by zero)', () => {
    const current  = [makeTxn({ type: 'credit', amount: 1000 })];
    const previous: Transaction[] = [];
    const result = calculateCashFlowTrend(current, previous);
    expect(result.incomeChangePercent).toBe(0);
    expect(isFinite(result.incomeChangePercent)).toBe(true);
  });

  it('returns 0% netChange when previous net is 0', () => {
    // Previous had equal income and expenses (net = 0)
    const previous = [
      makeTxn({ type: 'credit', amount: 500 }),
      makeTxn({ type: 'debit',  amount: 500 }),
    ];
    const current = [makeTxn({ type: 'credit', amount: 1000 })];
    const result = calculateCashFlowTrend(current, previous);
    expect(result.netChangePercent).toBe(0);
    expect(isFinite(result.netChangePercent)).toBe(true);
  });
});

// ─── prepareSankeyData ───────────────────────────────────────────────────────

describe('prepareSankeyData', () => {
  it('excludes Credit Card Payment transactions from income and expenses', () => {
    const txns = [
      makeTxn({ type: 'credit', amount: 5000, categoryId: CAT_SALARY.id   }),
      makeTxn({ type: 'debit',  amount: 2000, categoryId: CAT_CC_PAY.id   }), // should be excluded
      makeTxn({ type: 'debit',  amount: 300,  categoryId: CAT_GROCERIES.id }),
    ];
    const nodes = prepareSankeyData(txns, categories);

    // The CC Payment should not appear as an expense node
    const ccNode = nodes.find(n => n.target === 'Credit Card Payments');
    expect(ccNode).toBeUndefined();

    // Grocery expense should appear
    const groceryNode = nodes.find(n => n.target === 'Groceries');
    expect(groceryNode).toBeDefined();
    expect(groceryNode?.value).toBe(300);
  });

  it('excludes transactions with transferId from Sankey', () => {
    const txns = [
      makeTxn({ type: 'credit', amount: 5000, categoryId: CAT_SALARY.id }),
      makeTxn({ type: 'debit',  amount: 1000, transferId: 'tf-1', categoryId: null }),
    ];
    const nodes = prepareSankeyData(txns, categories);
    // Transfer should not appear
    const totalExpenseFlows = nodes.filter(n => n.source === 'Total Income');
    // Only a Savings node (income 5000, expenses 0) — no expense category nodes
    expect(totalExpenseFlows.every(n => n.target === 'Savings')).toBe(true);
  });

  it('produces a Savings node when income > expenses', () => {
    const txns = [
      makeTxn({ type: 'credit', amount: 5000, categoryId: CAT_SALARY.id   }),
      makeTxn({ type: 'debit',  amount: 1000, categoryId: CAT_GROCERIES.id }),
    ];
    const nodes = prepareSankeyData(txns, categories);
    const savings = nodes.find(n => n.target === 'Savings');
    expect(savings).toBeDefined();
    expect(savings?.value).toBe(4000);
  });

  it('does NOT produce a Savings node when expenses exceed income', () => {
    const txns = [
      makeTxn({ type: 'credit', amount: 500,  categoryId: CAT_SALARY.id   }),
      makeTxn({ type: 'debit',  amount: 2000, categoryId: CAT_GROCERIES.id }),
    ];
    const nodes = prepareSankeyData(txns, categories);
    const savings = nodes.find(n => n.target === 'Savings');
    expect(savings).toBeUndefined();
  });

  it('excludes credits in categories that also have debits (refund detection)', () => {
    // Groceries has both a refund (credit) and a purchase (debit).
    // The credit should NOT appear as income.
    const txns = [
      makeTxn({ type: 'credit', amount: 20,   categoryId: CAT_GROCERIES.id }), // refund
      makeTxn({ type: 'debit',  amount: 300,  categoryId: CAT_GROCERIES.id }), // purchase
      makeTxn({ type: 'credit', amount: 5000, categoryId: CAT_SALARY.id   }), // real income
    ];
    const nodes = prepareSankeyData(txns, categories);

    // Salary should appear as income source
    const salaryNode = nodes.find(n => n.source === 'Salary');
    expect(salaryNode?.value).toBe(5000);

    // Grocery refund should NOT appear as income source
    const groceryIncomeNode = nodes.find(n => n.source === 'Groceries' && n.target === 'Total Income');
    expect(groceryIncomeNode).toBeUndefined();
  });

  it('groups expense categories beyond top 7 into "Other"', () => {
    // Create 9 expense categories
    const manyCats = Array.from({ length: 9 }, (_, i) => ({
      id: `cat-${i}`,
      name: `Category ${i}`,
    }));
    const txns = manyCats.map((cat, i) =>
      makeTxn({ type: 'debit', amount: (i + 1) * 100, categoryId: cat.id })
    );
    // Add income so Sankey has a source
    txns.push(makeTxn({ type: 'credit', amount: 10000, categoryId: null }));

    const nodes = prepareSankeyData(txns, manyCats);
    const expenseNodes = nodes.filter(n => n.source === 'Total Income');
    const otherNode = expenseNodes.find(n => n.target === 'Other');

    // Should have max 7 expense nodes + Other + possibly Savings
    const namedExpenseNodes = expenseNodes.filter(n => n.target !== 'Other' && n.target !== 'Savings');
    expect(namedExpenseNodes.length).toBeLessThanOrEqual(7);
    expect(otherNode).toBeDefined();
  });

  it('correctly expands paystub gross pay when salary node exists', () => {
    const txns = [
      makeTxn({ type: 'credit', amount: 4000, categoryId: CAT_SALARY.id   }), // Nikki net pay
      makeTxn({ type: 'debit',  amount: 500,  categoryId: CAT_GROCERIES.id }),
    ];
    const paystub: Paystub = {
      id: 'p1',
      userId: 'user-1',
      grossPay: 6000,
      netPay: 4000,
      payPeriodStart: '2026-02-15',
      payPeriodEnd: '2026-02-28',
      deductions: [
        { name: '401k',            amount: 1200 },
        { name: 'Federal Tax',     amount: 600  },
        { name: 'Health Insurance', amount: 200 },
      ],
    };

    const nodes = prepareSankeyData(txns, categories, paystub);

    // Nikki Gross Pay should connect to Total Income (net) and each deduction
    const grossPayNodes = nodes.filter(n => n.source === 'Nikki Gross Pay');
    expect(grossPayNodes).toHaveLength(4); // 3 deductions + net to Total Income

    const netNode = grossPayNodes.find(n => n.target === 'Total Income');
    expect(netNode?.value).toBe(4000);

    const k401Node = grossPayNodes.find(n => n.target === '401k');
    expect(k401Node?.value).toBe(1200);

    // Combined Salary node should be removed
    const salaryNode = nodes.find(n => n.source === 'Salary' && n.target === 'Total Income');
    expect(salaryNode).toBeUndefined();
  });

  it('returns empty array for empty transaction list', () => {
    expect(prepareSankeyData([], categories)).toHaveLength(0);
  });
});
