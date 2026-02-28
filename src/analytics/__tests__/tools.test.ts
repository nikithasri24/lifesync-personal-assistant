import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyticsTools } from '../tools';

// Mock the analytics service
vi.mock('@/services/analytics', () => ({
  getProductivityAnalytics: vi.fn(),
  getFinanceAnalytics: vi.fn(),
  getWellbeingAnalytics: vi.fn(),
  getWeeklyReport: vi.fn(),
  getMonthlyReport: vi.fn(),
}));

import * as analyticsService from '@/services/analytics';

describe('Analytics AI Tools', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get_productivity_summary tool', () => {
    it('should get productivity summary', async () => {
      const mockSummary = {
        tasksCompleted: 2,
        tasksTotal: 3,
        habitsCompleted: 5,
        habitsTotal: 7,
        focusMinutes: 60,
        journalEntries: 3,
        projectsProgressed: 1,
        productivityScore: 75,
      };

      vi.mocked(analyticsService.getProductivityAnalytics).mockResolvedValue(mockSummary as any);

      const tool = analyticsTools.find((t) => t.definition.function.name === 'get_productivity_summary');
      expect(tool).toBeDefined();

      const result = await tool!.execute({}, mockUserId);

      expect(result.success).toBe(true);
      expect(result.summary ?? result.data).toBeDefined();
    });
  });

  describe('get_finance_summary tool', () => {
    it('should get finance summary', async () => {
      const mockSummary = {
        totalSpending: 500,
        totalIncome: 3000,
        spendingByCategory: { food: 200, transport: 100 },
        budgetCompliance: 80,
        netSavings: 2500,
      };

      vi.mocked(analyticsService.getFinanceAnalytics).mockResolvedValue(mockSummary as any);

      const tool = analyticsTools.find((t) => t.definition.function.name === 'get_finance_summary');
      expect(tool).toBeDefined();

      const result = await tool!.execute(
        {
          period: 'month',
        },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.summary ?? result.data).toBeDefined();
    });
  });

  describe('get_wellbeing_insights tool', () => {
    it('should get wellbeing insights', async () => {
      const mockInsights = {
        wellbeingScore: 80,
        journalStreak: 5,
      };

      vi.mocked(analyticsService.getWellbeingAnalytics).mockResolvedValue(mockInsights as any);

      const tool = analyticsTools.find((t) => t.definition.function.name === 'get_wellbeing_insights');
      expect(tool).toBeDefined();

      const result = await tool!.execute({}, mockUserId);

      expect(result.success).toBe(true);
      expect(result.insights ?? result.data).toBeDefined();
    });
  });

  describe('get_weekly_report tool', () => {
    it('should get weekly report', async () => {
      const mockReport = {
        productivity: { tasksCompleted: 5, tasksTotal: 8 },
        finance: { totalSpending: 200 },
        wellbeing: { wellbeingScore: 75 },
      };

      vi.mocked(analyticsService.getWeeklyReport).mockResolvedValue(mockReport as any);

      const tool = analyticsTools.find((t) => t.definition.function.name === 'get_weekly_report');
      expect(tool).toBeDefined();

      const result = await tool!.execute({}, mockUserId);

      expect(result.success).toBe(true);
      expect(result.report ?? result.data).toBeDefined();
    });
  });

  describe('get_monthly_report tool', () => {
    it('should get monthly report', async () => {
      const mockReport = {
        productivity: { tasksCompleted: 20, tasksTotal: 30 },
        finance: { totalSpending: 1000 },
        wellbeing: { wellbeingScore: 70 },
      };

      vi.mocked(analyticsService.getMonthlyReport).mockResolvedValue(mockReport as any);

      const tool = analyticsTools.find((t) => t.definition.function.name === 'get_monthly_report');
      expect(tool).toBeDefined();

      const result = await tool!.execute(
        {
          month: '2025-01',
        },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.report ?? result.data).toBeDefined();
    });
  });
});
