import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { getFinanceAPI } from '@/finance/data';
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
  Loan,
  LoanInput,
  LoanPayment,
  LoanPaymentInput,
  RecurringTransaction,
  RecurringTransactionInput,
  PendingTransaction,
  RetirementAccountWithStats,
  RetirementAccountMetadataInput,
} from '@/finance/types';
import { logger } from '@/services/logger';
import { getMergedConnectionId, type MergedConnectionResult } from '@/shared/api/SharedDataProvider';

// ==================== Merged Connection ====================

// Cache for merged connection to avoid repeated checks within same session
let cachedFinanceMergedConnection: MergedConnectionResult | null | undefined = undefined;

/**
 * Get the merged connection ID for finances if both users have enabled merged mode.
 * Results are cached for the session to avoid repeated database calls.
 */
export async function getFinancesMergedConnection(): Promise<MergedConnectionResult | null> {
  if (cachedFinanceMergedConnection !== undefined) {
    logger.debug('Hooks', 'Using cached finance merged connection', { connection: cachedFinanceMergedConnection });
    return cachedFinanceMergedConnection;
  }
  cachedFinanceMergedConnection = await getMergedConnectionId('finances');
  logger.debug('Hooks', 'Fetched finance merged connection', { connection: cachedFinanceMergedConnection });
  return cachedFinanceMergedConnection;
}

/**
 * Clear the cached merged connection (call when permissions change)
 */
export function clearFinanceMergedConnectionCache(): void {
  cachedFinanceMergedConnection = undefined;
}

// ==================== Query Keys ====================

export const financeKeys = {
  all: ['finance'] as const,
  mergedConnection: () => [...financeKeys.all, 'mergedConnection'] as const,
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
  loans: () => [...financeKeys.all, 'loans'] as const,
  loan: (id: string) => [...financeKeys.all, 'loan', id] as const,
  loanPayments: (loanId: string) => [...financeKeys.all, 'loanPayments', loanId] as const,
  recurringTransactions: () => [...financeKeys.all, 'recurringTransactions'] as const,
  pendingTransactions: () => [...financeKeys.all, 'pendingTransactions'] as const,
  retirementAccounts: () => [...financeKeys.all, 'retirementAccounts'] as const,
  retirementAccount: (id: string) => [...financeKeys.all, 'retirementAccount', id] as const,
};

// ==================== Merged Connection ====================

/**
 * Hook to get merged connection for finances module.
 * Returns partnerId and connectionId if both users have merged mode enabled.
 */
export function useFinanceMergedConnectionQuery(options?: { enabled?: boolean }): UseQueryResult<MergedConnectionResult | null, Error> {
  return useQuery<MergedConnectionResult | null, Error>({
    queryKey: financeKeys.mergedConnection(),
    queryFn: async () => {
      const result = await getFinancesMergedConnection();
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - merged connection doesn't change often
    enabled: options?.enabled ?? true,
  });
}

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
      void queryClient.invalidateQueries({ queryKey: financeKeys.accounts() });
    },
  });
}

export function useUpsertAccountMutation(): UseMutationResult<void, Error, { id?: string; name: string; type: string; balance: number; institutionId?: string }, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id?: string; name: string; type: string; balance: number; institutionId?: string }>({
    mutationFn: async (account) => {
      logger.debug('Finance', 'Upserting account', { account });
      const api = await getFinanceAPI();
      await api.upsertAccount(account);
    },
    onSuccess: (_, account) => {
      logger.info('Finance', 'Account upserted successfully', { name: account.name });
      void queryClient.invalidateQueries({ queryKey: financeKeys.accounts() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.netWorth() });
    },
    onError: (error: Error, account) => {
      logger.error('Finance', 'Failed to upsert account', { error: error.message, name: account.name });
    },
  });
}

export function useDeleteAccountMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (accountId: string) => {
      logger.debug('Finance', 'Deleting account', { accountId });
      const api = await getFinanceAPI();
      await api.deleteAccount(accountId);
    },
    onSuccess: (_, accountId) => {
      logger.info('Finance', 'Account deleted successfully', { accountId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.accounts() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.netWorth() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.transactions() });
    },
    onError: (error: Error, accountId) => {
      logger.error('Finance', 'Failed to delete account', { error: error.message, accountId });
    },
  });
}

// ==================== Transactions ====================

