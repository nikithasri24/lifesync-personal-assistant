import { describe, it, expect } from 'vitest';
import {
  UUIDSchema,
  ISODateSchema,
  PhoneSchema,
  ColorHexSchema,
  ShoppingCategorySchema,
  PrioritySchema,
  StoreTypeSchema,
  ShoppingListTypeSchema,
  RatingSchema,
  NutritionInfoSchema,
  ShoppingItemSchema,
  ShoppingItemInputSchema,
  CoordinatesSchema,
  StorePreferencesSchema,
  StoreSchema,
  StoreInputSchema,
  ShoppingListSchema,
  ShoppingListInputSchema,
  ParsedReceiptItemSchema,
  ReceiptMetaSchema,
  validateReceiptItems,
  validateReceiptMeta,
  validateReceipt,
  validateShoppingItemsArray,
  validateShoppingItem,
} from '../shopping';

describe('Shopping Schemas', () => {
  describe('Common Schemas', () => {
    it('should validate UUID', () => {
      expect(UUIDSchema.parse('123e4567-e89b-12d3-a456-426614174000')).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(() => UUIDSchema.parse('not-a-uuid')).toThrow();
      expect(() => UUIDSchema.parse('123')).toThrow();
    });

    it('should validate ISO dates', () => {
      expect(ISODateSchema.parse('2024-01-15')).toBe('2024-01-15');
      expect(ISODateSchema.parse('2024-01-15T10:00:00Z')).toBe('2024-01-15T10:00:00Z');
      expect(() => ISODateSchema.parse('2024/01/15')).toThrow();
      expect(() => ISODateSchema.parse('not-a-date')).toThrow();
    });

    it('should validate phone numbers', () => {
      expect(PhoneSchema.parse('123-456-7890')).toBe('123-456-7890');
      expect(PhoneSchema.parse('(123) 456-7890')).toBe('(123) 456-7890');
      expect(PhoneSchema.parse('+1 123 456 7890')).toBe('+1 123 456 7890');
      expect(() => PhoneSchema.parse('abc')).toThrow();
      expect(() => PhoneSchema.parse('123')).toThrow(); // Too short
    });

    it('should validate color hex codes', () => {
      expect(ColorHexSchema.parse('#FF5733')).toBe('#FF5733');
      expect(ColorHexSchema.parse('#000000')).toBe('#000000');
      expect(() => ColorHexSchema.parse('FF5733')).toThrow(); // Missing #
      expect(() => ColorHexSchema.parse('#FFF')).toThrow(); // Too short
      expect(() => ColorHexSchema.parse('#GGGGGG')).toThrow(); // Invalid chars
    });
  });

  describe('Enum Schemas', () => {
    it('should validate shopping categories', () => {
      expect(ShoppingCategorySchema.parse('produce')).toBe('produce');
      expect(ShoppingCategorySchema.parse('dairy')).toBe('dairy');
      expect(() => ShoppingCategorySchema.parse('invalid')).toThrow();
    });

    it('should validate priorities', () => {
      expect(PrioritySchema.parse('low')).toBe('low');
      expect(PrioritySchema.parse('medium')).toBe('medium');
      expect(PrioritySchema.parse('high')).toBe('high');
      expect(() => PrioritySchema.parse('urgent')).toThrow();
    });

    it('should validate store types', () => {
      expect(StoreTypeSchema.parse('grocery')).toBe('grocery');
      expect(StoreTypeSchema.parse('wholesale')).toBe('wholesale');
      expect(() => StoreTypeSchema.parse('invalid')).toThrow();
    });

    it('should validate shopping list types', () => {
      expect(ShoppingListTypeSchema.parse('master')).toBe('master');
      expect(ShoppingListTypeSchema.parse('recipe-based')).toBe('recipe-based');
      expect(() => ShoppingListTypeSchema.parse('invalid')).toThrow();
    });

    it('should validate ratings', () => {
      expect(RatingSchema.parse(1)).toBe(1);
      expect(RatingSchema.parse(5)).toBe(5);
      expect(() => RatingSchema.parse(0)).toThrow(); // Too low
      expect(() => RatingSchema.parse(6)).toThrow(); // Too high
      expect(() => RatingSchema.parse(3.5)).toThrow(); // Not integer
    });
  });

  describe('NutritionInfoSchema', () => {
    it('should validate complete nutrition info', () => {
      const nutrition = {
        calories: 250,
        organic: true,
        glutenFree: false,
        vegan: true,
      };
      const result = NutritionInfoSchema.parse(nutrition);
      expect(result.calories).toBe(250);
      expect(result.organic).toBe(true);
    });

    it('should validate partial nutrition info', () => {
      const nutrition = { organic: true };
      const result = NutritionInfoSchema.parse(nutrition);
      expect(result.organic).toBe(true);
      expect(result.calories).toBeUndefined();
    });

    it('should reject negative calories', () => {
      expect(() => NutritionInfoSchema.parse({ calories: -10 })).toThrow();
    });

    it('should reject unreasonably high calories', () => {
      expect(() => NutritionInfoSchema.parse({ calories: 20000 })).toThrow();
    });
  });

  describe('ShoppingItemSchema', () => {
    const validItem = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Organic Bananas',
      quantity: 6,
      unit: 'count',
      category: 'produce',
      priority: 'medium',
      purchased: false,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    };

    it('should validate a complete shopping item', () => {
      const result = ShoppingItemSchema.parse(validItem);
      expect(result.name).toBe('Organic Bananas');
      expect(result.quantity).toBe(6);
    });

    it('should validate with all optional fields', () => {
      const itemWithOptionals = {
        ...validItem,
        subcategory: 'fruit',
        price: 3.99,
        estimatedPrice: 4.50,
        aisle: '5A',
        brand: 'Dole',
        size: '1 lb',
        notes: 'Buy ripe ones',
        imageUrl: 'https://example.com/banana.jpg',
        barcode: '012345678901',
        nutritionInfo: { calories: 105, organic: true },
        tags: ['fruit', 'healthy'],
        addedBy: '223e4567-e89b-12d3-a456-426614174000',
        purchasedAt: '2024-01-16T10:00:00Z',
        purchasedBy: '323e4567-e89b-12d3-a456-426614174000',
        assignedStore: '423e4567-e89b-12d3-a456-426614174000',
        bestStores: ['523e4567-e89b-12d3-a456-426614174000'],
      };

      const result = ShoppingItemSchema.parse(itemWithOptionals);
      expect(result.brand).toBe('Dole');
      expect(result.tags).toHaveLength(2);
    });

    it('should reject invalid name', () => {
      expect(() => ShoppingItemSchema.parse({ ...validItem, name: '' })).toThrow();
      expect(() => ShoppingItemSchema.parse({ ...validItem, name: 'A'.repeat(201) })).toThrow();
    });

    it('should reject invalid quantity', () => {
      expect(() => ShoppingItemSchema.parse({ ...validItem, quantity: 0 })).toThrow();
      expect(() => ShoppingItemSchema.parse({ ...validItem, quantity: -5 })).toThrow();
      expect(() => ShoppingItemSchema.parse({ ...validItem, quantity: 20000 })).toThrow();
    });

    it('should reject invalid price', () => {
      expect(() => ShoppingItemSchema.parse({ ...validItem, price: -1 })).toThrow();
      expect(() => ShoppingItemSchema.parse({ ...validItem, price: 200000 })).toThrow();
    });

    it('should reject invalid barcode', () => {
      expect(() => ShoppingItemSchema.parse({ ...validItem, barcode: 'abc123' })).toThrow();
    });

    it('should reject too many tags', () => {
      const tooManyTags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
      expect(() => ShoppingItemSchema.parse({ ...validItem, tags: tooManyTags })).toThrow();
    });
  });

  describe('ShoppingItemInputSchema', () => {
    it('should validate input without system fields', () => {
      const input = {
        name: 'Milk',
        quantity: 1,
        category: 'dairy',
        priority: 'high',
        purchased: false,
      };

      const result = ShoppingItemInputSchema.parse(input);
      expect(result.name).toBe('Milk');
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('createdAt');
    });
  });

  describe('CoordinatesSchema', () => {
    it('should validate correct coordinates', () => {
      const coords = { lat: 37.7749, lng: -122.4194 };
      const result = CoordinatesSchema.parse(coords);
      expect(result.lat).toBe(37.7749);
      expect(result.lng).toBe(-122.4194);
    });

    it('should reject invalid latitude', () => {
      expect(() => CoordinatesSchema.parse({ lat: 91, lng: 0 })).toThrow();
      expect(() => CoordinatesSchema.parse({ lat: -91, lng: 0 })).toThrow();
    });

    it('should reject invalid longitude', () => {
      expect(() => CoordinatesSchema.parse({ lat: 0, lng: 181 })).toThrow();
      expect(() => CoordinatesSchema.parse({ lat: 0, lng: -181 })).toThrow();
    });
  });

  describe('StorePreferencesSchema', () => {
    const validPreferences = {
      priceRating: 4,
      qualityRating: 5,
      cleanlinessRating: 4,
      serviceRating: 5,
      overallRating: 5,
    };

    it('should validate complete preferences', () => {
      const result = StorePreferencesSchema.parse(validPreferences);
      expect(result.overallRating).toBe(5);
    });

    it('should reject invalid ratings', () => {
      expect(() =>
        StorePreferencesSchema.parse({ ...validPreferences, priceRating: 0 })
      ).toThrow();
      expect(() =>
        StorePreferencesSchema.parse({ ...validPreferences, qualityRating: 6 })
      ).toThrow();
    });
  });

  describe('StoreSchema', () => {
    const validStore = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Whole Foods Market',
      type: 'organic',
      color: '#00AA55',
      preferences: {
        priceRating: 2,
        qualityRating: 5,
        cleanlinessRating: 5,
        serviceRating: 4,
        overallRating: 4,
      },
      specialties: ['Organic', 'Natural'],
      bestFor: ['Produce', 'Meat'],
      avgPrices: { milk: 4.99, bread: 5.99 },
      favorite: true,
    };

    it('should validate a complete store', () => {
      const result = StoreSchema.parse(validStore);
      expect(result.name).toBe('Whole Foods Market');
      expect(result.type).toBe('organic');
    });

    it('should validate with all optional fields', () => {
      const storeWithOptionals = {
        ...validStore,
        address: '123 Main St, San Francisco, CA 94102',
        phone: '415-555-0123',
        website: 'https://www.wholefoodsmarket.com',
        logo: 'https://example.com/logo.png',
        coordinates: { lat: 37.7749, lng: -122.4194 },
        distance: 2.5,
        lastVisited: '2024-01-15',
        hours: {
          monday: { open: '8:00 AM', close: '10:00 PM' },
          tuesday: { open: '8:00 AM', close: '10:00 PM' },
        },
        hasDelivery: true,
        hasPickup: true,
        deliveryFee: 5.99,
      };

      const result = StoreSchema.parse(storeWithOptionals);
      expect(result.address).toBeDefined();
      expect(result.coordinates?.lat).toBe(37.7749);
      expect(result.hasDelivery).toBe(true);
    });

    it('should reject invalid store name', () => {
      expect(() => StoreSchema.parse({ ...validStore, name: '' })).toThrow();
      expect(() => StoreSchema.parse({ ...validStore, name: 'A'.repeat(201) })).toThrow();
    });

    it('should reject invalid color', () => {
      expect(() => StoreSchema.parse({ ...validStore, color: 'red' })).toThrow();
      expect(() => StoreSchema.parse({ ...validStore, color: '#FFF' })).toThrow();
    });

    it('should reject negative distance', () => {
      expect(() => StoreSchema.parse({ ...validStore, distance: -1 })).toThrow();
    });

    it('should reject negative delivery fee', () => {
      expect(() => StoreSchema.parse({ ...validStore, deliveryFee: -5 })).toThrow();
    });
  });

  describe('StoreInputSchema', () => {
    it('should validate input without id', () => {
      const input = {
        name: 'Trader Joes',
        type: 'grocery',
        color: '#FF6B35',
        preferences: {
          priceRating: 4,
          qualityRating: 4,
          cleanlinessRating: 5,
          serviceRating: 5,
          overallRating: 4,
        },
        specialties: ['Snacks', 'Frozen'],
        bestFor: ['Quick meals'],
        avgPrices: {},
        favorite: false,
      };

      const result = StoreInputSchema.parse(input);
      expect(result.name).toBe('Trader Joes');
      expect(result).not.toHaveProperty('id');
    });
  });

  describe('ShoppingListSchema', () => {
    const validList = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Weekly Groceries',
      type: 'master',
      color: '#4CAF50',
      items: [],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    };

    it('should validate a complete shopping list', () => {
      const result = ShoppingListSchema.parse(validList);
      expect(result.name).toBe('Weekly Groceries');
      expect(result.items).toHaveLength(0);
    });

    it('should validate with all optional fields', () => {
      const listWithOptionals = {
        ...validList,
        description: 'Regular weekly shopping',
        icon: 'shopping-cart',
        storeId: '223e4567-e89b-12d3-a456-426614174000',
        totalEstimatedCost: 150.00,
        totalActualCost: 145.50,
        items: [
          {
            id: '323e4567-e89b-12d3-a456-426614174000',
            name: 'Milk',
            quantity: 1,
            category: 'dairy',
            priority: 'high',
            purchased: false,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
          },
        ],
      };

      const result = ShoppingListSchema.parse(listWithOptionals);
      expect(result.description).toBe('Regular weekly shopping');
      expect(result.items).toHaveLength(1);
      expect(result.totalActualCost).toBe(145.50);
    });

    it('should reject invalid list name', () => {
      expect(() => ShoppingListSchema.parse({ ...validList, name: '' })).toThrow();
      expect(() => ShoppingListSchema.parse({ ...validList, name: 'A'.repeat(201) })).toThrow();
    });

    it('should reject negative costs', () => {
      expect(() =>
        ShoppingListSchema.parse({ ...validList, totalEstimatedCost: -10 })
      ).toThrow();
      expect(() =>
        ShoppingListSchema.parse({ ...validList, totalActualCost: -5 })
      ).toThrow();
    });

    it('should reject too many items', () => {
      const tooManyItems = Array.from({ length: 1001 }, (_, i) => ({
        id: `${i}23e4567-e89b-12d3-a456-426614174000`,
        name: `Item ${i}`,
        quantity: 1,
        category: 'other',
        priority: 'low',
        purchased: false,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }));

      expect(() =>
        ShoppingListSchema.parse({ ...validList, items: tooManyItems })
      ).toThrow();
    });
  });

  describe('Receipt Validation (Existing)', () => {
    describe('ParsedReceiptItemSchema', () => {
      const validReceiptItem = {
        id: 'item-1',
        name: 'Organic Apples',
        quantity: 5,
        selected: true,
        category: 'produce',
        threshold: 'low',
        price: 8.99,
        size: '3 lb bag',
      };

      it('should validate receipt item', () => {
        const result = ParsedReceiptItemSchema.parse(validReceiptItem);
        expect(result.name).toBe('Organic Apples');
        expect(result.price).toBe(8.99);
      });

      it('should reject invalid name characters', () => {
        expect(() =>
          ParsedReceiptItemSchema.parse({ ...validReceiptItem, name: 'Item<script>' })
        ).toThrow();
      });
    });

    describe('ReceiptMetaSchema', () => {
      const validMeta = {
        merchant: 'Whole Foods',
        date: '2024-01-15',
        subtotal: 100.00,
        tax: 8.75,
        total: 108.75,
      };

      it('should validate receipt metadata', () => {
        const result = ReceiptMetaSchema.parse(validMeta);
        expect(result.merchant).toBe('Whole Foods');
        expect(result.total).toBe(108.75);
      });

      it('should reject incorrect total calculation', () => {
        expect(() =>
          ReceiptMetaSchema.parse({ ...validMeta, total: 200 })
        ).toThrow();
      });

      it('should allow total within 1% tolerance', () => {
        const result = ReceiptMetaSchema.parse({
          ...validMeta,
          total: 108.90, // Within 1% of 108.75
        });
        expect(result.total).toBe(108.90);
      });
    });

    describe('validateReceiptItems', () => {
      it('should filter out invalid items', () => {
        const items = [
          {
            id: '1',
            name: 'Valid Item',
            quantity: 1,
            selected: true,
            category: 'produce',
            threshold: 'low',
          },
          {
            id: '2',
            name: 'Invalid<>Item',
            quantity: 1,
            selected: true,
            category: 'produce',
            threshold: 'low',
          },
        ];

        const result = validateReceiptItems(items);
        expect(result.valid).toHaveLength(1);
        expect(result.invalid).toBe(1);
        expect(result.errors).toHaveLength(1);
      });

      it('should throw in strict mode', () => {
        const items = [
          {
            id: '1',
            name: 'Invalid<>Item',
            quantity: 1,
            selected: true,
            category: 'produce',
            threshold: 'low',
          },
        ];

        expect(() => validateReceiptItems(items, { strict: true })).toThrow();
      });
    });

    describe('validateReceipt', () => {
      it('should validate complete receipt', () => {
        const items = [
          {
            id: '1',
            name: 'Apples',
            quantity: 5,
            selected: true,
            category: 'produce',
            threshold: 'low',
            price: 8.99,
          },
        ];

        const meta = {
          merchant: 'Store',
          total: 8.99,
        };

        const result = validateReceipt(items, meta);
        expect(result.items).toHaveLength(1);
        expect(result.meta.merchant).toBe('Store');
        expect(result.validation.itemCount).toBe(1);
        expect(result.validation.invalidItemCount).toBe(0);
      });

      it('should throw in strict mode when no valid items', () => {
        const items = [
          {
            id: '1',
            name: 'Bad<>Item',
            quantity: 1,
            selected: true,
            category: 'produce',
            threshold: 'low',
          },
        ];

        expect(() => validateReceipt(items, {}, { strict: true })).toThrow();
      });
    });
  });

  describe('Helper Functions', () => {
    describe('validateShoppingItemsArray', () => {
      it('should filter out invalid items and keep valid ones', () => {
        const items = [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Valid',
            quantity: 1,
            category: 'produce',
            priority: 'low',
            purchased: false,
            createdAt: '2024-01-15',
            updatedAt: '2024-01-15',
          },
          {
            id: 'invalid-uuid',
            name: 'Invalid',
            quantity: 1,
            category: 'produce',
            priority: 'low',
            purchased: false,
            createdAt: '2024-01-15',
            updatedAt: '2024-01-15',
          },
        ];

        const result = validateShoppingItemsArray(
          ShoppingItemSchema,
          items,
          'test'
        );

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Valid');
      });
    });

    describe('validateShoppingItem', () => {
      it('should return validated item on success', () => {
        const item = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test',
          quantity: 1,
          category: 'produce',
          priority: 'low',
          purchased: false,
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
        };

        const result = validateShoppingItem(ShoppingItemSchema, item, 'test');
        expect(result.name).toBe('Test');
      });

      it('should throw on validation failure', () => {
        const item = {
          id: 'invalid',
          name: 'Test',
          quantity: 1,
        };

        expect(() =>
          validateShoppingItem(ShoppingItemSchema, item, 'test')
        ).toThrow(/Validation failed for test/);
      });
    });
  });
});
