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
} from '../types';

export interface FinanceAPI {
  listInstitutions(): Promise<Institution[]>;
  listAccounts(): Promise<Account[]>;
  updateAccount(accountId: string, updates: Partial<Account>): Promise<void>;
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
}