export function useTransactionsQuery(params?: TxnQuery, options?: Omit<UseQueryOptions<Transaction[], Error>, 'queryKey' | 'queryFn'>): UseQueryResult<Transaction[], Error> {
  return useQuery<Transaction[], Error>({
    queryKey: financeKeys.transactions(params),
    queryFn: async () => {
      const api = await getFinanceAPI();
      const result = await api.listTransactions(params ?? { limit: 500 });
      // Extract items from paginated response
      return result.items;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
}

export function useUpsertTransactionMutation(): UseMutationResult<void, Error, TransactionInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, TransactionInput>({
    mutationFn: async (transaction: TransactionInput) => {
      logger.debug('Finance', 'Upserting transaction', { id: transaction.id, amount: transaction.amount });
      const api = await getFinanceAPI();
      await api.upsertTransaction(transaction);
    },
    onSuccess: (_, transaction) => {
      logger.info('Finance', 'Transaction upserted successfully', { id: transaction.id });
      // Invalidate all transaction queries since we don't know which params were used
      void queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (error: Error, transaction) => {
      logger.error('Finance', 'Failed to upsert transaction', { error: error.message, id: transaction.id });
    },
  });
}

export function useDeleteTransactionMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      logger.debug('Finance', 'Deleting transaction', { id });
      const api = await getFinanceAPI();
      await api.deleteTransaction(id);
    },
    onSuccess: (_, id) => {
      logger.info('Finance', 'Transaction deleted successfully', { id });
      void queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (error: Error, id) => {
      logger.error('Finance', 'Failed to delete transaction', { error: error.message, id });
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
      logger.debug('Finance', 'Upserting budget', { categoryId: budget.categoryId, month: budget.month, limit: budget.limit });
      const api = await getFinanceAPI();
      await api.upsertBudget(budget);
    },
    onSuccess: (_, variables) => {
      logger.info('Finance', 'Budget upserted successfully', { categoryId: variables.categoryId, month: variables.month });
      void queryClient.invalidateQueries({ queryKey: financeKeys.budgets(variables.month) });
    },
    onError: (error: Error, budget) => {
      logger.error('Finance', 'Failed to upsert budget', { error: error.message, categoryId: budget.categoryId });
    },
  });
}

export function useDeleteBudgetMutation(): UseMutationResult<void, Error, { categoryId: string; month: string }, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { categoryId: string; month: string }>({
    mutationFn: async ({ categoryId, month }: { categoryId: string; month: string }) => {
      logger.debug('Finance', 'Deleting budget', { categoryId, month });
      const api = await getFinanceAPI();
      await api.deleteBudget(categoryId, month);
    },
    onSuccess: (_, variables) => {
      logger.info('Finance', 'Budget deleted successfully', { categoryId: variables.categoryId, month: variables.month });
      void queryClient.invalidateQueries({ queryKey: financeKeys.budgets(variables.month) });
    },
    onError: (error: Error, { categoryId, month }) => {
      logger.error('Finance', 'Failed to delete budget', { error: error.message, categoryId, month });
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
      logger.debug('Finance', 'Upserting budget template', { categoryId: template.categoryId });
      const api = await getFinanceAPI();
      await api.upsertBudgetTemplate(template);
    },
    onSuccess: (_, template) => {
      logger.info('Finance', 'Budget template upserted successfully', { categoryId: template.categoryId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.budgetTemplates() });
    },
    onError: (error: Error, template) => {
      logger.error('Finance', 'Failed to upsert budget template', { error: error.message, categoryId: template.categoryId });
    },
  });
}

export function useDeleteBudgetTemplateMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (categoryId: string) => {
      logger.debug('Finance', 'Deleting budget template', { categoryId });
      const api = await getFinanceAPI();
      await api.deleteBudgetTemplate(categoryId);
    },
    onSuccess: (_, categoryId) => {
      logger.info('Finance', 'Budget template deleted successfully', { categoryId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.budgetTemplates() });
    },
    onError: (error: Error, categoryId) => {
      logger.error('Finance', 'Failed to delete budget template', { error: error.message, categoryId });
    },
  });
}

