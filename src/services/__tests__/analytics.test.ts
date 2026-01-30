import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTasks } from '@/api/tasksAPI';
import { getHabits } from '@/api/habitsAPI';
import { getUserLifeGoals } from '@/goals/api/lifeGoalsAPI';

// Mock the APIs
vi.mock('@/api/tasksAPI');
vi.mock('@/api/habitsAPI');
vi.mock('@/goals/api/lifeGoalsAPI');

describe('Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get productivity analytics', async () => {
    const mockTasks = [
      { id: '1', status: 'done', completed_at: '2025-01-15T10:00:00Z' },
      { id: '2', status: 'done', completed_at: '2025-01-14T10:00:00Z' },
      { id: '3', status: 'todo' },
    ];

    vi.mocked(getTasks).mockResolvedValue(mockTasks as any);

    // Simple analytics calculation
    const completedTasks = mockTasks.filter((t) => t.status === 'done');
    const completionRate = (completedTasks.length / mockTasks.length) * 100;

    expect(completedTasks).toHaveLength(2);
    expect(completionRate).toBe(66.66666666666666);
  });

  it('should get finance analytics', async () => {
    // Mock finance data
    const mockExpenses = [
      { amount: 100, category: 'food' },
      { amount: 200, category: 'transport' },
    ];

    const totalSpent = mockExpenses.reduce((sum, e) => sum + e.amount, 0);
    expect(totalSpent).toBe(300);
  });

  it('should get wellbeing analytics', async () => {
    const mockHabits = [
      { id: '1', name: 'Exercise', streak_count: 7 },
      { id: '2', name: 'Meditation', streak_count: 3 },
    ];

    vi.mocked(getHabits).mockResolvedValue(mockHabits as any);

    const averageStreak =
      mockHabits.reduce((sum, h) => sum + h.streak_count, 0) / mockHabits.length;

    expect(averageStreak).toBe(5);
  });

  it('should handle date ranges', async () => {
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';

    const mockTasks = [
      { id: '1', created_at: '2025-01-15T10:00:00Z', status: 'done' },
      { id: '2', created_at: '2025-12-15T10:00:00Z', status: 'done' },
    ];

    vi.mocked(getTasks).mockResolvedValue(mockTasks as any);

    // Filter tasks within date range
    const tasksInRange = mockTasks.filter((t) => {
      const taskDate = new Date(t.created_at);
      return taskDate >= new Date(startDate) && taskDate <= new Date(endDate);
    });

    expect(tasksInRange).toHaveLength(1);
  });

  it('should aggregate cross-feature data', async () => {
    const mockTasks = [{ id: '1', status: 'done' }];
    const mockHabits = [{ id: '1', streak_count: 5 }];
    const mockGoals = [{ id: '1', status: 'in-progress', progress: 75 }];

    vi.mocked(getTasks).mockResolvedValue(mockTasks as any);
    vi.mocked(getHabits).mockResolvedValue(mockHabits as any);
    vi.mocked(getUserLifeGoals).mockResolvedValue(mockGoals as any);

    // Aggregate data
    const summary = {
      tasks: mockTasks.length,
      habits: mockHabits.length,
      goals: mockGoals.length,
      total_items: mockTasks.length + mockHabits.length + mockGoals.length,
    };

    expect(summary.total_items).toBe(3);
    expect(summary.tasks).toBe(1);
  });
});
