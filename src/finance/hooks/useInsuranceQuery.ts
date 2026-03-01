import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { getFinanceAPI } from '@/finance/data';
import type { InsurancePolicy, InsurancePolicyInput } from '@/finance/types';
import { logger } from '@/services/logger';
import { financeKeys } from './useFinanceMergedMode';

// ==================== Insurance Policies ====================

export function useInsurancePoliciesQuery(): UseQueryResult<InsurancePolicy[], Error> {
  return useQuery<InsurancePolicy[], Error>({
    queryKey: financeKeys.insurancePolicies(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listInsurancePolicies();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpsertInsurancePolicyMutation(): UseMutationResult<void, Error, InsurancePolicyInput, { previousPolicies: InsurancePolicy[] | undefined }> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, InsurancePolicyInput, { previousPolicies: InsurancePolicy[] | undefined }>({
    mutationFn: async (policy: InsurancePolicyInput) => {
      logger.debug('Finance', 'Upserting insurance policy', { policyName: policy.policyName });
      const api = await getFinanceAPI();
      await api.upsertInsurancePolicy(policy);
    },
    onMutate: async (policy) => {
      logger.debug('Finance', 'Optimistic update: insurance policy', { policyName: policy.policyName });
      await queryClient.cancelQueries({ queryKey: financeKeys.insurancePolicies() });
      const previousPolicies = queryClient.getQueryData<InsurancePolicy[]>(financeKeys.insurancePolicies());

      // Optimistic update
      if (policy.id) {
        queryClient.setQueryData<InsurancePolicy[]>(financeKeys.insurancePolicies(), (old) => {
          if (!old) return [];
          return old.map((p) => (p.id === policy.id ? { ...p, ...policy } as InsurancePolicy : p));
        });
      } else {
        queryClient.setQueryData<InsurancePolicy[]>(financeKeys.insurancePolicies(), (old) => {
          if (!old) return [];
          return [...old, { ...policy, id: 'temp-' + Date.now(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as InsurancePolicy];
        });
      }

      return { previousPolicies };
    },
    onError: (err: Error, policy, context) => {
      logger.error('Finance', 'Failed to upsert insurance policy', { error: err.message, policyName: policy.policyName });
      if (context?.previousPolicies) {
        queryClient.setQueryData<InsurancePolicy[]>(financeKeys.insurancePolicies(), context.previousPolicies);
      }
    },
    onSuccess: (_, policy) => {
      logger.info('Finance', 'Insurance policy saved successfully', { policyName: policy.policyName });
      void queryClient.invalidateQueries({ queryKey: financeKeys.insurancePolicies() });
    },
  });
}

export function useDeleteInsurancePolicyMutation(): UseMutationResult<void, Error, string, { previousPolicies: InsurancePolicy[] | undefined }> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previousPolicies: InsurancePolicy[] | undefined }>({
    mutationFn: async (policyId: string) => {
      logger.debug('Finance', 'Deleting insurance policy', { policyId });
      const api = await getFinanceAPI();
      await api.deleteInsurancePolicy(policyId);
    },
    onMutate: async (policyId) => {
      logger.debug('Finance', 'Optimistic delete: insurance policy', { policyId });
      await queryClient.cancelQueries({ queryKey: financeKeys.insurancePolicies() });
      const previousPolicies = queryClient.getQueryData<InsurancePolicy[]>(financeKeys.insurancePolicies());

      // Optimistic delete
      queryClient.setQueryData<InsurancePolicy[]>(financeKeys.insurancePolicies(), (old) => {
        if (!old) return [];
        return old.filter((p) => p.id !== policyId);
      });

      return { previousPolicies };
    },
    onError: (err: Error, policyId, context) => {
      logger.error('Finance', 'Failed to delete insurance policy', { error: err.message, policyId });
      if (context?.previousPolicies) {
        queryClient.setQueryData<InsurancePolicy[]>(financeKeys.insurancePolicies(), context.previousPolicies);
      }
    },
    onSuccess: (_, policyId) => {
      logger.info('Finance', 'Insurance policy deleted successfully', { policyId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.insurancePolicies() });
    },
  });
}