export function useInitializeBudgetsMutation(): UseMutationResult<number, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<number, Error, string>({
    mutationFn: async (month: string) => {
      logger.debug('Finance', 'Initializing budgets from templates', { month });
      const api = await getFinanceAPI();
      return api.initializeBudgetsFromTemplates(month);
    },
    onSuccess: (_, month) => {
      logger.info('Finance', 'Budgets initialized successfully', { month });
      void queryClient.invalidateQueries({ queryKey: financeKeys.budgets(month) });
    },
    onError: (error: Error, month) => {
      logger.error('Finance', 'Failed to initialize budgets', { error: error.message, month });
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
      logger.debug('Finance', 'Upserting goal', { id: goal.id, name: goal.name });
      const api = await getFinanceAPI();
      await api.upsertGoal(goal);
    },
    onSuccess: (_, goal) => {
      logger.info('Finance', 'Goal upserted successfully', { id: goal.id, name: goal.name });
      void queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
    },
    onError: (error: Error, goal) => {
      logger.error('Finance', 'Failed to upsert goal', { error: error.message, id: goal.id });
    },
  });
}

export function useDeleteGoalMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (goalId: string) => {
      logger.debug('Finance', 'Deleting goal', { goalId });
      const api = await getFinanceAPI();
      await api.deleteGoal(goalId);
    },
    onSuccess: (_, goalId) => {
      logger.info('Finance', 'Goal deleted successfully', { id: goalId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
    },
    onError: (error: Error, goalId) => {
      logger.error('Finance', 'Failed to delete goal', { error: error.message, goalId });
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
      logger.debug('Finance', 'Syncing goal from account', { goalId });
      const api = await getFinanceAPI();
      await api.syncGoalFromAccount(goalId);
    },
    onSuccess: (_, goalId) => {
      logger.info('Finance', 'Goal synced successfully', { goalId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.goalProgress(goalId) });
    },
    onError: (error: Error, goalId) => {
      logger.error('Finance', 'Failed to sync goal', { error: error.message, goalId });
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
      logger.debug('Finance', 'Upserting card benefit', { accountId, benefitName: benefit.name });
      const api = await getFinanceAPI();
      await api.upsertCardBenefit(accountId, benefit);
    },
    onSuccess: (_, { accountId, benefit }) => {
      logger.info('Finance', 'Card benefit upserted successfully', { accountId, benefitName: benefit.name });
      void queryClient.invalidateQueries({ queryKey: financeKeys.cardBenefits(accountId) });
    },
    onError: (error: Error, { accountId }) => {
      logger.error('Finance', 'Failed to upsert card benefit', { error: error.message, accountId });
    },
  });
}

export function useDeleteCardBenefitMutation(): UseMutationResult<void, Error, { benefitId: string; accountId: string }, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { benefitId: string; accountId: string }>({
    mutationFn: async ({ benefitId, accountId }: { benefitId: string; accountId: string }) => {
      logger.debug('Finance', 'Deleting card benefit', { benefitId, accountId });
      const api = await getFinanceAPI();
      await api.deleteCardBenefit(benefitId);
    },
    onSuccess: (_, { benefitId, accountId }) => {
      logger.info('Finance', 'Card benefit deleted successfully', { benefitId, accountId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.cardBenefits(accountId) });
    },
    onError: (error: Error, { benefitId, accountId }) => {
      logger.error('Finance', 'Failed to delete card benefit', { error: error.message, benefitId, accountId });
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
      logger.debug('Finance', 'Upserting category bonus', { accountId, category: bonus.category });
      const api = await getFinanceAPI();
      await api.upsertCategoryBonus(accountId, bonus);
    },
    onSuccess: (_, { accountId, bonus }) => {
      logger.info('Finance', 'Category bonus upserted successfully', { accountId, category: bonus.category });
      void queryClient.invalidateQueries({ queryKey: financeKeys.categoryBonuses(accountId) });
    },
    onError: (error: Error, { accountId }) => {
      logger.error('Finance', 'Failed to upsert category bonus', { error: error.message, accountId });
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
      logger.debug('Finance', 'Upserting welcome bonus', { accountId });
      const api = await getFinanceAPI();
      await api.upsertWelcomeBonus(accountId, bonus);
    },
    onSuccess: (_, { accountId }) => {
      logger.info('Finance', 'Welcome bonus upserted successfully', { accountId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.welcomeBonuses(accountId) });
    },
    onError: (error: Error, { accountId }) => {
      logger.error('Finance', 'Failed to upsert welcome bonus', { error: error.message, accountId });
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
      logger.debug('Finance', 'Upserting card offer', { accountId, merchant: offer.merchant });
      const api = await getFinanceAPI();
      await api.upsertCardOffer(accountId, offer);
    },
    onSuccess: (_, { accountId, offer }) => {
      logger.info('Finance', 'Card offer upserted successfully', { accountId, merchant: offer.merchant });
      void queryClient.invalidateQueries({ queryKey: financeKeys.cardOffers(accountId) });
    },
    onError: (error: Error, { accountId }) => {
      logger.error('Finance', 'Failed to upsert card offer', { error: error.message, accountId });
    },
  });
}

