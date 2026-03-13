/**
 * usePredictionsQuery
 * React Query wrapper around PredictionService.generatePredictions().
 * Provides the URGENT section data for the Command Center dashboard.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { predictionService, type Prediction } from '@/services/ai/PredictionService';
import { logger } from '@/services/logger';

export const predictionKeys = {
  all: ['predictions'] as const,
  list: (userId: string, days: number) => [...predictionKeys.all, userId, days] as const,
};

export function usePredictionsQuery(lookAheadDays = 7): UseQueryResult<Prediction[], Error> {
  const { user } = useAuth();

  return useQuery<Prediction[], Error>({
    queryKey: predictionKeys.list(user?.id ?? '', lookAheadDays),
    queryFn: async () => {
      logger.debug('Dashboard', 'Fetching predictions', { userId: user?.id, lookAheadDays });
      return predictionService.generatePredictions(user!.id, lookAheadDays);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 15,      // 15 min — predictions don't change every second
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchInterval: 1000 * 60 * 30, // Background refresh every 30 min
  });
}
