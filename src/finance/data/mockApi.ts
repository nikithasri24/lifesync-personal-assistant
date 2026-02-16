/**
 * Mock Finance API for testing
 * Implements FinanceAPI interface with in-memory data
 */

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
} from '../types';
import type { FinanceAPI } from './api';

export class MockApi implements FinanceAPI {
  private institutions: Institution[] = [];
  private accounts: Account[] = [];
  private transactions: Transaction[] = [];
  private budgets: Budget[] = [];
  private budgetTemplates: BudgetTemplate[] = [];
  private categories: Category[] = [];
  private netWorth: NetPoint[] = [];
  private goals: Goal[] = [];
  private cardBenefits: CardBenefit[] = [];
  private categoryBonuses: CardCategoryBonus[] = [];
  private welcomeBonuses: WelcomeBonus[] = [];
  private cardOffers: CardOffer[] = [];
  private loans: Loan[] = [];
  private loanPayments: LoanPayment[] = [];
  private insurancePolicies: InsurancePolicy[] = [];
  private retirementAccounts: RetirementAccountWithStats[] = [];
  private retirementContributions: RetirementContribution[] = [];
  private retirementPerformance: RetirementPerformance[] = [];

  async listInstitutions(): Promise<Institution[]> {
    return this.institutions;
  }

  async listAccounts(): Promise<Account[]> {
    return this.accounts;
  }

  async updateAccount(accountId: string, updates: Partial<Account>): Promise<void> {
    const index = this.accounts.findIndex(a => a.id === accountId);
    if (index >= 0) {
      this.accounts[index] = { ...this.accounts[index], ...updates };
    }
  }

  async upsertAccount(account: { id?: string; name: string; type: string; balance: number; institutionId?: string }): Promise<void> {
    if (account.id) {
      const index = this.accounts.findIndex(a => a.id === account.id);
      if (index >= 0) {
        this.accounts[index] = { ...this.accounts[index], ...account } as Account;
      }
    } else {
      const newAccount: Account = {
        id: crypto.randomUUID(),
        userId: 'test-user',
        name: account.name,
        type: account.type as Account['type'],
        balance: account.balance,
        institutionId: account.institutionId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.accounts.push(newAccount);
    }
  }

  async deleteAccount(accountId: string): Promise<void> {
    this.accounts = this.accounts.filter(a => a.id !== accountId);
  }

  async listTransactions(params: TxnQuery): Promise<Paginated<Transaction>> {
    let filtered = [...this.transactions];

    if (params.accountId) {
      filtered = filtered.filter(t => t.accountId === params.accountId);
    }
    if (params.categoryId) {
      filtered = filtered.filter(t => t.categoryId === params.categoryId);
    }
    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(search) ||
        t.merchant?.toLowerCase().includes(search)
      );
    }
    if (params.startDate) {
      filtered = filtered.filter(t => t.date >= params.startDate!);
    }
    if (params.endDate) {
      filtered = filtered.filter(t => t.date <= params.endDate!);
    }

    const limit = params.limit || 100;
    const items = filtered.slice(0, limit);
    const nextCursor = filtered.length > limit ? `${filtered[limit].date}:${filtered[limit].id}` : undefined;

