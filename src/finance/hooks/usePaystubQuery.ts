import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getPaystubsAPI, type Paystub } from '../data';

export function usePaystubQuery(payPeriod: string): UseQueryResult<Paystub | null, Error> {
  return useQuery<Paystub | null, Error>({
    queryKey: ['finance', 'paystub', payPeriod],
    queryFn: () => getPaystubsAPI().getPaystub(payPeriod),
    staleTime: 1000 * 60 * 60, // 1 hour — paystubs rarely change
  });
}
