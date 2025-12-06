import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../currency';

describe('currency', () => {
  describe('formatCurrency', () => {
    it('should format USD currency by default', () => {
      const formatted = formatCurrency(1234.56);
      expect(formatted).toBe('$1,234.56');
    });

    it('should format zero correctly', () => {
      const formatted = formatCurrency(0);
      expect(formatted).toBe('$0.00');
    });

    it('should format negative amounts', () => {
      const formatted = formatCurrency(-500.25);
      expect(formatted).toBe('-$500.25');
    });

    it('should handle large numbers', () => {
      const formatted = formatCurrency(1000000);
      expect(formatted).toBe('$1,000,000.00');
    });

    it('should handle small decimal numbers', () => {
      const formatted = formatCurrency(0.99);
      expect(formatted).toBe('$0.99');
    });

    it('should respect custom fraction digits', () => {
      const formatted = formatCurrency(1234.5678, 3);
      expect(formatted).toBe('$1,234.568');
    });

    it('should format with zero fraction digits', () => {
      const formatted = formatCurrency(1234.56, 0);
      expect(formatted).toBe('$1,235');
    });

    it('should format EUR currency', () => {
      const formatted = formatCurrency(1234.56, undefined, 'EUR', 'en-US');
      expect(formatted).toBe('€1,234.56');
    });

    it('should format GBP currency', () => {
      const formatted = formatCurrency(1234.56, undefined, 'GBP', 'en-US');
      expect(formatted).toBe('£1,234.56');
    });

    it('should handle different locales', () => {
      const formatted = formatCurrency(1234.56, undefined, 'USD', 'de-DE');
      expect(formatted).toContain('1');
      expect(formatted).toContain('234');
      expect(formatted).toContain('56');
    });

    it('should handle very small numbers with custom fraction digits', () => {
      const formatted = formatCurrency(0.001, 4);
      expect(formatted).toBe('$0.0010');
    });

    it('should round correctly with fraction digits', () => {
      const formatted = formatCurrency(1234.9999, 2);
      expect(formatted).toBe('$1,235.00');
    });
  });
});
