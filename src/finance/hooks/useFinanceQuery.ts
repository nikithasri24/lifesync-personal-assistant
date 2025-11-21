import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { getFinanceAPI } from '../data';
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
import { logger } from '@/services/logger';

// ==================== Query Keys ====================

export const financeKeys = {
  all: ['finance'] as const,
  institutions: () => [...financeKeys.all, 'institutions'] as const,
  accounts: () => [...financeKeys.all, 'accounts'] as const,
  account: (id: string) => [...financeKeys.all, 'account', id] as const,
  transactions: (params?: TxnQuery) => [...financeKeys.all, 'transactions', params] as const,
  budgets: (month: string) => [...financeKeys.all, 'budgets', month] as const,
  budgetTemplates: () => [...financeKeys.all, 'budgetTemplates'] as const,
  categories: () => [...financeKeys.all, 'categories'] as const,
  netWorth: () => [...financeKeys.all, 'netWorth'] as const,
  goals: () => [...financeKeys.all, 'goals'] as const,
  goal: (id: string) => [...financeKeys.all, 'goal', id] as const,
  goalProgress: (goalId: string) => [...financeKeys.all, 'goalProgress', goalId] as const,
  cardBenefits: (accountId: string) => [...financeKeys.all, 'cardBenefits', accountId] as const,
  categoryBonuses: (accountId: string) => [...financeKeys.all, 'categoryBonuses', accountId] as const,
  welcomeBonuses: (accountId: string) => [...financeKeys.all, 'welcomeBonuses', accountId] as const,
  cardOffers: (accountId: string) => [...financeKeys.all, 'cardOffers', accountId] as const,
};

// ==================== Institutions ====================

export function useInstitutionsQuery() {
  return useQuery({
    queryKey: financeKeys.institutions(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listInstitutions();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes (institutions don't change often)
  });
}

// ==================== Accounts ====================

export function useAccountsQuery() {
  return useQuery({
    queryKey: financeKeys.accounts(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listAccounts();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, updates }: { accountId: string; updates: Partial<Account> }) => {
      logger.debug('Finance', 'Updating account', { accountId, updates });
      const api = await getFinanceAPI();
      await api.updateAccount(accountId, updates);
    },
    onMutate: async ({ accountId, updates }) => {
      logger.debug('Finance', 'Optimistic update: account', { accountId, updates });
      await queryClient.cancelQueries({ queryKey: financeKeys.accounts() });
      const previousAccounts = queryClient.getQueryData<Account[]>(financeKeys.accounts());

      // Optimistic update
      queryClient.setQueryData<Account[]>(financeKeys.accounts(), (old) => {
        if (!old) return old;
        return old.map((account) =>
          account.id === accountId ? { ...account, ...updates } : account
        );
      });

      return { previousAccounts };
    },
    onError: (err: Error, { accountId }, context) => {
      logger.error('Finance', 'Failed to update account', { error: err.message, accountId });
      if (context?.previousAccounts) {
        queryClient.setQueryData(financeKeys.accounts(), context.previousAccounts);
      }
    },
    onSuccess: (_, { accountId }) => {
      logger.info('Finance', 'Account updated successfully', { id: accountId });
      queryClient.invalidateQueries({ queryKey: financeKeys.accounts() });
    },
  });
}

// ==================== Transactions ====================

export function useTransactionsQuery(params?: TxnQuery, options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: financeKeys.transactions(params),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listTransactions(params || { limit: 500 });
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
}

export function useUpsertTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: TransactionInput) => {
      logger.debug('Finance', 'Upserting transaction', { id: transaction.id, amount: transaction.amount });
      const api = await getFinanceAPI();
      await api.upsertTransaction(transaction);
    },
    onSuccess: (_, transaction) => {
      logger.info('Finance', 'Transaction upserted successfully', { id: transaction.id });
      // Invalidate all transaction queries since we don't know which params were used
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (error: Error, transaction) => {
      logger.error('Finance', 'Failed to upsert transaction', { error: error.message, id: transaction.id });
    },
  });
}

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('Finance', 'Deleting transaction', { id });
      const api = await getFinanceAPI();
      await api.deleteTransaction(id);
    },
    onSuccess: (_, id) => {
      logger.info('Finance', 'Transaction deleted successfully', { id });
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (error: Error, id) => {
      logger.error('Finance', 'Failed to delete transaction', { error: error.message, id });
    },
  });
}

