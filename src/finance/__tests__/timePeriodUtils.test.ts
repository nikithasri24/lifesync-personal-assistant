/**
 * Unit tests for timePeriodUtils.ts
 *
 * Tests date range calculations used for filtering transactions on the Finance
 * Dashboard, Reports, and Budgets pages.
 */

import { describe, it, expect } from 'vitest';
import {
  getTimePeriodRange,
  getPreviousPeriodRange,
  isInRange,
  filterByDateRange,
  groupByMonth,
  getMonthsBetween,
} from '../utils/timePeriodUtils';

// ─── getTimePeriodRange ───────────────────────────────────────────────────────

describe('getTimePeriodRange', () => {
  const now = new Date();

  it('this-month: from = start of current month', () => {
    const range = getTimePeriodRange('this-month');
    const from = new Date(range.from);
    expect(from.getDate()).toBe(1);
    expect(from.getMonth()).toBe(now.getMonth());
    expect(from.getFullYear()).toBe(now.getFullYear());
  });

  it('this-month: to = end of current month', () => {
    const range = getTimePeriodRange('this-month');
    const to = new Date(range.to);
    expect(to.getMonth()).toBe(now.getMonth());
    expect(to.getFullYear()).toBe(now.getFullYear());
    // End of month: next date would be the 1st of next month
    const nextDay = new Date(to.getTime() + 1);
    expect(nextDay.getDate()).toBe(1);
  });

  it('last-month: from/to are in the previous calendar month', () => {
    const range = getTimePeriodRange('last-month');
    const from = new Date(range.from);
    const to   = new Date(range.to);
    const expectedMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    expect(from.getMonth()).toBe(expectedMonth);
    expect(to.getMonth()).toBe(expectedMonth);
    expect(from.getDate()).toBe(1);
  });

  it('last-3-months: from is start of the month 2 months ago', () => {
    const range = getTimePeriodRange('last-3-months');
    const from = new Date(range.from);
    const to   = new Date(range.to);
    // from should be 2 months back, to should be in current month
    expect(to.getMonth()).toBe(now.getMonth());
    expect(from.getDate()).toBe(1);
    // from must be strictly before 'to'
    expect(from.getTime()).toBeLessThan(to.getTime());
  });

  it('this-year: covers entire current year', () => {
    const range = getTimePeriodRange('this-year');
    const from = new Date(range.from);
    const to   = new Date(range.to);
    expect(from.getFullYear()).toBe(now.getFullYear());
    expect(to.getFullYear()).toBe(now.getFullYear());
    expect(from.getMonth()).toBe(0);  // January
  });

  it('last-year: covers entire previous year', () => {
    const range = getTimePeriodRange('last-year');
    const from = new Date(range.from);
    const to   = new Date(range.to);
    const lastYear = now.getFullYear() - 1;
    expect(from.getFullYear()).toBe(lastYear);
    expect(to.getFullYear()).toBe(lastYear);
  });

  it('custom: uses provided from/to dates', () => {
    const customFrom = new Date('2025-06-01');
    const customTo   = new Date('2025-06-30');
    const range = getTimePeriodRange('custom', { from: customFrom, to: customTo });
    expect(new Date(range.from).toISOString()).toBe(customFrom.toISOString());
    expect(new Date(range.to).toISOString()).toBe(customTo.toISOString());
  });

  it('custom: throws when no customRange provided', () => {
    expect(() => getTimePeriodRange('custom')).toThrow();
  });
});

// ─── getPreviousPeriodRange ───────────────────────────────────────────────────

