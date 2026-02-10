/**
 * Zod Schemas for Finance Module Validation
 *
 * These schemas validate financial data including accounts, transactions,
 * budgets, goals, credit cards, insurance, and loans.
 */

import { z } from 'zod';

// ==================== Common Schemas ====================

/**
 * UUID v4 format
 */
export const UUIDSchema = z.string().uuid('Invalid UUID format');

/**
 * ISO date string validation
 */
export const ISODateSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)) && /^\d{4}-\d{2}-\d{2}/.test(val),
  { message: 'Invalid ISO date string' }
);

/**
 * Year-month format (YYYY-MM)
 */
export const YearMonthSchema = z.string().regex(
  /^\d{4}-\d{2}$/,
  'Invalid year-month format (must be YYYY-MM)'
);

/**
 * Email validation
 */
export const EmailSchema = z.string().email('Invalid email format');

/**
 * Phone number validation (flexible format)
 */
export const PhoneSchema = z.string()
  .regex(/^[\d\s\-\(\)\+\.]+$/, 'Invalid phone number format')
  .min(10, 'Phone number is too short')
  .max(20, 'Phone number is too long');

/**
 * URL validation
 */
export const URLSchema = z.string().url('Invalid URL format');

/**
 * Percentage (0-100)
 */
export const PercentageSchema = z.number()
  .nonnegative('Percentage cannot be negative')
  .max(100, 'Percentage cannot exceed 100');

/**
 * APR (Annual Percentage Rate) - 0-100%
 */
export const APRSchema = z.number()
  .nonnegative('APR cannot be negative')
  .max(100, 'APR is unreasonably high');

/**
 * Day of month (1-31 or -1 for last day)
 */
export const DayOfMonthSchema = z.number()
  .int('Day must be a whole number')
  .refine(
    (day) => (day >= 1 && day <= 31) || day === -1,
    { message: 'Day must be 1-31 or -1 for last day of month' }
  );

// ==================== Enum Schemas ====================

/**
 * Account types
 */
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

export type AccountType = z.infer<typeof AccountTypeSchema>;

/**
 * Rewards types
 */
export const RewardsTypeSchema = z.enum(['points', 'miles', 'cashback']);

export type RewardsType = z.infer<typeof RewardsTypeSchema>;

/**
 * Transaction types
 */
export const TxnTypeSchema = z.enum(['debit', 'credit']);

export type TxnType = z.infer<typeof TxnTypeSchema>;

/**
 * Goal types
 */
export const GoalTypeSchema = z.enum(['savings', 'debt']);

export type GoalType = z.infer<typeof GoalTypeSchema>;

/**
 * Goal status
 */
export const GoalStatusSchema = z.enum(['ahead', 'on-track', 'behind', 'at-risk']);

export type GoalStatus = z.infer<typeof GoalStatusSchema>;

/**
 * Benefit types
 */
export const BenefitTypeSchema = z.enum([
  'recurring_credit',
  'travel_credit',
  'protection',
  'lounge_access',
  'other',
]);

export type BenefitType = z.infer<typeof BenefitTypeSchema>;

/**
 * Benefit frequency
 */
export const BenefitFrequencySchema = z.enum([
  'annual',
  'monthly',
  'quarterly',
  'once',
  'per_use',
]);

export type BenefitFrequency = z.infer<typeof BenefitFrequencySchema>;

/**
 * Spending categories
 */
export const SpendingCategorySchema = z.enum([
  'dining',
  'travel',
  'groceries',
  'gas',
  'online',
  'all_other',
]);

export type SpendingCategory = z.infer<typeof SpendingCategorySchema>;

/**
 * Offer types
 */
export const OfferTypeSchema = z.enum(['cashback', 'statement_credit', 'bonus_points']);

export type OfferType = z.infer<typeof OfferTypeSchema>;

/**
 * Recurring frequency
 */
export const RecurringFrequencySchema = z.enum([
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'yearly',
]);

export type RecurringFrequency = z.infer<typeof RecurringFrequencySchema>;

/**
 * Pending transaction status
 */
export const PendingTransactionStatusSchema = z.enum([
  'pending',
  'approved',
  'skipped',
  'edited',
]);

export type PendingTransactionStatus = z.infer<typeof PendingTransactionStatusSchema>;

/**
 * Insurance types
 */
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

export type InsuranceType = z.infer<typeof InsuranceTypeSchema>;

