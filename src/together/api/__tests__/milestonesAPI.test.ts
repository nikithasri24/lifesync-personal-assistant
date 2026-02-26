/**
 * Unit tests for milestonesAPI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getMilestones,
  getUpcomingMilestones,
  getMilestone,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from '../milestonesAPI';
import { supabase } from '@/lib/supabase';
import type { Milestone, MilestoneFilters } from '../../types';
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

describe('milestonesAPI', () => {
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
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue(mockUser);
  });

  describe('getMilestones', () => {
    it('should fetch milestones for current user', async () => {
      vi.mocked(getTogetherMergedConnection).mockResolvedValue(null);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [mockMilestone], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await getMilestones();

      expect(result).toEqual([mockMilestone]);
      expect(supabase.from).toHaveBeenCalledWith('milestones');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('should fetch milestones for both users in merged mode', async () => {
      vi.mocked(getTogetherMergedConnection).mockResolvedValue({
        connectionId: 'conn-1',
        partnerId: 'user-456',
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({ data: [mockMilestone], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await getMilestones();

      expect(result).toEqual([mockMilestone]);
      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('user_id.eq.user-123')
      );
    });

    it('should apply type filter', async () => {
      vi.mocked(getTogetherMergedConnection).mockResolvedValue(null);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      // Chain: user_id -> milestone_type -> result
      mockQuery.eq.mockReturnValueOnce(mockQuery).mockReturnValueOnce(mockQuery);
      mockQuery.eq.mockResolvedValueOnce({ data: [mockMilestone], error: null });

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const filters: MilestoneFilters = { type: 'anniversary' };
      await getMilestones(filters);

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockQuery.eq).toHaveBeenCalledWith('milestone_type', 'anniversary');
    });

    it('should apply for_whom filter', async () => {
      vi.mocked(getTogetherMergedConnection).mockResolvedValue(null);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      // Chain: user_id -> for_whom -> result
      mockQuery.eq.mockReturnValueOnce(mockQuery).mockReturnValueOnce(mockQuery);
      mockQuery.eq.mockResolvedValueOnce({ data: [mockMilestone], error: null });

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const filters: MilestoneFilters = { for_whom: 'me' };
      await getMilestones(filters);

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockQuery.eq).toHaveBeenCalledWith('for_whom', 'me');
    });

    it('should filter upcoming milestones client-side', async () => {
      vi.mocked(getTogetherMergedConnection).mockResolvedValue(null);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const pastMilestone = { ...mockMilestone, milestone_date: '2020-01-01' };
      const futureMilestone = { ...mockMilestone, milestone_date: futureDate.toISOString().split('T')[0] };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [pastMilestone, futureMilestone], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const filters: MilestoneFilters = { upcoming_only: true };
      const result = await getMilestones(filters);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(futureMilestone);
    });

    it('should filter past milestones client-side', async () => {
      vi.mocked(getTogetherMergedConnection).mockResolvedValue(null);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const pastMilestone = { ...mockMilestone, milestone_date: '2020-01-01' };
      const futureMilestone = { ...mockMilestone, milestone_date: futureDate.toISOString().split('T')[0] };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [pastMilestone, futureMilestone], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const filters: MilestoneFilters = { past_only: true };
      const result = await getMilestones(filters);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(pastMilestone);
    });

    it('should handle errors', async () => {
      vi.mocked(getTogetherMergedConnection).mockResolvedValue(null);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(getMilestones()).rejects.toThrow();
    });
  });

  describe('getUpcomingMilestones', () => {
    it('should fetch upcoming milestones from view', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [mockMilestone], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await getUpcomingMilestones();

      expect(result).toEqual([mockMilestone]);
      expect(supabase.from).toHaveBeenCalledWith('upcoming_milestones');
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });

    it('should handle errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'View error' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(getUpcomingMilestones()).rejects.toThrow();
    });
  });

  describe('getMilestone', () => {
    it('should fetch single milestone by ID', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockMilestone, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await getMilestone('milestone-1');

      expect(result).toEqual(mockMilestone);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'milestone-1');
    });

    it('should return null when milestone not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await getMilestone('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(getMilestone('milestone-1')).rejects.toThrow();
    });
  });

  describe('createMilestone', () => {
    it('should create a new milestone', async () => {
      const newMilestone = {
        title: 'Birthday',
        milestone_date: '2024-12-25',
        milestone_type: 'birthday' as const,
        for_whom: 'me' as const,
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMilestone, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await createMilestone(newMilestone);

      expect(result).toEqual(mockMilestone);
      expect(mockQuery.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        ...newMilestone,
      });
    });

    it('should handle errors', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(createMilestone({
        title: 'Test',
        milestone_date: '2024-01-01',
        milestone_type: 'custom',
        for_whom: 'both',
      })).rejects.toThrow();
    });
  });

  describe('updateMilestone', () => {
    it('should update an existing milestone', async () => {
      const updates = { title: 'Updated Anniversary' };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ...mockMilestone, ...updates }, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await updateMilestone('milestone-1', updates);

      expect(result.title).toBe('Updated Anniversary');
      expect(mockQuery.update).toHaveBeenCalledWith(updates);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'milestone-1');
    });

    it('should handle errors', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(updateMilestone('milestone-1', { title: 'Test' })).rejects.toThrow();
    });
  });

  describe('deleteMilestone', () => {
    it('should delete a milestone', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await deleteMilestone('milestone-1');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'milestone-1');
    });

    it('should handle errors', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(deleteMilestone('milestone-1')).rejects.toThrow();
    });
  });
});
