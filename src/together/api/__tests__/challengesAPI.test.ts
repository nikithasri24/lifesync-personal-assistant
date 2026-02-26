/**
 * Unit tests for challengesAPI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAchievementRewards,
  getAchievementReward,
  createAchievementReward,
  updateAchievementReward,
  deleteAchievementReward,
} from '../challengesAPI';
import { supabase } from '@/lib/supabase';
import type { AchievementReward } from '../../types';
import { requireAuth } from '@/api/apiWrapper';
import { getTogetherMergedConnection } from '../../hooks/useTogetherMergedMode';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('@/api/apiWrapper', () => ({
  apiCall: vi.fn((fn) => fn()),
  requireAuth: vi.fn(),
}));

vi.mock('../../hooks/useTogetherMergedMode', () => ({
  getTogetherMergedConnection: vi.fn(),
}));

vi.mock('@/services/logger');

describe('challengesAPI', () => {
  const mockUser = { id: 'user-123' };
  const mockChallenge: AchievementReward = {
    id: 'challenge-1',
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
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue(mockUser);
  });

  describe('getAchievementRewards', () => {
    it('should fetch challenges with connection ID', async () => {
      vi.mocked(getTogetherMergedConnection).mockResolvedValue(null);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [mockChallenge], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await getAchievementRewards('conn-1');

      expect(result).toEqual([mockChallenge]);
      expect(supabase.from).toHaveBeenCalledWith('achievement_rewards');
      expect(mockQuery.eq).toHaveBeenCalledWith('connection_id', 'conn-1');
    });

    it('should fetch challenges for both users in merged mode', async () => {
      vi.mocked(getTogetherMergedConnection).mockResolvedValue({
        connectionId: 'conn-1',
        partnerId: 'user-456',
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({ data: [mockChallenge], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await getAchievementRewards();

      expect(result).toEqual([mockChallenge]);
      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('creator_id.eq.user-123')
      );
      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('creator_id.eq.user-456')
      );
    });

    it('should return empty array when no connection and not merged', async () => {
      vi.mocked(getTogetherMergedConnection).mockResolvedValue(null);

      const result = await getAchievementRewards();

      expect(result).toEqual([]);
    });

    it('should handle errors', async () => {
      vi.mocked(getTogetherMergedConnection).mockResolvedValue(null);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(getAchievementRewards('conn-1')).rejects.toThrow();
    });
  });

  describe('getAchievementReward', () => {
    it('should fetch single challenge by ID', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockChallenge, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await getAchievementReward('challenge-1');

      expect(result).toEqual(mockChallenge);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'challenge-1');
    });

    it('should handle errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(getAchievementReward('challenge-1')).rejects.toThrow();
    });
  });

  describe('createAchievementReward', () => {
    it('should create a new challenge', async () => {
      const newChallenge = {
        connection_id: 'conn-1',
        title: 'Reading Challenge',
        description: 'Read 10 books',
        target_value: 10,
        unit: 'books',
        reward_description: 'Weekend getaway!',
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockChallenge, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await createAchievementReward(newChallenge);

      expect(result).toEqual(mockChallenge);
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newChallenge,
          creator_id: mockUser.id,
          status: 'active',
          current_progress: 0,
        })
      );
    });

    it('should handle errors', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(createAchievementReward({
        connection_id: 'conn-1',
        title: 'Test',
        target_value: 10,
      })).rejects.toThrow();
    });
  });

  describe('updateAchievementReward', () => {
    it('should update an existing challenge', async () => {
      const updates = { current_progress: 20 };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ...mockChallenge, ...updates }, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await updateAchievementReward('challenge-1', updates);

      expect(result.current_progress).toBe(20);
      expect(mockQuery.update).toHaveBeenCalledWith(updates);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'challenge-1');
    });

    it('should update status', async () => {
      const updates = { status: 'completed' as const };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ...mockChallenge, ...updates }, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await updateAchievementReward('challenge-1', updates);

      expect(result.status).toBe('completed');
      expect(mockQuery.update).toHaveBeenCalledWith(updates);
    });

    it('should handle errors', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(updateAchievementReward('challenge-1', { current_progress: 20 })).rejects.toThrow();
    });
  });

  describe('deleteAchievementReward', () => {
    it('should delete a challenge', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await deleteAchievementReward('challenge-1');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'challenge-1');
    });

    it('should handle errors', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(deleteAchievementReward('challenge-1')).rejects.toThrow();
    });
  });
});
