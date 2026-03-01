import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getFinanceAPI } from '@/finance/data';
import type { Institution } from '@/finance/types';
import { financeKeys } from './useFinanceMergedMode';

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
