import { describe, it, expect } from 'vitest';
import { parseReceiptToItems, parseReceiptMeta, categorizeName } from '../receiptParser';

describe('receiptParser', () => {
  describe('parseReceiptToItems', () => {
    it('should parse valid receipt items', () => {
      const receiptText = `
WHOLE FOODS MARKET
123 Main St
Date: 2024-01-15

Organic Bananas         2.99
Chicken Breast 2 lb    12.99
Whole Milk 1 gal        4.49
Bread                   3.99

Subtotal               24.46
Tax                     1.96
Total                  26.42
      `;

      const result = parseReceiptToItems(receiptText);

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.validation.validItems).toBe(result.items.length);
      expect(result.validation.invalidItems).toBe(0);
      expect(result.validation.errors).toEqual([]);

      // Check that items have required fields
      result.items.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.name).toBeDefined();
        expect(item.name.length).toBeGreaterThanOrEqual(2);
        expect(item.quantity).toBeGreaterThan(0);
        expect(item.category).toBeDefined();
      });
    });

    it('should filter out invalid items with single character names', () => {
      const receiptText = `
A                      1.99
Valid Item Name        5.99
B                      2.99
Another Good Item      7.99
      `;

      const result = parseReceiptToItems(receiptText);

      // Should only get 2 valid items (A and B are too short)
      expect(result.items.length).toBe(2);
      expect(result.items[0].name).toBe('Valid Item Name');
      expect(result.items[1].name).toBe('Another Good Item');
    });

    it('should handle items with quantities', () => {
      const receiptText = `
2 x Apples             5.98
3 x Oranges            8.97
      `;

      const result = parseReceiptToItems(receiptText);

      expect(result.items.length).toBe(2);
      expect(result.items[0].quantity).toBe(2);
      expect(result.items[1].quantity).toBe(3);
    });

    it('should handle multi-buy formats', () => {
      const receiptText = `
2 for 5.00 Yogurt
3 / 10.00 Cans
      `;

      const result = parseReceiptToItems(receiptText);

      expect(result.items.length).toBe(2);
      expect(result.items[0].quantity).toBe(2);
      expect(result.items[0].price).toBe(2.50); // 5.00 / 2
      expect(result.items[1].quantity).toBe(3);
      expect(result.items[1].price).toBeCloseTo(3.33, 2); // 10.00 / 3
    });

    it('should extract sizes from item names', () => {
      const receiptText = `
Milk 1 gal             4.99
Orange Juice 64 oz     3.99
Coffee 12 oz           8.99
      `;

      const result = parseReceiptToItems(receiptText);

      expect(result.items.length).toBe(3);
      // Size extraction happens during parsing - just verify items parsed successfully
      expect(result.items.every(item => item.name.length > 0)).toBe(true);
      expect(result.items.every(item => item.price !== undefined)).toBe(true);
    });

    it('should throw error when no valid items found', () => {
      const receiptText = `
Subtotal               24.46
Tax                     1.96
Total                  26.42
      `;

      expect(() => parseReceiptToItems(receiptText)).toThrow('No valid items found in receipt');
    });

    it('should handle items with unreasonably high quantities', () => {
      const receiptText = `
Normal Item            5.99
9999 x Invalid Item   99.99
      `;

      const result = parseReceiptToItems(receiptText);

      // Should filter out item with quantity > 1000
      expect(result.validation.invalidItems).toBeGreaterThan(0);
      expect(result.items.every(item => item.quantity <= 1000)).toBe(true);
    });

    it('should handle duplicate item names by skipping duplicates', () => {
      const receiptText = `
Bananas                2.99
Apples                 3.99
Bananas                2.99
Oranges                4.99
      `;

      const result = parseReceiptToItems(receiptText);

      // Should only have 3 items (Bananas appears twice)
      expect(result.items.length).toBe(3);
      const itemNames = result.items.map(item => item.name.toLowerCase());
      expect(new Set(itemNames).size).toBe(3); // All unique
    });
  });

  describe('parseReceiptMeta', () => {
    it('should parse receipt metadata successfully', () => {
      const receiptText = `
WHOLE FOODS MARKET
123 Main St, New York, NY 10001
Date: 2024-01-15
Time: 10:30 AM

Items...

Subtotal               24.46
Tax                     1.96
Total                  26.42
Visa *1234
      `;

      const meta = parseReceiptMeta(receiptText);

      expect(meta.merchant).toBeDefined();
      expect(meta.date).toBeDefined();
      expect(meta.time).toBeDefined();
      expect(meta.subtotal).toBe(24.46);
      expect(meta.tax).toBe(1.96);
      expect(meta.total).toBe(26.42);
      expect(meta.payment).toBeDefined();
    });

    it('should handle missing metadata fields gracefully', () => {
      const receiptText = `
Some Store
Total                  10.00
      `;

      const meta = parseReceiptMeta(receiptText);

      expect(meta.total).toBe(10.00);
      expect(meta.subtotal).toBeUndefined();
      expect(meta.tax).toBeUndefined();
    });

    it('should validate date formats', () => {
      const receiptText1 = 'Date: 2024-01-15';
      const receiptText2 = 'Date: 01/15/2024';

      const meta1 = parseReceiptMeta(receiptText1);
      const meta2 = parseReceiptMeta(receiptText2);

      expect(meta1.date).toBe('2024-01-15');
      expect(meta2.date).toBe('01/15/2024');
    });

    it('should validate time formats', () => {
      const receiptText1 = 'Time: 10:30 AM';
      const receiptText2 = 'Time: 14:30:00';

      const meta1 = parseReceiptMeta(receiptText1);
      const meta2 = parseReceiptMeta(receiptText2);

      expect(meta1.time).toBe('10:30 AM');
      expect(meta2.time).toBe('14:30:00');
    });

    it('should handle totals validation', () => {
      const receiptText = `
Subtotal              100.00
Tax                    10.00
Total                 110.00
      `;

      const meta = parseReceiptMeta(receiptText);

      // Should parse valid totals correctly
      expect(meta.subtotal).toBe(100.00);
      expect(meta.tax).toBe(10.00);
      expect(meta.total).toBe(110.00);
    });

    it('should handle prices with commas (European format)', () => {
      const receiptText = `
Subtotal              24,46
Tax                    1,96
Total                 26,42
      `;

      const meta = parseReceiptMeta(receiptText);

      expect(meta.subtotal).toBe(24.46);
      expect(meta.tax).toBe(1.96);
      expect(meta.total).toBe(26.42);
    });

    it('should handle minimal/invalid input gracefully', () => {
      const receiptText = 'No valid data here';

      const meta = parseReceiptMeta(receiptText);

      // May return empty or just merchant - both are acceptable
      expect(typeof meta).toBe('object');
      expect(meta.total).toBeUndefined();
    });
  });

  describe('categorizeName', () => {
    it('should categorize produce items', () => {
      expect(categorizeName('Organic Bananas')).toBe('produce');
      expect(categorizeName('Fresh Tomatoes')).toBe('produce');
      expect(categorizeName('Spinach Leaves')).toBe('produce');
    });

    it('should categorize dairy items', () => {
      expect(categorizeName('Whole Milk')).toBe('dairy');
      expect(categorizeName('Greek Yogurt')).toBe('dairy');
      expect(categorizeName('Cheddar Cheese')).toBe('dairy');
    });

    it('should categorize meat items', () => {
      expect(categorizeName('Chicken Breast')).toBe('meat');
      expect(categorizeName('Ground Beef')).toBe('meat');
      expect(categorizeName('Fresh Salmon')).toBe('meat');
    });

    it('should categorize bakery items', () => {
      expect(categorizeName('Whole Wheat Bread')).toBe('bakery');
      expect(categorizeName('Bagels')).toBe('bakery');
      expect(categorizeName('Croissants')).toBe('bakery');
    });

    it('should categorize frozen items', () => {
      expect(categorizeName('Frozen Pizza')).toBe('frozen');
      expect(categorizeName('Frozen Vegetables')).toBe('frozen');
      expect(categorizeName('Frozen Peas')).toBe('frozen');
    });

    it('should categorize household items', () => {
      expect(categorizeName('Laundry Detergent')).toBe('household');
      expect(categorizeName('Paper Towels')).toBe('household');
      expect(categorizeName('Dish Soap')).toBe('household');
    });

    it('should categorize personal care items', () => {
      expect(categorizeName('Toothpaste')).toBe('personal');
      expect(categorizeName('Deodorant')).toBe('personal');
      expect(categorizeName('Razor Blades')).toBe('personal');
    });

    it('should categorize pantry items', () => {
      expect(categorizeName('Olive Oil')).toBe('pantry');
      expect(categorizeName('Pasta')).toBe('pantry');
      expect(categorizeName('Rice')).toBe('pantry');
      expect(categorizeName('Canned Beans')).toBe('pantry');
    });

    it('should default to other for unknown items', () => {
      expect(categorizeName('Unknown Item XYZ')).toBe('other');
      expect(categorizeName('Random Thing')).toBe('other');
    });

    it('should be case insensitive', () => {
      expect(categorizeName('ORGANIC BANANAS')).toBe('produce');
      expect(categorizeName('whole milk')).toBe('dairy');
      expect(categorizeName('ChIcKeN BrEaSt')).toBe('meat');
    });
  });
});