/**
 * Insurance status
 */
export const InsuranceStatusSchema = z.enum([
  'active',
  'expired',
  'cancelled',
  'pending',
]);

export type InsuranceStatus = z.infer<typeof InsuranceStatusSchema>;

/**
 * Premium frequency
 */
export const PremiumFrequencySchema = z.enum([
  'monthly',
  'quarterly',
  'semi-annual',
  'annual',
]);

export type PremiumFrequency = z.infer<typeof PremiumFrequencySchema>;

/**
 * Claim status
 */
export const ClaimStatusSchema = z.enum([
  'filed',
  'under_review',
  'approved',
  'denied',
  'paid',
  'closed',
]);

export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;

/**
 * Beneficiary type
 */
export const BeneficiaryTypeSchema = z.enum(['primary', 'contingent']);

export type BeneficiaryType = z.infer<typeof BeneficiaryTypeSchema>;

/**
 * Payment status
 */
export const PaymentStatusSchema = z.enum([
  'pending',
  'completed',
  'failed',
  'refunded',
]);

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

// ==================== Institution Schema ====================

/**
 * Schema for financial institutions
 */
export const InstitutionSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  name: z.string()
    .min(1, 'Institution name is required')
    .max(200, 'Institution name is too long'),
  logoUrl: URLSchema.optional(),
});

export type ValidatedInstitution = z.infer<typeof InstitutionSchema>;

/**
 * Schema for institution input
 */
export const InstitutionInputSchema = InstitutionSchema.omit({
  id: true,
});

export type ValidatedInstitutionInput = z.infer<typeof InstitutionInputSchema>;

// ==================== Account Schema ====================

/**
 * Schema for financial accounts
 */
export const AccountSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  institutionId: UUIDSchema.optional(),
  name: z.string()
    .min(1, 'Account name is required')
    .max(200, 'Account name is too long'),
  type: AccountTypeSchema,
  balance: z.number()
    .max(1000000000, 'Balance is unreasonably high'),
  lastUpdatedISO: ISODateSchema,
  liability: z.boolean().optional(),

  // Credit card specific fields
  creditLimit: z.number()
    .positive('Credit limit must be positive')
    .max(10000000, 'Credit limit is unreasonably high')
    .optional(),
  apr: APRSchema.optional(),
  paymentDueDay: DayOfMonthSchema.optional(),
  minimumPayment: z.number()
    .nonnegative('Minimum payment cannot be negative')
    .max(1000000, 'Minimum payment is unreasonably high')
    .optional(),
  statementBalance: z.number()
    .max(10000000, 'Statement balance is unreasonably high')
    .optional(),
  statementDate: ISODateSchema.optional(),

  // Rewards fields
  annualFee: z.number()
    .nonnegative('Annual fee cannot be negative')
    .max(10000, 'Annual fee is unreasonably high')
    .optional(),
  annualFeeDueDate: ISODateSchema.optional(),
  rewardsBalance: z.number()
    .nonnegative('Rewards balance cannot be negative')
    .max(100000000, 'Rewards balance is unreasonably high')
    .optional(),
  rewardsType: RewardsTypeSchema.optional(),
  baseRewardsRate: z.number()
    .nonnegative('Base rewards rate cannot be negative')
    .max(100, 'Base rewards rate is unreasonably high')
    .optional(),
});

export type ValidatedAccount = z.infer<typeof AccountSchema>;

/**
 * Schema for account input
 */
export const AccountInputSchema = AccountSchema.omit({
  id: true,
  userId: true,
});

export type ValidatedAccountInput = z.infer<typeof AccountInputSchema>;

// ==================== Category Schema ====================

/**
 * Schema for transaction categories
 */
export const CategorySchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  name: z.string()
    .min(1, 'Category name is required')
    .max(100, 'Category name is too long'),
  parentId: UUIDSchema.optional(),
  icon: z.string()
    .max(50, 'Icon is too long')
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format (must be #RRGGBB)')
    .optional(),
});

export type ValidatedCategory = z.infer<typeof CategorySchema>;

/**
 * Schema for category input
 */
export const CategoryInputSchema = CategorySchema.omit({
  id: true,
});

export type ValidatedCategoryInput = z.infer<typeof CategoryInputSchema>;

// ==================== Transaction Schema ====================

/**
 * Schema for financial transactions
 */
