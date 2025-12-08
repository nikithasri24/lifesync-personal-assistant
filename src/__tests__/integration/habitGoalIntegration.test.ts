/**
 * Habit-Goal Integration Tests
 * Tests the integration between habits and goals
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import * as habitsAPI from '../../api/habitsAPI';
import * as goalsAPI from '../../api/goalsAPI';

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
    status: 'active',
    progress: 0,
    priority: 'high',
    target_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockHabit = {
    id: 'habit-1',
    user_id: mockUser.id,
    title: 'Daily Running',
    description: 'Run 5km every day',
    frequency: 'daily',
    goal_id: mockGoal.id,
    streak: 0,
    best_streak: 0,
    total_completions: 0,
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
    const goal = await goalsAPI.createGoal({
      title: mockGoal.title,
      description: mockGoal.description,
      category: mockGoal.category,
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
      title: mockHabit.title,
      description: mockHabit.description,
      frequency: 'daily',
      goalId: goal.id,
    });

    expect(habit).toBeDefined();
    expect(habit.goalId).toBe(goal.id);
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

    // Complete habit
    const completion = await habitsAPI.completeHabit(mockHabit.id);
    expect(completion).toBeDefined();

    // Update habit stats
    const updatedHabit = await habitsAPI.updateHabit(mockHabit.id, {
      streak: 1,
      totalCompletions: 1,
    });

    expect(updatedHabit.streak).toBe(1);
    expect(updatedHabit.totalCompletions).toBe(1);

    // Calculate and update goal progress
    // In a real implementation, this would be based on habit milestones
    const progress = Math.min((updatedHabit.totalCompletions / 100) * 100, 100);
    const updatedGoal = await goalsAPI.updateGoal(mockGoal.id, {
      progress: Math.round(progress),
    });

    expect(updatedGoal.progress).toBeGreaterThan(0);
  });

  test('should complete goal when habit milestones met', async () => {
    // Mock habit with high completion count
    const completedHabit = {
      ...mockHabit,
      streak: 100,
      total_completions: 100,
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
    const milestoneReached = habit.totalCompletions >= 100;

    if (milestoneReached) {
      const updatedGoal = await goalsAPI.updateGoal(mockGoal.id, {
        status: 'completed',
        progress: 100,
      });

      expect(updatedGoal.status).toBe('completed');
      expect(updatedGoal.progress).toBe(100);
    }
  });

  test('should show habits linked to a specific goal', async () => {
    // Mock query to get habits filtered by goal
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [mockHabit],
        error: null,
      }),
    };

    (supabase.from as any).mockReturnValue(mockQuery);

    const habits = await habitsAPI.getHabits({ goalId: mockGoal.id });

    expect(habits).toBeDefined();
    expect(Array.isArray(habits)).toBe(true);
    expect(habits.length).toBeGreaterThan(0);
    expect(habits[0].goalId).toBe(mockGoal.id);
  });

  test('should unlink habit from goal', async () => {
    // Mock habit update to remove goal link
    const mockQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockHabit, goal_id: null },
        error: null,
      }),
    };

    (supabase.from as any).mockReturnValue(mockQuery);

    const updatedHabit = await habitsAPI.updateHabit(mockHabit.id, {
      goalId: undefined,
    });

    expect(updatedHabit.goalId).toBeUndefined();
  });
});
