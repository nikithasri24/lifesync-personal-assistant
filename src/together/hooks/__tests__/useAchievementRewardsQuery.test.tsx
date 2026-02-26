/**
 * Unit tests for useAchievementRewardsQuery hooks
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useAchievementRewards,
  useAchievementReward,
  useCreateAchievementReward,
  useUpdateAchievementReward,
  useDeleteAchievementReward,
} from '../useAchievementRewardsQuery';
import * as challengesAPI from '../../api/challengesAPI';
import { supabase } from '@/lib/supabase';
import type { AchievementReward } from '../../types';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('../../api/challengesAPI');
vi.mock('@/services/logger');
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('useAchievementRewardsQuery', () => {
  let queryClient: QueryClient;

  const mockUser = { id: 'user-123' };
  const mockReward: AchievementReward = {
    id: 'reward-1',
    connection_id: 'conn-1',
    creator_id: 'user-123',
    title: '30 Day Workout Challenge',
    description: 'Complete 30 workouts in 30 days',
    target_value: 30,
    current_progress: 15,
    unit: 'workouts',
    status: 'active',
    reward_description: 'Spa day together!',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
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

  describe('useAchievementRewards', () => {
    it('should fetch achievement rewards successfully', async () => {
      const mockRewards = [mockReward];
      vi.mocked(challengesAPI.getAchievementRewards).mockResolvedValue(mockRewards);

      const { result } = renderHook(() => useAchievementRewards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRewards);
      expect(challengesAPI.getAchievementRewards).toHaveBeenCalledWith(undefined);
    });

    it('should fetch achievement rewards with connection ID', async () => {
      vi.mocked(challengesAPI.getAchievementRewards).mockResolvedValue([]);

      const { result } = renderHook(() => useAchievementRewards('conn-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(challengesAPI.getAchievementRewards).toHaveBeenCalledWith('conn-1');
    });

    it('should handle fetch error', async () => {
      const mockError = new Error('Failed to fetch challenges');
      vi.mocked(challengesAPI.getAchievementRewards).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAchievementRewards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(mockError);
    });
  });

  describe('useAchievementReward', () => {
    it('should fetch single reward by ID', async () => {
      vi.mocked(challengesAPI.getAchievementReward).mockResolvedValue(mockReward);

      const { result } = renderHook(() => useAchievementReward('reward-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockReward);
      expect(challengesAPI.getAchievementReward).toHaveBeenCalledWith('reward-1');
    });

    it('should not fetch when ID is empty', () => {
      const { result } = renderHook(() => useAchievementReward(''), { wrapper });

      expect(result.current.isFetching).toBe(false);
    });
  });

  describe('useCreateAchievementReward', () => {
    it('should create challenge successfully', async () => {
      const newChallenge = {
        connection_id: 'conn-1',
        title: 'Reading Challenge',
        description: 'Read 10 books',
        target_value: 10,
        unit: 'books',
        reward_description: 'Weekend getaway!',
      };

      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockReward, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useCreateAchievementReward(), { wrapper });

      result.current.mutate(newChallenge);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabaseChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newChallenge,
          creator_id: mockUser.id,
          status: 'active',
          current_progress: 0,
        })
      );
      expect(result.current.data).toEqual(mockReward);
    });

    it('should handle authentication error', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useCreateAchievementReward(), { wrapper });

      result.current.mutate({
        connection_id: 'conn-1',
        title: 'Test',
        target_value: 10,
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
        single: vi.fn().mockResolvedValue({ data: mockReward, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateAchievementReward(), { wrapper });

      result.current.mutate({
        connection_id: 'conn-1',
        title: 'Test',
        target_value: 10,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['achievement-rewards', 'list'] })
      );
    });
  });

  describe('useUpdateAchievementReward', () => {
    it('should update challenge successfully', async () => {
      const updates = { current_progress: 20 };
      const updated = { ...mockReward, ...updates };

      const mockSupabaseChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updated, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useUpdateAchievementReward(), { wrapper });

      result.current.mutate({ id: 'reward-1', ...updates });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabaseChain.update).toHaveBeenCalledWith(updates);
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('id', 'reward-1');
      expect(result.current.data).toEqual(updated);
    });

    it('should auto-complete when progress reaches target', async () => {
      // Seed cache with partial progress
      queryClient.setQueryData(['achievement-rewards', 'reward-1'], mockReward);

      const updates = { current_progress: 30 }; // Reaches target of 30
      const mockSupabaseChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockReward, ...updates, status: 'completed' },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useUpdateAchievementReward(), { wrapper });

      result.current.mutate({ id: 'reward-1', ...updates });

      // Check optimistic update includes auto-completion - wait for onMutate to complete
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<AchievementReward>([
          'achievement-rewards',
          'reward-1',
        ]);
        expect(cachedData?.status).toBe('completed');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should optimistically update cache', async () => {
      // Seed cache
      queryClient.setQueryData(['achievement-rewards', 'reward-1'], mockReward);

      const updates = { current_progress: 20 };
      const mockSupabaseChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockReward, ...updates },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useUpdateAchievementReward(), { wrapper });

      result.current.mutate({ id: 'reward-1', ...updates });

      // Check optimistic update - wait for onMutate to complete
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<AchievementReward>([
          'achievement-rewards',
          'reward-1',
        ]);
        expect(cachedData?.current_progress).toBe(20);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should rollback on error', async () => {
      // Seed cache
      queryClient.setQueryData(['achievement-rewards', 'reward-1'], mockReward);

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

      const { result } = renderHook(() => useUpdateAchievementReward(), { wrapper });

      result.current.mutate({ id: 'reward-1', current_progress: 100 });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Check rollback
      const cachedData = queryClient.getQueryData<AchievementReward>([
        'achievement-rewards',
        'reward-1',
      ]);
      expect(cachedData?.current_progress).toBe(15); // Original value
    });
  });

  describe('useDeleteAchievementReward', () => {
    it('should delete challenge successfully', async () => {
      const mockSupabaseChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useDeleteAchievementReward(), { wrapper });

      result.current.mutate('reward-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabaseChain.delete).toHaveBeenCalled();
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('id', 'reward-1');
    });

    it('should remove from cache and invalidate queries on success', async () => {
      const mockSupabaseChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      // Seed cache
      queryClient.setQueryData(['achievement-rewards', 'reward-1'], mockReward);
      const removeSpy = vi.spyOn(queryClient, 'removeQueries');
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteAchievementReward(), { wrapper });

      result.current.mutate('reward-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(removeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['achievement-rewards', 'reward-1'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['achievement-rewards', 'list'] })
      );
    });

    it('should handle delete error', async () => {
      const mockSupabaseChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useDeleteAchievementReward(), { wrapper });

      result.current.mutate('reward-1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
