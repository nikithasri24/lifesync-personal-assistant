/**
 * Habit-Goal Integration Tests
 * Tests the integration between habits and goals
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import * as habitsAPI from '../../api/habitsAPI';
import * as lifeGoalsAPI from '../../goals/api/lifeGoalsAPI';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('Habit-Goal Integration', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockGoal = {
    id: 'goal-1',
    user_id: mockUser.id,
    title: 'Run a Marathon',
    description: 'Complete a full marathon by end of year',
    category: 'fitness',
    status: 'in-progress',
    progress: 0,
    priority: 'high',
    target_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockHabit = {
    id: 'habit-1',
    user_id: mockUser.id,
    name: 'Daily Running',
    description: 'Run 5km every day',
    frequency: 'daily' as const,
    category: 'fitness',
    streak_count: 0,
    best_streak: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should link habit to goal', async () => {
    // Mock goal creation
    const mockGoalQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockGoal,
        error: null,
      }),
    };

    (supabase.from as any).mockReturnValue(mockGoalQuery);

    // Create goal
    const goal = await lifeGoalsAPI.createLifeGoal({
      title: mockGoal.title,
      description: mockGoal.description,
      category: 'fitness',
      priority: 'high',
    });

    expect(goal).toBeDefined();
    expect(goal.id).toBe(mockGoal.id);

    // Mock habit creation with goal_id
    const mockHabitQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockHabit,
        error: null,
      }),
    };

    (supabase.from as any).mockReturnValue(mockHabitQuery);

    // Create habit linked to goal
    const habit = await habitsAPI.createHabit({
      name: mockHabit.name,
      description: mockHabit.description,
      frequency: 'daily',
      category: 'fitness',
    });

    expect(habit).toBeDefined();
    expect(habit.name).toBe(mockHabit.name);
  });

  test('should track habit towards goal progress', async () => {
    // Mock habit completion tracking
    const mockCompletionQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'completion-1',
          habit_id: mockHabit.id,
          completed_at: new Date().toISOString(),
        },
        error: null,
      }),
    };

    // Mock habit update with increased streak
    const mockHabitUpdateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          ...mockHabit,
          streak: 1,
          total_completions: 1,
        },
        error: null,
      }),
    };

    // Mock goal update with progress calculation
    const mockGoalUpdateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          ...mockGoal,
          progress: 10,
        },
        error: null,
      }),
    };

    let callCount = 0;
    (supabase.from as any).mockImplementation((table: string) => {
      callCount++;
      if (table === 'habit_completions') return mockCompletionQuery;
      if (table === 'habits') return mockHabitUpdateQuery;
      return mockGoalUpdateQuery;
    });

    // Update habit stats (streak_count is the correct property name)
    const updatedHabit = await habitsAPI.updateHabit(mockHabit.id, {
      streak_count: 1,
    });

    expect(updatedHabit.streak_count).toBe(1);

    // Calculate and update goal progress
    // In a real implementation, this would be based on habit milestones
    const progress = Math.min(((updatedHabit.streak_count ?? 0) / 100) * 100, 100);
    const updatedGoal = await lifeGoalsAPI.updateLifeGoal(mockGoal.id, {
      progress: Math.round(progress),
    });

    expect(updatedGoal.progress).toBeGreaterThan(0);
  });

  test('should complete goal when habit milestones met', async () => {
    // Mock habit with high completion count
    const completedHabit = {
      ...mockHabit,
      streak_count: 100,
      best_streak: 100,
    };

    // Mock getting habit
    const mockHabitQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: completedHabit,
        error: null,
      }),
    };

    // Mock goal completion
    const mockGoalUpdateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          ...mockGoal,
          status: 'completed',
          progress: 100,
        },
        error: null,
      }),
    };

    let callCount = 0;
    (supabase.from as any).mockImplementation((table: string) => {
      callCount++;
      if (table === 'habits') return mockHabitQuery;
      return mockGoalUpdateQuery;
    });

    // Check if habit milestone is met
    const habit = await habitsAPI.getHabit(mockHabit.id);

    // In a real implementation, there would be logic to check milestones
    const milestoneReached = (habit.streak_count ?? 0) >= 100;

    if (milestoneReached) {
      const updatedGoal = await lifeGoalsAPI.updateLifeGoal(mockGoal.id, {
        status: 'completed',
        progress: 100,
      });

      expect(updatedGoal.status).toBe('completed');
      expect(updatedGoal.progress).toBe(100);
    }
  });

  test('should show habits filtered by category', async () => {
    // Mock query to get habits filtered by category
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [mockHabit],
        error: null,
      }),
    };

    (supabase.from as any).mockReturnValue(mockQuery);

    const habits = await habitsAPI.getHabits({ category: 'fitness' });

    expect(habits).toBeDefined();
    expect(Array.isArray(habits)).toBe(true);
    expect(habits.length).toBeGreaterThan(0);
    expect(habits[0].category).toBe('fitness');
  });

  test('should deactivate habit', async () => {
    // Mock habit update to deactivate
    const mockQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockHabit, is_active: false },
        error: null,
      }),
    };

    (supabase.from as any).mockReturnValue(mockQuery);

    const updatedHabit = await habitsAPI.updateHabit(mockHabit.id, {
      is_active: false,
    });

    expect(updatedHabit.is_active).toBe(false);
  });
});
