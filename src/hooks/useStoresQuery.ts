import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getStores } from '@/api/storesAPI';
import { mapStoreDataToStore } from '@/shopping/services/storeMappers';
import type { Store } from '@/shopping/types';
import type { StoreData } from '@/services/types';

export const storeKeys = {
  all: ['stores'] as const,
  list: () => [...storeKeys.all, 'list'] as const,
};

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
