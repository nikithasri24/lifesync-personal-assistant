/**
 * Unit tests for useMilestonesQuery hooks
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useMilestones,
  useInfiniteMilestones,
  useUpcomingMilestones,
  useMilestone,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
} from '../useMilestonesQuery';
import * as milestonesAPI from '../../api/milestonesAPI';
import { supabase } from '@/lib/supabase';
import type { Milestone, MilestoneFilters } from '../../types';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('../../api/milestonesAPI');
vi.mock('@/services/logger');
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('useMilestonesQuery', () => {
  let queryClient: QueryClient;

  const mockUser = { id: 'user-123' };
  const mockMilestone: Milestone = {
    id: 'milestone-1',
    user_id: 'user-123',
    connection_id: 'conn-1',
    title: 'Anniversary',
    milestone_date: '2024-06-15',
    milestone_type: 'anniversary',
    for_whom: 'both',
    is_recurring: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useMilestones', () => {
    it('should fetch milestones successfully', async () => {
      const mockMilestones = [mockMilestone];
      vi.mocked(milestonesAPI.getMilestones).mockResolvedValue(mockMilestones);

      const { result } = renderHook(() => useMilestones(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockMilestones);
      expect(milestonesAPI.getMilestones).toHaveBeenCalledWith(undefined);
    });

    it('should fetch milestones with filters', async () => {
      const filters: MilestoneFilters = { for_whom: 'me' };
      vi.mocked(milestonesAPI.getMilestones).mockResolvedValue([]);

      const { result } = renderHook(() => useMilestones(filters), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(milestonesAPI.getMilestones).toHaveBeenCalledWith(filters);
    });

    it('should handle fetch error', async () => {
      const mockError = new Error('Failed to fetch milestones');
      vi.mocked(milestonesAPI.getMilestones).mockRejectedValue(mockError);

      const { result } = renderHook(() => useMilestones(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(mockError);
    });
  });

  describe('useInfiniteMilestones', () => {
    it('should fetch first page of milestones', async () => {
      const mockMilestones = Array.from({ length: 20 }, (_, i) => ({
        ...mockMilestone,
        id: `milestone-${i}`,
      }));
      vi.mocked(milestonesAPI.getMilestones).mockResolvedValue(mockMilestones);

      const { result } = renderHook(() => useInfiniteMilestones(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.pages[0]).toHaveLength(20);
    });

    it('should load more pages when hasNextPage is true', async () => {
      const mockMilestones = Array.from({ length: 25 }, (_, i) => ({
        ...mockMilestone,
        id: `milestone-${i}`,
      }));
      vi.mocked(milestonesAPI.getMilestones).mockResolvedValue(mockMilestones);

      const { result } = renderHook(() => useInfiniteMilestones(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.hasNextPage).toBe(true);

      // Fetch next page
      result.current.fetchNextPage();

      await waitFor(() => {
        expect(result.current.data?.pages).toHaveLength(2);
      });

      expect(result.current.data?.pages[1]).toHaveLength(5); // Remaining 5 items
    });

    it('should not have next page when last page has fewer than PAGE_SIZE items', async () => {
      const mockMilestones = Array.from({ length: 15 }, (_, i) => ({
        ...mockMilestone,
        id: `milestone-${i}`,
      }));
      vi.mocked(milestonesAPI.getMilestones).mockResolvedValue(mockMilestones);

      const { result } = renderHook(() => useInfiniteMilestones(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.hasNextPage).toBe(false);
    });
  });

  describe('useUpcomingMilestones', () => {
    it('should fetch upcoming milestones successfully', async () => {
      const mockUpcoming = [mockMilestone];
      vi.mocked(milestonesAPI.getUpcomingMilestones).mockResolvedValue(mockUpcoming);

      const { result } = renderHook(() => useUpcomingMilestones(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUpcoming);
      expect(milestonesAPI.getUpcomingMilestones).toHaveBeenCalled();
    });
  });

  describe('useMilestone', () => {
    it('should fetch single milestone by ID', async () => {
      vi.mocked(milestonesAPI.getMilestone).mockResolvedValue(mockMilestone);

      const { result } = renderHook(() => useMilestone('milestone-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockMilestone);
      expect(milestonesAPI.getMilestone).toHaveBeenCalledWith('milestone-1');
    });

    it('should not fetch when ID is empty', () => {
      const { result } = renderHook(() => useMilestone(''), { wrapper });

      expect(result.current.isFetching).toBe(false);
    });
  });

  describe('useCreateMilestone', () => {
    it('should create milestone successfully', async () => {
      const newMilestone = {
        title: 'Birthday',
        milestone_date: '2024-12-25',
        milestone_type: 'birthday' as const,
        for_whom: 'me' as const,
      };

      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMilestone, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useCreateMilestone(), { wrapper });

      result.current.mutate(newMilestone);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabaseChain.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        ...newMilestone,
      });
      expect(result.current.data).toEqual(mockMilestone);
    });

    it('should handle authentication error', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useCreateMilestone(), { wrapper });

      result.current.mutate({
        title: 'Test',
        milestone_date: '2024-01-01',
        milestone_type: 'custom',
        for_whom: 'both',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain('Not authenticated');
    });

    it('should invalidate queries on success', async () => {
      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMilestone, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateMilestone(), { wrapper });

      result.current.mutate({
        title: 'Test',
        milestone_date: '2024-01-01',
        milestone_type: 'custom',
        for_whom: 'both',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['milestones', 'list'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['milestones', 'upcoming'] })
      );
    });
  });

  describe('useUpdateMilestone', () => {
    it('should update milestone successfully', async () => {
      const updates = { title: 'Updated Anniversary' };
      const updated = { ...mockMilestone, ...updates };

      const mockSupabaseChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updated, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useUpdateMilestone(), { wrapper });

      result.current.mutate({ id: 'milestone-1', ...updates });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabaseChain.update).toHaveBeenCalledWith(updates);
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('id', 'milestone-1');
      expect(result.current.data).toEqual(updated);
    });

    it('should optimistically update cache', async () => {
      // Seed cache with milestone
      queryClient.setQueryData(['milestones', 'milestone-1'], mockMilestone);

      const updates = { title: 'Optimistic Update' };
      const mockSupabaseChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockMilestone, ...updates },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useUpdateMilestone(), { wrapper });

      result.current.mutate({ id: 'milestone-1', ...updates });

      // Check optimistic update - wait for onMutate to complete
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<Milestone>(['milestones', 'milestone-1']);
        expect(cachedData?.title).toBe('Optimistic Update');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should rollback on error', async () => {
      // Seed cache
      queryClient.setQueryData(['milestones', 'milestone-1'], mockMilestone);

      const mockSupabaseChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useUpdateMilestone(), { wrapper });

      result.current.mutate({ id: 'milestone-1', title: 'Should Fail' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Check rollback
      const cachedData = queryClient.getQueryData<Milestone>(['milestones', 'milestone-1']);
      expect(cachedData?.title).toBe('Anniversary'); // Original value
    });
  });

  describe('useDeleteMilestone', () => {
    it('should delete milestone successfully', async () => {
      const mockSupabaseChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useDeleteMilestone(), { wrapper });

      result.current.mutate('milestone-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabaseChain.delete).toHaveBeenCalled();
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('id', 'milestone-1');
    });

    it('should remove from cache and invalidate queries on success', async () => {
      const mockSupabaseChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      // Seed cache
      queryClient.setQueryData(['milestones', 'milestone-1'], mockMilestone);
      const removeSpy = vi.spyOn(queryClient, 'removeQueries');
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteMilestone(), { wrapper });

      result.current.mutate('milestone-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(removeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['milestones', 'milestone-1'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['milestones', 'list'] })
      );
    });

    it('should handle delete error', async () => {
      const mockSupabaseChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useDeleteMilestone(), { wrapper });

      result.current.mutate('milestone-1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
