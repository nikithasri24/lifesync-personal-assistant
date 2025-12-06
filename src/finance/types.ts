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

export type RewardsType = 'points' | 'miles' | 'cashback';

export type Account = {
  id: string;
  institutionId?: string;
  name: string;
  type: AccountType;
  balance: number;
  lastUpdatedISO: string;
  liability?: boolean;
  // Credit card specific fields
  creditLimit?: number;
  apr?: number;
  paymentDueDay?: number; // Day of month (1-31)
  minimumPayment?: number;
  statementBalance?: number;
  statementDate?: string; // ISO date string
  // Rewards fields
  annualFee?: number;
  annualFeeDueDate?: string; // ISO date string
  rewardsBalance?: number;
  rewardsType?: RewardsType;
  baseRewardsRate?: number; // Base earning rate (e.g., 1.0 for 1%)
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

export type CreditCardStatement = {
  id: string;
  accountId: string;
  statementDate: string; // ISO date
  dueDate: string; // ISO date
  balance: number;
  minimumPayment: number;
  apr?: number;
  paid: boolean;
  paidAmount?: number;
  paidDate?: string; // ISO date
  createdAt: string;
};

export type CreditCardStatementInput = Omit<CreditCardStatement, 'id' | 'createdAt'> & {
  id?: string;
};

export type BenefitType = 'recurring_credit' | 'travel_credit' | 'protection' | 'lounge_access' | 'other';
export type BenefitFrequency = 'annual' | 'monthly' | 'quarterly' | 'once' | 'per_use';

export type CardBenefit = {
  id: string;
  accountId: string;
  benefitType: BenefitType;
  name: string;
  description?: string;
  value?: number;
  frequency?: BenefitFrequency;
  usedAmount: number;
  resetDate?: string; // ISO date
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CardBenefitInput = Omit<CardBenefit, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

export type SpendingCategory = 'dining' | 'travel' | 'groceries' | 'gas' | 'online' | 'all_other';

export type CardCategoryBonus = {
  id: string;
  accountId: string;
  category: SpendingCategory;
  rewardsRate: number; // e.g., 3.0 for 3x points
  isRotating: boolean;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  createdAt: string;
};

export type CardCategoryBonusInput = Omit<CardCategoryBonus, 'id' | 'createdAt'> & {
  id?: string;
};

export type WelcomeBonus = {
  id: string;
  accountId: string;
  bonusAmount: number;
  requiredSpend: number;
  currentSpend: number;
  deadline: string; // ISO date
  completed: boolean;
  completedDate?: string; // ISO date
  createdAt: string;
  updatedAt: string;
};

export type WelcomeBonusInput = Omit<WelcomeBonus, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

export type OfferType = 'cashback' | 'statement_credit' | 'bonus_points';

export type CardOffer = {
  id: string;
  accountId: string;
  merchant: string;
  offerType: OfferType;
  offerAmount: number;
  requiredSpend?: number;
  expirationDate?: string; // ISO date
  activated: boolean;
  activatedDate?: string; // ISO date
  redeemed: boolean;
  redeemedDate?: string; // ISO date
  createdAt: string;
};

export type CardOfferInput = Omit<CardOffer, 'id' | 'createdAt'> & {
  id?: string;
};

export type TransactionInput = Omit<Transaction, 'id'> & { id?: string };
export type GoalInput = Omit<Goal, 'id'> & { id?: string };
