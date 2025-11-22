import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toMonth, currentMonth, monthRange, monthsBack } from '../date';

describe('date utilities', () => {
  describe('toMonth', () => {
    it('should extract year-month from ISO date', () => {
      expect(toMonth('2025-11-21T12:00:00Z')).toBe('2025-11');
    });

    it('should handle date without time', () => {
      expect(toMonth('2025-11-21')).toBe('2025-11');
    });

    it('should handle different months', () => {
      expect(toMonth('2025-01-01')).toBe('2025-01');
      expect(toMonth('2025-12-31')).toBe('2025-12');
    });

    it('should preserve leading zeros in month', () => {
      expect(toMonth('2025-03-15')).toBe('2025-03');
    });
  });

  describe('currentMonth', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return current month in YYYY-MM format', () => {
      vi.setSystemTime(new Date('2025-11-21T12:00:00Z'));
      const result = currentMonth();
      expect(result).toBe('2025-11');
    });

    it('should pad single-digit months', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
      const result = currentMonth();
      expect(result).toBe('2025-01');
    });

    it('should handle December', () => {
      vi.setSystemTime(new Date('2025-12-31T23:59:59Z'));
      const result = currentMonth();
      expect(result).toBe('2025-12');
    });
  });

  describe('monthRange', () => {
    it('should return start and end of month', () => {
      const range = monthRange('2025-11');
      expect(range.from).toContain('2025-11-01');
      expect(range.from).toContain('T00:00:00');
      expect(range.to).toContain('2025-11-30');
      expect(range.to).toContain('T23:59:59');
    });

    it('should handle January', () => {
      const range = monthRange('2025-01');
      expect(range.from).toContain('2025-01-01');
      expect(range.to).toContain('2025-01-31');
    });

    it('should handle February in non-leap year', () => {
      const range = monthRange('2025-02');
      expect(range.from).toContain('2025-02-01');
      expect(range.to).toContain('2025-02-28');
    });

    it('should handle February in leap year', () => {
      const range = monthRange('2024-02');
      expect(range.from).toContain('2024-02-01');
      expect(range.to).toContain('2024-02-29');
    });

    it('should handle months with 30 days', () => {
      const range = monthRange('2025-04');
      expect(range.from).toContain('2025-04-01');
      expect(range.to).toContain('2025-04-30');
    });

    it('should handle months with 31 days', () => {
      const range = monthRange('2025-03');
      expect(range.from).toContain('2025-03-01');
      expect(range.to).toContain('2025-03-31');
    });

    it('should return ISO formatted dates', () => {
      const range = monthRange('2025-11');
      expect(range.from).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
      expect(range.to).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
  });

  describe('monthsBack', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return array of months going back', () => {
      vi.setSystemTime(new Date('2025-11-21T12:00:00Z'));
      const result = monthsBack(3);
      expect(result).toEqual(['2025-09', '2025-10', '2025-11']);
    });

    it('should handle single month', () => {
      vi.setSystemTime(new Date('2025-11-21T12:00:00Z'));
      const result = monthsBack(1);
      expect(result).toEqual(['2025-11']);
    });

    it('should handle year boundary', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
      const result = monthsBack(3);
      expect(result).toEqual(['2024-11', '2024-12', '2025-01']);
    });

    it('should pad month numbers', () => {
      vi.setSystemTime(new Date('2025-03-15T12:00:00Z'));
      const result = monthsBack(3);
      expect(result).toEqual(['2025-01', '2025-02', '2025-03']);
    });

    it('should handle 12 months', () => {
      vi.setSystemTime(new Date('2025-11-21T12:00:00Z'));
      const result = monthsBack(12);
      expect(result).toHaveLength(12);
      expect(result[0]).toBe('2024-12');
      expect(result[11]).toBe('2025-11');
    });

    it('should return empty array for zero months', () => {
      vi.setSystemTime(new Date('2025-11-21T12:00:00Z'));
      const result = monthsBack(0);
      expect(result).toEqual([]);
    });
  });
});
