import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyticsTools } from '../tools';
import * as tasksAPI from '@/api/tasksAPI';
import * as habitsAPI from '@/api/habitsAPI';

// Mock the APIs
vi.mock('@/api/tasksAPI');
vi.mock('@/api/habitsAPI');

describe('Analytics AI Tools', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get_productivity_summary tool', () => {
    it('should get productivity summary', async () => {
      const mockTasks = [
        { id: '1', status: 'done', priority: 'high', completed_at: '2025-01-15T10:00:00Z' },
        { id: '2', status: 'done', priority: 'medium', completed_at: '2025-01-14T10:00:00Z' },
        { id: '3', status: 'todo', priority: 'low' },
      ];

      vi.mocked(tasksAPI.getTasks).mockResolvedValue(mockTasks as any);

      const tool = analyticsTools.find((t) => t.definition.function.name === 'get_productivity_summary');
      expect(tool).toBeDefined();

      const result = await tool!.execute({}, mockUserId);

      expect(result.success).toBe(true);
      expect(result.summary).toBeDefined();
    });
  });

  describe('get_finance_summary tool', () => {
    it('should get finance summary', async () => {
      const tool = analyticsTools.find((t) => t.definition.function.name === 'get_finance_summary');
      expect(tool).toBeDefined();

      const result = await tool!.execute(
        {
          period: 'month',
        },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.summary).toBeDefined();
    });
  });

  describe('get_wellbeing_insights tool', () => {
    it('should get wellbeing insights', async () => {
      const mockHabits = [
        { id: '1', name: 'Exercise', streak_count: 7, category: 'health' },
        { id: '2', name: 'Meditation', streak_count: 3, category: 'mindfulness' },
      ];

      vi.mocked(habitsAPI.getHabits).mockResolvedValue(mockHabits as any);

      const tool = analyticsTools.find((t) => t.definition.function.name === 'get_wellbeing_insights');
      expect(tool).toBeDefined();

      const result = await tool!.execute({}, mockUserId);

      expect(result.success).toBe(true);
      expect(result.insights).toBeDefined();
    });
  });

  describe('get_weekly_report tool', () => {
    it('should get weekly report', async () => {
      const mockTasks = [
        { id: '1', status: 'done', completed_at: '2025-01-15T10:00:00Z' },
        { id: '2', status: 'done', completed_at: '2025-01-14T10:00:00Z' },
      ];

      vi.mocked(tasksAPI.getTasks).mockResolvedValue(mockTasks as any);

      const tool = analyticsTools.find((t) => t.definition.function.name === 'get_weekly_report');
      expect(tool).toBeDefined();

      const result = await tool!.execute({}, mockUserId);

      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
    });
  });

  describe('get_monthly_report tool', () => {
    it('should get monthly report', async () => {
      const tool = analyticsTools.find((t) => t.definition.function.name === 'get_monthly_report');
      expect(tool).toBeDefined();

      const result = await tool!.execute(
        {
          month: '2025-01',
        },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
    });
  });
});
