import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { getStores, createStore, getShoppingMergedConnection } from '@/api/storesAPI';
import { mapStoreDataToStore } from '@/shopping/services/storeMappers';
import type { Store } from '@/shopping/types';
import type { StoreData } from '@/services/types';

export const storeKeys = {
  all: ['stores'] as const,
  list: () => [...storeKeys.all, 'list'] as const,
  mergedConnection: () => [...storeKeys.all, 'mergedConnection'] as const,
};

/**
 * Hook to check if shopping merged mode is enabled
 * Returns connection info if both users have merged mode enabled
 */
export function useMergedShoppingConnectionQuery() {
  return useQuery({
    queryKey: storeKeys.mergedConnection(),
    queryFn: getShoppingMergedConnection,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
  });
}

export function useStoresQuery(): UseQueryResult<Store[], Error> {
  return useQuery({
    queryKey: storeKeys.list(),
    queryFn: async () => {
      const data: StoreData[] = await getStores();
      return data.map(mapStoreDataToStore);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateStore(): UseMutationResult<
  StoreData,
  Error,
  Omit<StoreData, 'id' | 'user_id' | 'created_at' | 'updated_at'>
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStore,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: storeKeys.all });
    },
  });
}
