/**
 * Together Feature Merged Mode Support
 * Enables viewing partner's milestones, messages, and challenges in unified views
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getMergedConnectionId, type MergedConnectionResult } from '@/shared/api/SharedDataProvider';
import { logger } from '@/services/logger';

// Module names for Together feature merged mode
type TogetherModule = 'milestones' | 'messages' | 'challenges';

// Merged connection cache
let cachedMergedConnections: Partial<Record<TogetherModule, MergedConnectionResult | null>> = {};

/**
 * Get merged connection for a Together module
 */
async function getTogetherMergedConnection(module: TogetherModule): Promise<MergedConnectionResult | null> {
  if (cachedMergedConnections[module] !== undefined) {
    logger.debug('Together', 'Returning cached merged connection', {
      module,
      cached: cachedMergedConnections[module],
    });
    return cachedMergedConnections[module]!;
  }

  logger.debug('Together', 'Checking merged connection', { module });

  const connection = await getMergedConnectionId('together');

  cachedMergedConnections[module] = connection;

  logger.info('Together', 'Together merged connection status', {
    module,
    hasMergedMode: !!connection,
    partnerId: connection?.partnerId,
  });

  return connection;
}

/**
 * Clear cached merged connections (call when connection status changes)
 */
export function clearTogetherMergedConnectionCache(): void {
  logger.debug('Together', 'Clearing together merged connection cache');
  cachedMergedConnections = {};
}

/**
 * Hook to check if milestones merged mode is enabled
 * Returns connection info if both users have merged mode enabled for Together
 */
export function useMergedMilestonesConnection(): UseQueryResult<MergedConnectionResult | null, Error> {
  return useQuery({
    queryKey: ['together', 'milestones', 'mergedConnection'],
    queryFn: () => getTogetherMergedConnection('milestones'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
  });
}

/**
 * Hook to check if messages merged mode is enabled
 */
export function useMergedMessagesConnection(): UseQueryResult<MergedConnectionResult | null, Error> {
  return useQuery({
    queryKey: ['together', 'messages', 'mergedConnection'],
    queryFn: () => getTogetherMergedConnection('messages'),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
  });
}

/**
 * Hook to check if challenges merged mode is enabled
 */
export function useMergedChallengesConnection(): UseQueryResult<MergedConnectionResult | null, Error> {
  return useQuery({
    queryKey: ['together', 'challenges', 'mergedConnection'],
    queryFn: () => getTogetherMergedConnection('challenges'),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
  });
}

/**
 * Export the getter for use in API calls
 */
export { getTogetherMergedConnection };
