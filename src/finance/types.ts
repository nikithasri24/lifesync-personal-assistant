export type Institution = {
  id: string;
  userId: string; // Owner of the institution (for merged mode)
  name: string;
  logoUrl?: string;
};

export type AccountType =
  | 'checking'
  | 'savings'
  | 'credit'
  | 'brokerage'
  | 'loan'
  | 'investment'
  | '401k'
  | '403b'
  | 'traditional_ira'
  | 'roth_ira'
  | 'sep_ira'
  | 'simple_ira'
  | 'hsa';

export type RewardsType = 'points' | 'miles' | 'cashback';

export type Account = {
  id: string;
  userId: string; // Owner of the account (for merged mode)
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
  userId: string; // Owner of the category (for merged mode)
  name: string;
  parentId?: string;
  icon?: string;
  color?: string;
};

export type TxnType = 'debit' | 'credit';

export type Transaction = {
  id: string;
  userId: string; // Owner of the transaction (for merged mode)
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
  userId: string; // Owner of the budget (for merged mode)
  categoryId: string;
  month: string; // YYYY-MM
  limit: number;
};

export type BudgetTemplate = {
  id: string;
  userId: string; // Owner of the budget template (for merged mode)
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
  userId: string; // Owner of the goal (for merged mode)
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
  userId: string; // Owner of the card benefit (for merged mode)
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
  userId: string; // Owner of the category bonus (for merged mode)
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
  userId: string; // Owner of the welcome bonus (for merged mode)
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
  userId: string; // Owner of the card offer (for merged mode)
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

export type RewardsHistory = {
  id: string;
  accountId: string;
  dateISO: string; // ISO date
  pointsEarned: number;
  pointsRedeemed: number;
  balance: number;
  description?: string;
  transactionId?: string;
  category?: string;
  createdAt: string;
};

export type RewardsHistoryInput = Omit<RewardsHistory, 'id' | 'createdAt'> & {
  id?: string;
};

export type TransactionInput = Omit<Transaction, 'id'> & { id?: string };

// Recurring Transactions Types
export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export type PendingTransactionStatus = 'pending' | 'approved' | 'skipped' | 'edited';

export type RecurringTransaction = {
  id: string;
  userId: string; // Owner of the recurring transaction (for merged mode)
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  categoryId?: string;
  accountId?: string;
  frequency: RecurringFrequency;
  startDate: string; // ISO date
  endDate?: string; // ISO date
  dayOfMonth?: number; // 1-31 or -1 for last day
  dayOfWeek?: number; // 0=Sun, 1=Mon, etc.
  autoCreate: boolean;
  requireApproval: boolean;
  daysBefore: number;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastGeneratedDate?: string; // ISO date
  // From view
  nextOccurrenceDate?: string; // ISO date
  pendingCount?: number;
};

export type RecurringTransactionInput = Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt' | 'lastGeneratedDate' | 'nextOccurrenceDate' | 'pendingCount'> & {
  id?: string;
};

export type PendingTransaction = {
  id: string;
  userId: string; // Owner of the pending transaction (for merged mode)
  recurringTransactionId?: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  categoryId?: string;
  accountId?: string;
  scheduledDate: string; // ISO date
  status: PendingTransactionStatus;
  transactionId?: string; // Link to approved transaction
  notes?: string;
  createdAt: string;
  reviewedAt?: string;
};

export type PendingTransactionInput = Omit<PendingTransaction, 'id' | 'createdAt' | 'reviewedAt'> & {
  id?: string;
};

// Insurance Tracking Types
export type InsuranceType = 'health' | 'auto' | 'home' | 'life' | 'disability' | 'umbrella' | 'pet' | 'travel' | 'other';
export type InsuranceStatus = 'active' | 'expired' | 'cancelled' | 'pending';
export type PremiumFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
export type ClaimStatus = 'filed' | 'under_review' | 'approved' | 'denied' | 'paid' | 'closed';
export type BeneficiaryType = 'primary' | 'contingent';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type InsurancePolicy = {
  id: string;
  userId: string; // Owner of the insurance policy (for merged mode)
  policyName: string;
  policyNumber?: string;
  provider: string;
  type: InsuranceType;
  status: InsuranceStatus;
  coverageAmount?: number;
  deductible?: number;
  premiumAmount: number;
  premiumFrequency: PremiumFrequency;
  startDate: string; // ISO date
  endDate?: string; // ISO date
  renewalDate?: string; // ISO date
  nextPaymentDate?: string; // ISO date
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  notes?: string;
  documents?: unknown[]; // JSONB array
  autoRenew: boolean;
  renewalReminderDays: number;
  createdAt: string;
  updatedAt: string;
  // From view
  claimCount?: number;
  totalClaimsPaid?: number;
  beneficiaryCount?: number;
  lastPaymentDate?: string;
};

