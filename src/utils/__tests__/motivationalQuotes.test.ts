import { describe, it, expect } from 'vitest';
import { COMPLETION_QUOTES, getDailyQuote, getNextDayQuote } from '../motivationalQuotes';

describe('motivationalQuotes', () => {
  describe('COMPLETION_QUOTES', () => {
    it('should have 75 quotes', () => {
      expect(COMPLETION_QUOTES).toHaveLength(75);
    });

    it('should have all quotes as non-empty strings', () => {
      COMPLETION_QUOTES.forEach((quote, index) => {
        expect(quote).toBeTruthy();
        expect(typeof quote).toBe('string');
        expect(quote.length).toBeGreaterThan(0);
      });
    });

    it('should have last quote as completion message', () => {
      const lastQuote = COMPLETION_QUOTES[COMPLETION_QUOTES.length - 1];
      expect(lastQuote).toContain('75 days');
      expect(lastQuote).toContain('Congratulations');
    });

    it('should have unique quotes', () => {
      const uniqueQuotes = new Set(COMPLETION_QUOTES);
      expect(uniqueQuotes.size).toBe(COMPLETION_QUOTES.length);
    });

    it('should contain motivational keywords', () => {
      const motivationalKeywords = [
        'discipline',
        'commitment',
        'consistency',
        'success',
        'progress',
        'champion',
        'strong',
      ];

      const allQuotesText = COMPLETION_QUOTES.join(' ').toLowerCase();

      motivationalKeywords.forEach((keyword) => {
        expect(allQuotesText).toContain(keyword.toLowerCase());
      });
    });
  });

  describe('getDailyQuote', () => {
    it('should return first quote for day 1', () => {
      const quote = getDailyQuote(1);
      expect(quote).toBe(COMPLETION_QUOTES[0]);
    });

    it('should return second quote for day 2', () => {
      const quote = getDailyQuote(2);
      expect(quote).toBe(COMPLETION_QUOTES[1]);
    });

    it('should cycle back to start after reaching end of quotes', () => {
      // Day 76 should wrap around to index 0 (same as day 1)
      const quote76 = getDailyQuote(76);
      const quote1 = getDailyQuote(1);
      expect(quote76).toBe(quote1);
    });

    it('should return consistent quote for the same day number', () => {
      const day = 30;
      const quote1 = getDailyQuote(day);
      const quote2 = getDailyQuote(day);
      expect(quote1).toBe(quote2);
    });

    it('should handle all days 1-75', () => {
      for (let day = 1; day <= 75; day++) {
        const quote = getDailyQuote(day);
        expect(quote).toBeTruthy();
        expect(typeof quote).toBe('string');
        expect(COMPLETION_QUOTES).toContain(quote);
      }
    });

    it('should return last completion quote for day 75', () => {
      const quote = getDailyQuote(75);
      expect(quote).toBe(COMPLETION_QUOTES[74]); // 75 - 1 = index 74
    });

    it('should use modulo to cycle through quotes', () => {
      // Day 1 and day (1 + 75) should have the same quote
      const totalQuotes = COMPLETION_QUOTES.length;
      const quote1 = getDailyQuote(1);
      const quoteCycle = getDailyQuote(1 + totalQuotes);
      expect(quote1).toBe(quoteCycle);
    });

    it('should handle large day numbers', () => {
      const quote = getDailyQuote(200);
      expect(quote).toBeTruthy();
      expect(COMPLETION_QUOTES).toContain(quote);
    });

    it('should give different quotes for consecutive days', () => {
      const quote1 = getDailyQuote(1);
      const quote2 = getDailyQuote(2);
      expect(quote1).not.toBe(quote2);
    });

    it('should map day numbers correctly to array indices', () => {
      // Day 1 -> Index 0
      expect(getDailyQuote(1)).toBe(COMPLETION_QUOTES[0]);
      // Day 10 -> Index 9
      expect(getDailyQuote(10)).toBe(COMPLETION_QUOTES[9]);
      // Day 50 -> Index 49
      expect(getDailyQuote(50)).toBe(COMPLETION_QUOTES[49]);
    });
  });

  describe('getNextDayQuote', () => {
    it('should return quote for next day', () => {
      const currentDay = 10;
      const nextQuote = getNextDayQuote(currentDay);
      const directNextQuote = getDailyQuote(currentDay + 1);
      expect(nextQuote).toBe(directNextQuote);
    });

    it('should return second quote when current day is 1', () => {
      const nextQuote = getNextDayQuote(1);
      expect(nextQuote).toBe(COMPLETION_QUOTES[1]);
    });

    it('should cycle correctly at boundary', () => {
      // If we're at the last quote (day 75), next should be first quote
      const nextQuote = getNextDayQuote(75);
      expect(nextQuote).toBe(COMPLETION_QUOTES[0]); // Day 76 wraps to index 0
    });

    it('should work for day 74 showing day 75 quote', () => {
      const nextQuote = getNextDayQuote(74);
      const day75Quote = getDailyQuote(75);
      expect(nextQuote).toBe(day75Quote);
    });

    it('should be different from current day quote', () => {
      const currentDay = 25;
      const currentQuote = getDailyQuote(currentDay);
      const nextQuote = getNextDayQuote(currentDay);
      expect(nextQuote).not.toBe(currentQuote);
    });

    it('should preview completion quote when on day 74', () => {
      const nextQuote = getNextDayQuote(74);
      const completionQuote = getDailyQuote(75);
      expect(nextQuote).toBe(completionQuote);
    });
  });

  describe('Quote Distribution', () => {
    it('should distribute quotes evenly across 75 days', () => {
      const usedQuotes = new Set<string>();

      for (let day = 1; day <= 75; day++) {
        const quote = getDailyQuote(day);
        usedQuotes.add(quote);
      }

      // With 84 quotes and 75 days, all 75 quotes should be from the pool
      expect(usedQuotes.size).toBe(75);
    });

    it('should not repeat quotes within first 75 days', () => {
      const quotes: string[] = [];

      for (let day = 1; day <= 75; day++) {
        quotes.push(getDailyQuote(day));
      }

      const uniqueQuotes = new Set(quotes);
      expect(uniqueQuotes.size).toBe(75); // All should be unique
    });

    it('should use quotes in order from the array', () => {
      for (let day = 1; day <= COMPLETION_QUOTES.length; day++) {
        const quote = getDailyQuote(day);
        expect(quote).toBe(COMPLETION_QUOTES[day - 1]);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should return undefined for day 0', () => {
      // Day 0: 0 - 1 = -1, -1 % 75 = -1, COMPLETION_QUOTES[-1] = undefined
      const quote = getDailyQuote(0);
      expect(quote).toBeUndefined();
    });

    it('should return undefined for negative day numbers', () => {
      // Negative modulo returns negative index, which is undefined
      const quote = getDailyQuote(-5);
      expect(quote).toBeUndefined();
    });

    it('should return undefined for decimal day numbers', () => {
      // JavaScript modulo with decimals: 10.7 - 1 = 9.7, 9.7 % 75 = 9.7
      // Array indexing with float returns undefined in strict mode
      const quote = getDailyQuote(10.7);
      expect(quote).toBeUndefined();
    });
  });

  describe('Consistency', () => {
    it('should return same quote when called multiple times for same day', () => {
      const day = 42;
      const calls = Array.from({ length: 100 }, () => getDailyQuote(day));
      const allSame = calls.every((quote) => quote === calls[0]);
      expect(allSame).toBe(true);
    });

    it('should maintain consistency across cycles', () => {
      const day1 = 15;
      const day2 = 15 + COMPLETION_QUOTES.length; // Same position in next cycle
      expect(getDailyQuote(day1)).toBe(getDailyQuote(day2));
    });
  });
});
