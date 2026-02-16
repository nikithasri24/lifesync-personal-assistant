/**
 * Zod validation schemas for Finance types
 * Runtime type safety for all finance-related data structures
 */

import { z } from 'zod';

// =====================================================
// BASIC FINANCE TYPES
// =====================================================

export const AccountTypeSchema = z.enum([
  'checking',
  'savings',
  'credit',
  'brokerage',
  'loan',
  'investment',
  '401k',
  '403b',
  'traditional_ira',
  'roth_ira',
  'sep_ira',
  'simple_ira',
  'hsa',
]);

export const RewardsTypeSchema = z.enum(['points', 'miles', 'cashback']);

export const TxnTypeSchema = z.enum(['debit', 'credit']);

// =====================================================
// INSTITUTION
// =====================================================

export const InstitutionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  logoUrl: z.string().url().optional(),
});

// =====================================================
// ACCOUNT
// =====================================================

export const AccountSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  institutionId: z.string().uuid().optional(),
  name: z.string().min(1),
  type: AccountTypeSchema,
  balance: z.number(),
  lastUpdatedISO: z.string().datetime(),
  liability: z.boolean().optional(),
  // Credit card fields
  creditLimit: z.number().positive().optional(),
  apr: z.number().min(0).max(100).optional(),
  paymentDueDay: z.number().int().min(1).max(31).optional(),
  minimumPayment: z.number().positive().optional(),
  statementBalance: z.number().optional(),
  statementDate: z.string().datetime().optional(),
  // Rewards fields
  annualFee: z.number().min(0).optional(),
  annualFeeDueDate: z.string().datetime().optional(),
  rewardsBalance: z.number().optional(),
  rewardsType: RewardsTypeSchema.optional(),
  baseRewardsRate: z.number().min(0).optional(),
});

export const AccountArraySchema = z.array(AccountSchema);

// =====================================================
// CATEGORY
// =====================================================

export const CategorySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  parentId: z.string().uuid().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const CategoryArraySchema = z.array(CategorySchema);

// =====================================================
// TRANSACTION
// =====================================================

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  accountId: z.string().uuid(),
  dateISO: z.string().datetime(),
  description: z.string().min(1),
  categoryId: z.string().uuid().optional(),
  amount: z.number(),
  type: TxnTypeSchema,
  notes: z.string().optional(),
  merchantName: z.string().optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  suggestedCategoryId: z.string().uuid().optional(),
  categorizationRuleId: z.string().uuid().optional(),
});

export const TransactionArraySchema = z.array(TransactionSchema);

// =====================================================
// BUDGET
// =====================================================

export const BudgetSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  categoryId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM format
  limit: z.number().positive(),
});

export const BudgetArraySchema = z.array(BudgetSchema);

export const BudgetTemplateSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  categoryId: z.string().uuid(),
  defaultAmount: z.number().positive(),
});

export const BudgetTemplateArraySchema = z.array(BudgetTemplateSchema);

// =====================================================
// GOAL
// =====================================================

export const GoalTypeSchema = z.enum(['savings', 'debt']);

export const GoalSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  connectionId: z.string().uuid().optional(),
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  currentAmount: z.number(),
  startingAmount: z.number(),
  dueDateISO: z.string().datetime(),
  type: GoalTypeSchema,
  linkedCategoryId: z.string().uuid().optional(),
  linkedAccountId: z.string().uuid().optional(),
  trackNetworth: z.boolean().optional(),
  isShared: z.boolean().optional(),
  createdAtISO: z.string().datetime().optional(),
  updatedAtISO: z.string().datetime().optional(),
});

export const GoalArraySchema = z.array(GoalSchema);

// =====================================================
// CREDIT CARD FEATURES
// =====================================================

export const BenefitTypeSchema = z.enum([
  'recurring_credit',
  'travel_credit',
  'protection',
  'lounge_access',
  'other',
]);

export const BenefitFrequencySchema = z.enum([
  'annual',
  'monthly',
  'quarterly',
  'once',
  'per_use',
]);

export const CardBenefitSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  accountId: z.string().uuid(),
  benefitType: BenefitTypeSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  value: z.number().positive().optional(),
  frequency: BenefitFrequencySchema.optional(),
  usedAmount: z.number().min(0),
  resetDate: z.string().datetime().optional(),
  active: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CardBenefitArraySchema = z.array(CardBenefitSchema);

export const SpendingCategorySchema = z.enum([
  'dining',
  'travel',
  'groceries',
  'gas',
  'online',
  'all_other',
]);

export const CardCategoryBonusSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  accountId: z.string().uuid(),
  category: SpendingCategorySchema,
  rewardsRate: z.number().positive(),
  isRotating: z.boolean(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export const CardCategoryBonusArraySchema = z.array(CardCategoryBonusSchema);

export const WelcomeBonusSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  accountId: z.string().uuid(),
  bonusAmount: z.number().positive(),
  requiredSpend: z.number().positive(),
  currentSpend: z.number().min(0),
  deadline: z.string().datetime(),
  completed: z.boolean(),
  completedDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const WelcomeBonusArraySchema = z.array(WelcomeBonusSchema);

export const OfferTypeSchema = z.enum(['cashback', 'statement_credit', 'bonus_points']);

export const CardOfferSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  accountId: z.string().uuid(),
  merchant: z.string().min(1),
  offerType: OfferTypeSchema,
  offerAmount: z.number().positive(),
  requiredSpend: z.number().positive().optional(),
  expirationDate: z.string().datetime().optional(),
  activated: z.boolean(),
  activatedDate: z.string().datetime().optional(),
  redeemed: z.boolean(),
  redeemedDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export const CardOfferArraySchema = z.array(CardOfferSchema);

// =====================================================
// RECURRING TRANSACTIONS
// =====================================================

export const RecurringFrequencySchema = z.enum([
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'yearly',
]);

export const PendingTransactionStatusSchema = z.enum([
  'pending',
  'approved',
  'skipped',
  'edited',
]);

export const RecurringTransactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  description: z.string().min(1),
  amount: z.number(),
  type: TxnTypeSchema,
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  frequency: RecurringFrequencySchema,
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  dayOfMonth: z.number().int().min(-1).max(31).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  autoCreate: z.boolean(),
  requireApproval: z.boolean(),
  daysBefore: z.number().int().min(0),
  active: z.boolean(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastGeneratedDate: z.string().datetime().optional(),
  nextOccurrenceDate: z.string().datetime().optional(),
  pendingCount: z.number().int().min(0).optional(),
});