export const TransactionSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  accountId: UUIDSchema,
  dateISO: ISODateSchema,
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description is too long'),
  categoryId: UUIDSchema.optional(),
  amount: z.number()
    .positive('Amount must be positive')
    .max(10000000, 'Amount is unreasonably high'),
  type: TxnTypeSchema,
  notes: z.string()
    .max(2000, 'Notes are too long')
    .optional(),

  // Categorization support
  merchantName: z.string()
    .max(200, 'Merchant name is too long')
    .optional(),
  confidenceScore: z.number()
    .min(0, 'Confidence score must be 0-1')
    .max(1, 'Confidence score must be 0-1')
    .optional(),
  suggestedCategoryId: UUIDSchema.optional(),
  categorizationRuleId: UUIDSchema.optional(),
});

export type ValidatedTransaction = z.infer<typeof TransactionSchema>;

/**
 * Schema for transaction input
 */
export const TransactionInputSchema = TransactionSchema.omit({
  id: true,
}).partial({ id: true });

export type ValidatedTransactionInput = z.infer<typeof TransactionInputSchema>;

// ==================== Budget Schema ====================

/**
 * Schema for budgets
 */
export const BudgetSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  categoryId: UUIDSchema,
  month: YearMonthSchema,
  limit: z.number()
    .positive('Limit must be positive')
    .max(10000000, 'Limit is unreasonably high'),
});

export type ValidatedBudget = z.infer<typeof BudgetSchema>;

/**
 * Schema for budget input
 */
export const BudgetInputSchema = BudgetSchema.omit({
  id: true,
}).partial({ id: true });

export type ValidatedBudgetInput = z.infer<typeof BudgetInputSchema>;

// ==================== Budget Template Schema ====================

/**
 * Schema for budget templates
 */
export const BudgetTemplateSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  categoryId: UUIDSchema,
  defaultAmount: z.number()
    .positive('Default amount must be positive')
    .max(10000000, 'Default amount is unreasonably high'),
});

export type ValidatedBudgetTemplate = z.infer<typeof BudgetTemplateSchema>;

/**
 * Schema for budget template input
 */
export const BudgetTemplateInputSchema = BudgetTemplateSchema.omit({
  id: true,
}).partial({ id: true });

export type ValidatedBudgetTemplateInput = z.infer<typeof BudgetTemplateInputSchema>;

// ==================== Goal Schema ====================

/**
 * Schema for financial goals
 */
export const GoalSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  connectionId: UUIDSchema.optional(),
  name: z.string()
    .min(1, 'Goal name is required')
    .max(200, 'Goal name is too long'),
  targetAmount: z.number()
    .positive('Target amount must be positive')
    .max(1000000000, 'Target amount is unreasonably high'),
  currentAmount: z.number()
    .nonnegative('Current amount cannot be negative')
    .max(1000000000, 'Current amount is unreasonably high'),
  startingAmount: z.number()
    .nonnegative('Starting amount cannot be negative')
    .max(1000000000, 'Starting amount is unreasonably high'),
  dueDateISO: ISODateSchema,
  type: GoalTypeSchema,
  linkedCategoryId: UUIDSchema.optional(),
  linkedAccountId: UUIDSchema.optional(),
  trackNetworth: z.boolean().optional(),
  isShared: z.boolean().optional(),
  createdAtISO: ISODateSchema.optional(),
  updatedAtISO: ISODateSchema.optional(),
});

export type ValidatedGoal = z.infer<typeof GoalSchema>;

/**
 * Schema for goal input
 */
export const GoalInputSchema = GoalSchema.omit({
  createdAtISO: true,
  updatedAtISO: true,
}).partial({ id: true });

export type ValidatedGoalInput = z.infer<typeof GoalInputSchema>;

// ==================== Goal Progress Point Schema ====================

/**
 * Schema for goal progress tracking points
 */
export const GoalProgressPointSchema = z.object({
  dateISO: ISODateSchema,
  amount: z.number()
    .nonnegative('Amount cannot be negative')
    .max(1000000000, 'Amount is unreasonably high'),
  note: z.string()
    .max(500, 'Note is too long')
    .optional(),
});

export type ValidatedGoalProgressPoint = z.infer<typeof GoalProgressPointSchema>;

// ==================== Goal Recommendation Schema ====================

/**
 * Schema for goal recommendations
 */
