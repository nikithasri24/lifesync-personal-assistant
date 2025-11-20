import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  getDreams,
  getDream,
  createDream,
  updateDream,
  deleteDream,
  type CreateGoalInput,
  type UpdateGoalInput,
  type CreateDreamInput,
  type UpdateDreamInput,
  type GoalFilters,
} from '../goalsAPI';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('goalsAPI', () => {
  const mockUser = { id: 'test-user-789' };
  const mockGoal = {
    id: 'goal-123',
    user_id: 'test-user-789',
    title: 'Learn TypeScript',
    description: 'Master TypeScript for better code quality',
    category: 'learning',
    target_date: '2025-12-31',
    status: 'active',
    progress: 25,
    priority: 'high',
    created_at: '2025-11-01T08:00:00Z',
    updated_at: '2025-11-19T09:00:00Z',
  };

  const mockDream = {
    id: 'dream-456',
    user_id: 'test-user-789',
    title: 'Visit Japan',
    description: 'Experience cherry blossoms in Kyoto',
    category: 'travel',
    notes: 'Save $5000 for the trip',
    created_at: '2025-10-15T10:00:00Z',
    last_updated: '2025-11-19T11:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
    });
  });

  describe('Goals API', () => {
    describe('getGoals', () => {
      it('should fetch all goals for authenticated user', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [mockGoal],
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const result = await getGoals();

        expect(supabase.from).toHaveBeenCalledWith('goals');
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
        expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('Learn TypeScript');
      });

      it('should apply status filter when provided', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data: [], error: null })),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const filters: GoalFilters = { status: 'completed' };
        await getGoals(filters);

        // eq should be called twice: once for user_id, once for status
        expect(mockQuery.eq).toHaveBeenCalledTimes(2);
        expect(mockQuery.eq).toHaveBeenCalledWith('status', 'completed');
      });

      it('should apply category filter when provided', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data: [], error: null })),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const filters: GoalFilters = { category: 'health' };
        await getGoals(filters);

        expect(mockQuery.eq).toHaveBeenCalledWith('category', 'health');
      });

      it('should apply priority filter when provided', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data: [], error: null })),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const filters: GoalFilters = { priority: 'high' };
        await getGoals(filters);

        expect(mockQuery.eq).toHaveBeenCalledWith('priority', 'high');
      });

      it('should throw error when not authenticated', async () => {
        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: null },
        });

        await expect(getGoals()).rejects.toThrow('Not authenticated');
      });
    });

    describe('getGoal', () => {
      it('should fetch a single goal by id', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockGoal,
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const result = await getGoal('goal-123');

        expect(mockQuery.eq).toHaveBeenCalledWith('id', 'goal-123');
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
        expect(result.title).toBe('Learn TypeScript');
      });

      it('should throw error when goal not found', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        await expect(getGoal('nonexistent')).rejects.toThrow('Goal not found');
      });
    });

    describe('createGoal', () => {
      it('should create a new goal with all fields', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockGoal,
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const input: CreateGoalInput = {
          title: 'Learn TypeScript',
          description: 'Master TypeScript for better code quality',
          category: 'learning',
          targetDate: new Date('2025-12-31'),
          status: 'active',
          progress: 25,
          priority: 'high',
        };

        const result = await createGoal(input);

        expect(mockQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: mockUser.id,
            title: 'Learn TypeScript',
            description: 'Master TypeScript for better code quality',
            category: 'learning',
            target_date: '2025-12-31',
            status: 'active',
            progress: 25,
            priority: 'high',
          })
        );
        expect(result.title).toBe('Learn TypeScript');
      });

      it('should create a minimal goal with only required fields', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockGoal, description: null, category: null },
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const input: CreateGoalInput = {
          title: 'Simple Goal',
        };

        await createGoal(input);

        expect(mockQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Simple Goal',
            description: null,
            category: null,
            status: 'active',
            progress: 0,
            priority: 'medium',
          })
        );
      });
    });

    describe('updateGoal', () => {
      it('should update goal fields', async () => {
        const mockQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockGoal, progress: 50, status: 'on_hold' },
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const updates: UpdateGoalInput = {
          progress: 50,
          status: 'on_hold',
        };

        const result = await updateGoal('goal-123', updates);

        expect(mockQuery.update).toHaveBeenCalled();
        expect(result.progress).toBe(50);
        expect(result.status).toBe('on_hold');
      });
    });

    describe('deleteGoal', () => {
      it('should delete a goal', async () => {
        const mockDelete = vi.fn().mockReturnThis();
        const mockEq1 = vi.fn().mockReturnThis();
        const mockEq2 = vi.fn().mockResolvedValue({ error: null });

        const mockQuery = {
          delete: mockDelete,
        };

        mockDelete.mockReturnValue({ eq: mockEq1 });
        mockEq1.mockReturnValue({ eq: mockEq2 });

        (supabase.from as any).mockReturnValue(mockQuery);

        await deleteGoal('goal-123');

        expect(mockDelete).toHaveBeenCalled();
        expect(mockEq1).toHaveBeenCalledWith('id', 'goal-123');
        expect(mockEq2).toHaveBeenCalledWith('user_id', mockUser.id);
      });
    });
  });

  describe('Dreams API', () => {
    describe('getDreams', () => {
      it('should fetch all dreams for authenticated user', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [mockDream],
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const result = await getDreams();

        expect(supabase.from).toHaveBeenCalledWith('dreams');
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
        expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('Visit Japan');
      });

      it('should throw error when not authenticated', async () => {
        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: null },
        });

        await expect(getDreams()).rejects.toThrow('Not authenticated');
      });
    });

    describe('getDream', () => {
      it('should fetch a single dream by id', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockDream,
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const result = await getDream('dream-456');

        expect(mockQuery.eq).toHaveBeenCalledWith('id', 'dream-456');
        expect(result.title).toBe('Visit Japan');
      });

      it('should throw error when dream not found', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        await expect(getDream('nonexistent')).rejects.toThrow('Dream not found');
      });
    });

    describe('createDream', () => {
      it('should create a new dream', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockDream,
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const input: CreateDreamInput = {
          title: 'Visit Japan',
          description: 'Experience cherry blossoms in Kyoto',
          category: 'travel',
          notes: 'Save $5000 for the trip',
        };

        const result = await createDream(input);

        expect(mockQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: mockUser.id,
            title: 'Visit Japan',
            description: 'Experience cherry blossoms in Kyoto',
            category: 'travel',
            notes: 'Save $5000 for the trip',
          })
        );
        expect(result.title).toBe('Visit Japan');
      });

      it('should create a minimal dream', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockDream, description: null, category: null, notes: null },
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const input: CreateDreamInput = {
          title: 'Simple Dream',
        };

        await createDream(input);

        expect(mockQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Simple Dream',
            description: null,
            category: null,
            notes: null,
          })
        );
      });
    });

    describe('updateDream', () => {
      it('should update dream fields', async () => {
        const mockQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockDream, notes: 'Updated notes' },
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const updates: UpdateDreamInput = {
          notes: 'Updated notes',
        };

        const result = await updateDream('dream-456', updates);

        expect(mockQuery.update).toHaveBeenCalled();
        expect(result.notes).toBe('Updated notes');
      });
    });

    describe('deleteDream', () => {
      it('should delete a dream', async () => {
        const mockDelete = vi.fn().mockReturnThis();
        const mockEq1 = vi.fn().mockReturnThis();
        const mockEq2 = vi.fn().mockResolvedValue({ error: null });

        const mockQuery = {
          delete: mockDelete,
        };

        mockDelete.mockReturnValue({ eq: mockEq1 });
        mockEq1.mockReturnValue({ eq: mockEq2 });

        (supabase.from as any).mockReturnValue(mockQuery);

        await deleteDream('dream-456');

        expect(mockDelete).toHaveBeenCalled();
        expect(mockEq1).toHaveBeenCalledWith('id', 'dream-456');
        expect(mockEq2).toHaveBeenCalledWith('user_id', mockUser.id);
      });
    });
  });
});
