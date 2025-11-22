import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateGoalRecommendation,
  generateExpectedPath,
  generateProjectedPath,
  calculateProgressPercentage,
  getStatusColor,
} from '../goalCalculations';
import type { Goal, GoalProgressPoint } from '../../types';

describe('goalCalculations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createMockGoal = (overrides?: Partial<Goal>): Goal => ({
    id: 'goal-1',
    name: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 5000,
    startingAmount: 0,
    dueDateISO: '2026-01-01T00:00:00Z',
    type: 'savings',
    createdAtISO: '2025-01-01T00:00:00Z',
    updatedAtISO: '2025-06-01T00:00:00Z',
    ...overrides,
  });

  describe('calculateGoalRecommendation', () => {
    it('should calculate recommendation for goal on track', () => {
      const goal = createMockGoal({
        currentAmount: 5000,
        targetAmount: 10000,
        dueDateISO: '2026-01-01T00:00:00Z',
      });

      const result = calculateGoalRecommendation(goal);

      expect(result.requiredMonthlyContribution).toBeGreaterThan(0);
      expect(result.daysRemaining).toBeGreaterThan(0);
      expect(result.monthsRemaining).toBeGreaterThan(0);
      expect(result.status).toBeDefined();
      expect(result.message).toBeDefined();
    });

    it('should mark goal as ahead when progress exceeds time', () => {
      const goal = createMockGoal({
        currentAmount: 8000,
        targetAmount: 10000,
        startingAmount: 0,
        createdAtISO: '2025-01-01T00:00:00Z',
        dueDateISO: '2026-01-01T00:00:00Z',
      });

      const result = calculateGoalRecommendation(goal);

      expect(result.status).toBe('ahead');
      expect(result.onTrack).toBe(true);
      expect(result.message).toContain('Ahead');
    });

    it('should mark goal as behind when progress lags', () => {
      const goal = createMockGoal({
        currentAmount: 2000,
        targetAmount: 10000,
        startingAmount: 0,
        createdAtISO: '2025-01-01T00:00:00Z',
        dueDateISO: '2026-01-01T00:00:00Z',
      });

      const result = calculateGoalRecommendation(goal);

      expect(result.status).toBe('behind');
      expect(result.onTrack).toBe(false);
    });

    it('should mark completed goal as ahead', () => {
      const goal = createMockGoal({
        currentAmount: 10000,
        targetAmount: 10000,
      });

      const result = calculateGoalRecommendation(goal);

      expect(result.status).toBe('ahead');
      expect(result.message).toContain('Goal reached');
    });

    it('should mark overdue goal as at-risk', () => {
      const goal = createMockGoal({
        currentAmount: 5000,
        targetAmount: 10000,
        dueDateISO: '2025-05-01T00:00:00Z', // Past date
      });

      const result = calculateGoalRecommendation(goal);

      expect(result.status).toBe('at-risk');
      expect(result.daysRemaining).toBe(0);
    });

    it('should calculate required monthly contribution correctly', () => {
      const goal = createMockGoal({
        currentAmount: 4000,
        targetAmount: 10000,
        dueDateISO: '2025-12-01T00:00:00Z', // 6 months away
      });

      const result = calculateGoalRecommendation(goal);

      // Need 6000 more in ~6 months = ~1000/month
      expect(result.requiredMonthlyContribution).toBeGreaterThan(900);
      expect(result.requiredMonthlyContribution).toBeLessThan(1100);
    });

    it('should use progress history when available', () => {
      const goal = createMockGoal({
        currentAmount: 5000,
        targetAmount: 10000,
      });

      const history: GoalProgressPoint[] = [
        { dateISO: '2025-01-01T00:00:00Z', amount: 0 },
        { dateISO: '2025-03-01T00:00:00Z', amount: 2000 },
        { dateISO: '2025-05-01T00:00:00Z', amount: 4000 },
      ];

      const result = calculateGoalRecommendation(goal, history);

      expect(result.projectedCompletionISO).toBeDefined();
    });

    it('should handle goal with very short timeline', () => {
      const goal = createMockGoal({
        currentAmount: 5000,
        targetAmount: 10000,
        dueDateISO: '2025-06-15T00:00:00Z', // 14 days away
      });

      const result = calculateGoalRecommendation(goal);

      expect(result.daysRemaining).toBeLessThan(30);
    });

    it('should handle goal already past target', () => {
      const goal = createMockGoal({
        currentAmount: 12000,
        targetAmount: 10000,
      });

      const result = calculateGoalRecommendation(goal);

      expect(result.status).toBe('ahead');
      expect(result.message).toContain('ahead');
    });
  });

  describe('generateExpectedPath', () => {
    it('should generate linear progression path', () => {
      const goal = createMockGoal({
        startingAmount: 0,
        currentAmount: 5000,
        targetAmount: 10000,
        createdAtISO: '2025-01-01T00:00:00Z',
        dueDateISO: '2026-01-01T00:00:00Z',
      });

      const path = generateExpectedPath(goal, 12);

      expect(path).toHaveLength(13); // 0 to 12 inclusive
      expect(path[0].amount).toBe(0);
      expect(path[12].amount).toBe(10000);
    });

    it('should generate evenly spaced points', () => {
      const goal = createMockGoal();
      const path = generateExpectedPath(goal, 4);

      expect(path).toHaveLength(5);
      expect(path[0].amount).toBe(goal.startingAmount);
      expect(path[4].amount).toBe(goal.targetAmount);
    });

    it('should mark all points as Expected', () => {
      const goal = createMockGoal();
      const path = generateExpectedPath(goal);

      expect(path.every(p => p.note === 'Expected')).toBe(true);
    });

    it('should handle custom number of points', () => {
      const goal = createMockGoal();

      expect(generateExpectedPath(goal, 6)).toHaveLength(7);
      expect(generateExpectedPath(goal, 24)).toHaveLength(25);
    });
  });

  describe('generateProjectedPath', () => {
    it('should project based on monthly rate', () => {
      const goal = createMockGoal({
        currentAmount: 5000,
        targetAmount: 10000,
        dueDateISO: '2025-12-01T00:00:00Z',
      });

      const monthlyRate = 1000; // Saving $1000/month
      const path = generateProjectedPath(goal, monthlyRate, 6);

      expect(path).toHaveLength(7);
      expect(path[0].amount).toBe(5000);
      expect(path[path.length - 1].amount).toBeGreaterThan(5000);
    });

    it('should cap at target amount', () => {
      const goal = createMockGoal({
        currentAmount: 9000,
        targetAmount: 10000,
      });

      const monthlyRate = 1000; // Would exceed target
      const path = generateProjectedPath(goal, monthlyRate, 6);

      expect(path.every(p => p.amount <= 10000)).toBe(true);
    });

    it('should mark all points as Projected', () => {
      const goal = createMockGoal();
      const path = generateProjectedPath(goal, 500);

      expect(path.every(p => p.note === 'Projected')).toBe(true);
    });

    it('should handle zero monthly rate', () => {
      const goal = createMockGoal({
        currentAmount: 5000,
      });

      const path = generateProjectedPath(goal, 0, 6);

      expect(path.every(p => p.amount === 5000)).toBe(true);
    });

    it('should handle negative monthly rate', () => {
      const goal = createMockGoal({
        currentAmount: 5000,
      });

      const path = generateProjectedPath(goal, -500, 6);

      // Amount shouldn't go negative below current
      expect(path[0].amount).toBe(5000);
    });
  });

  describe('calculateProgressPercentage', () => {
    it('should calculate percentage for partial progress', () => {
      const goal = createMockGoal({
        startingAmount: 0,
        currentAmount: 5000,
        targetAmount: 10000,
      });

      const percentage = calculateProgressPercentage(goal);
      expect(percentage).toBe(50);
    });

    it('should return 100 for completed goal', () => {
      const goal = createMockGoal({
        startingAmount: 0,
        currentAmount: 10000,
        targetAmount: 10000,
      });

      const percentage = calculateProgressPercentage(goal);
      expect(percentage).toBe(100);
    });

    it('should cap at 100 for exceeded goal', () => {
      const goal = createMockGoal({
        startingAmount: 0,
        currentAmount: 12000,
        targetAmount: 10000,
      });

      const percentage = calculateProgressPercentage(goal);
      expect(percentage).toBe(100);
    });

    it('should return 0 for no progress', () => {
      const goal = createMockGoal({
        startingAmount: 0,
        currentAmount: 0,
        targetAmount: 10000,
      });

      const percentage = calculateProgressPercentage(goal);
      expect(percentage).toBe(0);
    });

    it('should handle non-zero starting amount', () => {
      const goal = createMockGoal({
        startingAmount: 2000,
        currentAmount: 6000,
        targetAmount: 10000,
      });

      const percentage = calculateProgressPercentage(goal);
      expect(percentage).toBe(50); // 4000 of 8000 needed
    });

    it('should handle zero total needed', () => {
      const goal = createMockGoal({
        startingAmount: 10000,
        currentAmount: 10000,
        targetAmount: 10000,
      });

      const percentage = calculateProgressPercentage(goal);
      expect(percentage).toBe(0);
    });
  });

  describe('getStatusColor', () => {
    it('should return emerald colors for ahead status', () => {
      const colors = getStatusColor('ahead');
      expect(colors.bg).toContain('emerald');
      expect(colors.text).toContain('emerald');
      expect(colors.ring).toContain('emerald');
      expect(colors.progress).toBe('#10b981');
    });

    it('should return blue colors for on-track status', () => {
      const colors = getStatusColor('on-track');
      expect(colors.bg).toContain('blue');
      expect(colors.text).toContain('blue');
      expect(colors.ring).toContain('blue');
      expect(colors.progress).toBe('#3b82f6');
    });

    it('should return amber colors for behind status', () => {
      const colors = getStatusColor('behind');
      expect(colors.bg).toContain('amber');
      expect(colors.text).toContain('amber');
      expect(colors.ring).toContain('amber');
      expect(colors.progress).toBe('#f59e0b');
    });

    it('should return red colors for at-risk status', () => {
      const colors = getStatusColor('at-risk');
      expect(colors.bg).toContain('red');
      expect(colors.text).toContain('red');
      expect(colors.ring).toContain('red');
      expect(colors.progress).toBe('#ef4444');
    });

    it('should return consistent color object structure', () => {
      const statuses: Array<'ahead' | 'on-track' | 'behind' | 'at-risk'> =
        ['ahead', 'on-track', 'behind', 'at-risk'];

      statuses.forEach(status => {
        const colors = getStatusColor(status);
        expect(colors).toHaveProperty('bg');
        expect(colors).toHaveProperty('text');
        expect(colors).toHaveProperty('ring');
        expect(colors).toHaveProperty('progress');
      });
    });
  });
});
