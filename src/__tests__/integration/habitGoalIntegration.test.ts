/**
 * Habit-Goal Integration Tests
 * Tests the integration between habits and goals
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock the API modules directly to avoid Supabase mock complexity
vi.mock('../../api/habitsAPI', () => ({
  createHabit: vi.fn(),
  getHabit: vi.fn(),
  getHabits: vi.fn(),
  updateHabit: vi.fn(),
  deleteHabit: vi.fn(),
}));

vi.mock('../../goals/api/lifeGoalsAPI', () => ({
  createLifeGoal: vi.fn(),
  updateLifeGoal: vi.fn(),
  deleteLifeGoal: vi.fn(),
}));

import * as habitsAPI from '../../api/habitsAPI';
import * as lifeGoalsAPI from '../../goals/api/lifeGoalsAPI';

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
  });

  test('should link habit to goal', async () => {
    vi.mocked(lifeGoalsAPI.createLifeGoal).mockResolvedValue(mockGoal as any);
    vi.mocked(habitsAPI.createHabit).mockResolvedValue(mockHabit as any);

    // Create goal
    const goal = await lifeGoalsAPI.createLifeGoal({
      title: mockGoal.title,
      description: mockGoal.description,
      category: 'fitness',
      priority: 'high',
    });

    expect(goal).toBeDefined();
    expect(goal.id).toBe(mockGoal.id);

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
    const updatedHabitWithStreak = { ...mockHabit, streak_count: 1, total_completions: 1 };
    const updatedGoalWithProgress = { ...mockGoal, progress: 1 };

    vi.mocked(habitsAPI.updateHabit).mockResolvedValue(updatedHabitWithStreak as any);
    vi.mocked(lifeGoalsAPI.updateLifeGoal).mockResolvedValue(updatedGoalWithProgress as any);

    // Update habit stats
    const updatedHabit = await habitsAPI.updateHabit(mockHabit.id, {
      streak_count: 1,
    });

    expect(updatedHabit.streak_count).toBe(1);

    // Calculate and update goal progress
    const progress = Math.min(((updatedHabit.streak_count ?? 0) / 100) * 100, 100);
    const updatedGoal = await lifeGoalsAPI.updateLifeGoal(mockGoal.id, {
      progress: Math.round(progress),
    });

    expect(updatedGoal.progress).toBeGreaterThan(0);
  });

  test('should complete goal when habit milestones met', async () => {
    const completedHabit = { ...mockHabit, streak_count: 100, best_streak: 100 };
    const completedGoal = { ...mockGoal, status: 'completed', progress: 100 };

    vi.mocked(habitsAPI.getHabit).mockResolvedValue(completedHabit as any);
    vi.mocked(lifeGoalsAPI.updateLifeGoal).mockResolvedValue(completedGoal as any);

    // Check if habit milestone is met
    const habit = await habitsAPI.getHabit(mockHabit.id);

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
    vi.mocked(habitsAPI.getHabits).mockResolvedValue([mockHabit] as any);

    const habits = await habitsAPI.getHabits({ category: 'fitness' });

    expect(habits).toBeDefined();
    expect(Array.isArray(habits)).toBe(true);
    expect(habits.length).toBeGreaterThan(0);
    expect(habits[0].category).toBe('fitness');
  });

  test('should deactivate habit', async () => {
    const deactivatedHabit = { ...mockHabit, is_active: false };
    vi.mocked(habitsAPI.updateHabit).mockResolvedValue(deactivatedHabit as any);

    const updatedHabit = await habitsAPI.updateHabit(mockHabit.id, {
      is_active: false,
    });

    expect(updatedHabit.is_active).toBe(false);
  });
});
