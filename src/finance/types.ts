export type Institution = {
  id: string;
  name: string;
  logoUrl?: string;
};

export type AccountType =
  | 'checking'
  | 'savings'
  | 'credit'
  | 'brokerage'
  | 'loan'
  | 'investment';

export type Account = {
  id: string;
  institutionId?: string;
  name: string;
  type: AccountType;
  balance: number;
  lastUpdatedISO: string;
  liability?: boolean;
};

export type Category = {
  id: string;
  name: string;
  parentId?: string;
  icon?: string;
  color?: string;
};

export type TxnType = 'debit' | 'credit';

export type Transaction = {
  id: string;
  accountId: string;
  dateISO: string; // UTC ISO string
  description: string;
  categoryId?: string;
  amount: number;
  type: TxnType;
  notes?: string;
  // Categorization support
  merchantName?: string;
  confidenceScore?: number; // 0-1, null = manually categorized
  suggestedCategoryId?: string;
  categorizationRuleId?: string;
};

export type Budget = {
  id: string;
  categoryId: string;
  month: string; // YYYY-MM
  limit: number;
};

export type BudgetTemplate = {
  id: string;
  categoryId: string;
  defaultAmount: number;
};

export type BudgetTemplateInput = Omit<BudgetTemplate, 'id'> & { id?: string };

export type NetPoint = {
  month: string; // YYYY-MM
  assets: number;
  liabilities: number;
};

export type GoalType = 'savings' | 'debt';

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  dueDateISO: string;
  type: GoalType;
  linkedCategoryId?: string;
};

export type TxnQuery = {
  text?: string;
  fromISO?: string;
  toISO?: string;
  accountIds?: string[];
  categoryIds?: string[];
  type?: TxnType;
  cursor?: string; // pagination cursor (impl-defined)
  limit?: number;
};

export type Paginated<T> = {
  items: T[];
  nextCursor?: string;
};

export type TransactionInput = Omit<Transaction, 'id'> & { id?: string };
export type GoalInput = Omit<Goal, 'id'> & { id?: string };
