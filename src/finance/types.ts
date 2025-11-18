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
  startingAmount: number;
  dueDateISO: string;
  type: GoalType;
  linkedCategoryId?: string;
  linkedAccountId?: string; // Auto-track from account balance
  trackNetworth?: boolean; // Track total networth instead
  createdAtISO?: string;
  updatedAtISO?: string;
};

export type GoalProgressPoint = {
  dateISO: string;
  amount: number;
  note?: string;
};

export type GoalRecommendation = {
  requiredMonthlyContribution: number;
  onTrack: boolean;
  projectedCompletionISO: string; // When you'll actually reach the goal at current rate
  daysRemaining: number;
  monthsRemaining: number;
  status: 'ahead' | 'on-track' | 'behind' | 'at-risk';
  message: string;
};

export type GoalInput = Omit<Goal, 'createdAtISO' | 'updatedAtISO'> & {
  id?: string;
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