// ==================== Loans ====================

export function useLoansQuery(): UseQueryResult<Loan[], Error> {
  return useQuery<Loan[], Error>({
    queryKey: financeKeys.loans(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listLoans();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpsertLoanMutation(): UseMutationResult<void, Error, LoanInput, { previousLoans: Loan[] | undefined }> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, LoanInput, { previousLoans: Loan[] | undefined }>({
    mutationFn: async (loan: LoanInput) => {
      logger.debug('Finance', 'Upserting loan', { loanName: loan.loanName });
      const api = await getFinanceAPI();
      await api.upsertLoan(loan);
    },
    onMutate: async (loan) => {
      logger.debug('Finance', 'Optimistic update: loan', { loanName: loan.loanName });
      await queryClient.cancelQueries({ queryKey: financeKeys.loans() });
      const previousLoans = queryClient.getQueryData<Loan[]>(financeKeys.loans());

      // Optimistic update
      if (loan.id) {
        queryClient.setQueryData<Loan[]>(financeKeys.loans(), (old) => {
          if (!old) return old;
          return old.map((l) => (l.id === loan.id ? { ...l, ...loan } : l));
        });
      } else {
        // For new loans, we can't optimistically add without an ID
        // Just skip optimistic update for creates
      }

      return { previousLoans };
    },
    onError: (err: Error, loan, context) => {
      logger.error('Finance', 'Failed to upsert loan', { error: err.message, loanName: loan.loanName });
      if (context?.previousLoans) {
        queryClient.setQueryData<Loan[]>(financeKeys.loans(), context.previousLoans);
      }
    },
    onSuccess: (_, loan) => {
      logger.info('Finance', 'Loan upserted successfully', { loanName: loan.loanName });
      void queryClient.invalidateQueries({ queryKey: financeKeys.loans() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.accounts() });
    },
  });
}

export function useDeleteLoanMutation(): UseMutationResult<void, Error, string, { previousLoans: Loan[] | undefined }> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previousLoans: Loan[] | undefined }>({
    mutationFn: async (loanId: string) => {
      logger.debug('Finance', 'Deleting loan', { loanId });
      const api = await getFinanceAPI();
      await api.deleteLoan(loanId);
    },
    onMutate: async (loanId) => {
      logger.debug('Finance', 'Optimistic delete: loan', { loanId });
      await queryClient.cancelQueries({ queryKey: financeKeys.loans() });
      const previousLoans = queryClient.getQueryData<Loan[]>(financeKeys.loans());

      // Optimistic delete
      queryClient.setQueryData<Loan[]>(financeKeys.loans(), (old) => {
        if (!old) return old;
        return old.filter((l) => l.id !== loanId);
      });

      return { previousLoans };
    },
    onError: (err: Error, loanId, context) => {
      logger.error('Finance', 'Failed to delete loan', { error: err.message, loanId });
      if (context?.previousLoans) {
        queryClient.setQueryData<Loan[]>(financeKeys.loans(), context.previousLoans);
      }
    },
    onSuccess: (_, loanId) => {
      logger.info('Finance', 'Loan deleted successfully', { loanId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.loans() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.loanPayments(loanId) });
    },
  });
}

// ==================== Loan Payments ====================

export function useLoanPaymentsQuery(loanId: string | null): UseQueryResult<LoanPayment[], Error> {
  return useQuery<LoanPayment[], Error>({
    queryKey: loanId ? financeKeys.loanPayments(loanId) : ['loanPayments-null'],
    queryFn: async () => {
      if (!loanId) throw new Error('Loan ID is required');
      const api = await getFinanceAPI();
      return api.listLoanPayments(loanId);
    },
    enabled: !!loanId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpsertLoanPaymentMutation(): UseMutationResult<void, Error, { loanId: string; payment: LoanPaymentInput }, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { loanId: string; payment: LoanPaymentInput }>({
    mutationFn: async ({ loanId, payment }: { loanId: string; payment: LoanPaymentInput }) => {
      logger.debug('Finance', 'Upserting loan payment', { loanId, paymentDate: payment.paymentDate });
      const api = await getFinanceAPI();
      await api.upsertLoanPayment(loanId, payment);
    },
    onSuccess: (_, { loanId }) => {
      logger.info('Finance', 'Loan payment upserted successfully', { loanId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.loanPayments(loanId) });
      void queryClient.invalidateQueries({ queryKey: financeKeys.loans() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.loan(loanId) });
    },
    onError: (error: Error, { loanId }) => {
      logger.error('Finance', 'Failed to upsert loan payment', { error: error.message, loanId });
    },
  });
}

export function useDeleteLoanPaymentMutation(): UseMutationResult<void, Error, { paymentId: string; loanId: string }, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { paymentId: string; loanId: string }>({
    mutationFn: async ({ paymentId }: { paymentId: string; loanId: string }) => {
      logger.debug('Finance', 'Deleting loan payment', { paymentId });
      const api = await getFinanceAPI();
      await api.deleteLoanPayment(paymentId);
    },
    onSuccess: (_, { loanId, paymentId }) => {
      logger.info('Finance', 'Loan payment deleted successfully', { paymentId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.loanPayments(loanId) });
      void queryClient.invalidateQueries({ queryKey: financeKeys.loans() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.loan(loanId) });
    },
    onError: (error: Error, { paymentId }) => {
      logger.error('Finance', 'Failed to delete loan payment', { error: error.message, paymentId });
    },
  });
}

// ==================== Recurring Transactions ====================

export function useRecurringTransactionsQuery(): UseQueryResult<RecurringTransaction[], Error> {
  return useQuery<RecurringTransaction[], Error>({
    queryKey: financeKeys.recurringTransactions(),
    queryFn: async () => {
      // TODO: Implement listRecurringTransactions in FinanceAPI
      return [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePendingTransactionsQuery(): UseQueryResult<PendingTransaction[], Error> {
  return useQuery<PendingTransaction[], Error>({
    queryKey: financeKeys.pendingTransactions(),
    queryFn: async () => {
      // TODO: Implement listPendingTransactions in FinanceAPI
      return [];
    },
    refetchInterval: 1000 * 60, // Refetch every minute for pending items
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useUpsertRecurringTransactionMutation(): UseMutationResult<void, Error, RecurringTransactionInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RecurringTransactionInput>({
    mutationFn: async (recurring: RecurringTransactionInput) => {
      logger.debug('Finance', 'Upserting recurring transaction', { recurring });
      // TODO: Implement upsertRecurringTransaction in FinanceAPI
      logger.warn('Finance', 'upsertRecurringTransaction not implemented');
    },
    onSuccess: (_, recurring) => {
      logger.info('Finance', 'Recurring transaction saved successfully', { id: recurring.id });
      void queryClient.invalidateQueries({ queryKey: financeKeys.recurringTransactions() });
    },
    onError: (error: Error) => {
      logger.error('Finance', 'Failed to save recurring transaction', { error: error.message });
    },
  });
}

export function useDeleteRecurringTransactionMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (recurringId: string) => {
      logger.debug('Finance', 'Deleting recurring transaction', { recurringId });
      // TODO: Implement deleteRecurringTransaction in FinanceAPI
      logger.warn('Finance', 'deleteRecurringTransaction not implemented');
    },
    onSuccess: (_, recurringId) => {
      logger.info('Finance', 'Recurring transaction deleted successfully', { recurringId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.recurringTransactions() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.pendingTransactions() });
    },
    onError: (error: Error) => {
      logger.error('Finance', 'Failed to delete recurring transaction', { error: error.message });
    },
  });
}

export function useApprovePendingTransactionMutation(): UseMutationResult<void, Error, { pendingId: string; edits?: Partial<TransactionInput> }, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { pendingId: string; edits?: Partial<TransactionInput> }>({
    mutationFn: async ({ pendingId, edits }) => {
      logger.debug('Finance', 'Approving pending transaction', { pendingId, hasEdits: !!edits });
      // TODO: Implement approvePendingTransaction in FinanceAPI
      logger.warn('Finance', 'approvePendingTransaction not implemented');
    },
    onSuccess: (_, { pendingId }) => {
      logger.info('Finance', 'Pending transaction approved successfully', { pendingId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.pendingTransactions() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.transactions() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.accounts() });
    },
    onError: (error: Error) => {
      logger.error('Finance', 'Failed to approve pending transaction', { error: error.message });
    },
  });
}

export function useSkipPendingTransactionMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (pendingId: string) => {
      logger.debug('Finance', 'Skipping pending transaction', { pendingId });
      // TODO: Implement skipPendingTransaction in FinanceAPI
      logger.warn('Finance', 'skipPendingTransaction not implemented');
    },
    onSuccess: (_, pendingId) => {
      logger.info('Finance', 'Pending transaction skipped successfully', { pendingId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.pendingTransactions() });
    },
    onError: (error: Error) => {
      logger.error('Finance', 'Failed to skip pending transaction', { error: error.message });
    },
  });
}

export function useDeletePendingTransactionMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (pendingId: string) => {
      logger.debug('Finance', 'Deleting pending transaction', { pendingId });
      // TODO: Implement deletePendingTransaction in FinanceAPI
      logger.warn('Finance', 'deletePendingTransaction not implemented');
    },
    onSuccess: (_, pendingId) => {
      logger.info('Finance', 'Pending transaction deleted successfully', { pendingId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.pendingTransactions() });
    },
    onError: (error: Error) => {
      logger.error('Finance', 'Failed to delete pending transaction', { error: error.message });
    },
  });
}

