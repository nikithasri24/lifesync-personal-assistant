import type {
  Account,
  Budget,
  BudgetTemplate,
  BudgetTemplateInput,
  Category,
  Goal,
  GoalInput,
  GoalProgressPoint,
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
const institutions: Institution[] = (await import('./seed/institutions.json')).default as Institution[];
const accounts: Account[] = (await import('./seed/accounts.json')).default as Account[];
const categories: Category[] = (await import('./seed/categories.json')).default as Category[];
const transactions: Transaction[] = (await import('./seed/transactions.json')).default as Transaction[];
const budgets: Budget[] = (await import('./seed/budgets.json')).default as Budget[];
const networth: NetPoint[] = (await import('./seed/networth.json')).default as NetPoint[];
const goals: Goal[] = (await import('./seed/goals.json')).default as Goal[];

// Budget templates (in-memory for mock)
const budgetTemplates: BudgetTemplate[] = [];

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function randomLatency(): number {
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

  async updateAccount(accountId: string, updates: Partial<Account>): Promise<void> {
    await sleep(randomLatency());
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      Object.assign(account, updates);
    }
  }

  async upsertAccount(account: { id?: string; name: string; type: string; balance: number; institutionId?: string }): Promise<void> {
    await sleep(randomLatency());
    if (account.id) {
      const existingIndex = accounts.findIndex(a => a.id === account.id);
      if (existingIndex >= 0) {
        accounts[existingIndex] = {
          ...accounts[existingIndex],
          name: account.name,
          type: account.type as import('../types').AccountType,
          balance: account.balance,
          institutionId: account.institutionId,
          lastUpdatedISO: new Date().toISOString(),
        };
      }
    } else {
      const newAccount: Account = {
        id: `mock-${Date.now()}`,
        name: account.name,
        type: account.type as import('../types').AccountType,
        balance: account.balance,
        liability: account.type === 'credit',
        lastUpdatedISO: new Date().toISOString(),
        institutionId: account.institutionId,
      };
      accounts.push(newAccount);
    }
  }

  async deleteAccount(accountId: string): Promise<void> {
    await sleep(randomLatency());
    const index = accounts.findIndex(a => a.id === accountId);
    if (index >= 0) {
      accounts.splice(index, 1);
    }
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
    const nextCursor = items.length + start < list.length ? items[items.length - 1]?.id ?? undefined : undefined;
    return { items, nextCursor };
  }

  async upsertTransaction(txn: TransactionInput): Promise<void> {
    const validatedTxn = await validateTransactionInput(txn);
    await sleep(randomLatency());
    if (validatedTxn.id) {
      const idx = transactions.findIndex((t) => t.id === validatedTxn.id);
      if (idx >= 0) {
        transactions[idx] = { ...transactions[idx], ...validatedTxn } as Transaction;
      }
      return;
    }
    const id = `mock_${Math.random().toString(36).slice(2)}`;
    transactions.push({ ...validatedTxn, id } as Transaction);
  }

  async deleteTransaction(id: string): Promise<void> {
    await sleep(randomLatency());
    const idx = transactions.findIndex((t) => t.id === id);
    if (idx >= 0) transactions.splice(idx, 1);
  }

  async listBudgets(monthISO: string): Promise<Budget[]> {
    await sleep(randomLatency());
    return budgets.filter((b) => b.month === monthISO);
  }

  async upsertBudget(budget: { categoryId: string; month: string; limit: number }): Promise<void> {
    await sleep(randomLatency());

    // Normalize month format (YYYY-MM)
    const monthDate = budget.month.length === 7 ? budget.month : budget.month.slice(0, 7);

    // Find existing budget
    const idx = budgets.findIndex(
      (b) => b.categoryId === budget.categoryId && b.month === monthDate
    );

    if (idx >= 0) {
      // Update existing
      budgets[idx] = {
        ...budgets[idx],
        limit: budget.limit,
      };
    } else {
      // Create new
      const id = `mock_budget_${Math.random().toString(36).slice(2)}`;
      budgets.push({
        id,
        categoryId: budget.categoryId,
        month: monthDate,
        limit: budget.limit,
      });
    }
  }

  async deleteBudget(categoryId: string, month: string): Promise<void> {
    await sleep(randomLatency());

    // Normalize month format (YYYY-MM)
    const monthDate = month.length === 7 ? month : month.slice(0, 7);

    const idx = budgets.findIndex(
      (b) => b.categoryId === categoryId && b.month === monthDate
    );

    if (idx >= 0) {
      budgets.splice(idx, 1);
    }
  }

  async listBudgetTemplates(): Promise<BudgetTemplate[]> {
    await sleep(randomLatency());
    return budgetTemplates;
  }

  async upsertBudgetTemplate(template: BudgetTemplateInput): Promise<void> {
    await sleep(randomLatency());

    // Find existing template
    const idx = budgetTemplates.findIndex((t) => t.categoryId === template.categoryId);

    if (idx >= 0) {
      // Update existing
      budgetTemplates[idx] = {
        ...budgetTemplates[idx],
        defaultAmount: template.defaultAmount,
      };
    } else {
      // Create new
      const id = template.id ?? `mock_template_${Math.random().toString(36).slice(2)}`;
      budgetTemplates.push({
        id,
        categoryId: template.categoryId,
        defaultAmount: template.defaultAmount,
      });
    }
  }

  async deleteBudgetTemplate(categoryId: string): Promise<void> {
    await sleep(randomLatency());

    const idx = budgetTemplates.findIndex((t) => t.categoryId === categoryId);
    if (idx >= 0) {
      budgetTemplates.splice(idx, 1);
    }
  }

  async initializeBudgetsFromTemplates(month: string): Promise<number> {
    await sleep(randomLatency());

    // Normalize month format (YYYY-MM)
    const monthDate = month.length === 7 ? month : month.slice(0, 7);

    let count = 0;
    for (const template of budgetTemplates) {
      // Check if budget already exists for this category and month
      const exists = budgets.some(
        (b) => b.categoryId === template.categoryId && b.month === monthDate
      );

      if (!exists) {
        // Create budget from template
        const id = `mock_budget_${Math.random().toString(36).slice(2)}`;
        budgets.push({
          id,
          categoryId: template.categoryId,
          month: monthDate,
          limit: template.defaultAmount,
        });
        count++;
      }
    }

    return count;
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
    const validatedGoal = await validateGoalInput(goal);
    await sleep(randomLatency());
    if (validatedGoal.id) {
      const idx = goals.findIndex((g) => g.id === validatedGoal.id);
      if (idx >= 0) {
        goals[idx] = { ...goals[idx], ...validatedGoal, updatedAtISO: new Date().toISOString() } as Goal;
      }
      return;
    }
    const id = `mock_goal_${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();

    // Extract and type-check optional fields to avoid unsafe assignments
    let startingAmount = 0;
    if (typeof validatedGoal.startingAmount === 'number') {
      startingAmount = validatedGoal.startingAmount;
    }

    let linkedCategoryId: string | undefined;
    if (typeof validatedGoal.linkedCategoryId === 'string') {
      linkedCategoryId = validatedGoal.linkedCategoryId;
    }

    let linkedAccountId: string | undefined;
    if (typeof validatedGoal.linkedAccountId === 'string') {
      linkedAccountId = validatedGoal.linkedAccountId;
    }

    let trackNetworth: boolean | undefined = false;
    if (typeof validatedGoal.trackNetworth === 'boolean') {
      trackNetworth = validatedGoal.trackNetworth;
    }

    const newGoal: Goal = {
      id,
      name: validatedGoal.name,
      targetAmount: validatedGoal.targetAmount,
      currentAmount: typeof validatedGoal.currentAmount === 'number' ? validatedGoal.currentAmount : 0,
      startingAmount,
      dueDateISO: validatedGoal.dueDateISO,
      type: validatedGoal.type,
      linkedCategoryId,
      linkedAccountId,
      trackNetworth,
      createdAtISO: now,
      updatedAtISO: now,
    };
    goals.push(newGoal);
  }

  async deleteGoal(goalId: string): Promise<void> {
    await sleep(randomLatency());
    const idx = goals.findIndex((g) => g.id === goalId);
    if (idx >= 0) goals.splice(idx, 1);
  }

  async getGoalProgressHistory(_goalId: string): Promise<GoalProgressPoint[]> {
    await sleep(randomLatency());
    // Mock: return empty array for now (in real app, this would come from database)
    return [];
  }

  async syncGoalFromAccount(goalId: string): Promise<void> {
    await sleep(randomLatency());
    // Mock: simulate syncing goal from linked account
    const goal = goals.find((g) => g.id === goalId);
    if (!goal?.linkedAccountId) return;

    const account = accounts.find((a) => a.id === goal.linkedAccountId);
    if (account) {
      const goalIndex = goals.findIndex((g) => g.id === goalId);
      if (goalIndex >= 0) {
        goals[goalIndex] = {
          ...goals[goalIndex],
          currentAmount: account.balance,
          updatedAtISO: new Date().toISOString(),
        };
      }
    }
  }

  // Loan tracking methods (mock implementation)
  async listLoans(): Promise<import('../types').Loan[]> {
    await sleep(randomLatency());
    return [];
  }

  async upsertLoan(_loan: import('../types').LoanInput): Promise<void> {
    await sleep(randomLatency());
  }

  async deleteLoan(_loanId: string): Promise<void> {
    await sleep(randomLatency());
  }

  async listLoanPayments(_loanId: string): Promise<import('../types').LoanPayment[]> {
    await sleep(randomLatency());
    return [];
  }

  async upsertLoanPayment(_loanId: string, _payment: import('../types').LoanPaymentInput): Promise<void> {
    await sleep(randomLatency());
  }

  async deleteLoanPayment(_paymentId: string): Promise<void> {
    await sleep(randomLatency());
  }

  // Credit card benefits methods (mock implementation)
  async listCardBenefits(_accountId: string): Promise<import('../types').CardBenefit[]> {
    await sleep(randomLatency());
    return [];
  }

  async upsertCardBenefit(_accountId: string, _benefit: import('../types').CardBenefitInput): Promise<void> {
    await sleep(randomLatency());
  }

  async deleteCardBenefit(_benefitId: string): Promise<void> {
    await sleep(randomLatency());
  }

  async listCategoryBonuses(_accountId: string): Promise<import('../types').CardCategoryBonus[]> {
    await sleep(randomLatency());
    return [];
  }

  async upsertCategoryBonus(_accountId: string, _bonus: import('../types').CardCategoryBonusInput): Promise<void> {
    await sleep(randomLatency());
  }

  async listWelcomeBonuses(_accountId: string): Promise<import('../types').WelcomeBonus[]> {
    await sleep(randomLatency());
    return [];
  }

  async upsertWelcomeBonus(_accountId: string, _bonus: import('../types').WelcomeBonusInput): Promise<void> {
    await sleep(randomLatency());
  }

  async listCardOffers(_accountId: string): Promise<import('../types').CardOffer[]> {
    await sleep(randomLatency());
    return [];
  }

  async upsertCardOffer(_accountId: string, _offer: import('../types').CardOfferInput): Promise<void> {
    await sleep(randomLatency());
  }

  // Retirement account tracking methods (mock implementation)
  async listRetirementAccounts(): Promise<import('../types').RetirementAccountWithStats[]> {
    await sleep(randomLatency());
    return [];
  }

  async getRetirementAccount(_accountId: string): Promise<import('../types').RetirementAccountWithStats | null> {
    await sleep(randomLatency());
    return null;
  }

  async upsertRetirementAccountMetadata(_metadata: import('../types').RetirementAccountMetadataInput): Promise<void> {
    await sleep(randomLatency());
  }

  async deleteRetirementAccountMetadata(_accountId: string): Promise<void> {
    await sleep(randomLatency());
  }

  async listRetirementContributions(_retirementAccountId: string): Promise<import('../types').RetirementContribution[]> {
    await sleep(randomLatency());
    return [];
  }

  async addRetirementContribution(_contribution: import('../types').RetirementContributionInput): Promise<void> {
    await sleep(randomLatency());
  }

  async deleteRetirementContribution(_contributionId: string): Promise<void> {
    await sleep(randomLatency());
  }

  async calculateContributionRoom(_retirementAccountId: string, _annualIncome: number): Promise<import('../types').ContributionRoom> {
    await sleep(randomLatency());
    return {
      employeeRoom: 0,
      employerRoom: 0,
      totalLimit: 0,
      isOver50: false
    };
  }

  async listRetirementPerformance(_retirementAccountId: string): Promise<import('../types').RetirementPerformance[]> {
    await sleep(randomLatency());
    return [];
  }

  async recordRetirementPerformance(_performance: import('../types').RetirementPerformanceInput): Promise<void> {
    await sleep(randomLatency());
  }

  async calculateVestedBalance(_retirementAccountId: string, _employmentYears: number): Promise<number> {
    await sleep(randomLatency());
    return 0;
  }
}