export const GoalRecommendationSchema = z.object({
  requiredMonthlyContribution: z.number()
    .max(10000000, 'Required monthly contribution is unreasonably high'),
  onTrack: z.boolean(),
  projectedCompletionISO: ISODateSchema,
  daysRemaining: z.number().int('Days must be a whole number'),
  monthsRemaining: z.number(),
  status: GoalStatusSchema,
  message: z.string()
    .max(500, 'Message is too long'),
});

export type ValidatedGoalRecommendation = z.infer<typeof GoalRecommendationSchema>;

// ==================== Credit Card Statement Schema ====================

/**
 * Base schema for credit card statements (without refinements)
 */
const CreditCardStatementBaseSchema = z.object({
  id: UUIDSchema,
  accountId: UUIDSchema,
  statementDate: ISODateSchema,
  dueDate: ISODateSchema,
  balance: z.number()
    .max(10000000, 'Balance is unreasonably high'),
  minimumPayment: z.number()
    .nonnegative('Minimum payment cannot be negative')
    .max(1000000, 'Minimum payment is unreasonably high'),
  apr: APRSchema.optional(),
  paid: z.boolean(),
  paidAmount: z.number()
    .nonnegative('Paid amount cannot be negative')
    .max(10000000, 'Paid amount is unreasonably high')
    .optional(),
  paidDate: ISODateSchema.optional(),
  createdAt: ISODateSchema,
});

/**
 * Schema for credit card statements with date validation
 */
export const CreditCardStatementSchema = CreditCardStatementBaseSchema.refine(
  (data) => new Date(data.dueDate) >= new Date(data.statementDate),
  { message: 'Due date must be after or equal to statement date' }
);

export type ValidatedCreditCardStatement = z.infer<typeof CreditCardStatementSchema>;

/**
 * Schema for credit card statement input
 */
export const CreditCardStatementInputSchema = CreditCardStatementBaseSchema.omit({
  id: true,
  createdAt: true,
}).partial({ id: true }).refine(
  (data) => new Date(data.dueDate) >= new Date(data.statementDate),
  { message: 'Due date must be after or equal to statement date' }
);

export type ValidatedCreditCardStatementInput = z.infer<typeof CreditCardStatementInputSchema>;

// ==================== Card Benefit Schema ====================

/**
 * Schema for card benefits
 */
export const CardBenefitSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  accountId: UUIDSchema,
  benefitType: BenefitTypeSchema,
  name: z.string()
    .min(1, 'Benefit name is required')
    .max(200, 'Benefit name is too long'),
  description: z.string()
    .max(1000, 'Description is too long')
    .optional(),
  value: z.number()
    .nonnegative('Value cannot be negative')
    .max(100000, 'Value is unreasonably high')
    .optional(),
  frequency: BenefitFrequencySchema.optional(),
  usedAmount: z.number()
    .nonnegative('Used amount cannot be negative')
    .max(100000, 'Used amount is unreasonably high'),
  resetDate: ISODateSchema.optional(),
  active: z.boolean(),
  createdAt: ISODateSchema,
  updatedAt: ISODateSchema,
});

export type ValidatedCardBenefit = z.infer<typeof CardBenefitSchema>;

/**
 * Schema for card benefit input
 */
export const CardBenefitInputSchema = CardBenefitSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({ id: true });

export type ValidatedCardBenefitInput = z.infer<typeof CardBenefitInputSchema>;

// ==================== Card Category Bonus Schema ====================

/**
 * Base schema for card category bonuses (without refinements)
 */
const CardCategoryBonusBaseSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  accountId: UUIDSchema,
  category: SpendingCategorySchema,
  rewardsRate: z.number()
    .nonnegative('Rewards rate cannot be negative')
    .max(100, 'Rewards rate is unreasonably high'),
  isRotating: z.boolean(),
  startDate: ISODateSchema.optional(),
  endDate: ISODateSchema.optional(),
  createdAt: ISODateSchema,
});

/**
 * Date range validation refinement for card category bonus
 */
const cardCategoryBonusDateRefinement = (data: { startDate?: string; endDate?: string }) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
};

/**
 * Schema for card category bonuses with date validation
 */
export const CardCategoryBonusSchema = CardCategoryBonusBaseSchema.refine(
  cardCategoryBonusDateRefinement,
  { message: 'End date must be after or equal to start date' }
);

export type ValidatedCardCategoryBonus = z.infer<typeof CardCategoryBonusSchema>;

/**
 * Schema for card category bonus input
 */