// ==================== Budgets ====================

export function useBudgetsQuery(month: string) {
  return useQuery({
    queryKey: financeKeys.budgets(month),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listBudgets(month);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpsertBudgetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budget: { categoryId: string; month: string; limit: number }) => {
      logger.debug('Finance', 'Upserting budget', { categoryId: budget.categoryId, month: budget.month, limit: budget.limit });
      const api = await getFinanceAPI();
      await api.upsertBudget(budget);
    },
    onSuccess: (_, variables) => {
      logger.info('Finance', 'Budget upserted successfully', { categoryId: variables.categoryId, month: variables.month });
      queryClient.invalidateQueries({ queryKey: financeKeys.budgets(variables.month) });
    },
    onError: (error: Error, budget) => {
      logger.error('Finance', 'Failed to upsert budget', { error: error.message, categoryId: budget.categoryId });
    },
  });
}

export function useDeleteBudgetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, month }: { categoryId: string; month: string }) => {
      logger.debug('Finance', 'Deleting budget', { categoryId, month });
      const api = await getFinanceAPI();
      await api.deleteBudget(categoryId, month);
    },
    onSuccess: (_, variables) => {
      logger.info('Finance', 'Budget deleted successfully', { categoryId: variables.categoryId, month: variables.month });
      queryClient.invalidateQueries({ queryKey: financeKeys.budgets(variables.month) });
    },
    onError: (error: Error, { categoryId, month }) => {
      logger.error('Finance', 'Failed to delete budget', { error: error.message, categoryId, month });
    },
  });
}

// ==================== Budget Templates ====================

export function useBudgetTemplatesQuery() {
  return useQuery({
    queryKey: financeKeys.budgetTemplates(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listBudgetTemplates();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useUpsertBudgetTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: BudgetTemplateInput) => {
      logger.debug('Finance', 'Upserting budget template', { categoryId: template.categoryId });
      const api = await getFinanceAPI();
      await api.upsertBudgetTemplate(template);
    },
    onSuccess: (_, template) => {
      logger.info('Finance', 'Budget template upserted successfully', { categoryId: template.categoryId });
      queryClient.invalidateQueries({ queryKey: financeKeys.budgetTemplates() });
    },
    onError: (error: Error, template) => {
      logger.error('Finance', 'Failed to upsert budget template', { error: error.message, categoryId: template.categoryId });
    },
  });
}

export function useDeleteBudgetTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      logger.debug('Finance', 'Deleting budget template', { categoryId });
      const api = await getFinanceAPI();
      await api.deleteBudgetTemplate(categoryId);
    },
    onSuccess: (_, categoryId) => {
      logger.info('Finance', 'Budget template deleted successfully', { categoryId });
      queryClient.invalidateQueries({ queryKey: financeKeys.budgetTemplates() });
    },
    onError: (error: Error, categoryId) => {
      logger.error('Finance', 'Failed to delete budget template', { error: error.message, categoryId });
    },
  });
}

export function useInitializeBudgetsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (month: string) => {
      logger.debug('Finance', 'Initializing budgets from templates', { month });
      const api = await getFinanceAPI();
      return api.initializeBudgetsFromTemplates(month);
    },
    onSuccess: (_, month) => {
      logger.info('Finance', 'Budgets initialized successfully', { month });
      queryClient.invalidateQueries({ queryKey: financeKeys.budgets(month) });
    },
    onError: (error: Error, month) => {
      logger.error('Finance', 'Failed to initialize budgets', { error: error.message, month });
    },
  });
}

