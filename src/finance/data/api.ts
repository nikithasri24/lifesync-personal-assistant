import type {
  Institution,
  Account,
  Transaction,
  Budget,
  BudgetTemplate,
  BudgetTemplateInput,
  Category,
  NetPoint,
  Goal,
  TxnQuery,
  Paginated,
  TransactionInput,
  GoalInput,
} from '../types';

export interface FinanceAPI {
  listInstitutions(): Promise<Institution[]>;
  listAccounts(): Promise<Account[]>;
  listTransactions(params: TxnQuery): Promise<Paginated<Transaction>>;
  upsertTransaction(txn: TransactionInput): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  listBudgets(monthISO: string): Promise<Budget[]>;
  upsertBudget(budget: { categoryId: string; month: string; limit: number }): Promise<void>;
  deleteBudget(categoryId: string, month: string): Promise<void>;
  listBudgetTemplates(): Promise<BudgetTemplate[]>;
  upsertBudgetTemplate(template: BudgetTemplateInput): Promise<void>;
  deleteBudgetTemplate(categoryId: string): Promise<void>;
  initializeBudgetsFromTemplates(month: string): Promise<number>;
  listCategories(): Promise<Category[]>;
  listNetWorth(): Promise<NetPoint[]>;
  listGoals(): Promise<Goal[]>;
  upsertGoal(goal: GoalInput): Promise<void>;
}
