import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { getFinanceAPI } from '@/finance/data';
import type { Loan, LoanInput, LoanPayment, LoanPaymentInput } from '@/finance/types';
import { logger } from '@/services/logger';
import { financeKeys } from './useFinanceMergedMode';

// ==================== Loans ====================

export function useLoansQuery(): UseQueryResult<Loan[], Error> {
  return useQuery<Loan[], Error>({
    queryKey: financeKeys.loans(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listLoans();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpsertLoanMutation(): UseMutationResult<void, Error, LoanInput, { previousLoans: Loan[] | undefined }> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, LoanInput, { previousLoans: Loan[] | undefined }>({
    mutationFn: async (loan: LoanInput) => {
      logger.debug('Finance', 'Upserting loan', { loanName: loan.loanName });
      const api = await getFinanceAPI();
      await api.upsertLoan(loan);
    },
    onMutate: async (loan) => {
      logger.debug('Finance', 'Optimistic update: loan', { loanName: loan.loanName });
      await queryClient.cancelQueries({ queryKey: financeKeys.loans() });
      const previousLoans = queryClient.getQueryData<Loan[]>(financeKeys.loans());

      // Optimistic update
      if (loan.id) {
        queryClient.setQueryData<Loan[]>(financeKeys.loans(), (old) => {
          if (!old) return old;
          return old.map((l) => (l.id === loan.id ? { ...l, ...loan } : l));
        });
      }
      // For new loans, we can't optimistically add without an ID

      return { previousLoans };
    },
    onError: (err: Error, loan, context) => {
      logger.error('Finance', 'Failed to upsert loan', { error: err.message, loanName: loan.loanName });
      if (context?.previousLoans) {
        queryClient.setQueryData<Loan[]>(financeKeys.loans(), context.previousLoans);
      }
    },
    onSuccess: (_, loan) => {
      logger.info('Finance', 'Loan upserted successfully', { loanName: loan.loanName });
      void queryClient.invalidateQueries({ queryKey: financeKeys.loans() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.accounts() });
    },
  });
}

export function useDeleteLoanMutation(): UseMutationResult<void, Error, string, { previousLoans: Loan[] | undefined }> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previousLoans: Loan[] | undefined }>({
    mutationFn: async (loanId: string) => {
      logger.debug('Finance', 'Deleting loan', { loanId });
      const api = await getFinanceAPI();
      await api.deleteLoan(loanId);
    },
    onMutate: async (loanId) => {
      logger.debug('Finance', 'Optimistic delete: loan', { loanId });
      await queryClient.cancelQueries({ queryKey: financeKeys.loans() });
      const previousLoans = queryClient.getQueryData<Loan[]>(financeKeys.loans());

      // Optimistic delete
      queryClient.setQueryData<Loan[]>(financeKeys.loans(), (old) => {
        if (!old) return old;
        return old.filter((l) => l.id !== loanId);
      });

      return { previousLoans };
    },
    onError: (err: Error, loanId, context) => {
      logger.error('Finance', 'Failed to delete loan', { error: err.message, loanId });
      if (context?.previousLoans) {
        queryClient.setQueryData<Loan[]>(financeKeys.loans(), context.previousLoans);
      }
    },
    onSuccess: (_, loanId) => {
      logger.info('Finance', 'Loan deleted successfully', { loanId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.loans() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.loanPayments(loanId) });
    },
  });
}

// ==================== Loan Payments ====================

export function useLoanPaymentsQuery(loanId: string | null): UseQueryResult<LoanPayment[], Error> {
  return useQuery<LoanPayment[], Error>({
    queryKey: loanId ? financeKeys.loanPayments(loanId) : ['loanPayments-null'],
    queryFn: async () => {
      if (!loanId) throw new Error('Loan ID is required');
      const api = await getFinanceAPI();
      return api.listLoanPayments(loanId);
    },
    enabled: !!loanId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpsertLoanPaymentMutation(): UseMutationResult<void, Error, { loanId: string; payment: LoanPaymentInput }, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { loanId: string; payment: LoanPaymentInput }>({
    mutationFn: async ({ loanId, payment }: { loanId: string; payment: LoanPaymentInput }) => {
      logger.debug('Finance', 'Upserting loan payment', { loanId, paymentDate: payment.paymentDate });
      const api = await getFinanceAPI();
      await api.upsertLoanPayment(loanId, payment);
    },
    onSuccess: (_, { loanId }) => {
      logger.info('Finance', 'Loan payment upserted successfully', { loanId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.loanPayments(loanId) });
      void queryClient.invalidateQueries({ queryKey: financeKeys.loans() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.loan(loanId) });
    },
    onError: (error: Error, { loanId }) => {
      logger.error('Finance', 'Failed to upsert loan payment', { error: error.message, loanId });
    },
  });
}

export function useDeleteLoanPaymentMutation(): UseMutationResult<void, Error, { paymentId: string; loanId: string }, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { paymentId: string; loanId: string }>({
    mutationFn: async ({ paymentId }: { paymentId: string; loanId: string }) => {
      logger.debug('Finance', 'Deleting loan payment', { paymentId });
      const api = await getFinanceAPI();
      await api.deleteLoanPayment(paymentId);
    },
    onSuccess: (_, { loanId, paymentId }) => {
      logger.info('Finance', 'Loan payment deleted successfully', { paymentId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.loanPayments(loanId) });
      void queryClient.invalidateQueries({ queryKey: financeKeys.loans() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.loan(loanId) });
    },
    onError: (error: Error, { paymentId }) => {
      logger.error('Finance', 'Failed to delete loan payment', { error: error.message, paymentId });
    },
  });
}
