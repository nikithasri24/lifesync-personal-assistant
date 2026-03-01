import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getFinanceAPI } from '@/finance/data';
import type { NetPoint } from '@/finance/types';
import { financeKeys } from './useFinanceMergedMode';

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