export type InsuranceClaim = {
  id: string;
  policyId: string;
  claimNumber?: string;
  claimType: string;
  claimDate: string; // ISO date
  incidentDate: string; // ISO date
  claimAmount: number;
  approvedAmount?: number;
  paidAmount?: number;
  deductiblePaid?: number;
  status: ClaimStatus;
  description: string;
  notes?: string;
  adjusterName?: string;
  adjusterPhone?: string;
  adjusterEmail?: string;
  filedDate?: string; // ISO date
  approvedDate?: string; // ISO date
  paidDate?: string; // ISO date
  closedDate?: string; // ISO date
  createdAt: string;
  updatedAt: string;
};

export type InsuranceBeneficiary = {
  id: string;
  policyId: string;
  name: string;
  relationship: string;
  beneficiaryType: BeneficiaryType;
  percentage: number;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
};

export type InsurancePremiumPayment = {
  id: string;
  policyId: string;
  paymentDate: string; // ISO date
  amount: number;
  paymentMethod?: string;
  coveragePeriodStart?: string; // ISO date
  coveragePeriodEnd?: string; // ISO date
  status: PaymentStatus;
  transactionId?: string;
  confirmationNumber?: string;
  notes?: string;
  createdAt: string;
};

export type InsurancePolicyInput = Omit<InsurancePolicy, 'id' | 'createdAt' | 'updatedAt' | 'claimCount' | 'totalClaimsPaid' | 'beneficiaryCount' | 'lastPaymentDate'> & {
  id?: string;
};

export type InsuranceClaimInput = Omit<InsuranceClaim, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

export type InsuranceBeneficiaryInput = Omit<InsuranceBeneficiary, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

export type InsurancePremiumPaymentInput = Omit<InsurancePremiumPayment, 'id' | 'createdAt'> & {
  id?: string;
};

// Loan Tracking Types
export type LoanType = 'auto' | 'mortgage' | 'personal' | 'student' | 'business' | 'other';
export type LoanStatus = 'active' | 'paid_off' | 'deferred' | 'defaulted';

export type Loan = {
  id: string;
  userId: string; // Owner of the loan (for merged mode)
  accountId?: string; // Link to account if tracked there
  loanName: string;
  loanType: LoanType;
  status: LoanStatus;
  principalAmount: number; // Total loan amount
  currentBalance: number; // Remaining balance
  interestRate: number; // Annual percentage rate
  monthlyPayment: number; // Required monthly payment
  extraPayment: number; // Additional monthly payment
  targetPayoffDate: string; // ISO date
  startDate: string; // ISO date
  firstPaymentDate: string; // ISO date
  lender?: string;
  loanNumber?: string;
  termMonths?: number; // Original loan term in months
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Calculated fields
  totalPaid?: number;
  interestPaid?: number;
  principalPaid?: number;
  remainingPayments?: number;
  projectedPayoffDate?: string; // ISO date
};

export type LoanPayment = {
  id: string;
  loanId: string;
  paymentDate: string; // ISO date
  amount: number;
  principalAmount: number;
  interestAmount: number;
  extraAmount: number; // Extra payment beyond required
  balanceAfter: number; // Balance after this payment
  transactionId?: string; // Link to transaction if exists
  notes?: string;
  createdAt: string;
};

export type LoanInput = Omit<Loan, 'id' | 'createdAt' | 'updatedAt' | 'totalPaid' | 'interestPaid' | 'principalPaid' | 'remainingPayments' | 'projectedPayoffDate'> & {
  id?: string;
};

