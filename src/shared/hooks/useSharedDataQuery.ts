/**
 * useSharedDataQuery Hook
 *
 * Fetches shared data from connected users based on module permissions.
 * Returns combined data from all connections for each module.
 */

import { useQuery } from '@tanstack/react-query';
import type { ShareableModule } from '../types/connections';
import { fetchSharedDashboardData, type SharedData } from '../services/SharedDataProvider';

const sharedDataKeys = {
  all: ['shared-data'] as const,
  byModule: (module: ShareableModule) => [...sharedDataKeys.all, module] as const,
};

/**
 * Main hook to fetch all shared data
 */
export function useSharedDataQuery() {
  return useQuery<SharedData>({
    queryKey: sharedDataKeys.all,
    queryFn: fetchSharedDashboardData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: true,
  });
}

export default useSharedDataQuery;