    return { items, nextCursor };
  }

  async upsertTransaction(txn: TransactionInput): Promise<void> {
    if (txn.id) {
      const index = this.transactions.findIndex(t => t.id === txn.id);
      if (index >= 0) {
        this.transactions[index] = { ...this.transactions[index], ...txn } as Transaction;
      }
    } else {
      const newTxn: Transaction = {
        ...txn,
        id: crypto.randomUUID(),
        userId: 'test-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Transaction;
      this.transactions.push(newTxn);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    this.transactions = this.transactions.filter(t => t.id !== id);
  }

  async listBudgets(monthISO: string): Promise<Budget[]> {
    return this.budgets.filter(b => b.month === monthISO);
  }

  async upsertBudget(budget: { categoryId: string; month: string; limit: number }): Promise<void> {
    const index = this.budgets.findIndex(b => b.categoryId === budget.categoryId && b.month === budget.month);
    if (index >= 0) {
      this.budgets[index] = { ...this.budgets[index], ...budget };
    } else {
      const newBudget: Budget = {
        id: crypto.randomUUID(),
        userId: 'test-user',
        categoryId: budget.categoryId,
        month: budget.month,
        limit: budget.limit,
        spent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.budgets.push(newBudget);
    }
  }

  async deleteBudget(categoryId: string, month: string): Promise<void> {
    this.budgets = this.budgets.filter(b => !(b.categoryId === categoryId && b.month === month));
  }

  async listBudgetTemplates(): Promise<BudgetTemplate[]> {
    return this.budgetTemplates;
  }

  async upsertBudgetTemplate(template: BudgetTemplateInput): Promise<void> {
    const index = this.budgetTemplates.findIndex(t => t.categoryId === template.categoryId);
    if (index >= 0) {
      this.budgetTemplates[index] = { ...this.budgetTemplates[index], ...template };
    } else {
      const newTemplate: BudgetTemplate = {
        id: crypto.randomUUID(),
        userId: 'test-user',
        categoryId: template.categoryId,
        defaultLimit: template.defaultLimit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.budgetTemplates.push(newTemplate);
    }
  }

  async deleteBudgetTemplate(categoryId: string): Promise<void> {
    this.budgetTemplates = this.budgetTemplates.filter(t => t.categoryId !== categoryId);
  }

  async initializeBudgetsFromTemplates(month: string): Promise<number> {
    let count = 0;
    for (const template of this.budgetTemplates) {
      const exists = this.budgets.some(b => b.categoryId === template.categoryId && b.month === month);
      if (!exists) {
        await this.upsertBudget({
          categoryId: template.categoryId,
          month,
          limit: template.defaultLimit,
        });
        count++;
      }
    }
    return count;
  }

  async listCategories(): Promise<Category[]> {
    return this.categories;
  }

  async listNetWorth(): Promise<NetPoint[]> {
    return this.netWorth;
  }

  async listGoals(): Promise<Goal[]> {
    return this.goals;
  }

  async upsertGoal(goal: GoalInput): Promise<void> {
    if (goal.id) {
      const index = this.goals.findIndex(g => g.id === goal.id);
      if (index >= 0) {
        this.goals[index] = { ...this.goals[index], ...goal } as Goal;
      }
    } else {
      const newGoal: Goal = {
        ...goal,
        id: crypto.randomUUID(),
        userId: 'test-user',
        currentAmount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Goal;
      this.goals.push(newGoal);
    }
  }

  async deleteGoal(goalId: string): Promise<void> {
    this.goals = this.goals.filter(g => g.id !== goalId);
  }

  async getGoalProgressHistory(goalId: string): Promise<GoalProgressPoint[]> {
    return [];
  }

  async syncGoalFromAccount(goalId: string): Promise<void> {
    // Mock implementation
  }

  async listCardBenefits(accountId: string): Promise<CardBenefit[]> {
    return this.cardBenefits.filter(b => b.accountId === accountId);
  }

  async upsertCardBenefit(accountId: string, benefit: CardBenefitInput): Promise<void> {
    if (benefit.id) {
      const index = this.cardBenefits.findIndex(b => b.id === benefit.id);
      if (index >= 0) {
        this.cardBenefits[index] = { ...this.cardBenefits[index], ...benefit } as CardBenefit;
      }
    } else {
      const newBenefit: CardBenefit = {
        ...benefit,
        id: crypto.randomUUID(),
        accountId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as CardBenefit;
      this.cardBenefits.push(newBenefit);
    }
  }

  async deleteCardBenefit(benefitId: string): Promise<void> {
    this.cardBenefits = this.cardBenefits.filter(b => b.id !== benefitId);
  }

  async listCategoryBonuses(accountId: string): Promise<CardCategoryBonus[]> {
    return this.categoryBonuses.filter(b => b.accountId === accountId);
  }

  async upsertCategoryBonus(accountId: string, bonus: CardCategoryBonusInput): Promise<void> {
    if (bonus.id) {
      const index = this.categoryBonuses.findIndex(b => b.id === bonus.id);
      if (index >= 0) {
        this.categoryBonuses[index] = { ...this.categoryBonuses[index], ...bonus } as CardCategoryBonus;
      }
    } else {
      const newBonus: CardCategoryBonus = {
        ...bonus,
        id: crypto.randomUUID(),
        accountId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as CardCategoryBonus;
      this.categoryBonuses.push(newBonus);
    }
  }

  async listWelcomeBonuses(accountId: string): Promise<WelcomeBonus[]> {
    return this.welcomeBonuses.filter(b => b.accountId === accountId);
  }

  async upsertWelcomeBonus(accountId: string, bonus: WelcomeBonusInput): Promise<void> {
    if (bonus.id) {
      const index = this.welcomeBonuses.findIndex(b => b.id === bonus.id);
      if (index >= 0) {
        this.welcomeBonuses[index] = { ...this.welcomeBonuses[index], ...bonus } as WelcomeBonus;
      }
    } else {
      const newBonus: WelcomeBonus = {
        ...bonus,
        id: crypto.randomUUID(),
        accountId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as WelcomeBonus;
      this.welcomeBonuses.push(newBonus);
    }
  }

  async listCardOffers(accountId: string): Promise<CardOffer[]> {
    return this.cardOffers.filter(o => o.accountId === accountId);
  }

  async upsertCardOffer(accountId: string, offer: CardOfferInput): Promise<void> {
    if (offer.id) {
      const index = this.cardOffers.findIndex(o => o.id === offer.id);
      if (index >= 0) {
        this.cardOffers[index] = { ...this.cardOffers[index], ...offer } as CardOffer;
      }
    } else {
      const newOffer: CardOffer = {
        ...offer,
        id: crypto.randomUUID(),
        accountId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as CardOffer;
      this.cardOffers.push(newOffer);
    }
  }

  async listLoans(): Promise<Loan[]> {
    return this.loans;
  }

  async upsertLoan(loan: LoanInput): Promise<void> {
    if (loan.id) {
      const index = this.loans.findIndex(l => l.id === loan.id);
      if (index >= 0) {
        this.loans[index] = { ...this.loans[index], ...loan } as Loan;
      }
    } else {
      const newLoan: Loan = {
        ...loan,
        id: crypto.randomUUID(),
        userId: 'test-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Loan;
      this.loans.push(newLoan);
    }
  }

  async deleteLoan(loanId: string): Promise<void> {
    this.loans = this.loans.filter(l => l.id !== loanId);
  }

  async listLoanPayments(loanId: string): Promise<LoanPayment[]> {
    return this.loanPayments.filter(p => p.loanId === loanId);
  }

  async upsertLoanPayment(loanId: string, payment: LoanPaymentInput): Promise<void> {
    if (payment.id) {
      const index = this.loanPayments.findIndex(p => p.id === payment.id);
      if (index >= 0) {
        this.loanPayments[index] = { ...this.loanPayments[index], ...payment } as LoanPayment;
      }
    } else {
      const newPayment: LoanPayment = {
        ...payment,
        id: crypto.randomUUID(),
        loanId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as LoanPayment;
      this.loanPayments.push(newPayment);
    }
  }

  async deleteLoanPayment(paymentId: string): Promise<void> {
    this.loanPayments = this.loanPayments.filter(p => p.id !== paymentId);
  }

  async listInsurancePolicies(): Promise<InsurancePolicy[]> {
    return this.insurancePolicies;
  }

  async upsertInsurancePolicy(policy: InsurancePolicyInput): Promise<void> {
    if (policy.id) {
      const index = this.insurancePolicies.findIndex(p => p.id === policy.id);
      if (index >= 0) {
        this.insurancePolicies[index] = { ...this.insurancePolicies[index], ...policy } as InsurancePolicy;
      }
    } else {
      const newPolicy: InsurancePolicy = {
        ...policy,
        id: crypto.randomUUID(),
        userId: 'test-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as InsurancePolicy;
      this.insurancePolicies.push(newPolicy);
    }
  }

  async deleteInsurancePolicy(policyId: string): Promise<void> {
    this.insurancePolicies = this.insurancePolicies.filter(p => p.id !== policyId);
  }

  async listRetirementAccounts(): Promise<RetirementAccountWithStats[]> {
    return this.retirementAccounts;
  }

  async getRetirementAccount(accountId: string): Promise<RetirementAccountWithStats | null> {
    return this.retirementAccounts.find(a => a.id === accountId) || null;
  }

  async upsertRetirementAccountMetadata(metadata: RetirementAccountMetadataInput): Promise<void> {
    // Mock implementation
  }

  async deleteRetirementAccountMetadata(accountId: string): Promise<void> {
    // Mock implementation
  }

  async listRetirementContributions(retirementAccountId: string): Promise<RetirementContribution[]> {
    return this.retirementContributions.filter(c => c.retirementAccountId === retirementAccountId);
  }

  async addRetirementContribution(contribution: RetirementContributionInput): Promise<void> {
    const newContribution: RetirementContribution = {
      ...contribution,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as RetirementContribution;
    this.retirementContributions.push(newContribution);
  }

  async deleteRetirementContribution(contributionId: string): Promise<void> {
    this.retirementContributions = this.retirementContributions.filter(c => c.id !== contributionId);
  }

  async calculateContributionRoom(retirementAccountId: string, annualIncome: number): Promise<ContributionRoom> {
    return {
      year: new Date().getFullYear(),
      limit: 30000,
      contributed: 0,
      remaining: 30000,
      carryForward: 0,
    };
  }

  async listRetirementPerformance(retirementAccountId: string): Promise<RetirementPerformance[]> {
    return this.retirementPerformance.filter(p => p.retirementAccountId === retirementAccountId);
  }

  async recordRetirementPerformance(performance: RetirementPerformanceInput): Promise<void> {
    const newPerformance: RetirementPerformance = {
      ...performance,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as RetirementPerformance;
    this.retirementPerformance.push(newPerformance);
  }

  async calculateVestedBalance(retirementAccountId: string, employmentYears: number): Promise<number> {
    return 0;
  }
}
