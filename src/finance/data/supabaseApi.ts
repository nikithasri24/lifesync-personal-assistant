import type { SupabaseClient } from '@supabase/supabase-js';
import type { FinanceAPI } from './api';
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
  RetirementAccountWithStats,
  RetirementAccountMetadataInput,
  RetirementContribution,
  RetirementContributionInput,
  RetirementPerformance,
  RetirementPerformanceInput,
  ContributionRoom,
} from '../types';

/**
 * Supabase implementation of FinanceAPI
 *
 * Note: This is a stub implementation. Full implementation pending.
 */
export class SupabaseApi implements FinanceAPI {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async listInstitutions(): Promise<Institution[]> {
    throw new Error('SupabaseApi.listInstitutions not implemented');
  }

  async listAccounts(): Promise<Account[]> {
    throw new Error('SupabaseApi.listAccounts not implemented');
  }

  async updateAccount(_accountId: string, _updates: Partial<Account>): Promise<void> {
    throw new Error('SupabaseApi.updateAccount not implemented');
  }

  async upsertAccount(_account: { id?: string; name: string; type: string; balance: number; institutionId?: string }): Promise<void> {
    throw new Error('SupabaseApi.upsertAccount not implemented');
  }

  async deleteAccount(_accountId: string): Promise<void> {
    throw new Error('SupabaseApi.deleteAccount not implemented');
  }

  async listTransactions(_params: TxnQuery): Promise<Paginated<Transaction>> {
    throw new Error('SupabaseApi.listTransactions not implemented');
  }

  async upsertTransaction(_txn: TransactionInput): Promise<void> {
    throw new Error('SupabaseApi.upsertTransaction not implemented');
  }

  async deleteTransaction(_id: string): Promise<void> {
    throw new Error('SupabaseApi.deleteTransaction not implemented');
  }

  async listBudgets(_monthISO: string): Promise<Budget[]> {
    throw new Error('SupabaseApi.listBudgets not implemented');
  }

  async upsertBudget(_budget: { categoryId: string; month: string; limit: number }): Promise<void> {
    throw new Error('SupabaseApi.upsertBudget not implemented');
  }

  async deleteBudget(_categoryId: string, _month: string): Promise<void> {
    throw new Error('SupabaseApi.deleteBudget not implemented');
  }

  async listBudgetTemplates(): Promise<BudgetTemplate[]> {
    throw new Error('SupabaseApi.listBudgetTemplates not implemented');
  }

  async upsertBudgetTemplate(_template: BudgetTemplateInput): Promise<void> {
    throw new Error('SupabaseApi.upsertBudgetTemplate not implemented');
  }

  async deleteBudgetTemplate(_categoryId: string): Promise<void> {
    throw new Error('SupabaseApi.deleteBudgetTemplate not implemented');
  }

  async initializeBudgetsFromTemplates(_month: string): Promise<number> {
    throw new Error('SupabaseApi.initializeBudgetsFromTemplates not implemented');
  }

  async listCategories(): Promise<Category[]> {
    throw new Error('SupabaseApi.listCategories not implemented');
  }

  async listNetWorth(): Promise<NetPoint[]> {
    throw new Error('SupabaseApi.listNetWorth not implemented');
  }

  async listGoals(): Promise<Goal[]> {
    throw new Error('SupabaseApi.listGoals not implemented');
  }

  async upsertGoal(_goal: GoalInput): Promise<void> {
    throw new Error('SupabaseApi.upsertGoal not implemented');
  }

  async deleteGoal(_goalId: string): Promise<void> {
    throw new Error('SupabaseApi.deleteGoal not implemented');
  }

  async getGoalProgressHistory(_goalId: string): Promise<GoalProgressPoint[]> {
    throw new Error('SupabaseApi.getGoalProgressHistory not implemented');
  }

  async syncGoalFromAccount(_goalId: string): Promise<void> {
    throw new Error('SupabaseApi.syncGoalFromAccount not implemented');
  }

  // Credit card benefits
  async listCardBenefits(_accountId: string): Promise<CardBenefit[]> {
    throw new Error('SupabaseApi.listCardBenefits not implemented');
  }

  async upsertCardBenefit(_accountId: string, _benefit: CardBenefitInput): Promise<void> {
    throw new Error('SupabaseApi.upsertCardBenefit not implemented');
  }

