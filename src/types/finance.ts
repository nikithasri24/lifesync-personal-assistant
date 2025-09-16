/**
 * Comprehensive financial data types for the Finance Hub
 * Provides type safety for all financial operations
 */

// Base types
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'other';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type CategoryType = 'income' | 'expense';
export type BudgetPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type BudgetStatus = 'on_track' | 'warning' | 'over_budget';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';

// Account Management
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: Currency;
  institution: string;
  accountNumber: string;
  routingNumber?: string;
  isActive: boolean;
  lastSynced: Date;
  syncEnabled?: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Management
export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval: number; // e.g., every 2 weeks = frequency: 'weekly', interval: 2
  endDate?: Date;
  nextDue?: Date;
}

export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  amount: number; // Positive for income, negative for expenses
  category: string;
  subcategory?: string;
  date: Date;
  status: TransactionStatus;
  type: TransactionType;
  merchant?: string;
  location?: string;
  notes?: string;
  tags?: string[];
  receiptUrl?: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  parentTransactionId?: string; // For split transactions
  splits?: TransactionSplit[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionSplit {
  id: string;
  amount: number;
  category: string;
  description?: string;
}

// Category Management
export interface TransactionCategory {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  parentId?: string; // For subcategories
  isActive: boolean;
  monthlyBudget?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Budget Management
export interface Budget {
  id: string;
  name: string;
  categoryIds: string[];
  limit: number;
  spent: number;
  remaining: number;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  alertThreshold: number; // Percentage (0-100)
  status: BudgetStatus;
  rollover: boolean; // Carry over unused budget to next period
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  type: 'approaching_limit' | 'over_limit' | 'monthly_summary';
  message: string;
  threshold: number;
  isRead: boolean;
  createdAt: Date;
}

// Financial Goals
export interface FinancialGoal {
  id: string;
  name: string;
  description?: string;
  type: 'savings' | 'debt_payoff' | 'investment' | 'other';
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  status: GoalStatus;
  linkedAccountId?: string;
  autoContribute?: {
    enabled: boolean;
    amount: number;
    frequency: 'weekly' | 'monthly';
  };
  milestones?: GoalMilestone[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalMilestone {
  id: string;
  amount: number;
  description: string;
  achievedDate?: Date;
}

// Investment Tracking
export interface Investment {
  id: string;
  accountId: string;
  symbol: string;
  name: string;
  type: 'stock' | 'etf' | 'bond' | 'mutual_fund' | 'crypto' | 'other';
  shares: number;
  avgCostBasis: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
  dividendYield?: number;
  lastUpdated: Date;
  notes?: string;
}

export interface PortfolioAllocation {
  category: string;
  percentage: number;
  value: number;
  target?: number; // Target allocation percentage
}

// Financial Insights & Analytics
export interface FinancialInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'achievement' | 'tip';
  title: string;
  description: string;
  category: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  potentialSavings?: number;
  relatedAccountIds?: string[];
  relatedTransactionIds?: string[];
  isRead: boolean;
  isDismissed: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export interface SpendingTrend {
  category: string;
  currentPeriod: number;
  previousPeriod: number;
  changePercent: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface FinancialHealth {
  score: number; // 0-100
  factors: {
    savingsRate: number;
    debtToIncomeRatio: number;
    emergencyFundMonths: number;
    budgetAdherence: number;
    creditUtilization?: number;
  };
  recommendations: string[];
  lastCalculated: Date;
}

// Reports & Analytics
export interface FinancialReport {
  id: string;
  type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  categoryBreakdown: CategoryBreakdown[];
  topMerchants: MerchantSpending[];
  trends: SpendingTrend[];
  generatedAt: Date;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MerchantSpending {
  merchant: string;
  amount: number;
  transactionCount: number;
  category: string;
}

// Subscriptions & Recurring Charges
export interface Subscription {
  id: string;
  name: string;
  merchant: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextBillingDate: Date;
  category: string;
  isActive: boolean;
  linkedTransactionIds: string[];
  notes?: string;
  cancellationUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Credit & Debt Management
export interface DebtAccount {
  id: string;
  accountId: string;
  type: 'credit_card' | 'loan' | 'mortgage' | 'student_loan' | 'other';
  balance: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: Date;
  creditLimit?: number; // For credit cards
  payoffStrategies?: PayoffStrategy[];
}

export interface PayoffStrategy {
  id: string;
  name: string;
  type: 'debt_snowball' | 'debt_avalanche' | 'custom';
  monthsToPayoff: number;
  totalInterest: number;
  monthlyPayment: number;
}

// Tax Management
export interface TaxCategory {
  id: string;
  name: string;
  description: string;
  isDeductible: boolean;
  transactionIds: string[];
  taxYear: number;
  estimatedDeduction: number;
}

// Import/Export
export interface ImportMapping {
  csvColumn: string;
  fieldType: 'date' | 'description' | 'amount' | 'category' | 'account';
  fieldName: string;
  transformation?: 'absolute' | 'negate' | 'date_format';
}

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'xlsx';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  includeCategories?: string[];
  includeAccounts?: string[];
  groupBy?: 'date' | 'category' | 'account';
}

// Notifications & Alerts
export interface FinancialAlert {
  id: string;
  type: 'budget_warning' | 'unusual_spending' | 'bill_reminder' | 'goal_milestone' | 'account_sync_error';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  isRead: boolean;
  actionRequired: boolean;
  relatedEntityId?: string; // Budget ID, Goal ID, etc.
  createdAt: Date;
  expiresAt?: Date;
}

// User Preferences
export interface FinancialPreferences {
  defaultCurrency: Currency;
  budgetAlertThreshold: number;
  monthlyBudgetStartDay: number; // 1-31
  categorizeTransactionsAutomatically: boolean;
  enableSyncNotifications: boolean;
  enableBudgetNotifications: boolean;
  enableGoalNotifications: boolean;
  defaultAccountId?: string;
  hideSensitiveData: boolean;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  numberFormat: 'US' | 'EU' | 'other';
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FinancialSummary {
  accounts: {
    total: number;
    totalBalance: number;
    byType: Record<AccountType, number>;
  };
  transactions: {
    thisMonth: {
      income: number;
      expenses: number;
      net: number;
      count: number;
    };
    lastMonth: {
      income: number;
      expenses: number;
      net: number;
      count: number;
    };
  };
  budgets: {
    total: number;
    onTrack: number;
    warning: number;
    overBudget: number;
  };
  goals: {
    total: number;
    active: number;
    completed: number;
    totalProgress: number;
  };
}

// Form Types for UI Components
export interface TransactionFormData {
  description: string;
  amount: string;
  category: string;
  date: string;
  accountId: string;
  type: TransactionType;
  notes?: string;
  tags?: string[];
  isRecurring: boolean;
  recurringPattern?: Partial<RecurringPattern>;
}

export interface BudgetFormData {
  name: string;
  categoryIds: string[];
  limit: string;
  period: BudgetPeriod;
  alertThreshold: string;
  rollover: boolean;
  notes?: string;
}

export interface GoalFormData {
  name: string;
  description?: string;
  type: FinancialGoal['type'];
  targetAmount: string;
  targetDate: string;
  linkedAccountId?: string;
  autoContribute?: {
    enabled: boolean;
    amount: string;
    frequency: 'weekly' | 'monthly';
  };
}

// Error Types
export interface FinancialError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

// Utility Types
export type Dateish = Date | string | number;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type CreateType<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateType<T> = Partial<Omit<T, 'id' | 'createdAt'>> & { updatedAt: Date };

// Export grouped types for convenience
export type TransactionTypes = Transaction | TransactionSplit | TransactionCategory | RecurringPattern;
export type BudgetTypes = Budget | BudgetAlert;
export type GoalTypes = FinancialGoal | GoalMilestone;
export type InvestmentTypes = Investment | PortfolioAllocation;
export type AnalyticsTypes = FinancialInsight | SpendingTrend | FinancialHealth | FinancialReport;
export type AlertTypes = FinancialAlert | BudgetAlert;