export const CardCategoryBonusInputSchema = CardCategoryBonusBaseSchema.omit({
  id: true,
  createdAt: true,
}).partial({ id: true }).refine(
  cardCategoryBonusDateRefinement,
  { message: 'End date must be after or equal to start date' }
);

export type ValidatedCardCategoryBonusInput = z.infer<typeof CardCategoryBonusInputSchema>;

// ==================== Welcome Bonus Schema ====================

/**
 * Schema for welcome bonuses
 */
export const WelcomeBonusSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  accountId: UUIDSchema,
  bonusAmount: z.number()
    .positive('Bonus amount must be positive')
    .max(10000000, 'Bonus amount is unreasonably high'),
  requiredSpend: z.number()
    .positive('Required spend must be positive')
    .max(100000000, 'Required spend is unreasonably high'),
  currentSpend: z.number()
    .nonnegative('Current spend cannot be negative')
    .max(100000000, 'Current spend is unreasonably high'),
  deadline: ISODateSchema,
  completed: z.boolean(),
  completedDate: ISODateSchema.optional(),
  createdAt: ISODateSchema,
  updatedAt: ISODateSchema,
});

export type ValidatedWelcomeBonus = z.infer<typeof WelcomeBonusSchema>;

/**
 * Schema for welcome bonus input
 */
export const WelcomeBonusInputSchema = WelcomeBonusSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({ id: true });

export type ValidatedWelcomeBonusInput = z.infer<typeof WelcomeBonusInputSchema>;

// ==================== Card Offer Schema ====================

/**
 * Schema for card offers
 */
export const CardOfferSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  accountId: UUIDSchema,
  merchant: z.string()
    .min(1, 'Merchant is required')
    .max(200, 'Merchant name is too long'),
  offerType: OfferTypeSchema,
  offerAmount: z.number()
    .positive('Offer amount must be positive')
    .max(100000, 'Offer amount is unreasonably high'),
  requiredSpend: z.number()
    .positive('Required spend must be positive')
    .max(1000000, 'Required spend is unreasonably high')
    .optional(),
  expirationDate: ISODateSchema.optional(),
  activated: z.boolean(),
  activatedDate: ISODateSchema.optional(),
  redeemed: z.boolean(),
  redeemedDate: ISODateSchema.optional(),
  createdAt: ISODateSchema,
});

export type ValidatedCardOffer = z.infer<typeof CardOfferSchema>;

/**
 * Schema for card offer input
 */
export const CardOfferInputSchema = CardOfferSchema.omit({
  id: true,
  createdAt: true,
}).partial({ id: true });

export type ValidatedCardOfferInput = z.infer<typeof CardOfferInputSchema>;

// ==================== Insurance Policy Schema ====================

/**
 * Base schema for insurance policies (without refinements)
 */
const InsurancePolicyBaseSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  policyName: z.string()
    .min(1, 'Policy name is required')
    .max(200, 'Policy name is too long'),
  policyNumber: z.string()
    .max(100, 'Policy number is too long')
    .optional(),
  provider: z.string()
    .min(1, 'Provider is required')
    .max(200, 'Provider name is too long'),
  type: InsuranceTypeSchema,
  status: InsuranceStatusSchema,
  coverageAmount: z.number()
    .positive('Coverage amount must be positive')
    .max(100000000, 'Coverage amount is unreasonably high')
    .optional(),
  deductible: z.number()
    .nonnegative('Deductible cannot be negative')
    .max(1000000, 'Deductible is unreasonably high')
    .optional(),
  premiumAmount: z.number()
    .positive('Premium amount must be positive')
    .max(1000000, 'Premium amount is unreasonably high'),
  premiumFrequency: PremiumFrequencySchema,
  startDate: ISODateSchema,
  endDate: ISODateSchema.optional(),
  renewalDate: ISODateSchema.optional(),
  nextPaymentDate: ISODateSchema.optional(),
  agentName: z.string()
    .max(200, 'Agent name is too long')
    .optional(),
  agentPhone: PhoneSchema.optional(),
  agentEmail: EmailSchema.optional(),
  notes: z.string()
    .max(2000, 'Notes are too long')
    .optional(),
  documents: z.array(z.unknown()).optional(),
  autoRenew: z.boolean(),
  renewalReminderDays: z.number()
    .int('Reminder days must be a whole number')
    .nonnegative('Reminder days cannot be negative')
    .max(365, 'Reminder days is unreasonably high'),
  createdAt: ISODateSchema,
  updatedAt: ISODateSchema,

  // View fields
  claimCount: z.number().int().nonnegative().optional(),
  totalClaimsPaid: z.number().nonnegative().optional(),
  beneficiaryCount: z.number().int().nonnegative().optional(),
  lastPaymentDate: ISODateSchema.optional(),
});

