import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listPantryItems } from '../mealPlanningAPI';
import { supabase } from '../../lib/supabase';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock validation to pass through data
vi.mock('../../schemas/mealPlanning', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../schemas/mealPlanning')>();
  return {
    ...actual,
    validateArrayWithFilter: vi.fn((schema, data) => data), // Pass through data
  };
});

describe('Pantry Pagination', () => {
  beforeEach(() => {
    // Mock auth to return a user
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } as any },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('listPantryItems', () => {
    it('should return items without cursor for first page', async () => {
      const mockItems = [
        {
          id: 'item-1',
          user_id: 'user-123',
          connection_id: null,
          name: 'Milk',
          quantity: 2,
          unit: 'L',
          category: 'dairy',
          subcategory: null,
          location: null,
          expiration_date: null,
          notes: null,
          is_low_stock: false,
          low_stock_threshold: null,
          auto_restock: null,
          restock_quantity: null,
          last_purchased_at: null,
          last_used_at: null,
          created_at: '2024-01-15T10:00:00.000Z',
          updated_at: '2024-01-15T10:00:00.000Z',
        },
        {
          id: 'item-2',
          user_id: 'user-123',
          connection_id: null,
          name: 'Bread',
          quantity: 1,
          unit: 'loaf',
          category: 'bakery',
          subcategory: null,
          location: null,
          expiration_date: null,
          notes: null,
          is_low_stock: true,
          low_stock_threshold: 2,
          auto_restock: null,
          restock_quantity: null,
          last_purchased_at: null,
          last_used_at: null,
          created_at: '2024-01-14T10:00:00.000Z',
          updated_at: '2024-01-14T10:00:00.000Z',
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockItems, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await listPantryItems({ limit: 10 });

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBeUndefined();
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.limit).toHaveBeenCalledWith(11); // limit + 1
    });

    it('should return nextCursor when there are more results', async () => {
      const mockItems = Array.from({ length: 11 }, (_, i) => ({
        id: `item-${i + 1}`,
        user_id: 'user-123',
        connection_id: null,
        name: `Item ${i + 1}`,
        quantity: 5,
        unit: 'kg',
        category: 'food',
        subcategory: null,
        location: null,
        expiration_date: null,
        notes: null,
        is_low_stock: false,
        low_stock_threshold: null,
        auto_restock: null,
        restock_quantity: null,
        last_purchased_at: null,
        last_used_at: null,
        created_at: `2024-01-${String(20 - i).padStart(2, '0')}T10:00:00.000Z`,
        updated_at: `2024-01-${String(20 - i).padStart(2, '0')}T10:00:00.000Z`,
      }));

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockItems, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await listPantryItems({ limit: 10 });

      expect(result.items).toHaveLength(10); // Should only return limit items
      expect(result.nextCursor).toBeDefined();
      expect(result.nextCursor).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z:item-\d+$/); // Format: timestamp:id
    });

    it('should use cursor for pagination', async () => {
      const cursor = '2024-01-15T10:00:00Z:item-5';

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await listPantryItems({ cursor, limit: 10 });

      expect(mockQuery.or).toHaveBeenCalledWith(
        'created_at.lt.2024-01-15T10:00:00Z,and(created_at.eq.2024-01-15T10:00:00Z,id.lt.item-5)'
      );
    });

    it('should filter expired items', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await listPantryItems({ filter: 'expired', limit: 10 });

      expect(mockQuery.lt).toHaveBeenCalledWith('expiration_date', expect.any(String));
    });

    it('should filter expiring soon items', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await listPantryItems({ filter: 'expiring_soon', limit: 10 });

      expect(mockQuery.gte).toHaveBeenCalledWith('expiration_date', expect.any(String));
      expect(mockQuery.lte).toHaveBeenCalledWith('expiration_date', expect.any(String));
    });

    it('should filter low stock items', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await listPantryItems({ filter: 'low_stock', limit: 10 });

      expect(mockQuery.eq).toHaveBeenCalledWith('is_low_stock', true);
    });

    it('should handle invalid cursor gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        or: undefined as any,
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      // Invalid cursor format should be ignored
      await listPantryItems({ cursor: 'invalid-cursor', limit: 10 });

      // Should not call .or() for invalid cursor
      expect(mockQuery.or).toBeUndefined();
    });

    it('should order by created_at DESC then id DESC', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await listPantryItems({ limit: 10 });

      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockQuery.order).toHaveBeenCalledWith('id', { ascending: false });
    });

    it('should use default limit of 100 when not specified', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await listPantryItems();

      expect(mockQuery.limit).toHaveBeenCalledWith(101); // default limit 100 + 1
    });
  });
});
