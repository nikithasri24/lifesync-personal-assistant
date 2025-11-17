import type {
  Account,
  Budget,
  Category,
  Goal,
  GoalInput,
  Institution,
  NetPoint,
  Paginated,
  Transaction,
  TransactionInput,
  TxnQuery,
} from '../types';
import type { FinanceAPI } from './api';
import { validateGoalInput, validateTransactionInput } from '../utils/validate';

// Lazy import JSON to keep tree-shake friendly
const institutions: Institution[] = (await import('./seed/institutions.json')).default as any;
const accounts: Account[] = (await import('./seed/accounts.json')).default as any;
const categories: Category[] = (await import('./seed/categories.json')).default as any;
const transactions: Transaction[] = (await import('./seed/transactions.json')).default as any;
const budgets: Budget[] = (await import('./seed/budgets.json')).default as any;
const networth: NetPoint[] = (await import('./seed/networth.json')).default as any;
const goals: Goal[] = (await import('./seed/goals.json')).default as any;

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function randomLatency() {
  return 150 + Math.floor(Math.random() * 150);
}

export class MockApi implements FinanceAPI {
  async listInstitutions(): Promise<Institution[]> {
    await sleep(randomLatency());
    return institutions;
  }

  async listAccounts(): Promise<Account[]> {
    await sleep(randomLatency());
    return accounts;
  }

  async listTransactions(params: TxnQuery): Promise<Paginated<Transaction>> {
    await sleep(randomLatency());
    const {
      text,
      fromISO,
      toISO,
      accountIds,
      categoryIds,
      type,
      cursor,
      limit = 50,
    } = params;
    let list = transactions.slice().sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
    if (text) {
      const q = text.toLowerCase();
      list = list.filter((t) =>
        t.description.toLowerCase().includes(q) || (t.notes ?? '').toLowerCase().includes(q)
      );
    }
    if (fromISO) list = list.filter((t) => t.dateISO >= fromISO);
    if (toISO) list = list.filter((t) => t.dateISO <= toISO);
    if (accountIds?.length) list = list.filter((t) => accountIds.includes(t.accountId));
    if (categoryIds?.length) list = list.filter((t) => (t.categoryId ? categoryIds.includes(t.categoryId) : false));
    if (type) list = list.filter((t) => t.type === type);

    let start = 0;
    if (cursor) {
      const idx = list.findIndex((t) => t.id === cursor);
      start = idx >= 0 ? idx + 1 : 0;
    }
    const items = list.slice(start, start + limit);
    const nextCursor = items.length + start < list.length ? items[items.length - 1]?.id : undefined;
    return { items, nextCursor };
  }

  async upsertTransaction(txn: TransactionInput): Promise<void> {
    txn = await validateTransactionInput(txn);
    await sleep(randomLatency());
    if (txn.id) {
      const idx = transactions.findIndex((t) => t.id === txn.id);
      if (idx >= 0) (transactions as any)[idx] = { ...(transactions as any)[idx], ...txn };
      return;
    }
    const id = `mock_${Math.random().toString(36).slice(2)}`;
    (transactions as any).push({ ...txn, id });
  }

  async deleteTransaction(id: string): Promise<void> {
    await sleep(randomLatency());
    const idx = transactions.findIndex((t) => t.id === id);
    if (idx >= 0) (transactions as any).splice(idx, 1);
  }

  async listBudgets(monthISO: string): Promise<Budget[]> {
    await sleep(randomLatency());
    return budgets.filter((b) => b.month === monthISO);
  }

  async upsertBudget(budget: { categoryId: string; month: string; limit: number }): Promise<void> {
    await sleep(randomLatency());

    // Normalize month format
    const monthDate = budget.month.length === 7 ? `${budget.month}-01` : budget.month;

    // Find existing budget
    const idx = budgets.findIndex(
      (b) => b.categoryId === budget.categoryId && b.month === monthDate
    );

    if (idx >= 0) {
      // Update existing
      (budgets as any)[idx] = {
        ...(budgets as any)[idx],
        limit: budget.limit,
      };
    } else {
      // Create new
      const id = `mock_budget_${Math.random().toString(36).slice(2)}`;
      (budgets as any).push({
        id,
        categoryId: budget.categoryId,
        month: monthDate,
        limit: budget.limit,
      });
    }
  }

  async deleteBudget(categoryId: string, month: string): Promise<void> {
    await sleep(randomLatency());

    // Normalize month format
    const monthDate = month.length === 7 ? `${month}-01` : month;

    const idx = budgets.findIndex(
      (b) => b.categoryId === categoryId && b.month === monthDate
    );

    if (idx >= 0) {
      (budgets as any).splice(idx, 1);
    }
  }

  async listCategories(): Promise<Category[]> {
    await sleep(randomLatency());
    return categories;
  }

  async listNetWorth(): Promise<NetPoint[]> {
    await sleep(randomLatency());
    return networth;
  }

  async listGoals(): Promise<Goal[]> {
    await sleep(randomLatency());
    return goals;
  }

  async upsertGoal(goal: GoalInput): Promise<void> {
    goal = await validateGoalInput(goal);
    await sleep(randomLatency());
    if (goal.id) {
      const idx = goals.findIndex((g) => g.id === goal.id);
      if (idx >= 0) (goals as any)[idx] = { ...(goals as any)[idx], ...goal };
      return;
    }
    const id = `mock_goal_${Math.random().toString(36).slice(2)}`;
    (goals as any).push({ ...goal, id });
  }
}
