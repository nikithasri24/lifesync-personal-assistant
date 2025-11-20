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
      const api = await getFinanceAPI();
      await api.updateAccount(accountId, updates);
    },
    onMutate: async ({ accountId, updates }) => {
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
    onError: (err, variables, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(financeKeys.accounts(), context.previousAccounts);
      }
    },
    onSuccess: () => {
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
      const api = await getFinanceAPI();
      await api.upsertTransaction(transaction);
    },
    onSuccess: () => {
      // Invalidate all transaction queries since we don't know which params were used
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
  });
}

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const api = await getFinanceAPI();
      await api.deleteTransaction(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
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
      const api = await getFinanceAPI();
      await api.upsertBudget(budget);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.budgets(variables.month) });
    },
  });
}

export function useDeleteBudgetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, month }: { categoryId: string; month: string }) => {
      const api = await getFinanceAPI();
      await api.deleteBudget(categoryId, month);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.budgets(variables.month) });
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
      const api = await getFinanceAPI();
      await api.upsertBudgetTemplate(template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.budgetTemplates() });
    },
  });
}

export function useDeleteBudgetTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const api = await getFinanceAPI();
      await api.deleteBudgetTemplate(categoryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.budgetTemplates() });
    },
  });
}

export function useInitializeBudgetsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (month: string) => {
      const api = await getFinanceAPI();
      return api.initializeBudgetsFromTemplates(month);
    },
    onSuccess: (_, month) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.budgets(month) });
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
      const api = await getFinanceAPI();
      await api.upsertGoal(goal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
    },
  });
}

export function useDeleteGoalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      const api = await getFinanceAPI();
      await api.deleteGoal(goalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
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
      const api = await getFinanceAPI();
      await api.syncGoalFromAccount(goalId);
    },
    onSuccess: (_, goalId) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
      queryClient.invalidateQueries({ queryKey: financeKeys.goalProgress(goalId) });
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
      const api = await getFinanceAPI();
      await api.upsertCardBenefit(accountId, benefit);
    },
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.cardBenefits(accountId) });
    },
  });
}

export function useDeleteCardBenefitMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ benefitId, accountId }: { benefitId: string; accountId: string }) => {
      const api = await getFinanceAPI();
      await api.deleteCardBenefit(benefitId);
    },
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.cardBenefits(accountId) });
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
      const api = await getFinanceAPI();
      await api.upsertCategoryBonus(accountId, bonus);
    },
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.categoryBonuses(accountId) });
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
      const api = await getFinanceAPI();
      await api.upsertWelcomeBonus(accountId, bonus);
    },
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.welcomeBonuses(accountId) });
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
      const api = await getFinanceAPI();
      await api.upsertCardOffer(accountId, offer);
    },
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.cardOffers(accountId) });
    },
  });
}
