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
  GoalProgressPoint,
  CardBenefit,
  CardBenefitInput,
  CardCategoryBonus,
  CardCategoryBonusInput,
  WelcomeBonus,
  WelcomeBonusInput,
  CardOffer,
  CardOfferInput,
  Loan,
  LoanInput,
  LoanPayment,
  LoanPaymentInput,
  InsurancePolicy,
  InsurancePolicyInput,
  RetirementAccountWithStats,
  RetirementAccountMetadataInput,
  RetirementContribution,
  RetirementContributionInput,
  RetirementPerformance,
  RetirementPerformanceInput,
  ContributionRoom,
  RecurringTransaction,
  RecurringTransactionInput,
  PendingTransaction,
} from '../types';

export interface FinanceAPI {
  listInstitutions(): Promise<Institution[]>;
  listAccounts(): Promise<Account[]>;
  updateAccount(accountId: string, updates: Partial<Account>): Promise<void>;
  upsertAccount(account: { id?: string; name: string; type: string; balance: number; institutionId?: string }): Promise<void>;
  deleteAccount(accountId: string): Promise<void>;
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
  deleteGoal(goalId: string): Promise<void>;
  getGoalProgressHistory(goalId: string): Promise<GoalProgressPoint[]>;
  syncGoalFromAccount(goalId: string): Promise<void>;
  // Credit card benefits
  listCardBenefits(accountId: string): Promise<CardBenefit[]>;
  upsertCardBenefit(accountId: string, benefit: CardBenefitInput): Promise<void>;
  deleteCardBenefit(benefitId: string): Promise<void>;
  listCategoryBonuses(accountId: string): Promise<CardCategoryBonus[]>;
  upsertCategoryBonus(accountId: string, bonus: CardCategoryBonusInput): Promise<void>;
  listWelcomeBonuses(accountId: string): Promise<WelcomeBonus[]>;
  upsertWelcomeBonus(accountId: string, bonus: WelcomeBonusInput): Promise<void>;
  listCardOffers(accountId: string): Promise<CardOffer[]>;
  upsertCardOffer(accountId: string, offer: CardOfferInput): Promise<void>;
  // Loan tracking
  listLoans(): Promise<Loan[]>;
  upsertLoan(loan: LoanInput): Promise<void>;
  deleteLoan(loanId: string): Promise<void>;
  listLoanPayments(loanId: string): Promise<LoanPayment[]>;
  upsertLoanPayment(loanId: string, payment: LoanPaymentInput): Promise<void>;
  deleteLoanPayment(paymentId: string): Promise<void>;
  // Insurance tracking
  listInsurancePolicies(): Promise<InsurancePolicy[]>;
  upsertInsurancePolicy(policy: InsurancePolicyInput): Promise<void>;
  deleteInsurancePolicy(policyId: string): Promise<void>;
  // Retirement account tracking
  listRetirementAccounts(): Promise<RetirementAccountWithStats[]>;
  getRetirementAccount(accountId: string): Promise<RetirementAccountWithStats | null>;
  upsertRetirementAccountMetadata(metadata: RetirementAccountMetadataInput): Promise<void>;
  deleteRetirementAccountMetadata(accountId: string): Promise<void>;
  // Contribution tracking
  listRetirementContributions(retirementAccountId: string): Promise<RetirementContribution[]>;
  addRetirementContribution(contribution: RetirementContributionInput): Promise<void>;
  deleteRetirementContribution(contributionId: string): Promise<void>;
  calculateContributionRoom(retirementAccountId: string, annualIncome: number): Promise<ContributionRoom>;
  // Performance tracking
  listRetirementPerformance(retirementAccountId: string): Promise<RetirementPerformance[]>;
  recordRetirementPerformance(performance: RetirementPerformanceInput): Promise<void>;
  // Vesting calculations
  calculateVestedBalance(retirementAccountId: string, employmentYears: number): Promise<number>;
  // Recurring transactions
  listRecurringTransactions(): Promise<RecurringTransaction[]>;
  upsertRecurringTransaction(input: RecurringTransactionInput): Promise<RecurringTransaction>;
  deleteRecurringTransaction(id: string): Promise<void>;
  // Pending transactions
  listPendingTransactions(): Promise<PendingTransaction[]>;
  approvePendingTransaction(pendingId: string, overrides?: Partial<TransactionInput>): Promise<void>;
  skipPendingTransaction(pendingId: string): Promise<void>;
  deletePendingTransaction(pendingId: string): Promise<void>;
  generatePendingTransactions(): Promise<number>;
}