export type LoanPaymentInput = Omit<LoanPayment, 'id' | 'createdAt'> & {
  id?: string;
};

// ============================================================================
// RETIREMENT ACCOUNT TYPES
// ============================================================================

export type RetirementAccountType = Extract<AccountType, '401k' | '403b' | 'traditional_ira' | 'roth_ira' | 'sep_ira' | 'simple_ira' | 'hsa'>;

export type TaxTreatment = 'pre_tax' | 'post_tax' | 'tax_exempt';
export type VestingScheduleType = 'immediate' | 'cliff' | 'graded';
export type EmployerMatchType = 'percentage' | 'fixed' | 'tiered';
export type ContributionType = 'employee' | 'employer' | 'rollover' | 'catch_up';

export interface InvestmentAllocation {
  stocks?: number; // Percentage
  bonds?: number;
  cash?: number;
  international?: number;
  realEstate?: number;
  commodities?: number;
  other?: number;
  // Can add specific fund allocations
  funds?: Array<{
    name: string;
    ticker?: string;
    percentage: number;
  }>;
}

export interface RetirementAccountMetadata {
  id: string;
  accountId: string;

  // Tax Treatment
  taxTreatment: TaxTreatment;

  // Contribution Limits
  annualContributionLimit: number;
  catchUpLimit?: number;
  currentYearContributions: number;
  contributionYear: number;

  // Employer Match
  hasEmployerMatch: boolean;
  employerMatchPercentage?: number;
  employerMatchLimit?: number; // Percentage of salary
  employerMatchType?: EmployerMatchType;
  employerContributionsYTD: number;

  // Vesting
  hasVestingSchedule: boolean;
  vestingScheduleType?: VestingScheduleType;
  vestingCliffYears?: number;
  vestingGradedYears?: number;
  vestingPercentage: number;
  unvestedBalance: number;

  // Investment Allocation
  allocation?: InvestmentAllocation;

  // HSA-specific
  isFamilyCoverage?: boolean;

  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RetirementContribution {
  id: string;
  retirementAccountId: string;
  contributionDate: string; // ISO date
  amount: number;
  contributionType: ContributionType;
  contributionYear: number;
  transactionId?: string;
  notes?: string;
  createdAt: string;
}

export interface RetirementPerformance {
  id: string;
  retirementAccountId: string;
  snapshotDate: string; // ISO date
  balance: number;
  totalContributions: number;
  totalGains: number;
  rateOfReturn?: number; // Annualized percentage
  allocationSnapshot?: InvestmentAllocation;
  createdAt: string;
}

export interface RetirementAccountWithStats extends RetirementAccountMetadata {
  accountName: string;
  accountBalance: number;
  accountType?: RetirementAccountType;
  remainingEmployeeRoom: number;
  totalYTDContributions: number;
  vestedBalance: number;
  totalValue?: number;
  totalVested?: number;
  latestGains?: number;
  latestReturnRate?: number;
  latestRateOfReturn?: number;
}

export interface ContributionRoom {
  employeeRoom: number;
  employerRoom: number;
  totalLimit: number;
  isOver50: boolean;
}

// Input types for creation/updates
export type RetirementAccountMetadataInput = Omit<RetirementAccountMetadata, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

export type RetirementContributionInput = Omit<RetirementContribution, 'id' | 'createdAt'> & {
  id?: string;
};

export type RetirementPerformanceInput = Omit<RetirementPerformance, 'id' | 'createdAt'> & {
  id?: string;
};

// Utility type for account with retirement metadata
export interface RetirementAccount extends Account {
  retirementMetadata?: RetirementAccountWithStats;
}

// Helper constants for 2024 contribution limits
export const CONTRIBUTION_LIMITS_2024 = {
  '401k': { base: 23000, catchUp: 7500 },
  '403b': { base: 23000, catchUp: 7500 },
  'traditional_ira': { base: 7000, catchUp: 1000 },
  'roth_ira': { base: 7000, catchUp: 1000 },
  'sep_ira': { base: 69000, catchUp: 0 },
  'simple_ira': { base: 16000, catchUp: 3500 },
  'hsa_individual': { base: 4150, catchUp: 1000 },
  'hsa_family': { base: 8300, catchUp: 1000 },
} as const;