export function useGeneratePendingTransactionsMutation(): UseMutationResult<void, Error, void, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      logger.debug('Finance', 'Generating pending transactions');
      // TODO: Implement generatePendingTransactions in FinanceAPI
      logger.warn('Finance', 'generatePendingTransactions not implemented');
    },
    onSuccess: () => {
      logger.info('Finance', 'Pending transactions generated successfully');
      void queryClient.invalidateQueries({ queryKey: financeKeys.pendingTransactions() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.recurringTransactions() });
    },
    onError: (error: Error) => {
      logger.error('Finance', 'Failed to generate pending transactions', { error: error.message });
    },
  });
}

// ==================== Retirement Accounts ====================

export function useRetirementAccountsQuery(): UseQueryResult<RetirementAccountWithStats[], Error> {
  return useQuery<RetirementAccountWithStats[], Error>({
    queryKey: financeKeys.retirementAccounts(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listRetirementAccounts();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useRetirementAccountQuery(accountId: string | null): UseQueryResult<RetirementAccountWithStats | null, Error> {
  return useQuery<RetirementAccountWithStats | null, Error>({
    queryKey: accountId ? financeKeys.retirementAccount(accountId) : ['retirementAccount-null'],
    queryFn: async () => {
      if (!accountId) return null;
      const api = await getFinanceAPI();
      return api.getRetirementAccount(accountId);
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpsertRetirementAccountMetadataMutation(): UseMutationResult<void, Error, RetirementAccountMetadataInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RetirementAccountMetadataInput>({
    mutationFn: async (metadata: RetirementAccountMetadataInput) => {
      logger.debug('Finance', 'Upserting retirement account metadata', { accountId: metadata.accountId });
      const api = await getFinanceAPI();
      await api.upsertRetirementAccountMetadata(metadata);
    },
    onSuccess: (_, metadata) => {
      logger.info('Finance', 'Retirement account metadata upserted successfully', { accountId: metadata.accountId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.retirementAccounts() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.retirementAccount(metadata.accountId) });
      void queryClient.invalidateQueries({ queryKey: financeKeys.accounts() });
    },
    onError: (error: Error, metadata) => {
      logger.error('Finance', 'Failed to upsert retirement account metadata', { error: error.message, accountId: metadata.accountId });
    },
  });
}

export function useDeleteRetirementAccountMetadataMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (accountId: string) => {
      logger.debug('Finance', 'Deleting retirement account metadata', { accountId });
      const api = await getFinanceAPI();
      await api.deleteRetirementAccountMetadata(accountId);
    },
    onSuccess: (_, accountId) => {
      logger.info('Finance', 'Retirement account metadata deleted successfully', { accountId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.retirementAccounts() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.retirementAccount(accountId) });
    },
    onError: (error: Error, accountId) => {
      logger.error('Finance', 'Failed to delete retirement account metadata', { error: error.message, accountId });
    },
  });
}
