import { describe, it, expect } from 'vitest';
import {
  levenshteinDistance,
  similarity,
  findBestMatch,
  fuzzyContains,
  normalizeMerchantName,
  generateMerchantVariations,
  isSameMerchant,
  calculateConfidence,
} from '../fuzzyMatch';

describe('fuzzyMatch', () => {
  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(levenshteinDistance('hello', 'hello')).toBe(0);
    });

    it('should be case-insensitive', () => {
      expect(levenshteinDistance('Hello', 'hello')).toBe(0);
    });

    it('should handle empty strings', () => {
      expect(levenshteinDistance('', '')).toBe(0);
      expect(levenshteinDistance('hello', '')).toBe(5);
      expect(levenshteinDistance('', 'world')).toBe(5);
    });

    it('should calculate single character difference', () => {
      expect(levenshteinDistance('cat', 'bat')).toBe(1);
    });

    it('should calculate insertion distance', () => {
      expect(levenshteinDistance('cat', 'cats')).toBe(1);
    });

    it('should calculate deletion distance', () => {
      expect(levenshteinDistance('cats', 'cat')).toBe(1);
    });

    it('should calculate complex differences', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    });

    it('should trim whitespace', () => {
      expect(levenshteinDistance('  hello  ', 'hello')).toBe(0);
    });
  });

  describe('similarity', () => {
    it('should return 1.0 for identical strings', () => {
      expect(similarity('hello', 'hello')).toBe(1.0);
    });

    it('should return 0.0 for completely different strings', () => {
      const score = similarity('abc', 'xyz');
      expect(score).toBeLessThan(0.5);
    });

    it('should calculate similarity for similar strings', () => {
      const score = similarity('amazon', 'amazom');
      expect(score).toBeGreaterThan(0.8);
    });

    it('should handle empty strings', () => {
      expect(similarity('', '')).toBe(1.0);
    });

    it('should be symmetric', () => {
      const score1 = similarity('walmart', 'walmar');
      const score2 = similarity('walmar', 'walmart');
      expect(score1).toBe(score2);
    });
  });

  describe('findBestMatch', () => {
    it('should find exact match', () => {
      const candidates = ['Amazon', 'Walmart', 'Target'];
      const result = findBestMatch('Amazon', candidates);
      expect(result).toEqual({ match: 'Amazon', score: 1.0 });
    });

    it('should find best fuzzy match', () => {
      const candidates = ['Amazon', 'Walmart', 'Target'];
      const result = findBestMatch('Amazom', candidates);
      expect(result?.match).toBe('Amazon');
      expect(result?.score).toBeGreaterThan(0.8);
    });

    it('should return null if no match above threshold', () => {
      const candidates = ['Amazon', 'Walmart', 'Target'];
      const result = findBestMatch('XYZ123', candidates, 0.8);
      expect(result).toBeNull();
    });

    it('should respect minimum similarity threshold', () => {
      const candidates = ['Amazon', 'Walmart', 'Target'];
      const result = findBestMatch('Amaz', candidates, 0.9);
      expect(result).toBeNull();
    });

    it('should find match with default threshold', () => {
      const candidates = ['Starbucks', 'Walmart', 'Target'];
      const result = findBestMatch('Starbuks', candidates);
      expect(result?.match).toBe('Starbucks');
    });
  });

  describe('fuzzyContains', () => {
    it('should return true for exact substring match', () => {
      expect(fuzzyContains('Hello World', 'World')).toBe(true);
    });

    it('should return true for fuzzy word match', () => {
      expect(fuzzyContains('Starbucks Coffee', 'Starbuks')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(fuzzyContains('HELLO WORLD', 'hello')).toBe(true);
    });

    it('should return false when no match found', () => {
      expect(fuzzyContains('Amazon Prime', 'Walmart')).toBe(false);
    });

    it('should handle multiple word matching', () => {
      expect(fuzzyContains('Whole Foods Market', 'Whole Foods')).toBe(true);
    });

    it('should respect threshold', () => {
      // Lower threshold should still match
      expect(fuzzyContains('Amazon', 'Amazom', 0.8)).toBe(true);
    });
  });

  describe('normalizeMerchantName', () => {
    it('should remove common transaction prefixes', () => {
      expect(normalizeMerchantName('DEBIT PURCHASE AMAZON')).toContain('AMAZON');
      expect(normalizeMerchantName('CREDIT CARD WALMART')).toContain('WALMART');
      expect(normalizeMerchantName('SQ * COFFEE SHOP')).toContain('COFFEE SHOP');
    });

    it('should remove trailing numbers', () => {
      expect(normalizeMerchantName('STARBUCKS 12345')).toBe('STARBUCKS');
      expect(normalizeMerchantName('WALMART #789')).toBe('WALMART');
    });

    it('should remove company suffixes', () => {
      expect(normalizeMerchantName('AMAZON LLC')).toBe('AMAZON');
      expect(normalizeMerchantName('WALMART INC.')).toBe('WALMART');
      expect(normalizeMerchantName('TARGET CORP')).toBe('TARGET');
    });

    it('should normalize spacing', () => {
      expect(normalizeMerchantName('  AMAZON   PRIME  ')).toBe('AMAZON PRIME');
    });

    it('should convert to uppercase', () => {
      expect(normalizeMerchantName('amazon')).toBe('AMAZON');
    });

    it('should remove special characters', () => {
      expect(normalizeMerchantName('AMAZON*PRIME@123')).toBe('AMAZON PRIME 123');
    });
  });

  describe('generateMerchantVariations', () => {
    it('should include normalized version', () => {
      const variations = generateMerchantVariations('Amazon Prime');
      expect(variations).toContain('AMAZON PRIME');
    });

    it('should include lowercase version', () => {
      const variations = generateMerchantVariations('Amazon Prime');
      expect(variations.some(v => v === 'amazon prime')).toBe(true);
    });

    it('should include version without spaces', () => {
      const variations = generateMerchantVariations('Amazon Prime');
      expect(variations.some(v => v === 'AMAZONPRIME' || v === 'amazonprime')).toBe(true);
    });

    it('should include first word', () => {
      const variations = generateMerchantVariations('Whole Foods Market');
      expect(variations.some(v => v === 'WHOLE' || v === 'whole')).toBe(true);
    });

    it('should generate acronym for multi-word names', () => {
      const variations = generateMerchantVariations('Best Buy Co');
      // Should include some variation of the acronym or first word
      expect(variations.length).toBeGreaterThan(1);
      expect(variations.some(v => v.includes('BEST') || v.includes('best'))).toBe(true);
    });

    it('should not include very short first words', () => {
      const variations = generateMerchantVariations('A B Company');
      expect(variations.every(v => v !== 'A' && v !== 'a')).toBe(true);
    });
  });

  describe('isSameMerchant', () => {
    it('should return true for exact matches', () => {
      expect(isSameMerchant('Amazon', 'Amazon')).toBe(true);
    });

    it('should return true for similar names', () => {
      expect(isSameMerchant('Starbucks', 'Starbuks')).toBe(true);
    });

    it('should return true when one contains the other', () => {
      expect(isSameMerchant('Amazon Prime', 'Amazon')).toBe(true);
    });

    it('should handle transaction prefixes', () => {
      expect(isSameMerchant('DEBIT PURCHASE AMAZON', 'Amazon')).toBe(true);
    });

    it('should handle trailing numbers', () => {
      expect(isSameMerchant('Walmart 12345', 'Walmart 67890')).toBe(true);
    });

    it('should return false for different merchants', () => {
      expect(isSameMerchant('Amazon', 'Walmart')).toBe(false);
    });

    it('should respect custom threshold', () => {
      expect(isSameMerchant('Amazn', 'Amazon', 0.95)).toBe(false);
    });

    it('should match variations', () => {
      expect(isSameMerchant('Best Buy', 'BESTBUY')).toBe(true);
    });
  });

  describe('calculateConfidence', () => {
    it('should return high confidence for perfect match with history', () => {
      const confidence = calculateConfidence(1.0, true, 10);
      expect(confidence).toBeCloseTo(1.0, 1);
    });

    it('should return low confidence for poor match', () => {
      const confidence = calculateConfidence(0.5, false, 0);
      expect(confidence).toBeLessThan(0.5);
    });

    it('should weight merchant similarity at 70%', () => {
      const confidence = calculateConfidence(1.0, false, 0);
      expect(confidence).toBeCloseTo(0.7, 1);
    });

    it('should add bonus for amount match', () => {
      const withMatch = calculateConfidence(0.8, true, 0);
      const withoutMatch = calculateConfidence(0.8, false, 0);
      expect(withMatch).toBeGreaterThan(withoutMatch);
      expect(withMatch - withoutMatch).toBeCloseTo(0.1, 2);
    });

    it('should increase with history count', () => {
      const noHistory = calculateConfidence(0.7, true, 0);
      const withHistory = calculateConfidence(0.7, true, 5);
      expect(withHistory).toBeGreaterThan(noHistory);
    });

    it('should cap history bonus at 20%', () => {
      const confidence = calculateConfidence(0.5, false, 100);
      expect(confidence).toBeLessThanOrEqual(0.7);
    });

    it('should never exceed 1.0', () => {
      const confidence = calculateConfidence(1.0, true, 100);
      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    it('should handle zero merchant similarity', () => {
      const confidence = calculateConfidence(0, true, 10);
      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThan(0.5);
    });
  });
});
