/**
 * Time Period Utilities
 *
 * Utilities for handling date ranges, time periods, and date formatting
 * for financial reports and analysis.
 */

import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns';

export type TimePeriod = 'this-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'this-year' | 'last-year' | 'custom';

export interface DateRange {
  from: string; // ISO date string
  to: string;   // ISO date string
  label: string;
}

/**
 * Get date range for a predefined time period
 */
export function getTimePeriodRange(period: TimePeriod, customRange?: { from: Date; to: Date }): DateRange {
  const now = new Date();

  switch (period) {
    case 'this-month': {
      const from = startOfMonth(now);
      const to = endOfMonth(now);
      return {
        from: from.toISOString(),
        to: to.toISOString(),
        label: format(now, 'MMMM yyyy'),
      };
    }

    case 'last-month': {
      const lastMonth = subMonths(now, 1);
      const from = startOfMonth(lastMonth);
      const to = endOfMonth(lastMonth);
      return {
        from: from.toISOString(),
        to: to.toISOString(),
        label: format(lastMonth, 'MMMM yyyy'),
      };
    }

    case 'last-3-months': {
      const from = startOfMonth(subMonths(now, 2));
      const to = endOfMonth(now);
      return {
        from: from.toISOString(),
        to: to.toISOString(),
        label: 'Last 3 Months',
      };
    }

    case 'last-6-months': {
      const from = startOfMonth(subMonths(now, 5));
      const to = endOfMonth(now);
      return {
        from: from.toISOString(),
        to: to.toISOString(),
        label: 'Last 6 Months',
      };
    }

    case 'this-year': {
      const from = startOfYear(now);
      const to = endOfYear(now);
      return {
        from: from.toISOString(),
        to: to.toISOString(),
        label: format(now, 'yyyy'),
      };
    }

    case 'last-year': {
      const lastYear = subYears(now, 1);
      const from = startOfYear(lastYear);
      const to = endOfYear(lastYear);
      return {
        from: from.toISOString(),
        to: to.toISOString(),
        label: format(lastYear, 'yyyy'),
      };
    }

    case 'custom': {
      if (!customRange) {
        throw new Error('Custom range requires from and to dates');
      }
      return {
        from: customRange.from.toISOString(),
        to: customRange.to.toISOString(),
        label: `${format(customRange.from, 'MMM d')} - ${format(customRange.to, 'MMM d, yyyy')}`,
      };
    }

    default:
      return getTimePeriodRange('this-month');
  }
}

/**
 * Get previous period for comparison
 */
export function getPreviousPeriodRange(currentRange: DateRange): DateRange {
  const from = new Date(currentRange.from);
  const to = new Date(currentRange.to);

  // Calculate period length in days
  const periodLength = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

  // Go back by the same period length
  const prevTo = new Date(from);
  prevTo.setDate(prevTo.getDate() - 1);

  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - periodLength + 1);

  return {
    from: prevFrom.toISOString(),
    to: prevTo.toISOString(),
    label: `${format(prevFrom, 'MMM d')} - ${format(prevTo, 'MMM d, yyyy')}`,
  };
}

/**
 * Get available time period options
 */
export function getTimePeriodOptions(): Array<{ value: TimePeriod; label: string }> {
  return [
    { value: 'this-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'last-3-months', label: 'Last 3 Months' },
    { value: 'last-6-months', label: 'Last 6 Months' },
    { value: 'this-year', label: 'This Year' },
    { value: 'last-year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
  ];
}

/**
 * Check if a transaction falls within a date range
 */
export function isInRange(transactionDate: string, range: DateRange): boolean {
  const txnDate = new Date(transactionDate);
  const fromDate = new Date(range.from);
  const toDate = new Date(range.to);

  return txnDate >= fromDate && txnDate <= toDate;
}

/**
 * Filter transactions by date range
 */
export function filterByDateRange<T extends { dateISO: string }>(
  items: T[],
  range: DateRange
): T[] {
  return items.filter(item => isInRange(item.dateISO, range));
}

/**
 * Group items by month
 */
export function groupByMonth<T extends { dateISO: string }>(
  items: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const month = item.dateISO.slice(0, 7); // YYYY-MM
    const existing = groups.get(month) ?? [];
    groups.set(month, [...existing, item]);
  }

  return groups;
}

/**
 * Get month list between two dates
 */
export function getMonthsBetween(from: string, to: string): string[] {
  const months: string[] = [];
  const current = new Date(from);
  const end = new Date(to);

  while (current <= end) {
    months.push(format(current, 'yyyy-MM'));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}