  async deleteCardBenefit(_benefitId: string): Promise<void> {
    throw new Error('SupabaseApi.deleteCardBenefit not implemented');
  }

  async listCategoryBonuses(_accountId: string): Promise<CardCategoryBonus[]> {
    throw new Error('SupabaseApi.listCategoryBonuses not implemented');
  }

  async upsertCategoryBonus(_accountId: string, _bonus: CardCategoryBonusInput): Promise<void> {
    throw new Error('SupabaseApi.upsertCategoryBonus not implemented');
  }

  async listWelcomeBonuses(_accountId: string): Promise<WelcomeBonus[]> {
    throw new Error('SupabaseApi.listWelcomeBonuses not implemented');
  }

  async upsertWelcomeBonus(_accountId: string, _bonus: WelcomeBonusInput): Promise<void> {
    throw new Error('SupabaseApi.upsertWelcomeBonus not implemented');
  }

  async listCardOffers(_accountId: string): Promise<CardOffer[]> {
    throw new Error('SupabaseApi.listCardOffers not implemented');
  }

  async upsertCardOffer(_accountId: string, _offer: CardOfferInput): Promise<void> {
    throw new Error('SupabaseApi.upsertCardOffer not implemented');
  }

  // Loan tracking
  async listLoans(): Promise<Loan[]> {
    throw new Error('SupabaseApi.listLoans not implemented');
  }

  async upsertLoan(_loan: LoanInput): Promise<void> {
    throw new Error('SupabaseApi.upsertLoan not implemented');
  }

  async deleteLoan(_loanId: string): Promise<void> {
    throw new Error('SupabaseApi.deleteLoan not implemented');
  }

  async listLoanPayments(_loanId: string): Promise<LoanPayment[]> {
    throw new Error('SupabaseApi.listLoanPayments not implemented');
  }

  async upsertLoanPayment(_loanId: string, _payment: LoanPaymentInput): Promise<void> {
    throw new Error('SupabaseApi.upsertLoanPayment not implemented');
  }

  async deleteLoanPayment(_paymentId: string): Promise<void> {
    throw new Error('SupabaseApi.deleteLoanPayment not implemented');
  }

  // Retirement account tracking
  async listRetirementAccounts(): Promise<RetirementAccountWithStats[]> {
    throw new Error('SupabaseApi.listRetirementAccounts not implemented');
  }

  async getRetirementAccount(_accountId: string): Promise<RetirementAccountWithStats | null> {
    throw new Error('SupabaseApi.getRetirementAccount not implemented');
  }

  async upsertRetirementAccountMetadata(_metadata: RetirementAccountMetadataInput): Promise<void> {
    throw new Error('SupabaseApi.upsertRetirementAccountMetadata not implemented');
  }

  async deleteRetirementAccountMetadata(_accountId: string): Promise<void> {
    throw new Error('SupabaseApi.deleteRetirementAccountMetadata not implemented');
  }

  async listRetirementContributions(_retirementAccountId: string): Promise<RetirementContribution[]> {
    throw new Error('SupabaseApi.listRetirementContributions not implemented');
  }

  async addRetirementContribution(_contribution: RetirementContributionInput): Promise<void> {
    throw new Error('SupabaseApi.addRetirementContribution not implemented');
  }

  async deleteRetirementContribution(_contributionId: string): Promise<void> {
    throw new Error('SupabaseApi.deleteRetirementContribution not implemented');
  }

  async calculateContributionRoom(_retirementAccountId: string, _annualIncome: number): Promise<ContributionRoom> {
    throw new Error('SupabaseApi.calculateContributionRoom not implemented');
  }

  async listRetirementPerformance(_retirementAccountId: string): Promise<RetirementPerformance[]> {
    throw new Error('SupabaseApi.listRetirementPerformance not implemented');
  }

  async recordRetirementPerformance(_performance: RetirementPerformanceInput): Promise<void> {
    throw new Error('SupabaseApi.recordRetirementPerformance not implemented');
  }

  async calculateVestedBalance(_retirementAccountId: string, _employmentYears: number): Promise<number> {
    throw new Error('SupabaseApi.calculateVestedBalance not implemented');
  }
}