// ==================== Categories ====================

export function useCategoriesQuery() {
  return useQuery({
    queryKey: financeKeys.categories(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listCategories();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes (categories rarely change)
  });
}

// ==================== Net Worth ====================

export function useNetWorthQuery() {
  return useQuery({
    queryKey: financeKeys.netWorth(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listNetWorth();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ==================== Goals ====================

export function useGoalsQuery() {
  return useQuery({
    queryKey: financeKeys.goals(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listGoals();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpsertGoalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: GoalInput) => {
      logger.debug('Finance', 'Upserting goal', { id: goal.id, name: goal.name });
      const api = await getFinanceAPI();
      await api.upsertGoal(goal);
    },
    onSuccess: (_, goal) => {
      logger.info('Finance', 'Goal upserted successfully', { id: goal.id, name: goal.name });
      queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
    },
    onError: (error: Error, goal) => {
      logger.error('Finance', 'Failed to upsert goal', { error: error.message, id: goal.id });
    },
  });
}

export function useDeleteGoalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      logger.debug('Finance', 'Deleting goal', { goalId });
      const api = await getFinanceAPI();
      await api.deleteGoal(goalId);
    },
    onSuccess: (_, goalId) => {
      logger.info('Finance', 'Goal deleted successfully', { id: goalId });
      queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
    },
    onError: (error: Error, goalId) => {
      logger.error('Finance', 'Failed to delete goal', { error: error.message, goalId });
    },
  });
}

export function useGoalProgressQuery(goalId: string | null) {
  return useQuery({
    queryKey: goalId ? financeKeys.goalProgress(goalId) : ['goalProgress-null'],
    queryFn: async () => {
      if (!goalId) throw new Error('Goal ID is required');
      const api = await getFinanceAPI();
      return api.getGoalProgressHistory(goalId);
    },
    enabled: !!goalId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSyncGoalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      logger.debug('Finance', 'Syncing goal from account', { goalId });
      const api = await getFinanceAPI();
      await api.syncGoalFromAccount(goalId);
    },
    onSuccess: (_, goalId) => {
      logger.info('Finance', 'Goal synced successfully', { goalId });
      queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
      queryClient.invalidateQueries({ queryKey: financeKeys.goalProgress(goalId) });
    },
    onError: (error: Error, goalId) => {
      logger.error('Finance', 'Failed to sync goal', { error: error.message, goalId });
    },
  });
}

// ==================== Credit Card Benefits ====================

export function useCardBenefitsQuery(accountId: string | null) {
  return useQuery({
    queryKey: accountId ? financeKeys.cardBenefits(accountId) : ['cardBenefits-null'],
    queryFn: async () => {
      if (!accountId) throw new Error('Account ID is required');
      const api = await getFinanceAPI();
      return api.listCardBenefits(accountId);
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useUpsertCardBenefitMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, benefit }: { accountId: string; benefit: CardBenefitInput }) => {
      logger.debug('Finance', 'Upserting card benefit', { accountId, benefitName: benefit.name });
      const api = await getFinanceAPI();
      await api.upsertCardBenefit(accountId, benefit);
    },
    onSuccess: (_, { accountId, benefit }) => {
      logger.info('Finance', 'Card benefit upserted successfully', { accountId, benefitName: benefit.name });
      queryClient.invalidateQueries({ queryKey: financeKeys.cardBenefits(accountId) });
    },
    onError: (error: Error, { accountId }) => {
      logger.error('Finance', 'Failed to upsert card benefit', { error: error.message, accountId });
    },
  });
}

