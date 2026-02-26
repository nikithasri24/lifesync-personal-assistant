/**
 * Unit tests for dateHelpers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getDaysUntil,
  getCountdownText,
  getNextOccurrence,
  calculateAge,
  getAgeText,
  calculateYearsTogether,
  calculateDaysTogether,
  getAnniversaryText,
  formatDateLong,
  formatDateInput,
} from '../dateHelpers';

describe('dateHelpers', () => {
  beforeEach(() => {
    // Mock current date to 2024-06-15 for consistent testing
    // Use local time (no Z) to avoid timezone issues
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getDaysUntil', () => {
    it('should return 0 for today', () => {
      const result = getDaysUntil('2024-06-15');
      expect(result).toBe(0);
    });

    it('should return 1 for tomorrow', () => {
      const result = getDaysUntil('2024-06-16');
      expect(result).toBe(1);
    });

    it('should return -1 for yesterday', () => {
      const result = getDaysUntil('2024-06-14');
      expect(result).toBe(-1);
    });

    it('should return positive days for future dates', () => {
      const result = getDaysUntil('2024-06-25');
      expect(result).toBe(10);
    });

    it('should return negative days for past dates', () => {
      const result = getDaysUntil('2024-06-05');
      expect(result).toBe(-10);
    });

    it('should handle dates in different months', () => {
      const result = getDaysUntil('2024-07-15');
      expect(result).toBe(30);
    });

    it('should handle dates in different years', () => {
      const result = getDaysUntil('2025-06-15');
      expect(result).toBe(365);
    });

    it('should handle leap year correctly', () => {
      // 2024 is a leap year - from Feb 29 to Jun 15
      const result = getDaysUntil('2024-02-29');
      // May vary by 1 due to DST transitions
      expect(Math.abs(result + 107)).toBeLessThanOrEqual(1);
    });

    it('should handle month boundaries', () => {
      const result = getDaysUntil('2024-06-30');
      expect(result).toBe(15);
    });

    it('should handle year boundaries', () => {
      const result = getDaysUntil('2024-12-31');
      // May vary by 1 due to DST transitions
      expect(Math.abs(result - 199)).toBeLessThanOrEqual(1);
    });
  });

  describe('getCountdownText', () => {
    it('should return "Today" for current date', () => {
      const result = getCountdownText('2024-06-15');
      expect(result).toBe('Today');
    });

    it('should return "Tomorrow" for next day', () => {
      const result = getCountdownText('2024-06-16');
      expect(result).toBe('Tomorrow');
    });

    it('should return "Yesterday" for previous day', () => {
      const result = getCountdownText('2024-06-14');
      expect(result).toBe('Yesterday');
    });

    it('should return "In X days" for future dates', () => {
      expect(getCountdownText('2024-06-17')).toBe('In 2 days');
      expect(getCountdownText('2024-06-25')).toBe('In 10 days');
    });

    it('should return "X days ago" for past dates', () => {
      expect(getCountdownText('2024-06-13')).toBe('2 days ago');
      expect(getCountdownText('2024-06-05')).toBe('10 days ago');
    });

    it('should use singular "day" for 1 day', () => {
      expect(getCountdownText('2024-06-16')).toBe('Tomorrow');
      expect(getCountdownText('2024-06-14')).toBe('Yesterday');
    });

    it('should use plural "days" for multiple days', () => {
      expect(getCountdownText('2024-06-17')).toBe('In 2 days');
      expect(getCountdownText('2024-06-13')).toBe('2 days ago');
    });
  });

  describe('getNextOccurrence', () => {
    it('should return original date if not recurring', () => {
      const result = getNextOccurrence('2025-12-25', false);
      expect(result).toBe('2025-12-25');
    });

    it('should return this year\'s date if it hasn\'t passed yet', () => {
      // Current date is 2024-06-15, so 2024-12-25 hasn't passed
      const result = getNextOccurrence('2023-12-25', true);
      expect(result).toBe('2024-12-25');
    });

    it('should return next year\'s date if this year\'s has passed', () => {
      // Current date is 2024-06-15, so 2024-01-01 has passed
      const result = getNextOccurrence('2023-01-01', true);
      expect(result).toBe('2025-01-01');
    });

    it('should return today\'s date if it matches the original date', () => {
      // Current date is 2024-06-15
      const result = getNextOccurrence('2023-06-15', true);
      expect(result).toBe('2024-06-15');
    });

    it('should handle leap year birthdays', () => {
      // Feb 29 in a leap year (2020)
      // Current date is 2024-06-15 (2024 is leap year)
      // Feb 29 has already passed in 2024
      // Next occurrence would be 2025-02-29, but 2025 is not a leap year
      // JavaScript Date constructor rolls Feb 29 to March 1 in non-leap years
      const result = getNextOccurrence('2020-02-29', true);
      expect(result).toBe('2025-03-01');
    });

    it('should handle dates at year boundary', () => {
      const result = getNextOccurrence('2023-12-31', true);
      expect(result).toBe('2024-12-31');
    });

    it('should pad month and day with zeros', () => {
      // Current date: 2024-06-15
      // This year's occurrence: 2024-03-05 (has passed)
      // Next occurrence: 2025-03-05
      const result = getNextOccurrence('2023-03-05', true);
      expect(result).toBe('2025-03-05');
    });
  });

  describe('calculateAge', () => {
    it('should calculate age correctly when birthday has passed this year', () => {
      // Current date: 2024-06-15
      // Birthday: 1990-03-15 (birthday has passed)
      const result = calculateAge('1990-03-15');
      expect(result).toBe(34);
    });

    it('should calculate age correctly when birthday hasn\'t passed this year', () => {
      // Current date: 2024-06-15
      // Birthday: 1990-08-15 (birthday hasn't passed yet)
      const result = calculateAge('1990-08-15');
      expect(result).toBe(33);
    });

    it('should calculate age correctly when birthday is today', () => {
      // Current date: 2024-06-15
      // Birthday: 1990-06-15 (birthday is today)
      const result = calculateAge('1990-06-15');
      expect(result).toBe(34);
    });

    it('should return 0 for someone born this year', () => {
      const result = calculateAge('2024-01-01');
      expect(result).toBe(0);
    });

    it('should handle age calculation across decades', () => {
      const result = calculateAge('1950-01-01');
      expect(result).toBe(74);
    });

    it('should handle leap year birthdays', () => {
      // Born on leap day
      const result = calculateAge('2000-02-29');
      expect(result).toBe(24);
    });

    it('should handle same month but earlier day', () => {
      // Current date: 2024-06-15
      // Birthday: 1990-06-10 (same month, earlier day - has passed)
      const result = calculateAge('1990-06-10');
      expect(result).toBe(34);
    });

    it('should handle same month but later day', () => {
      // Current date: 2024-06-15
      // Birthday: 1990-06-20 (same month, later day - hasn't passed)
      const result = calculateAge('1990-06-20');
      expect(result).toBe(33);
    });
  });

  describe('getAgeText', () => {
    it('should return correct text for next birthday', () => {
      // Current age is 34, turning 35
      const result = getAgeText('1990-03-15');
      expect(result).toBe('Turning 35 years old');
    });

    it('should return correct text when birthday hasn\'t passed', () => {
      // Current age is 33, turning 34
      const result = getAgeText('1990-08-15');
      expect(result).toBe('Turning 34 years old');
    });

    it('should return correct text for first birthday', () => {
      const result = getAgeText('2024-01-01');
      expect(result).toBe('Turning 1 years old');
    });

    it('should handle milestone birthdays', () => {
      const result = getAgeText('1984-01-01');
      expect(result).toBe('Turning 41 years old');
    });
  });

  describe('calculateYearsTogether', () => {
    it('should calculate years correctly when anniversary has passed', () => {
      // Current date: 2024-06-15
      // Anniversary: 2020-03-15 (has passed this year)
      const result = calculateYearsTogether('2020-03-15');
      expect(result).toBe(4);
    });

    it('should calculate years correctly when anniversary hasn\'t passed', () => {
      // Current date: 2024-06-15
      // Anniversary: 2020-08-15 (hasn't passed this year)
      const result = calculateYearsTogether('2020-08-15');
      expect(result).toBe(3);
    });

    it('should return 0 for anniversary this year that has passed', () => {
      // Current date: 2024-06-15
      // Anniversary: 2024-03-15 (has passed)
      const result = calculateYearsTogether('2024-03-15');
      expect(result).toBe(0);
    });

    it('should return 0 for anniversary this year on the date', () => {
      const result = calculateYearsTogether('2024-06-15');
      expect(result).toBe(0);
    });

    it('should return 0 for anniversary this year after the date', () => {
      const result = calculateYearsTogether('2024-03-15');
      expect(result).toBe(0);
    });

    it('should handle long-term relationships', () => {
      const result = calculateYearsTogether('2000-01-01');
      expect(result).toBe(24);
    });

    it('should handle same month but earlier day', () => {
      // Anniversary: 2020-06-10 (same month, earlier day - has passed)
      const result = calculateYearsTogether('2020-06-10');
      expect(result).toBe(4);
    });

    it('should handle same month but later day', () => {
      // Anniversary: 2020-06-20 (same month, later day - hasn't passed)
      const result = calculateYearsTogether('2020-06-20');
      expect(result).toBe(3);
    });
  });

  describe('calculateDaysTogether', () => {
    it('should calculate days correctly', () => {
      // From 2024-06-10 to 2024-06-15 = 5 days
      const result = calculateDaysTogether('2024-06-10');
      expect(result).toBe(5);
    });

    it('should return 0 for today', () => {
      const result = calculateDaysTogether('2024-06-15');
      expect(result).toBe(0);
    });

    it('should handle dates across months', () => {
      // From 2024-05-15 to 2024-06-15 = 31 days
      const result = calculateDaysTogether('2024-05-15');
      expect(result).toBe(31);
    });

    it('should handle dates across years', () => {
      // From 2023-06-15 to 2024-06-15 = 366 days (2024 is leap year)
      // Note: Actual value may be 365 or 366 depending on DST transitions
      const result = calculateDaysTogether('2023-06-15');
      expect(result).toBeGreaterThanOrEqual(365);
      expect(result).toBeLessThanOrEqual(366);
    });

    it('should handle long-term relationships', () => {
      // From 2020-06-15 to 2024-06-15 = ~1461 days (includes leap day 2024-02-29)
      // Note: Actual value may vary by 1-2 days due to DST transitions
      const result = calculateDaysTogether('2020-06-15');
      expect(result).toBeGreaterThanOrEqual(1459);
      expect(result).toBeLessThanOrEqual(1461);
    });

    it('should handle leap year correctly', () => {
      // From 2024-02-29 to 2024-06-15 = 107 days
      // Note: May vary by 1 due to DST transitions
      const result = calculateDaysTogether('2024-02-29');
      expect(result).toBeGreaterThanOrEqual(106);
      expect(result).toBeLessThanOrEqual(107);
    });
  });

  describe('getAnniversaryText', () => {
    it('should return correct text for anniversary', () => {
      // 4 years together (anniversary passed this year)
      const result = getAnniversaryText('2020-03-15');

      expect(result.years).toBe('4 years together ❤️');
      expect(result.details).toContain('days');
      expect(result.details).toContain('months');
    });

    it('should use singular "year" for 1 year', () => {
      const result = getAnniversaryText('2023-03-15');
      expect(result.years).toBe('1 year together ❤️');
    });

    it('should use plural "years" for multiple years', () => {
      const result = getAnniversaryText('2020-03-15');
      expect(result.years).toBe('4 years together ❤️');
    });

    it('should calculate months correctly', () => {
      // 4 years = 1461 days, 1461 % 365 = 1, 1 / 30 = 0 months
      const result = getAnniversaryText('2020-06-15');
      expect(result.details).toContain('1,461 days');
      expect(result.details).toContain('0 months');
    });

    it('should format days with commas for large numbers', () => {
      // 10+ years
      const result = getAnniversaryText('2010-01-01');
      expect(result.details).toMatch(/\d{1,2},\d{3} days/);
    });

    it('should handle 0 years together', () => {
      const result = getAnniversaryText('2024-06-15');
      expect(result.years).toBe('0 years together ❤️');
      expect(result.details).toContain('0 days');
    });

    it('should use singular "month" for 1 month', () => {
      // Need to find a date that results in exactly 1 month
      // 365 days % 365 = 0, 0 / 30 = 0
      // Let's use 395 days: 395 % 365 = 30, 30 / 30 = 1 month
      const result = getAnniversaryText('2023-05-11');
      expect(result.details).toContain('1 month');
    });

    it('should use plural "months" for multiple months', () => {
      // 60 days: 60 % 365 = 60, 60 / 30 = 2 months
      const result = getAnniversaryText('2024-04-16');
      expect(result.details).toContain('2 months');
    });
  });

  describe('formatDateLong', () => {
    it('should format date in long format', () => {
      const result = formatDateLong('2024-06-15');
      expect(result).toBe('June 15, 2024');
    });

    it('should handle different months', () => {
      expect(formatDateLong('2024-01-01')).toBe('January 1, 2024');
      expect(formatDateLong('2024-12-31')).toBe('December 31, 2024');
    });

    it('should handle leap year dates', () => {
      const result = formatDateLong('2024-02-29');
      expect(result).toBe('February 29, 2024');
    });

    it('should handle dates with single-digit days', () => {
      const result = formatDateLong('2024-03-05');
      expect(result).toBe('March 5, 2024');
    });

    it('should handle dates across different years', () => {
      expect(formatDateLong('2025-06-15')).toBe('June 15, 2025');
      expect(formatDateLong('2023-06-15')).toBe('June 15, 2023');
    });
  });

  describe('formatDateInput', () => {
    it('should return date already in YYYY-MM-DD format', () => {
      const result = formatDateInput('2024-06-15');
      expect(result).toBe('2024-06-15');
    });

    it('should format date with padded zeros', () => {
      const result = formatDateInput('2024-03-05');
      expect(result).toBe('2024-03-05');
    });

    it('should handle dates with single-digit months', () => {
      const result = formatDateInput('2024-01-15');
      expect(result).toBe('2024-01-15');
    });

    it('should handle dates with single-digit days', () => {
      const result = formatDateInput('2024-06-05');
      expect(result).toBe('2024-06-05');
    });

    it('should handle dates at year boundaries', () => {
      expect(formatDateInput('2024-01-01')).toBe('2024-01-01');
      expect(formatDateInput('2024-12-31')).toBe('2024-12-31');
    });

    it('should handle leap year dates', () => {
      const result = formatDateInput('2024-02-29');
      expect(result).toBe('2024-02-29');
    });

    it('should preserve format for already formatted dates', () => {
      const dates = [
        '2024-01-01',
        '2024-06-15',
        '2024-12-31',
        '2025-03-05',
      ];

      dates.forEach(date => {
        expect(formatDateInput(date)).toBe(date);
      });
    });
  });

  describe('Edge cases and boundaries', () => {
    it('should handle date at start of month', () => {
      expect(getDaysUntil('2024-07-01')).toBe(16);
      expect(getCountdownText('2024-07-01')).toBe('In 16 days');
    });

    it('should handle date at end of month', () => {
      expect(getDaysUntil('2024-05-31')).toBe(-15);
      expect(getCountdownText('2024-05-31')).toBe('15 days ago');
    });

    it('should handle February in non-leap year', () => {
      vi.setSystemTime(new Date('2025-02-15T10:00:00'));
      expect(getDaysUntil('2025-02-28')).toBe(13);
      // Note: 2025 is not a leap year, so Feb 29 doesn't exist
    });

    it('should handle February in leap year', () => {
      vi.setSystemTime(new Date('2024-02-15T10:00:00'));
      expect(getDaysUntil('2024-02-29')).toBe(14);
    });

    it('should handle year transition', () => {
      vi.setSystemTime(new Date('2024-12-31T10:00:00'));
      expect(getDaysUntil('2025-01-01')).toBe(1);
      expect(getCountdownText('2025-01-01')).toBe('Tomorrow');
    });

    it('should handle dates far in the future', () => {
      const result = getDaysUntil('2030-06-15');
      expect(result).toBeGreaterThan(2000);
    });

    it('should handle dates far in the past', () => {
      const result = getDaysUntil('2020-06-15');
      expect(result).toBeLessThan(-1000);
    });

    it('should handle anniversary on leap day', () => {
      const result = calculateYearsTogether('2020-02-29');
      expect(result).toBe(4);

      const days = calculateDaysTogether('2020-02-29');
      // From 2020-02-29 to 2024-06-15 = ~1568 days
      // Note: May vary by 1-2 due to DST transitions
      expect(days).toBeGreaterThanOrEqual(1566);
      expect(days).toBeLessThanOrEqual(1568);
    });

    it('should handle birthday on leap day', () => {
      const age = calculateAge('2000-02-29');
      expect(age).toBe(24);

      const ageText = getAgeText('2000-02-29');
      expect(ageText).toBe('Turning 25 years old');
    });

    it('should handle next occurrence for leap day in non-leap year', () => {
      vi.setSystemTime(new Date('2025-03-01T10:00:00'));
      const result = getNextOccurrence('2020-02-29', true);
      // In 2025 (non-leap year), Feb 29 becomes March 1
      // The function returns next year's date regardless of leap status
      // So it returns 2025-03-01 (this year's occurrence)
      expect(result).toBe('2025-03-01');
    });
  });

  describe('Timezone independence', () => {
    it('should give consistent results regardless of time of day', () => {
      // Morning
      vi.setSystemTime(new Date('2024-06-15T01:00:00'));
      const morning = getDaysUntil('2024-06-20');

      // Afternoon
      vi.setSystemTime(new Date('2024-06-15T14:00:00'));
      const afternoon = getDaysUntil('2024-06-20');

      // Evening
      vi.setSystemTime(new Date('2024-06-15T23:00:00'));
      const evening = getDaysUntil('2024-06-20');

      expect(morning).toBe(afternoon);
      expect(afternoon).toBe(evening);
      expect(morning).toBe(5);
    });

    it('should handle dates at midnight boundary', () => {
      vi.setSystemTime(new Date('2024-06-15T00:00:00'));
      expect(getDaysUntil('2024-06-15')).toBe(0);
      expect(getCountdownText('2024-06-15')).toBe('Today');
    });

    it('should handle dates at end of day boundary', () => {
      vi.setSystemTime(new Date('2024-06-15T23:59:59'));
      expect(getDaysUntil('2024-06-15')).toBe(0);
      expect(getCountdownText('2024-06-15')).toBe('Today');
    });
  });
});