export const RecurringTransactionArraySchema = z.array(RecurringTransactionSchema);

export const PendingTransactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  recurringTransactionId: z.string().uuid().optional(),
  description: z.string().min(1),
  amount: z.number(),
  type: TxnTypeSchema,
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  scheduledDate: z.string().datetime(),
  status: PendingTransactionStatusSchema,
  transactionId: z.string().uuid().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  reviewedAt: z.string().datetime().optional(),
});

export const PendingTransactionArraySchema = z.array(PendingTransactionSchema);

// =====================================================
// INSURANCE
// =====================================================

export const InsuranceTypeSchema = z.enum([
  'health',
  'auto',
  'home',
  'life',
  'disability',
  'umbrella',
  'pet',
  'travel',
  'other',
]);

export const InsuranceStatusSchema = z.enum([
  'active',
  'expired',
  'cancelled',
  'pending',
]);

export const PremiumFrequencySchema = z.enum([
  'monthly',
  'quarterly',
  'semi-annual',
  'annual',
]);

export const InsurancePolicySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  policyName: z.string().min(1),
  policyNumber: z.string().optional(),
  provider: z.string().min(1),
  type: InsuranceTypeSchema,
  status: InsuranceStatusSchema,
  coverageAmount: z.number().positive().optional(),
  deductible: z.number().min(0).optional(),
  premiumAmount: z.number().positive(),
  premiumFrequency: PremiumFrequencySchema,
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  renewalDate: z.string().datetime().optional(),
  nextPaymentDate: z.string().datetime().optional(),
  agentName: z.string().optional(),
  agentPhone: z.string().optional(),
  agentEmail: z.string().email().optional(),
  notes: z.string().optional(),
  documents: z.array(z.unknown()).optional(),
  autoRenew: z.boolean(),
  renewalReminderDays: z.number().int().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  claimCount: z.number().int().min(0).optional(),
  totalClaimsPaid: z.number().min(0).optional(),
  beneficiaryCount: z.number().int().min(0).optional(),
  lastPaymentDate: z.string().datetime().optional(),
});

export const InsurancePolicyArraySchema = z.array(InsurancePolicySchema);

// =====================================================
// LOANS
// =====================================================

export const LoanTypeSchema = z.enum([
  'auto',
  'mortgage',
  'personal',
  'student',
  'business',
  'other',
]);

export const LoanStatusSchema = z.enum([
  'active',
  'paid_off',
  'deferred',
  'defaulted',
]);

export const LoanSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  accountId: z.string().uuid().optional(),
  loanName: z.string().min(1),
  loanType: LoanTypeSchema,
  status: LoanStatusSchema,
  principalAmount: z.number().positive(),
  currentBalance: z.number().min(0),
  interestRate: z.number().min(0).max(100),
  monthlyPayment: z.number().positive(),
  extraPayment: z.number().min(0),
  targetPayoffDate: z.string().datetime(),
  startDate: z.string().datetime(),
  firstPaymentDate: z.string().datetime(),
  lender: z.string().optional(),
  loanNumber: z.string().optional(),
  termMonths: z.number().int().positive().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  totalPaid: z.number().min(0).optional(),
  interestPaid: z.number().min(0).optional(),
  principalPaid: z.number().min(0).optional(),
  remainingPayments: z.number().int().min(0).optional(),
  projectedPayoffDate: z.string().datetime().optional(),
});

export const LoanArraySchema = z.array(LoanSchema);

// =====================================================
// SUPABASE FINANCE TYPES (from database.types.ts)
// =====================================================

export const FinancialAccountDataSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string().min(1),
  type: z.string(),
  balance: z.number(),
  last_updated_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  // Credit card fields
  credit_limit: z.number().nullable().optional(),
  apr: z.number().nullable().optional(),
  payment_due_day: z.number().nullable().optional(),
  minimum_payment: z.number().nullable().optional(),
  statement_balance: z.number().nullable().optional(),
  statement_date: z.string().nullable().optional(),
  annual_fee: z.number().nullable().optional(),
  annual_fee_due_date: z.string().nullable().optional(),
  rewards_balance: z.number().nullable().optional(),
  rewards_type: z.string().nullable().optional(),
  base_rewards_rate: z.number().nullable().optional(),
  liability: z.boolean().nullable().optional(),
  institution_id: z.string().nullable().optional(),
  connection_id: z.string().nullable().optional(),
});

export const FinancialAccountDataArraySchema = z.array(FinancialAccountDataSchema);

export const FinancialTransactionDataSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  account_id: z.string(),
  amount: z.number(),
  description: z.string().min(1),
  date: z.string(), // Date string (not datetime)
  type: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  category_id: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  merchant_name: z.string().nullable().optional(),
  confidence_score: z.number().nullable().optional(),
  suggested_category_id: z.string().nullable().optional(),
  categorization_rule_id: z.string().nullable().optional(),
  connection_id: z.string().nullable().optional(),
});

export const FinancialTransactionDataArraySchema = z.array(FinancialTransactionDataSchema);