/**
 * Date range validation refinement for insurance policy
 */
const insurancePolicyDateRefinement = (data: { startDate: string; endDate?: string }) => {
  if (data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
};

/**
 * Schema for insurance policies with date validation
 */
export const InsurancePolicySchema = InsurancePolicyBaseSchema.refine(
  insurancePolicyDateRefinement,
  { message: 'End date must be after or equal to start date' }
);

export type ValidatedInsurancePolicy = z.infer<typeof InsurancePolicySchema>;

/**
 * Schema for insurance policy input
 */
export const InsurancePolicyInputSchema = InsurancePolicyBaseSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  claimCount: true,
  totalClaimsPaid: true,
  beneficiaryCount: true,
  lastPaymentDate: true,
}).partial({ id: true }).refine(
  insurancePolicyDateRefinement,
  { message: 'End date must be after or equal to start date' }
);

export type ValidatedInsurancePolicyInput = z.infer<typeof InsurancePolicyInputSchema>;

// ==================== Insurance Claim Schema ====================

/**
 * Base schema for insurance claims (without refinements)
 */
const InsuranceClaimBaseSchema = z.object({
  id: UUIDSchema,
  policyId: UUIDSchema,
  claimNumber: z.string()
    .max(100, 'Claim number is too long')
    .optional(),
  claimType: z.string()
    .min(1, 'Claim type is required')
    .max(100, 'Claim type is too long'),
  claimDate: ISODateSchema,
  incidentDate: ISODateSchema,
  claimAmount: z.number()
    .positive('Claim amount must be positive')
    .max(100000000, 'Claim amount is unreasonably high'),
  approvedAmount: z.number()
    .nonnegative('Approved amount cannot be negative')
    .max(100000000, 'Approved amount is unreasonably high')
    .optional(),
  paidAmount: z.number()
    .nonnegative('Paid amount cannot be negative')
    .max(100000000, 'Paid amount is unreasonably high')
    .optional(),
  deductiblePaid: z.number()
    .nonnegative('Deductible paid cannot be negative')
    .max(1000000, 'Deductible paid is unreasonably high')
    .optional(),
  status: ClaimStatusSchema,
  description: z.string()
    .min(1, 'Description is required')
    .max(2000, 'Description is too long'),
  notes: z.string()
    .max(2000, 'Notes are too long')
    .optional(),
  adjusterName: z.string()
    .max(200, 'Adjuster name is too long')
    .optional(),
  adjusterPhone: PhoneSchema.optional(),
  adjusterEmail: EmailSchema.optional(),
  filedDate: ISODateSchema.optional(),
  approvedDate: ISODateSchema.optional(),
  paidDate: ISODateSchema.optional(),
  closedDate: ISODateSchema.optional(),
  createdAt: ISODateSchema,
  updatedAt: ISODateSchema,
});

/**
 * Schema for insurance claims with date validation
 */
export const InsuranceClaimSchema = InsuranceClaimBaseSchema.refine(
  (data) => new Date(data.claimDate) >= new Date(data.incidentDate),
  { message: 'Claim date must be after or equal to incident date' }
);

export type ValidatedInsuranceClaim = z.infer<typeof InsuranceClaimSchema>;

/**
 * Schema for insurance claim input
 */
export const InsuranceClaimInputSchema = InsuranceClaimBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({ id: true }).refine(
  (data) => new Date(data.claimDate) >= new Date(data.incidentDate),
  { message: 'Claim date must be after or equal to incident date' }
);

export type ValidatedInsuranceClaimInput = z.infer<typeof InsuranceClaimInputSchema>;

// ==================== Insurance Beneficiary Schema ====================

/**
 * Schema for insurance beneficiaries
 */
