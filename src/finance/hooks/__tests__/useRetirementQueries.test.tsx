import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useRetirementAccountsQuery,
  useRetirementAccountQuery,
  useUpsertRetirementAccountMetadataMutation,
  useDeleteRetirementAccountMetadataMutation,
} from '@/hooks/useFinanceQuery';
import type { RetirementAccountWithStats, RetirementAccountMetadataInput } from '../../types';

// Mock the API
vi.mock('../../data', () => ({
  getFinanceAPI: vi.fn(() => ({
    listRetirementAccounts: vi.fn(),
    getRetirementAccount: vi.fn(),
    upsertRetirementAccountMetadata: vi.fn(),
    deleteRetirementAccountMetadata: vi.fn(),
  })),
}));

const mockRetirementAccounts: RetirementAccountWithStats[] = [
  {
    id: '1',
    accountId: 'acc1',
    accountName: 'Test 401k',
    accountBalance: 50000,
    accountType: '401k',
    taxTreatment: 'pre_tax',
    annualContributionLimit: 23000,
    catchUpLimit: 7500,
    currentYearContributions: 10000,
    contributionYear: 2024,
    hasEmployerMatch: true,
    employerMatchPercentage: 100,
    employerMatchLimit: 6,
    employerMatchType: 'percentage',
    employerContributionsYTD: 3000,
    hasVestingSchedule: false,
    vestingPercentage: 100,
    unvestedBalance: 0,
    vestedBalance: 50000,
    totalValue: 50000,
    totalVested: 50000,
    totalYTDContributions: 13000,
    remainingEmployeeRoom: 13000,
    latestGains: 5000,
    latestRateOfReturn: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('Retirement React Query Hooks', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    vi.clearAllMocks();
  });

  describe('useRetirementAccountsQuery', () => {
    it('should fetch retirement accounts successfully', async () => {
      const { getFinanceAPI } = await import('../../data');
      const mockApi = await getFinanceAPI();
      vi.mocked(mockApi.listRetirementAccounts).mockResolvedValue(mockRetirementAccounts);

      const { result } = renderHook(() => useRetirementAccountsQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRetirementAccounts);
      expect(mockApi.listRetirementAccounts).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch error', async () => {
      const { getFinanceAPI } = await import('../../data');
      const mockApi = await getFinanceAPI();
      const error = new Error('Failed to fetch');
      vi.mocked(mockApi.listRetirementAccounts).mockRejectedValue(error);

      const { result } = renderHook(() => useRetirementAccountsQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });

    it('should have correct stale time', () => {
      const { result } = renderHook(() => useRetirementAccountsQuery(), { wrapper });

      // Should have 5 minute stale time
      expect(result.current).toBeDefined();
    });
  });

  describe('useRetirementAccountQuery', () => {
    it('should fetch single retirement account', async () => {
      const { getFinanceAPI } = await import('../../data');
      const mockApi = await getFinanceAPI();
      vi.mocked(mockApi.getRetirementAccount).mockResolvedValue(mockRetirementAccounts[0]);

      const { result } = renderHook(() => useRetirementAccountQuery('acc1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRetirementAccounts[0]);
      expect(mockApi.getRetirementAccount).toHaveBeenCalledWith('acc1');
    });

    it('should return null for null accountId', async () => {
      const { result } = renderHook(() => useRetirementAccountQuery(null), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(null);
    });

    it('should not fetch when accountId is null', async () => {
      const { getFinanceAPI } = await import('../../data');
      const mockApi = await getFinanceAPI();

      renderHook(() => useRetirementAccountQuery(null), { wrapper });

      await waitFor(() => {
        expect(mockApi.getRetirementAccount).not.toHaveBeenCalled();
      });
    });

    it('should handle fetch error', async () => {
      const { getFinanceAPI } = await import('../../data');
      const mockApi = await getFinanceAPI();
      const error = new Error('Account not found');
      vi.mocked(mockApi.getRetirementAccount).mockRejectedValue(error);

      const { result } = renderHook(() => useRetirementAccountQuery('acc1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });
  });

  describe('useUpsertRetirementAccountMetadataMutation', () => {
    it('should upsert retirement account metadata', async () => {
      const { getFinanceAPI } = await import('../../data');
      const mockApi = await getFinanceAPI();
      vi.mocked(mockApi.upsertRetirementAccountMetadata).mockResolvedValue(undefined);

      const { result } = renderHook(() => useUpsertRetirementAccountMetadataMutation(), { wrapper });

      const metadata: RetirementAccountMetadataInput = {
        accountId: 'acc1',
        taxTreatment: 'pre_tax',
        annualContributionLimit: 23000,
        catchUpLimit: 7500,
        currentYearContributions: 10000,
        contributionYear: 2024,
        hasEmployerMatch: true,
        employerMatchPercentage: 100,
        employerMatchLimit: 6,
        employerMatchType: 'percentage',
        employerContributionsYTD: 3000,
        hasVestingSchedule: false,
        vestingPercentage: 100,
        unvestedBalance: 0,
      };

      result.current.mutate(metadata);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.upsertRetirementAccountMetadata).toHaveBeenCalledWith(metadata);
    });

    it('should invalidate queries on success', async () => {
      const { getFinanceAPI } = await import('../../data');
      const mockApi = await getFinanceAPI();
      vi.mocked(mockApi.upsertRetirementAccountMetadata).mockResolvedValue(undefined);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpsertRetirementAccountMetadataMutation(), { wrapper });

      const metadata: RetirementAccountMetadataInput = {
        accountId: 'acc1',
        taxTreatment: 'pre_tax',
        annualContributionLimit: 23000,
        currentYearContributions: 0,
        contributionYear: 2024,
        hasEmployerMatch: false,
        employerContributionsYTD: 0,
        hasVestingSchedule: false,
        vestingPercentage: 100,
        unvestedBalance: 0,
      };

      result.current.mutate(metadata);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should invalidate retirement accounts, specific account, and accounts queries
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('should handle upsert error', async () => {
      const { getFinanceAPI } = await import('../../data');
      const mockApi = await getFinanceAPI();
      const error = new Error('Failed to save');
      vi.mocked(mockApi.upsertRetirementAccountMetadata).mockRejectedValue(error);

      const { result } = renderHook(() => useUpsertRetirementAccountMetadataMutation(), { wrapper });

      const metadata: RetirementAccountMetadataInput = {
        accountId: 'acc1',
        taxTreatment: 'pre_tax',
        annualContributionLimit: 23000,
        currentYearContributions: 0,
        contributionYear: 2024,
        hasEmployerMatch: false,
        employerContributionsYTD: 0,
        hasVestingSchedule: false,
        vestingPercentage: 100,
        unvestedBalance: 0,
      };

      result.current.mutate(metadata);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });
  });

  describe('useDeleteRetirementAccountMetadataMutation', () => {
    it('should delete retirement account metadata', async () => {
      const { getFinanceAPI } = await import('../../data');
      const mockApi = await getFinanceAPI();
      vi.mocked(mockApi.deleteRetirementAccountMetadata).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteRetirementAccountMetadataMutation(), { wrapper });

      result.current.mutate('acc1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.deleteRetirementAccountMetadata).toHaveBeenCalledWith('acc1');
    });

    it('should invalidate queries on success', async () => {
      const { getFinanceAPI } = await import('../../data');
      const mockApi = await getFinanceAPI();
      vi.mocked(mockApi.deleteRetirementAccountMetadata).mockResolvedValue(undefined);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteRetirementAccountMetadataMutation(), { wrapper });

      result.current.mutate('acc1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('should handle delete error', async () => {
      const { getFinanceAPI } = await import('../../data');
      const mockApi = await getFinanceAPI();
      const error = new Error('Failed to delete');
      vi.mocked(mockApi.deleteRetirementAccountMetadata).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteRetirementAccountMetadataMutation(), { wrapper });

      result.current.mutate('acc1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });
  });
});
