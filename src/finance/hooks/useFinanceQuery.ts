/* eslint-disable max-lines */
import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
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

export function useInstitutionsQuery(): UseQueryResult<Institution[], Error> {
  return useQuery<Institution[], Error>({
    queryKey: financeKeys.institutions(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listInstitutions();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes (institutions don't change often)
  });
}

// ==================== Accounts ====================

export function useAccountsQuery(): UseQueryResult<Account[], Error> {
  return useQuery<Account[], Error>({
    queryKey: financeKeys.accounts(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listAccounts();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateAccountMutation(): UseMutationResult<void, Error, { accountId: string; updates: Partial<Account> }, { previousAccounts: Account[] | undefined }> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { accountId: string; updates: Partial<Account> }, { previousAccounts: Account[] | undefined }>({
    mutationFn: async ({ accountId, updates }: { accountId: string; updates: Partial<Account> }) => {
      logger.debug('Updating account', { accountId, updates });
      const api = await getFinanceAPI();
      await api.updateAccount(accountId, updates);
    },
    onMutate: async ({ accountId, updates }) => {
      logger.debug('Optimistic update: account', { accountId, updates });
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
      logger.error('Failed to update account', { error: err.message, accountId });
      if (context?.previousAccounts) {
        queryClient.setQueryData(financeKeys.accounts(), context.previousAccounts);
      }
    },
    onSuccess: (_, { accountId }) => {
      logger.info('Account updated successfully', { id: accountId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.accounts() });
    },
  });
}

// ==================== Transactions ====================

export function useTransactionsQuery(params?: TxnQuery, options?: Omit<UseQueryOptions<Transaction[], Error>, 'queryKey' | 'queryFn'>): UseQueryResult<Transaction[], Error> {
  return useQuery<Transaction[], Error>({
    queryKey: financeKeys.transactions(params),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listTransactions(params ?? { limit: 500 });
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
}

export function useUpsertTransactionMutation(): UseMutationResult<void, Error, TransactionInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, TransactionInput>({
    mutationFn: async (transaction: TransactionInput) => {
      logger.debug('Upserting transaction', { id: transaction.id, amount: transaction.amount });
      const api = await getFinanceAPI();
      await api.upsertTransaction(transaction);
    },
    onSuccess: (_, transaction) => {
      logger.info('Transaction upserted successfully', { id: transaction.id });
      // Invalidate all transaction queries since we don't know which params were used
      void queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (error: Error, transaction) => {
      logger.error('Failed to upsert transaction', { error: error.message, id: transaction.id });
    },
  });
}

export function useDeleteTransactionMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      logger.debug('Deleting transaction', { id });
      const api = await getFinanceAPI();
      await api.deleteTransaction(id);
    },
    onSuccess: (_, id) => {
      logger.info('Transaction deleted successfully', { id });
      void queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (error: Error, id) => {
      logger.error('Failed to delete transaction', { error: error.message, id });
    },
  });
}

// ==================== Budgets ====================

export function useBudgetsQuery(month: string): UseQueryResult<Budget[], Error> {
  return useQuery<Budget[], Error>({
    queryKey: financeKeys.budgets(month),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listBudgets(month);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpsertBudgetMutation(): UseMutationResult<void, Error, { categoryId: string; month: string; limit: number }, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { categoryId: string; month: string; limit: number }>({
    mutationFn: async (budget: { categoryId: string; month: string; limit: number }) => {
      logger.debug('Upserting budget', { categoryId: budget.categoryId, month: budget.month, limit: budget.limit });
      const api = await getFinanceAPI();
      await api.upsertBudget(budget);
    },
    onSuccess: (_, variables) => {
      logger.info('Budget upserted successfully', { categoryId: variables.categoryId, month: variables.month });
      void queryClient.invalidateQueries({ queryKey: financeKeys.budgets(variables.month) });
    },
    onError: (error: Error, budget) => {
      logger.error('Failed to upsert budget', { error: error.message, categoryId: budget.categoryId });
    },
  });
}

export function useDeleteBudgetMutation(): UseMutationResult<void, Error, { categoryId: string; month: string }, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { categoryId: string; month: string }>({
    mutationFn: async ({ categoryId, month }: { categoryId: string; month: string }) => {
      logger.debug('Deleting budget', { categoryId, month });
      const api = await getFinanceAPI();
      await api.deleteBudget(categoryId, month);
    },
    onSuccess: (_, variables) => {
      logger.info('Budget deleted successfully', { categoryId: variables.categoryId, month: variables.month });
      void queryClient.invalidateQueries({ queryKey: financeKeys.budgets(variables.month) });
    },
    onError: (error: Error, { categoryId, month }) => {
      logger.error('Failed to delete budget', { error: error.message, categoryId, month });
    },
  });
}

// ==================== Budget Templates ====================

export function useBudgetTemplatesQuery(): UseQueryResult<BudgetTemplate[], Error> {
  return useQuery<BudgetTemplate[], Error>({
    queryKey: financeKeys.budgetTemplates(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listBudgetTemplates();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useUpsertBudgetTemplateMutation(): UseMutationResult<void, Error, BudgetTemplateInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, BudgetTemplateInput>({
    mutationFn: async (template: BudgetTemplateInput) => {
      logger.debug('Upserting budget template', { categoryId: template.categoryId });
      const api = await getFinanceAPI();
      await api.upsertBudgetTemplate(template);
    },
    onSuccess: (_, template) => {
      logger.info('Budget template upserted successfully', { categoryId: template.categoryId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.budgetTemplates() });
    },
    onError: (error: Error, template) => {
      logger.error('Failed to upsert budget template', { error: error.message, categoryId: template.categoryId });
    },
  });
}

export function useDeleteBudgetTemplateMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (categoryId: string) => {
      logger.debug('Deleting budget template', { categoryId });
      const api = await getFinanceAPI();
      await api.deleteBudgetTemplate(categoryId);
    },
    onSuccess: (_, categoryId) => {
      logger.info('Budget template deleted successfully', { categoryId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.budgetTemplates() });
    },
    onError: (error: Error, categoryId) => {
      logger.error('Failed to delete budget template', { error: error.message, categoryId });
    },
  });
}

export function useInitializeBudgetsMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (month: string) => {
      logger.debug('Initializing budgets from templates', { month });
      const api = await getFinanceAPI();
      return api.initializeBudgetsFromTemplates(month);
    },
    onSuccess: (_, month) => {
      logger.info('Budgets initialized successfully', { month });
      void queryClient.invalidateQueries({ queryKey: financeKeys.budgets(month) });
    },
    onError: (error: Error, month) => {
      logger.error('Failed to initialize budgets', { error: error.message, month });
    },
  });
}

// ==================== Categories ====================

export function useCategoriesQuery(): UseQueryResult<Category[], Error> {
  return useQuery<Category[], Error>({
    queryKey: financeKeys.categories(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listCategories();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes (categories rarely change)
  });
}

// ==================== Net Worth ====================

export function useNetWorthQuery(): UseQueryResult<NetPoint[], Error> {
  return useQuery<NetPoint[], Error>({
    queryKey: financeKeys.netWorth(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listNetWorth();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ==================== Goals ====================

export function useGoalsQuery(): UseQueryResult<Goal[], Error> {
  return useQuery<Goal[], Error>({
    queryKey: financeKeys.goals(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listGoals();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpsertGoalMutation(): UseMutationResult<void, Error, GoalInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, GoalInput>({
    mutationFn: async (goal: GoalInput) => {
      logger.debug('Upserting goal', { id: goal.id, name: goal.name });
      const api = await getFinanceAPI();
      await api.upsertGoal(goal);
    },
    onSuccess: (_, goal) => {
      logger.info('Goal upserted successfully', { id: goal.id, name: goal.name });
      void queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
    },
    onError: (error: Error, goal) => {
      logger.error('Failed to upsert goal', { error: error.message, id: goal.id });
    },
  });
}

export function useDeleteGoalMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (goalId: string) => {
      logger.debug('Deleting goal', { goalId });
      const api = await getFinanceAPI();
      await api.deleteGoal(goalId);
    },
    onSuccess: (_, goalId) => {
      logger.info('Goal deleted successfully', { id: goalId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
    },
    onError: (error: Error, goalId) => {
      logger.error('Failed to delete goal', { error: error.message, goalId });
    },
  });
}

export function useGoalProgressQuery(goalId: string | null): UseQueryResult<GoalProgressPoint[], Error> {
  return useQuery<GoalProgressPoint[], Error>({
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

export function useSyncGoalMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (goalId: string) => {
      logger.debug('Syncing goal from account', { goalId });
      const api = await getFinanceAPI();
      await api.syncGoalFromAccount(goalId);
    },
    onSuccess: (_, goalId) => {
      logger.info('Goal synced successfully', { goalId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.goalProgress(goalId) });
    },
    onError: (error: Error, goalId) => {
      logger.error('Failed to sync goal', { error: error.message, goalId });
    },
  });
}

// ==================== Credit Card Benefits ====================

export function useCardBenefitsQuery(accountId: string | null): UseQueryResult<CardBenefit[], Error> {
  return useQuery<CardBenefit[], Error>({
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

export function useUpsertCardBenefitMutation(): UseMutationResult<void, Error, { accountId: string; benefit: CardBenefitInput }, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { accountId: string; benefit: CardBenefitInput }>({
    mutationFn: async ({ accountId, benefit }: { accountId: string; benefit: CardBenefitInput }) => {
      logger.debug('Upserting card benefit', { accountId, benefitName: benefit.name });
      const api = await getFinanceAPI();
      await api.upsertCardBenefit(accountId, benefit);
    },
    onSuccess: (_, { accountId, benefit }) => {
      logger.info('Card benefit upserted successfully', { accountId, benefitName: benefit.name });
      void queryClient.invalidateQueries({ queryKey: financeKeys.cardBenefits(accountId) });
    },
    onError: (error: Error, { accountId }) => {
      logger.error('Failed to upsert card benefit', { error: error.message, accountId });
    },
  });
}

export function useDeleteCardBenefitMutation(): UseMutationResult<void, Error, { benefitId: string; accountId: string }, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { benefitId: string; accountId: string }>({
    mutationFn: async ({ benefitId, accountId }: { benefitId: string; accountId: string }) => {
      logger.debug('Deleting card benefit', { benefitId, accountId });
      const api = await getFinanceAPI();
      await api.deleteCardBenefit(benefitId);
    },
    onSuccess: (_, { benefitId, accountId }) => {
      logger.info('Card benefit deleted successfully', { benefitId, accountId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.cardBenefits(accountId) });
    },
    onError: (error: Error, { benefitId, accountId }) => {
      logger.error('Failed to delete card benefit', { error: error.message, benefitId, accountId });
    },
  });
}

// ==================== Category Bonuses ====================

export function useCategoryBonusesQuery(accountId: string | null): UseQueryResult<CardCategoryBonus[], Error> {
  return useQuery<CardCategoryBonus[], Error>({
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

export function useUpsertCategoryBonusMutation(): UseMutationResult<void, Error, { accountId: string; bonus: CardCategoryBonusInput }, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { accountId: string; bonus: CardCategoryBonusInput }>({
    mutationFn: async ({ accountId, bonus }: { accountId: string; bonus: CardCategoryBonusInput }) => {
      logger.debug('Upserting category bonus', { accountId, category: bonus.category });
      const api = await getFinanceAPI();
      await api.upsertCategoryBonus(accountId, bonus);
    },
    onSuccess: (_, { accountId, bonus }) => {
      logger.info('Category bonus upserted successfully', { accountId, category: bonus.category });
      void queryClient.invalidateQueries({ queryKey: financeKeys.categoryBonuses(accountId) });
    },
    onError: (error: Error, { accountId }) => {
      logger.error('Failed to upsert category bonus', { error: error.message, accountId });
    },
  });
}

// ==================== Welcome Bonuses ====================

export function useWelcomeBonusesQuery(accountId: string | null): UseQueryResult<WelcomeBonus[], Error> {
  return useQuery<WelcomeBonus[], Error>({
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

export function useUpsertWelcomeBonusMutation(): UseMutationResult<void, Error, { accountId: string; bonus: WelcomeBonusInput }, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { accountId: string; bonus: WelcomeBonusInput }>({
    mutationFn: async ({ accountId, bonus }: { accountId: string; bonus: WelcomeBonusInput }) => {
      logger.debug('Upserting welcome bonus', { accountId });
      const api = await getFinanceAPI();
      await api.upsertWelcomeBonus(accountId, bonus);
    },
    onSuccess: (_, { accountId }) => {
      logger.info('Welcome bonus upserted successfully', { accountId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.welcomeBonuses(accountId) });
    },
    onError: (error: Error, { accountId }) => {
      logger.error('Failed to upsert welcome bonus', { error: error.message, accountId });
    },
  });
}

// ==================== Card Offers ====================

export function useCardOffersQuery(accountId: string | null): UseQueryResult<CardOffer[], Error> {
  return useQuery<CardOffer[], Error>({
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

export function useUpsertCardOfferMutation(): UseMutationResult<void, Error, { accountId: string; offer: CardOfferInput }, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { accountId: string; offer: CardOfferInput }>({
    mutationFn: async ({ accountId, offer }: { accountId: string; offer: CardOfferInput }) => {
      logger.debug('Upserting card offer', { accountId, merchant: offer.merchant });
      const api = await getFinanceAPI();
      await api.upsertCardOffer(accountId, offer);
    },
    onSuccess: (_, { accountId, offer }) => {
      logger.info('Card offer upserted successfully', { accountId, merchant: offer.merchant });
      void queryClient.invalidateQueries({ queryKey: financeKeys.cardOffers(accountId) });
    },
    onError: (error: Error, { accountId }) => {
      logger.error('Failed to upsert card offer', { error: error.message, accountId });
    },
  });
}