describe('getPreviousPeriodRange', () => {
  it('previous period ends the day before current period starts', () => {
    const current = getTimePeriodRange('last-month');
    const prev    = getPreviousPeriodRange(current);

    const currentFrom = new Date(current.from);
    const prevTo      = new Date(prev.to);

    // prevTo should be the day before currentFrom
    const dayBeforeCurrent = new Date(currentFrom);
    dayBeforeCurrent.setDate(dayBeforeCurrent.getDate() - 1);

    expect(prevTo.toDateString()).toBe(dayBeforeCurrent.toDateString());
  });

  it('previous period has the same duration as the current period', () => {
    const current = getTimePeriodRange('last-3-months');
    const prev    = getPreviousPeriodRange(current);

    const currentLen = Math.ceil(
      (new Date(current.to).getTime() - new Date(current.from).getTime()) /
      (1000 * 60 * 60 * 24)
    );
    const prevLen = Math.ceil(
      (new Date(prev.to).getTime() - new Date(prev.from).getTime()) /
      (1000 * 60 * 60 * 24)
    );

    expect(prevLen).toBe(currentLen);
  });
});

// ─── isInRange ───────────────────────────────────────────────────────────────

describe('isInRange', () => {
  const range = {
    from: '2026-01-01T00:00:00.000Z',
    to:   '2026-01-31T23:59:59.999Z',
    label: 'January 2026',
  };

  it('returns true for a date inside the range', () => {
    expect(isInRange('2026-01-15T12:00:00.000Z', range)).toBe(true);
  });

  it('returns true at the start boundary', () => {
    expect(isInRange('2026-01-01T00:00:00.000Z', range)).toBe(true);
  });

  it('returns true at the end boundary', () => {
    expect(isInRange('2026-01-31T23:59:59.999Z', range)).toBe(true);
  });

  it('returns false for a date before the range', () => {
    expect(isInRange('2025-12-31T23:59:59.999Z', range)).toBe(false);
  });

  it('returns false for a date after the range', () => {
    expect(isInRange('2026-02-01T00:00:00.000Z', range)).toBe(false);
  });
});

// ─── filterByDateRange ───────────────────────────────────────────────────────

describe('filterByDateRange', () => {
  const range = {
    from: '2026-02-01T00:00:00.000Z',
    to:   '2026-02-28T23:59:59.999Z',
    label: 'Feb 2026',
  };

  it('keeps items within the range', () => {
    const items = [
      { dateISO: '2026-02-15T00:00:00.000Z', amount: 100 },
      { dateISO: '2026-01-31T23:59:59.999Z', amount: 200 },
      { dateISO: '2026-03-01T00:00:00.000Z', amount: 300 },
    ];
    const result = filterByDateRange(items, range);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(100);
  });

  it('returns empty array when no items match', () => {
    const items = [{ dateISO: '2025-01-01T00:00:00.000Z', amount: 50 }];
    expect(filterByDateRange(items, range)).toHaveLength(0);
  });
});

// ─── groupByMonth ────────────────────────────────────────────────────────────

describe('groupByMonth', () => {
  it('groups items by YYYY-MM key', () => {
    const items = [
      { dateISO: '2026-01-05', value: 'a' },
      { dateISO: '2026-01-20', value: 'b' },
      { dateISO: '2026-02-10', value: 'c' },
    ];
    const groups = groupByMonth(items);
    expect(groups.get('2026-01')).toHaveLength(2);
    expect(groups.get('2026-02')).toHaveLength(1);
  });

  it('returns empty map for empty array', () => {
    expect(groupByMonth([])).toEqual(new Map());
  });
});

// ─── getMonthsBetween ────────────────────────────────────────────────────────

describe('getMonthsBetween', () => {
  it('returns correct months including both endpoints', () => {
    // Use mid-month dates to avoid UTC midnight crossing timezone boundaries
    const months = getMonthsBetween('2026-01-15', '2026-03-15');
    expect(months).toEqual(['2026-01', '2026-02', '2026-03']);
  });

  it('returns single month for same month', () => {
    // Use mid-month dates to avoid UTC midnight crossing timezone boundaries
    const months = getMonthsBetween('2026-05-15', '2026-05-20');
    expect(months).toEqual(['2026-05']);
  });

  it('crosses year boundary correctly', () => {
    // Use mid-month dates to avoid UTC midnight crossing timezone boundaries
    const months = getMonthsBetween('2025-11-15', '2026-02-15');
    expect(months).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
  });
});
