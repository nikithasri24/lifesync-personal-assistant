import { useQuery, useQueries, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { getFinanceAPI } from '@/finance/data';
import type {
  CardBenefit,
  CardBenefitInput,
  CardCategoryBonus,
  CardCategoryBonusInput,
  WelcomeBonus,
  WelcomeBonusInput,
  CardOffer,
  CardOfferInput,
} from '@/finance/types';
import type { Account } from '@/finance/types';
import { logger } from '@/services/logger';
import { financeKeys } from './useFinanceMergedMode';

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

// ==================== Aggregate Queries (all cards at once) ====================

/** Fetch CardBenefits for a list of credit card accounts in parallel. */
export function useAllCardsBenefitsQuery(cards: Account[]): {
  data: Record<string, CardBenefit[]>;
  isLoading: boolean;
} {
  const queries = useQueries({
    queries: cards.map((card) => ({
      queryKey: financeKeys.cardBenefits(card.id),
      queryFn: async () => {
        const api = await getFinanceAPI();
        return api.listCardBenefits(card.id);
      },
      staleTime: 1000 * 60 * 10,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const data: Record<string, CardBenefit[]> = {};
  cards.forEach((card, i) => {
    data[card.id] = queries[i]?.data ?? [];
  });

  return { data, isLoading };
}

/** Fetch CardCategoryBonuses for a list of credit card accounts in parallel. */
export function useAllCardsCategoryBonusesQuery(cards: Account[]): {
  data: Record<string, CardCategoryBonus[]>;
  isLoading: boolean;
} {
  const queries = useQueries({
    queries: cards.map((card) => ({
      queryKey: financeKeys.categoryBonuses(card.id),
      queryFn: async () => {
        const api = await getFinanceAPI();
        return api.listCategoryBonuses(card.id);
      },
      staleTime: 1000 * 60 * 10,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const data: Record<string, CardCategoryBonus[]> = {};
  cards.forEach((card, i) => {
    data[card.id] = queries[i]?.data ?? [];
  });

  return { data, isLoading };
}

/** Fetch WelcomeBonuses for a list of credit card accounts in parallel. */
export function useAllCardsWelcomeBonusesQuery(cards: Account[]): {
  data: Record<string, WelcomeBonus[]>;
  isLoading: boolean;
} {
  const queries = useQueries({
    queries: cards.map((card) => ({
      queryKey: financeKeys.welcomeBonuses(card.id),
      queryFn: async () => {
        const api = await getFinanceAPI();
        return api.listWelcomeBonuses(card.id);
      },
      staleTime: 1000 * 60 * 10,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const data: Record<string, WelcomeBonus[]> = {};
  cards.forEach((card, i) => {
    data[card.id] = queries[i]?.data ?? [];
  });

  return { data, isLoading };
}
