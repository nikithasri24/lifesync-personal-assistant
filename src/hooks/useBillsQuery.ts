/**
 * Bills React Query Hooks
 * Provides data fetching and mutations for recurring bills
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBills,
  getBillsDueThisWeek,
  getUpcomingBills,
  createBill,
  updateBill,
  deleteBill,
  recordPayment,
  getPaymentHistory,
  getBillSummary,
} from '@/services/bills';
import type { CreateBillInput, UpdateBillInput, RecordPaymentInput } from '@/services/bills';
import { queryOptions } from '@/lib/react-query';

// Query keys
const billKeys = {
  all: ['bills'] as const,
  list: () => [...billKeys.all, 'list'] as const,
  dueThisWeek: () => [...billKeys.all, 'dueThisWeek'] as const,
  upcoming: () => [...billKeys.all, 'upcoming'] as const,
  summary: () => [...billKeys.all, 'summary'] as const,
  payments: (billId: string) => [...billKeys.all, 'payments', billId] as const,
};

/**
 * Hook to fetch all bills
 */
export function useBills(activeOnly = true) {
  return useQuery({
    queryKey: billKeys.list(),
    queryFn: () => getBills(activeOnly),
    staleTime: queryOptions.user.staleTime,
    gcTime: queryOptions.user.gcTime,
  });
}

/**
 * Hook to fetch bills due this week
 */
export function useBillsDueThisWeek() {
  return useQuery({
    queryKey: billKeys.dueThisWeek(),
    queryFn: getBillsDueThisWeek,
    staleTime: queryOptions.user.staleTime,
    gcTime: queryOptions.user.gcTime,
  });
}

/**
 * Hook to fetch upcoming bills (next 30 days)
 */
export function useUpcomingBills() {
  return useQuery({
    queryKey: billKeys.upcoming(),
    queryFn: getUpcomingBills,
    staleTime: queryOptions.user.staleTime,
    gcTime: queryOptions.user.gcTime,
  });
}

/**
 * Hook to fetch bill summary
 */
export function useBillSummary() {
  return useQuery({
    queryKey: billKeys.summary(),
    queryFn: getBillSummary,
    staleTime: queryOptions.user.staleTime,
    gcTime: queryOptions.user.gcTime,
  });
}

/**
 * Hook to fetch payment history for a bill
 */
export function usePaymentHistory(billId: string) {
  return useQuery({
    queryKey: billKeys.payments(billId),
    queryFn: () => getPaymentHistory(billId),
    enabled: !!billId,
    staleTime: queryOptions.user.staleTime,
    gcTime: queryOptions.user.gcTime,
  });
}

/**
 * Hook to create a new bill
 */
export function useCreateBill() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateBillInput) => createBill(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.all });
    },
  });
}

/**
 * Hook to update a bill
 */
export function useUpdateBill() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ billId, updates }: { billId: string; updates: UpdateBillInput }) => 
      updateBill(billId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.all });
    },
  });
}

/**
 * Hook to delete a bill
 */
export function useDeleteBill() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (billId: string) => deleteBill(billId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.all });
    },
  });
}

/**
 * Hook to record a payment
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: RecordPaymentInput) => recordPayment(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: billKeys.all });
      queryClient.invalidateQueries({ queryKey: billKeys.payments(variables.bill_id) });
    },
  });
}