export function useDeleteCardBenefitMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ benefitId, accountId }: { benefitId: string; accountId: string }) => {
      logger.debug('Finance', 'Deleting card benefit', { benefitId, accountId });
      const api = await getFinanceAPI();
      await api.deleteCardBenefit(benefitId);
    },
    onSuccess: (_, { benefitId, accountId }) => {
      logger.info('Finance', 'Card benefit deleted successfully', { benefitId, accountId });
      queryClient.invalidateQueries({ queryKey: financeKeys.cardBenefits(accountId) });
    },
    onError: (error: Error, { benefitId, accountId }) => {
      logger.error('Finance', 'Failed to delete card benefit', { error: error.message, benefitId, accountId });
    },
  });
}

// ==================== Category Bonuses ====================

export function useCategoryBonusesQuery(accountId: string | null) {
  return useQuery({
    queryKey: accountId ? financeKeys.categoryBonuses(accountId) : ['categoryBonuses-null'],
    queryFn: async () => {
      if (!accountId) throw new Error('Account ID is required');
      const api = await getFinanceAPI();
      return api.listCategoryBonuses(accountId);
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useUpsertCategoryBonusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, bonus }: { accountId: string; bonus: CardCategoryBonusInput }) => {
      logger.debug('Finance', 'Upserting category bonus', { accountId, category: bonus.categoryId });
      const api = await getFinanceAPI();
      await api.upsertCategoryBonus(accountId, bonus);
    },
    onSuccess: (_, { accountId, bonus }) => {
      logger.info('Finance', 'Category bonus upserted successfully', { accountId, category: bonus.categoryId });
      queryClient.invalidateQueries({ queryKey: financeKeys.categoryBonuses(accountId) });
    },
    onError: (error: Error, { accountId }) => {
      logger.error('Finance', 'Failed to upsert category bonus', { error: error.message, accountId });
    },
  });
}

// ==================== Welcome Bonuses ====================

export function useWelcomeBonusesQuery(accountId: string | null) {
  return useQuery({
    queryKey: accountId ? financeKeys.welcomeBonuses(accountId) : ['welcomeBonuses-null'],
    queryFn: async () => {
      if (!accountId) throw new Error('Account ID is required');
      const api = await getFinanceAPI();
      return api.listWelcomeBonuses(accountId);
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useUpsertWelcomeBonusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, bonus }: { accountId: string; bonus: WelcomeBonusInput }) => {
      logger.debug('Finance', 'Upserting welcome bonus', { accountId });
      const api = await getFinanceAPI();
      await api.upsertWelcomeBonus(accountId, bonus);
    },
    onSuccess: (_, { accountId }) => {
      logger.info('Finance', 'Welcome bonus upserted successfully', { accountId });
      queryClient.invalidateQueries({ queryKey: financeKeys.welcomeBonuses(accountId) });
    },
    onError: (error: Error, { accountId }) => {
      logger.error('Finance', 'Failed to upsert welcome bonus', { error: error.message, accountId });
    },
  });
}

// ==================== Card Offers ====================

export function useCardOffersQuery(accountId: string | null) {
  return useQuery({
    queryKey: accountId ? financeKeys.cardOffers(accountId) : ['cardOffers-null'],
    queryFn: async () => {
      if (!accountId) throw new Error('Account ID is required');
      const api = await getFinanceAPI();
      return api.listCardOffers(accountId);
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useUpsertCardOfferMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, offer }: { accountId: string; offer: CardOfferInput }) => {
      logger.debug('Finance', 'Upserting card offer', { accountId, merchant: offer.merchantName });
      const api = await getFinanceAPI();
      await api.upsertCardOffer(accountId, offer);
    },
    onSuccess: (_, { accountId, offer }) => {
      logger.info('Finance', 'Card offer upserted successfully', { accountId, merchant: offer.merchantName });
      queryClient.invalidateQueries({ queryKey: financeKeys.cardOffers(accountId) });
    },
    onError: (error: Error, { accountId }) => {
      logger.error('Finance', 'Failed to upsert card offer', { error: error.message, accountId });
    },
  });
}
