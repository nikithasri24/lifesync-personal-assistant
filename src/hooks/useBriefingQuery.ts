/**
 * React Query hook for Daily Briefing
 */

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { generateDailyBriefing } from '@/services/briefing';
import type { DailyBriefing, BriefingOptions } from '@/services/briefing';
import { queryOptions } from '@/lib/react-query';

export const briefingKeys = {
  all: ['briefing'] as const,
  today: () => [...briefingKeys.all, 'today'] as const,
};

/**
 * Get today's daily briefing
 */
export function useDailyBriefing(
  options?: Partial<BriefingOptions>
): UseQueryResult<DailyBriefing, Error> {
  return useQuery({
    queryKey: briefingKeys.today(),
    queryFn: () => generateDailyBriefing(options),
    staleTime: queryOptions.user.staleTime, // 5 minutes
    gcTime: queryOptions.user.gcTime, // 10 minutes
    refetchOnWindowFocus: false,
    // Briefing data doesn't change frequently - refresh every 30 min
    refetchInterval: 30 * 60 * 1000,
  });
}

