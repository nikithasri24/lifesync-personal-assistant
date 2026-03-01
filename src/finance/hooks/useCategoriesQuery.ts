import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getFinanceAPI } from '@/finance/data';
import type { Category } from '@/finance/types';
import { financeKeys } from './useFinanceMergedMode';

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