export const InsuranceBeneficiarySchema = z.object({
  id: UUIDSchema,
  policyId: UUIDSchema,
  name: z.string()
    .min(1, 'Beneficiary name is required')
    .max(200, 'Beneficiary name is too long'),
  relationship: z.string()
    .min(1, 'Relationship is required')
    .max(100, 'Relationship is too long'),
  beneficiaryType: BeneficiaryTypeSchema,
  percentage: PercentageSchema,
  phone: PhoneSchema.optional(),
  email: EmailSchema.optional(),
  address: z.string()
    .max(500, 'Address is too long')
    .optional(),
  createdAt: ISODateSchema,
  updatedAt: ISODateSchema,
});

export type ValidatedInsuranceBeneficiary = z.infer<typeof InsuranceBeneficiarySchema>;

/**
 * Schema for insurance beneficiary input
 */
export const InsuranceBeneficiaryInputSchema = InsuranceBeneficiarySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({ id: true });

export type ValidatedInsuranceBeneficiaryInput = z.infer<typeof InsuranceBeneficiaryInputSchema>;

// ==================== Insurance Premium Payment Schema ====================

/**
 * Base schema for insurance premium payments (without refinements)
 */
const InsurancePremiumPaymentBaseSchema = z.object({
  id: UUIDSchema,
  policyId: UUIDSchema,
  paymentDate: ISODateSchema,
  amount: z.number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount is unreasonably high'),
  paymentMethod: z.string()
    .max(100, 'Payment method is too long')
    .optional(),
  coveragePeriodStart: ISODateSchema.optional(),
  coveragePeriodEnd: ISODateSchema.optional(),
  status: PaymentStatusSchema,
  transactionId: UUIDSchema.optional(),
  confirmationNumber: z.string()
    .max(100, 'Confirmation number is too long')
    .optional(),
  notes: z.string()
    .max(1000, 'Notes are too long')
    .optional(),
  createdAt: ISODateSchema,
});

/**
 * Coverage period validation refinement for insurance premium payment
 */
const premiumPaymentCoverageRefinement = (data: { coveragePeriodStart?: string; coveragePeriodEnd?: string }) => {
  if (data.coveragePeriodStart && data.coveragePeriodEnd) {
    return new Date(data.coveragePeriodEnd) >= new Date(data.coveragePeriodStart);
  }
  return true;
};

/**
 * Schema for insurance premium payments with coverage period validation
 */
export const InsurancePremiumPaymentSchema = InsurancePremiumPaymentBaseSchema.refine(
  premiumPaymentCoverageRefinement,
  { message: 'Coverage period end must be after or equal to start' }
);

export type ValidatedInsurancePremiumPayment = z.infer<typeof InsurancePremiumPaymentSchema>;

/**
 * Schema for insurance premium payment input
 */
export const InsurancePremiumPaymentInputSchema = InsurancePremiumPaymentBaseSchema.omit({
  id: true,
  createdAt: true,
}).partial({ id: true }).refine(
  premiumPaymentCoverageRefinement,
  { message: 'Coverage period end must be after or equal to start' }
);

export type ValidatedInsurancePremiumPaymentInput = z.infer<typeof InsurancePremiumPaymentInputSchema>;

// ==================== Array Schemas ====================

/**
 * Schema for arrays of institutions
 */
export const InstitutionsArraySchema = z.array(InstitutionSchema);

/**
 * Schema for arrays of accounts
 */
export const AccountsArraySchema = z.array(AccountSchema);

/**
 * Schema for arrays of categories
 */
export const CategoriesArraySchema = z.array(CategorySchema);

/**
 * Schema for arrays of transactions
 */
export const TransactionsArraySchema = z.array(TransactionSchema);

/**
 * Schema for arrays of budgets
 */
export const BudgetsArraySchema = z.array(BudgetSchema);

/**
 * Schema for arrays of goals
 */
export const GoalsArraySchema = z.array(GoalSchema);

// ==================== Validation Helper Functions ====================

/**
 * Validates and filters an array of items, logging warnings for invalid items
 */
export function validateFinanceArrayWithFilter<T>(
  schema: z.ZodSchema<unknown>,
  data: unknown[],
  context: string
): T[] {
  const validItems: T[] = [];

  for (let i = 0; i < data.length; i++) {
    const result = schema.safeParse(data[i]);
    if (result.success) {
      validItems.push(result.data as T);
    } else {
      console.warn(`Invalid item at index ${i} in ${context}:`, {
        errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        item: data[i],
      });
    }
  }

  return validItems;
}

/**
 * Validates a single item and throws on error
 */
export function validateFinanceItem<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Validation failed for ${context}: ${errors}`);
  }
  return result.data;
}
