import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import {
  getSkincareProducts,
  createSkincareProduct,
  updateSkincareProduct,
  deleteSkincareProduct,
  getSkinConditionLogs,
  createSkinConditionLog,
  getSkincareStats,
} from '../skincareAPI';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('Skincare API', () => {
  const mockUser = { id: 'test-user-123' };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase!.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
    });
  });

  describe('Products', () => {
    const mockProduct = {
      id: 'product-1',
      user_id: 'test-user-123',
      name: 'Vitamin C Serum',
      brand: 'The Ordinary',
      category: 'serum',
      in_use: true,
      purchase_date: '2025-01-01',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    it('should create skincare product', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProduct,
          error: null,
        }),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      const input = {
        name: 'Vitamin C Serum',
        brand: 'The Ordinary',
        category: 'serum' as const,
        usageTime: ['AM' as const],
        currentlyUsing: true,
        purchaseDate: '2025-01-01',
      };

      const result = await createSkincareProduct(input);

      expect(vi.mocked(supabase!.from)).toHaveBeenCalledWith('skincare_products');
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          name: 'Vitamin C Serum',
          brand: 'The Ordinary',
          category: 'serum',
        })
      );
      expect(result.name).toBe('Vitamin C Serum');
    });

    it('should get skincare products', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockProduct],
          error: null,
        }),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      const result = await getSkincareProducts();

      expect(vi.mocked(supabase!.from)).toHaveBeenCalledWith('skincare_products');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Vitamin C Serum');
    });

    it('should filter products by category', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: [mockProduct], error: null })),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      await getSkincareProducts({ category: 'serum' });

      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'serum');
    });

    it('should filter products by in_use status', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: [mockProduct], error: null })),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      await getSkincareProducts({ in_use: true });

      expect(mockQuery.eq).toHaveBeenCalledWith('in_use', true);
    });

    it('should update skincare product', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockProduct, currently_using: false },
          error: null,
        }),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      const result = await updateSkincareProduct('product-1', { currentlyUsing: false });

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          currently_using: false,
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'product-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(result.currentlyUsing).toBe(false);
    });

    it('should delete skincare product', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockResolvedValue({ error: null });

      const mockQuery = {
        delete: mockDelete,
      };

      mockDelete.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });

      (supabase!.from as any).mockReturnValue(mockQuery);

      await deleteSkincareProduct('product-1');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq1).toHaveBeenCalledWith('id', 'product-1');
      expect(mockEq2).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('should throw error when product creation fails', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      await expect(
        createSkincareProduct({ name: 'Test', category: 'serum', usageTime: ['AM'], currentlyUsing: true })
      ).rejects.toThrow();
    });
  });

  describe('Condition Logs', () => {
    const mockLog = {
      id: 'log-1',
      user_id: 'test-user-123',
      date: '2025-01-15',
      overall_condition: 4,
      notes: 'Skin looking good',
      created_at: '2025-01-15T10:00:00Z',
    };

    it('should log skin condition', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockLog,
          error: null,
        }),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      const input = {
        date: '2025-01-15',
        overall_condition: 4 as const,
        concerns: ['acne', 'dryness'],
        notes: 'Skin looking good',
      };

      const result = await createSkinConditionLog(input);

      expect(vi.mocked(supabase!.from)).toHaveBeenCalledWith('skin_condition_logs');
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          date: '2025-01-15',
          overall_condition: 4,
        })
      );
      expect(result.overall_condition).toBe(4);
    });

    it('should get skin condition logs', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockLog],
          error: null,
        }),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      const result = await getSkinConditionLogs();

      expect(vi.mocked(supabase!.from)).toHaveBeenCalledWith('skin_condition_logs');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockQuery.order).toHaveBeenCalledWith('date', { ascending: false });
      expect(result).toHaveLength(1);
      expect(result[0].overall_condition).toBe(4);
    });

    it('should filter logs by date range', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: [mockLog], error: null })),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      await getSkinConditionLogs({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(mockQuery.gte).toHaveBeenCalledWith('date', '2025-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('date', '2025-01-31');
    });

    it('should throw error when log creation fails', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      await expect(
        createSkinConditionLog({ date: '2025-01-15', overall_condition: 4 as const, concerns: [] })
      ).rejects.toThrow();
    });
  });

  describe('Stats', () => {
    it('should calculate skincare stats', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', currently_using: true, category: 'serum', usage_time: [], skin_type: null, concerns: [], ingredients: null, notes: null, purchase_date: null, expiry_date: null, size: null, size_unit: null, price: null, user_id: 'test-user-123', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
        { id: '2', name: 'Product 2', currently_using: false, category: 'serum', usage_time: [], skin_type: null, concerns: [], ingredients: null, notes: null, purchase_date: null, expiry_date: null, size: null, size_unit: null, price: null, user_id: 'test-user-123', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
        { id: '3', name: 'Product 3', currently_using: true, category: 'serum', usage_time: [], skin_type: null, concerns: [], ingredients: null, notes: null, purchase_date: null, expiry_date: null, size: null, size_unit: null, price: null, user_id: 'test-user-123', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
      ];

      const mockLogs = [
        { id: '1', date: '2025-01-15', overall_condition: 4 },
        { id: '2', date: '2025-01-14', overall_condition: 5 },
        { id: '3', date: '2025-01-13', overall_condition: 3 },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      (supabase!.from as any).mockImplementation((table: string) => {
        if (table === 'skincare_products') {
          return {
            ...mockQuery,
            order: vi.fn().mockResolvedValue({
              data: mockProducts,
              error: null,
            }),
          };
        } else if (table === 'skin_condition_logs') {
          return {
            ...mockQuery,
            order: vi.fn().mockResolvedValue({
              data: mockLogs,
              error: null,
            }),
          };
        }
        return mockQuery;
      });

      const result = await getSkincareStats();

      expect(result.totalProducts).toBe(3);
      expect(result.productsInUse).toBe(2);
      expect(result.averageCondition).toBe(4); // (4+5+3)/3 = 4
      expect(result.recentLogs).toHaveLength(3);
    });
  });
});
