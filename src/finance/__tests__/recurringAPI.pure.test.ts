/**
 * Unit tests for the two pure helper functions in recurringAPI.ts
 * (calculateNextOccurrence, shouldGeneratePending)
 *
 * These were private functions before commit a214559's table-name bug fix.
 * Exporting them (and testing them) ensures frequency math is correct.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateNextOccurrence,
  shouldGeneratePending,
} from '../data/recurringAPI';

// Helper: build a Date from a simple YYYY-MM-DD string in local time
function d(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// ─── calculateNextOccurrence ─────────────────────────────────────────────────

describe('calculateNextOccurrence', () => {
  it('daily → adds exactly 1 day', () => {
    const next = calculateNextOccurrence(d('2026-03-10'), 'daily');
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(2); // 0-indexed March
    expect(next.getDate()).toBe(11);
  });

  it('weekly → adds exactly 7 days', () => {
    const next = calculateNextOccurrence(d('2026-03-10'), 'weekly');
    expect(next.getDate()).toBe(17);
    expect(next.getMonth()).toBe(2);
  });

  it('biweekly → adds exactly 14 days', () => {
    const next = calculateNextOccurrence(d('2026-03-10'), 'biweekly');
    expect(next.getDate()).toBe(24);
    expect(next.getMonth()).toBe(2);
  });

  it('monthly without dayOfMonth → same day next month', () => {
    const next = calculateNextOccurrence(d('2026-03-15'), 'monthly');
    expect(next.getMonth()).toBe(3); // April
    expect(next.getDate()).toBe(15);
  });

  it('monthly with dayOfMonth=15 → 15th of next month', () => {
    const next = calculateNextOccurrence(d('2026-03-10'), 'monthly', 15);
    expect(next.getMonth()).toBe(3); // April
    expect(next.getDate()).toBe(15);
  });

  it('monthly with dayOfMonth=-1 → last day of next month', () => {
    // March → April has 30 days
    const next = calculateNextOccurrence(d('2026-03-10'), 'monthly', -1);
    expect(next.getMonth()).toBe(3); // April
    expect(next.getDate()).toBe(30);
  });

  it('monthly with dayOfMonth=31 on 28-day month → clamps to 28 (Feb)', () => {
    // Starting in January, next is February (non-leap 2026 = 28 days)
    const next = calculateNextOccurrence(d('2026-01-15'), 'monthly', 31);
    expect(next.getMonth()).toBe(1); // February
    expect(next.getDate()).toBeLessThanOrEqual(28);
  });

  it('monthly with dayOfMonth=31 on 30-day month → clamps to 30 (April)', () => {
    const next = calculateNextOccurrence(d('2026-03-01'), 'monthly', 31);
    expect(next.getMonth()).toBe(3); // April
    expect(next.getDate()).toBe(30);
  });

  it('quarterly → adds 3 months', () => {
    const next = calculateNextOccurrence(d('2026-01-15'), 'quarterly');
    expect(next.getMonth()).toBe(3); // April
    expect(next.getDate()).toBe(15);
  });

  it('yearly → adds 1 year', () => {
    const next = calculateNextOccurrence(d('2026-03-10'), 'yearly');
    expect(next.getFullYear()).toBe(2027);
    expect(next.getMonth()).toBe(2);  // March
    expect(next.getDate()).toBe(10);
  });

  it('unknown frequency → throws ValidationError', () => {
    // Cast to bypass TypeScript so we can test the runtime guard
    expect(() =>
      calculateNextOccurrence(d('2026-03-10'), 'hourly' as any)
    ).toThrow();
  });
});

// ─── shouldGeneratePending ───────────────────────────────────────────────────

describe('shouldGeneratePending', () => {
  const TODAY = d('2026-03-10');

  it('returns true when scheduled date is today (0 days away)', () => {
    expect(shouldGeneratePending(d('2026-03-10'), TODAY, 7)).toBe(true);
  });

  it('returns true when scheduled is within daysBefore window', () => {
    expect(shouldGeneratePending(d('2026-03-15'), TODAY, 7)).toBe(true); // 5 days away
  });

  it('returns true when scheduled is exactly daysBefore days away', () => {
    expect(shouldGeneratePending(d('2026-03-17'), TODAY, 7)).toBe(true); // exactly 7 days
  });

  it('returns false when scheduled is daysBefore+1 days away', () => {
    expect(shouldGeneratePending(d('2026-03-18'), TODAY, 7)).toBe(false); // 8 days away
  });

  it('returns false when scheduled is in the past (negative diffDays)', () => {
    expect(shouldGeneratePending(d('2026-03-05'), TODAY, 7)).toBe(false);
  });

  it('returns false far in the future', () => {
    expect(shouldGeneratePending(d('2026-06-10'), TODAY, 7)).toBe(false);
  });

  it('works with daysBefore=0 (only generate on the exact date)', () => {
    expect(shouldGeneratePending(d('2026-03-10'), TODAY, 0)).toBe(true);
    expect(shouldGeneratePending(d('2026-03-11'), TODAY, 0)).toBe(false);
  });

  it('works with large daysBefore window', () => {
    expect(shouldGeneratePending(d('2026-04-10'), TODAY, 31)).toBe(true); // 31 days away
    expect(shouldGeneratePending(d('2026-04-11'), TODAY, 31)).toBe(false); // 32 days away
  });
});
