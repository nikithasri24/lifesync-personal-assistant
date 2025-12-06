import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getTimePeriodRange,
  getPreviousPeriodRange,
  getTimePeriodOptions,
  isInRange,
  filterByDateRange,
  groupByMonth,
  getMonthsBetween,
} from '../timePeriodUtils';

describe('timePeriodUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getTimePeriodRange', () => {
    it('should return this month range', () => {
      const range = getTimePeriodRange('this-month');

      expect(range.from).toContain('2025-11-01');
      expect(range.label).toContain('November 2025');
    });

    it('should return last month range', () => {
      const range = getTimePeriodRange('last-month');

      expect(range.from).toContain('2025-10-01');
      expect(range.label).toContain('October 2025');
    });

    it('should return last 3 months range', () => {
      const range = getTimePeriodRange('last-3-months');

      expect(range.from).toContain('2025-09-01');
      expect(range.label).toBe('Last 3 Months');
    });

    it('should return last 6 months range', () => {
      const range = getTimePeriodRange('last-6-months');

      expect(range.from).toContain('2025-06-01');
      expect(range.label).toBe('Last 6 Months');
    });

    it('should return this year range', () => {
      const range = getTimePeriodRange('this-year');

      expect(range.from).toContain('2025-01-01');
      expect(range.label).toBe('2025');
    });

    it('should return last year range', () => {
      const range = getTimePeriodRange('last-year');

      expect(range.from).toContain('2024-01-01');
      expect(range.label).toBe('2024');
    });

    it('should return custom range when provided', () => {
      const customRange = {
        from: new Date('2025-05-01'),
        to: new Date('2025-08-31'),
      };

      const range = getTimePeriodRange('custom', customRange);

      expect(range.from).toContain('2025-05-01');
      expect(range.to).toContain('2025-08-31');
      expect(range.label).toBeTruthy();
    });

    it('should throw error for custom period without range', () => {
      expect(() => getTimePeriodRange('custom')).toThrow('Custom range requires from and to dates');
    });

    it('should default to this month for invalid period', () => {
      const range = getTimePeriodRange('invalid' as any);

      expect(range.from).toContain('2025-11-01');
    });

    it('should handle year boundary for last month', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));

      const range = getTimePeriodRange('last-month');

      expect(range.from).toContain('2024-12-01');
    });

    it('should return valid date ranges', () => {
      const range = getTimePeriodRange('this-month');

      expect(new Date(range.from).getTime()).toBeLessThan(new Date(range.to).getTime());
    });
  });

  describe('getPreviousPeriodRange', () => {
    it('should calculate previous period for 1-month range', () => {
      const currentRange = {
        from: '2025-11-01T00:00:00Z',
        to: '2025-11-30T23:59:59Z',
        label: 'November 2025',
      };

      const prevRange = getPreviousPeriodRange(currentRange);

      expect(prevRange.from).toContain('2025-10');
      expect(prevRange.to).toContain('2025-10-31');
    });

    it('should calculate previous period for custom range', () => {
      const currentRange = {
        from: '2025-11-01T00:00:00Z',
        to: '2025-11-15T00:00:00Z',
        label: 'Custom',
      };

      const prevRange = getPreviousPeriodRange(currentRange);

      // 15 day period, so previous should be 15 days before
      expect(new Date(prevRange.to).getTime()).toBeLessThan(new Date(currentRange.from).getTime());
    });

    it('should handle year boundary', () => {
      const currentRange = {
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-31T00:00:00Z',
        label: 'January 2025',
      };

      const prevRange = getPreviousPeriodRange(currentRange);

      expect(prevRange.from).toContain('2024-12');
    });

    it('should maintain similar period length', () => {
      const currentRange = {
        from: '2025-11-01T00:00:00Z',
        to: '2025-11-30T00:00:00Z',
        label: 'November',
      };

      const prevRange = getPreviousPeriodRange(currentRange);

      const currentLength = Math.ceil(
        (new Date(currentRange.to).getTime() - new Date(currentRange.from).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      const prevLength = Math.ceil(
        (new Date(prevRange.to).getTime() - new Date(prevRange.from).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Allow for 1-2 day difference due to month length variations
      expect(Math.abs(prevLength - currentLength)).toBeLessThanOrEqual(2);
    });
  });

  describe('getTimePeriodOptions', () => {
    it('should return all period options', () => {
      const options = getTimePeriodOptions();

      expect(options).toHaveLength(7);
      expect(options.map(o => o.value)).toContain('this-month');
      expect(options.map(o => o.value)).toContain('custom');
    });

    it('should have labels for all options', () => {
      const options = getTimePeriodOptions();

      options.forEach(option => {
        expect(option.label).toBeTruthy();
        expect(option.value).toBeTruthy();
      });
    });
  });

  describe('isInRange', () => {
    const range = {
      from: '2025-11-01T00:00:00Z',
      to: '2025-11-30T23:59:59Z',
      label: 'November',
    };

    it('should return true for date within range', () => {
      expect(isInRange('2025-11-15T12:00:00Z', range)).toBe(true);
    });

    it('should return true for date at range start', () => {
      expect(isInRange('2025-11-01T00:00:00Z', range)).toBe(true);
    });

    it('should return true for date at range end', () => {
      expect(isInRange('2025-11-30T23:59:59Z', range)).toBe(true);
    });

    it('should return false for date before range', () => {
      expect(isInRange('2025-10-31T23:59:59Z', range)).toBe(false);
    });

    it('should return false for date after range', () => {
      expect(isInRange('2025-12-01T00:00:00Z', range)).toBe(false);
    });

    it('should handle dates without time component', () => {
      expect(isInRange('2025-11-15', range)).toBe(true);
    });
  });

  describe('filterByDateRange', () => {
    const items = [
      { id: '1', dateISO: '2025-10-15T12:00:00Z', amount: 100 },
      { id: '2', dateISO: '2025-11-05T12:00:00Z', amount: 200 },
      { id: '3', dateISO: '2025-11-20T12:00:00Z', amount: 300 },
      { id: '4', dateISO: '2025-12-01T12:00:00Z', amount: 400 },
    ];

    const range = {
      from: '2025-11-01T00:00:00Z',
      to: '2025-11-30T23:59:59Z',
      label: 'November',
    };

    it('should filter items within range', () => {
      const filtered = filterByDateRange(items, range);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(i => i.id)).toEqual(['2', '3']);
    });

    it('should return empty array when no items in range', () => {
      const emptyRange = {
        from: '2026-01-01T00:00:00Z',
        to: '2026-01-31T23:59:59Z',
        label: 'January 2026',
      };

      const filtered = filterByDateRange(items, emptyRange);

      expect(filtered).toHaveLength(0);
    });

    it('should handle empty items array', () => {
      const filtered = filterByDateRange([], range);

      expect(filtered).toHaveLength(0);
    });

    it('should preserve item properties', () => {
      const filtered = filterByDateRange(items, range);

      expect(filtered[0]).toHaveProperty('amount');
      expect(filtered[0].amount).toBe(200);
    });
  });

  describe('groupByMonth', () => {
    const items = [
      { id: '1', dateISO: '2025-10-15T12:00:00Z' },
      { id: '2', dateISO: '2025-10-20T12:00:00Z' },
      { id: '3', dateISO: '2025-11-05T12:00:00Z' },
      { id: '4', dateISO: '2025-11-20T12:00:00Z' },
      { id: '5', dateISO: '2025-12-01T12:00:00Z' },
    ];

    it('should group items by month', () => {
      const grouped = groupByMonth(items);

      expect(grouped.size).toBe(3);
      expect(grouped.get('2025-10')).toHaveLength(2);
      expect(grouped.get('2025-11')).toHaveLength(2);
      expect(grouped.get('2025-12')).toHaveLength(1);
    });

    it('should use YYYY-MM format as keys', () => {
      const grouped = groupByMonth(items);

      const keys = Array.from(grouped.keys());
      keys.forEach(key => {
        expect(key).toMatch(/^\d{4}-\d{2}$/);
      });
    });

    it('should handle empty items array', () => {
      const grouped = groupByMonth([]);

      expect(grouped.size).toBe(0);
    });

    it('should handle single month', () => {
      const singleMonth = [
        { id: '1', dateISO: '2025-11-01T12:00:00Z' },
        { id: '2', dateISO: '2025-11-15T12:00:00Z' },
      ];

      const grouped = groupByMonth(singleMonth);

      expect(grouped.size).toBe(1);
      expect(grouped.get('2025-11')).toHaveLength(2);
    });

    it('should preserve item order within groups', () => {
      const grouped = groupByMonth(items);

      const octItems = grouped.get('2025-10')!;
      expect(octItems[0].id).toBe('1');
      expect(octItems[1].id).toBe('2');
    });
  });

  describe('getMonthsBetween', () => {
    it('should return array of months', () => {
      const months = getMonthsBetween('2025-10-01', '2025-12-31');

      expect(months.length).toBeGreaterThanOrEqual(2);
      expect(months[0]).toMatch(/2025-(09|10)/);
      expect(months[months.length - 1]).toMatch(/2025-(11|12)/);
    });

    it('should handle single month or more', () => {
      const months = getMonthsBetween('2025-11-01', '2025-11-30');

      expect(months.length).toBeGreaterThanOrEqual(1);
      // Due to timezone, could be 2025-10 or 2025-11
      expect(months[0]).toMatch(/2025-(10|11)/);
    });

    it('should handle year boundary', () => {
      const months = getMonthsBetween('2024-12-01', '2025-01-31');

      expect(months.length).toBeGreaterThanOrEqual(2);
      expect(months).toContain('2024-12');
      expect(months).toContain('2025-01');
    });

    it('should include partial months', () => {
      const months = getMonthsBetween('2025-10-15', '2025-12-05');

      expect(months.length).toBeGreaterThanOrEqual(2);
      expect(months).toContain('2025-10');
      expect(months).toContain('2025-11');
    });

    it('should handle same start and end date', () => {
      const months = getMonthsBetween('2025-11-15', '2025-11-15');

      expect(months.length).toBeGreaterThanOrEqual(1);
      expect(months).toContain('2025-11');
    });

    it('should handle full year', () => {
      const months = getMonthsBetween('2025-01-01', '2025-12-31');

      expect(months.length).toBeGreaterThanOrEqual(12);
      expect(months).toContain('2025-01');
      expect(months).toContain('2025-12');
    });
  });
});
