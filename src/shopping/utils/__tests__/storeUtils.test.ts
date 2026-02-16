/**
 * Tests for store utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  calculateStoreScore,
  smartRecommendStores,
  findBestStoreForItem,
} from '../storeUtils';
import type { Store, ShoppingItem } from '../../types';

describe('storeUtils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // New York to Los Angeles (approximately 2,451 miles)
      const nyLat = 40.7128;
      const nyLng = -74.0060;
      const laLat = 34.0522;
      const laLng = -118.2437;

      const distance = calculateDistance(nyLat, nyLng, laLat, laLng);

      expect(distance).toBeGreaterThan(2400);
      expect(distance).toBeLessThan(2500);
    });

    it('should return 0 for same location', () => {
      const lat = 37.7749;
      const lng = -122.4194;

      const distance = calculateDistance(lat, lng, lat, lng);

      expect(distance).toBeCloseTo(0, 1);
    });

    it('should calculate short distances accurately', () => {
      // Two points about 1 mile apart
      const lat1 = 37.7749;
      const lng1 = -122.4194;
      const lat2 = 37.7849;
      const lng2 = -122.4194;

      const distance = calculateDistance(lat1, lng1, lat2, lng2);

      expect(distance).toBeGreaterThan(0.5);
      expect(distance).toBeLessThan(10);
    });

    it('should handle negative coordinates', () => {
      const distance = calculateDistance(-33.8688, 151.2093, -37.8136, 144.9631);
      expect(distance).toBeGreaterThan(0);
    });

    it('should handle coordinates crossing the equator', () => {
      const distance = calculateDistance(10, 0, -10, 0);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('calculateStoreScore', () => {
    const createMockStore = (overrides: Partial<Store> = {}): Store => ({
      id: 'store-1',
      name: 'Test Store',
      chain: 'Test Chain',
      category: 'grocery',
      address: '123 Main St',
      city: 'Test City',
      state: 'TS',
      zip: '12345',
      country: 'USA',
      phone: '555-1234',
      website: 'https://teststore.com',
      logo: 'https://teststore.com/logo.png',
      favorite: false,
      distance: 2,
      bestFor: [],
      specialties: [],
      avgPrices: {},
      preferences: {
        priceRating: 3,
        qualityRating: 3,
        serviceRating: 3,
        selectionRating: 3,
      },
      hours: {},
      visited: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });

    it('should calculate base score for a store', () => {
      const store = createMockStore();
      const score = calculateStoreScore(store, 'produce');

      expect(score).toBeGreaterThan(0);
    });

    it('should give bonus for category match', () => {
      const storeWithoutCategory = createMockStore({ bestFor: [] });
      const storeWithCategory = createMockStore({ bestFor: ['produce'] });

      const scoreWithout = calculateStoreScore(storeWithoutCategory, 'produce');
      const scoreWith = calculateStoreScore(storeWithCategory, 'produce');

      expect(scoreWith).toBeGreaterThan(scoreWithout);
      expect(scoreWith - scoreWithout).toBe(3); // Category bonus
    });

    it('should factor in price rating', () => {
      const lowPrice = createMockStore({
        preferences: { priceRating: 5, qualityRating: 3, serviceRating: 3, selectionRating: 3 }
      });
      const highPrice = createMockStore({
        preferences: { priceRating: 1, qualityRating: 3, serviceRating: 3, selectionRating: 3 }
      });

      const scoreLow = calculateStoreScore(lowPrice, 'produce');
      const scoreHigh = calculateStoreScore(highPrice, 'produce');

      expect(scoreLow).toBeGreaterThan(scoreHigh);
    });

    it('should factor in quality rating', () => {
      const highQuality = createMockStore({
        preferences: { priceRating: 3, qualityRating: 5, serviceRating: 3, selectionRating: 3 }
      });
      const lowQuality = createMockStore({
        preferences: { priceRating: 3, qualityRating: 1, serviceRating: 3, selectionRating: 3 }
      });

      const scoreHigh = calculateStoreScore(highQuality, 'produce');
      const scoreLow = calculateStoreScore(lowQuality, 'produce');

      expect(scoreHigh).toBeGreaterThan(scoreLow);
    });

    it('should penalize for distance', () => {
      const nearStore = createMockStore({ distance: 1 });
      const farStore = createMockStore({ distance: 10 });

      const scoreNear = calculateStoreScore(nearStore, 'produce');
      const scoreFar = calculateStoreScore(farStore, 'produce');

      expect(scoreNear).toBeGreaterThan(scoreFar);
    });

    it('should give bonus for specialties', () => {
      const withSpecialties = createMockStore({ specialties: ['organic', 'local'] });
      const withoutSpecialties = createMockStore({ specialties: [] });

      const scoreWith = calculateStoreScore(withSpecialties, 'produce');
      const scoreWithout = calculateStoreScore(withoutSpecialties, 'produce');

      expect(scoreWith).toBeGreaterThan(scoreWithout);
    });

    it('should give bonus for favorite stores', () => {
      const favorite = createMockStore({ favorite: true });
      const notFavorite = createMockStore({ favorite: false });

      const scoreFav = calculateStoreScore(favorite, 'produce');
      const scoreNotFav = calculateStoreScore(notFavorite, 'produce');

      expect(scoreFav).toBeGreaterThan(scoreNotFav);
      expect(scoreFav - scoreNotFav).toBe(1); // Favorite bonus
    });

    it('should handle stores without distance', () => {
      const store = createMockStore({ distance: undefined });
      const score = calculateStoreScore(store, 'produce');

      // Should use default distance of 5 for penalty calculation
      expect(score).toBeDefined();
      expect(typeof score).toBe('number');
    });
  });

  describe('smartRecommendStores', () => {
    const mockStores: Store[] = [
      {
        id: 'store-1',
        name: 'Organic Market',
        chain: 'Organic Chain',
        category: 'specialty',
        address: '123 Main St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'USA',
        favorite: true,
        distance: 1,
        bestFor: ['produce'],
        specialties: ['organic'],
        avgPrices: {},
        preferences: {
          priceRating: 3,
          qualityRating: 5,
          serviceRating: 4,
          selectionRating: 4,
        },
        hours: {},
        visited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'store-2',
        name: 'Budget Mart',
        chain: 'Budget Chain',
        category: 'discount',
        address: '456 Oak St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'USA',
        favorite: false,
        distance: 2,
        bestFor: ['pantry', 'household'],
        specialties: [],
        avgPrices: {},
        preferences: {
          priceRating: 5,
          qualityRating: 2,
          serviceRating: 2,
          selectionRating: 3,
        },
        hours: {},
        visited: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'store-3',
        name: 'Fresh Foods',
        chain: 'Fresh Chain',
        category: 'grocery',
        address: '789 Pine St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'USA',
        favorite: false,
        distance: 3,
        bestFor: ['dairy', 'meat'],
        specialties: ['butcher'],
        avgPrices: { 'Milk': 3.99 },
        preferences: {
          priceRating: 3,
          qualityRating: 4,
          serviceRating: 4,
          selectionRating: 4,
        },
        hours: {},
        visited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should recommend stores based on category match', () => {
      const recommendations = smartRecommendStores(mockStores, 'Apples', 'produce');

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]).toBe('store-1'); // Organic Market
    });

    it('should recommend stores based on item price knowledge', () => {
      const recommendations = smartRecommendStores(mockStores, 'Milk', 'dairy');

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations).toContain('store-3'); // Has avgPrices for Milk
    });

    it('should recommend organic stores for produce', () => {
      const recommendations = smartRecommendStores(mockStores, 'Lettuce', 'produce');

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]).toBe('store-1'); // Has organic specialty
    });

    it('should sort recommendations by score', () => {
      const stores: Store[] = [
        ...mockStores,
        {
          id: 'store-4',
          name: 'Premium Produce',
          chain: 'Premium',
          category: 'specialty',
          address: '100 Elm St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          country: 'USA',
          favorite: false,
          distance: 0.5,
          bestFor: ['produce'],
          specialties: ['organic', 'local'],
          avgPrices: {},
          preferences: {
            priceRating: 2,
            qualityRating: 5,
            serviceRating: 5,
            selectionRating: 5,
          },
          hours: {},
          visited: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const recommendations = smartRecommendStores(stores, 'Tomatoes', 'produce');

      expect(recommendations.length).toBeGreaterThan(1);
      // Should be sorted by score (Premium Produce might rank higher due to closer distance and specialties)
      expect(recommendations).toContain('store-1');
      expect(recommendations).toContain('store-4');
    });

    it('should return empty array when no stores match', () => {
      const recommendations = smartRecommendStores(mockStores, 'TV', 'electronics');

      expect(recommendations).toEqual([]);
    });

    it('should handle stores with multiple matching criteria', () => {
      const recommendations = smartRecommendStores(mockStores, 'Chicken', 'meat');

      expect(recommendations).toContain('store-3'); // Best for meat
    });
  });

  describe('findBestStoreForItem', () => {
    const mockStores: Store[] = [
      {
        id: 'store-1',
        name: 'Organic Market',
        chain: 'Organic',
        category: 'specialty',
        address: '123 Main',
        city: 'City',
        state: 'ST',
        zip: '12345',
        country: 'USA',
        favorite: true,
        distance: 1,
        bestFor: ['produce'],
        specialties: ['organic'],
        avgPrices: {},
        preferences: {
          priceRating: 3,
          qualityRating: 5,
          serviceRating: 4,
          selectionRating: 4,
        },
        hours: {},
        visited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'store-2',
        name: 'Budget Mart',
        chain: 'Budget',
        category: 'discount',
        address: '456 Oak',
        city: 'City',
        state: 'ST',
        zip: '12345',
        country: 'USA',
        favorite: false,
        distance: 2,
        bestFor: ['pantry'],
        specialties: [],
        avgPrices: {},
        preferences: {
          priceRating: 5,
          qualityRating: 2,
          serviceRating: 2,
          selectionRating: 3,
        },
        hours: {},
        visited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should find best store for a shopping item', () => {
      const item: ShoppingItem = {
        id: 'item-1',
        name: 'Apples',
        quantity: 5,
        category: 'produce',
        priority: 'medium',
        purchased: false,
        tags: [],
        bestStores: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const bestStore = findBestStoreForItem(item, mockStores);

      expect(bestStore).toBe('store-1'); // Organic Market
    });

    it('should return undefined when no stores match', () => {
      const item: ShoppingItem = {
        id: 'item-2',
        name: 'Electronics',
        quantity: 1,
        category: 'electronics',
        priority: 'low',
        purchased: false,
        tags: [],
        bestStores: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const bestStore = findBestStoreForItem(item, mockStores);

      expect(bestStore).toBeUndefined();
    });

    it('should handle empty stores array', () => {
      const item: ShoppingItem = {
        id: 'item-3',
        name: 'Milk',
        quantity: 1,
        category: 'dairy',
        priority: 'medium',
        purchased: false,
        tags: [],
        bestStores: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const bestStore = findBestStoreForItem(item, []);

      expect(bestStore).toBeUndefined();
    });

    it('should prefer stores that match item category', () => {
      const item: ShoppingItem = {
        id: 'item-4',
        name: 'Rice',
        quantity: 2,
        category: 'pantry',
        priority: 'low',
        purchased: false,
        tags: [],
        bestStores: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const bestStore = findBestStoreForItem(item, mockStores);

      expect(bestStore).toBe('store-2'); // Budget Mart (bestFor: pantry)
    });
  });
});
