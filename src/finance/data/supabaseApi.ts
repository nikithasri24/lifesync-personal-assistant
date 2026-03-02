/**
 * SupabaseApi — thin composition layer implementing FinanceAPI.
 *
 * Delegates every method to the appropriate domain-specific API class.
 * Domain implementations live in the sibling files:
 *   institutionsAPI  →  listInstitutions
 *   accountsAPI      →  accounts CRUD
 *   transactionsAPI  →  transactions CRUD
 *   budgetsAPI       →  budgets + budget templates
 *   categoriesAPI    →  listCategories
 *   goalsAPI         →  net worth + goals CRUD
 *   creditCardsAPI   →  benefits / category bonuses / welcome bonuses / card offers
 *   insuranceLoansAPI→  loans + insurance + retirement
 *   recurringAPI     →  recurring transactions + pending transactions
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FinanceAPI } from './api';
import type {
  Account,
  TxnQuery,
  TransactionInput,
  BudgetTemplateInput,
  GoalInput,
  CardBenefitInput,
  CardCategoryBonusInput,
  WelcomeBonusInput,
  CardOfferInput,
  LoanInput,
  LoanPaymentInput,
  InsurancePolicyInput,
  RetirementAccountMetadataInput,
  RetirementContributionInput,
  RetirementPerformanceInput,
  RecurringTransactionInput,
} from '../types';
import { AccountsAPI } from './accountsAPI';
import { BudgetsAPI } from './budgetsAPI';
import { CategoriesAPI } from './categoriesAPI';
import { CreditCardsAPI } from './creditCardsAPI';
import { GoalsAPI } from './goalsAPI';
import { InstitutionsAPI } from './institutionsAPI';
import { InsuranceLoansAPI } from './insuranceLoansAPI';
import { TransactionsAPI } from './transactionsAPI';
import * as recurringAPI from './recurringAPI';

export class SupabaseApi implements FinanceAPI {
  private institutions: InstitutionsAPI;
  private accounts: AccountsAPI;
  private transactions: TransactionsAPI;
  private budgets: BudgetsAPI;
  private categories: CategoriesAPI;
  private goals: GoalsAPI;
  private creditCards: CreditCardsAPI;
  private insuranceLoans: InsuranceLoansAPI;

  constructor(client: SupabaseClient) {
    this.institutions = new InstitutionsAPI(client);
    this.accounts = new AccountsAPI(client);
    this.transactions = new TransactionsAPI(client);
    this.budgets = new BudgetsAPI(client);
    this.categories = new CategoriesAPI(client);
    this.goals = new GoalsAPI(client);
    this.creditCards = new CreditCardsAPI(client);
    this.insuranceLoans = new InsuranceLoansAPI(client);
  }

  // ── Institutions ──────────────────────────────────────────────────────────
  listInstitutions() { return this.institutions.listInstitutions(); }

  // ── Accounts ──────────────────────────────────────────────────────────────
  listAccounts() { return this.accounts.listAccounts(); }
  updateAccount(accountId: string, updates: Partial<Account>) { return this.accounts.updateAccount(accountId, updates); }
  upsertAccount(account: { id?: string; name: string; type: string; balance: number; institutionId?: string; userId?: string }) { return this.accounts.upsertAccount(account); }
  deleteAccount(accountId: string) { return this.accounts.deleteAccount(accountId); }

  // ── Transactions ──────────────────────────────────────────────────────────
  listTransactions(params: TxnQuery) { return this.transactions.listTransactions(params); }
  upsertTransaction(txn: TransactionInput) { return this.transactions.upsertTransaction(txn); }
  deleteTransaction(id: string) { return this.transactions.deleteTransaction(id); }
  createTransfer(params: { fromAccountId: string; toAccountId: string; amount: number; dateISO: string; notes?: string }) { return this.transactions.createTransfer(params); }

  // ── Budgets ───────────────────────────────────────────────────────────────
  listBudgets(monthISO: string) { return this.budgets.listBudgets(monthISO); }
  upsertBudget(budget: { categoryId: string; month: string; limit: number }) { return this.budgets.upsertBudget(budget); }
  deleteBudget(categoryId: string, month: string) { return this.budgets.deleteBudget(categoryId, month); }
  listBudgetTemplates() { return this.budgets.listBudgetTemplates(); }
  upsertBudgetTemplate(template: BudgetTemplateInput) { return this.budgets.upsertBudgetTemplate(template); }
  deleteBudgetTemplate(categoryId: string) { return this.budgets.deleteBudgetTemplate(categoryId); }
  initializeBudgetsFromTemplates(month: string) { return this.budgets.initializeBudgetsFromTemplates(month); }

  // ── Categories ────────────────────────────────────────────────────────────
  listCategories() { return this.categories.listCategories(); }

  // ── Net Worth + Goals ─────────────────────────────────────────────────────
  listNetWorth() { return this.goals.listNetWorth(); }
  listGoals() { return this.goals.listGoals(); }
  upsertGoal(goal: GoalInput) { return this.goals.upsertGoal(goal); }
  deleteGoal(goalId: string) { return this.goals.deleteGoal(goalId); }
  getGoalProgressHistory(goalId: string) { return this.goals.getGoalProgressHistory(goalId); }
  syncGoalFromAccount(goalId: string) { return this.goals.syncGoalFromAccount(goalId); }

  // ── Credit Cards ──────────────────────────────────────────────────────────
  listCardBenefits(accountId: string) { return this.creditCards.listCardBenefits(accountId); }
  upsertCardBenefit(accountId: string, benefit: CardBenefitInput) { return this.creditCards.upsertCardBenefit(accountId, benefit); }
  deleteCardBenefit(benefitId: string) { return this.creditCards.deleteCardBenefit(benefitId); }
  listCategoryBonuses(accountId: string) { return this.creditCards.listCategoryBonuses(accountId); }
  upsertCategoryBonus(accountId: string, bonus: CardCategoryBonusInput) { return this.creditCards.upsertCategoryBonus(accountId, bonus); }
  listWelcomeBonuses(accountId: string) { return this.creditCards.listWelcomeBonuses(accountId); }
  upsertWelcomeBonus(accountId: string, bonus: WelcomeBonusInput) { return this.creditCards.upsertWelcomeBonus(accountId, bonus); }
  listCardOffers(accountId: string) { return this.creditCards.listCardOffers(accountId); }
  upsertCardOffer(accountId: string, offer: CardOfferInput) { return this.creditCards.upsertCardOffer(accountId, offer); }

  // ── Loans ─────────────────────────────────────────────────────────────────
  listLoans() { return this.insuranceLoans.listLoans(); }
  upsertLoan(loan: LoanInput) { return this.insuranceLoans.upsertLoan(loan); }
  deleteLoan(loanId: string) { return this.insuranceLoans.deleteLoan(loanId); }
  listLoanPayments(loanId: string) { return this.insuranceLoans.listLoanPayments(loanId); }
  upsertLoanPayment(loanId: string, payment: LoanPaymentInput) { return this.insuranceLoans.upsertLoanPayment(loanId, payment); }
  deleteLoanPayment(paymentId: string) { return this.insuranceLoans.deleteLoanPayment(paymentId); }

  // ── Insurance ─────────────────────────────────────────────────────────────
  listInsurancePolicies() { return this.insuranceLoans.listInsurancePolicies(); }
  upsertInsurancePolicy(policy: InsurancePolicyInput) { return this.insuranceLoans.upsertInsurancePolicy(policy); }
  deleteInsurancePolicy(policyId: string) { return this.insuranceLoans.deleteInsurancePolicy(policyId); }

  // ── Retirement ────────────────────────────────────────────────────────────
  listRetirementAccounts() { return this.insuranceLoans.listRetirementAccounts(); }
  getRetirementAccount(accountId: string) { return this.insuranceLoans.getRetirementAccount(accountId); }
  upsertRetirementAccountMetadata(metadata: RetirementAccountMetadataInput) { return this.insuranceLoans.upsertRetirementAccountMetadata(metadata); }
  deleteRetirementAccountMetadata(accountId: string) { return this.insuranceLoans.deleteRetirementAccountMetadata(accountId); }
  listRetirementContributions(retirementAccountId: string) { return this.insuranceLoans.listRetirementContributions(retirementAccountId); }
  addRetirementContribution(contribution: RetirementContributionInput) { return this.insuranceLoans.addRetirementContribution(contribution); }
  deleteRetirementContribution(contributionId: string) { return this.insuranceLoans.deleteRetirementContribution(contributionId); }
  calculateContributionRoom(retirementAccountId: string, annualIncome: number) { return this.insuranceLoans.calculateContributionRoom(retirementAccountId, annualIncome); }
  listRetirementPerformance(retirementAccountId: string) { return this.insuranceLoans.listRetirementPerformance(retirementAccountId); }
  recordRetirementPerformance(performance: RetirementPerformanceInput) { return this.insuranceLoans.recordRetirementPerformance(performance); }
  calculateVestedBalance(retirementAccountId: string, employmentYears: number) { return this.insuranceLoans.calculateVestedBalance(retirementAccountId, employmentYears); }

  // ── Recurring + Pending ───────────────────────────────────────────────────
  listRecurringTransactions() { return recurringAPI.listRecurringTransactions(); }
  upsertRecurringTransaction(input: RecurringTransactionInput) { return recurringAPI.upsertRecurringTransaction(input); }
  deleteRecurringTransaction(id: string) { return recurringAPI.deleteRecurringTransaction(id); }
  listPendingTransactions() { return recurringAPI.listPendingTransactions(); }
  approvePendingTransaction(pendingId: string, overrides?: Partial<TransactionInput>) { return recurringAPI.approvePendingTransaction(pendingId, overrides); }
  skipPendingTransaction(pendingId: string) { return recurringAPI.skipPendingTransaction(pendingId); }
  deletePendingTransaction(pendingId: string) { return recurringAPI.deletePendingTransaction(pendingId); }
  generatePendingTransactions() { return recurringAPI.generatePendingTransactions(); }
}
