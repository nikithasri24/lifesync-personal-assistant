import { describe, it, expect, beforeEach, vi } from 'vitest';
import { skincareTools } from '../tools';
import * as skincareAPI from '@/api/skincareAPI';

// Mock the skincare API
vi.mock('@/api/skincareAPI');

describe('Skincare AI Tools', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('add_skincare_product tool', () => {
    it('should add a skincare product', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Vitamin C Serum',
        brand: 'The Ordinary',
        category: 'serum' as const,
        user_id: mockUserId,
        in_use: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(skincareAPI.createSkincareProduct).mockResolvedValue(mockProduct);

      const tool = skincareTools.find((t) => t.definition.function.name === 'add_skincare_product');
      expect(tool).toBeDefined();

      const result = await tool!.execute(
        {
          name: 'Vitamin C Serum',
          brand: 'The Ordinary',
          category: 'serum',
        },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.product).toBeDefined();
      expect(result.product?.name).toBe('Vitamin C Serum');
      expect(skincareAPI.createSkincareProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Vitamin C Serum',
          brand: 'The Ordinary',
          category: 'serum',
        })
      );
    });

    it('should handle missing required fields', async () => {
      const tool = skincareTools.find((t) => t.definition.function.name === 'add_skincare_product');

      const result = await tool!.execute(
        {
          name: 'Test Product',
          // Missing brand and category
        },
        mockUserId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle API errors', async () => {
      vi.mocked(skincareAPI.createSkincareProduct).mockRejectedValue(
        new Error('Database error')
      );

      const tool = skincareTools.find((t) => t.definition.function.name === 'add_skincare_product');

      const result = await tool!.execute(
        {
          name: 'Vitamin C Serum',
          brand: 'The Ordinary',
          category: 'serum',
        },
        mockUserId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('log_skin_condition tool', () => {
    it('should log skin condition', async () => {
      const mockLog = {
        id: 'log-1',
        date: '2025-01-15',
        overall_condition: 4,
        notes: 'Skin looking good',
        user_id: mockUserId,
        created_at: new Date().toISOString(),
      };

      vi.mocked(skincareAPI.createSkinConditionLog).mockResolvedValue(mockLog);

      const tool = skincareTools.find((t) => t.definition.function.name === 'log_skin_condition');
      expect(tool).toBeDefined();

      const result = await tool!.execute(
        {
          date: '2025-01-15',
          overall_condition: 4,
          notes: 'Skin looking good',
        },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.log).toBeDefined();
      expect(result.log?.overall_condition).toBe(4);
      expect(skincareAPI.createSkinConditionLog).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2025-01-15',
          overall_condition: 4,
          notes: 'Skin looking good',
        })
      );
    });

    it('should validate condition range', async () => {
      const tool = skincareTools.find((t) => t.definition.function.name === 'log_skin_condition');

      const result = await tool!.execute(
        {
          date: '2025-01-15',
          overall_condition: 6, // Invalid: should be 1-5
        },
        mockUserId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('1 and 5');
    });

    it('should handle missing required fields', async () => {
      const tool = skincareTools.find((t) => t.definition.function.name === 'log_skin_condition');

      const result = await tool!.execute(
        {
          date: '2025-01-15',
          // Missing overall_condition
        },
        mockUserId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('get_routine_suggestion tool', () => {
    it('should get morning routine suggestion', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Cleanser',
          brand: 'CeraVe',
          category: 'cleanser' as const,
          in_use: true,
        },
        {
          id: '2',
          name: 'Vitamin C Serum',
          brand: 'The Ordinary',
          category: 'serum' as const,
          in_use: true,
        },
        {
          id: '3',
          name: 'Moisturizer',
          brand: 'CeraVe',
          category: 'moisturizer' as const,
          in_use: true,
        },
        {
          id: '4',
          name: 'Sunscreen SPF 50',
          brand: 'La Roche-Posay',
          category: 'sunscreen' as const,
          in_use: true,
        },
      ];

      vi.mocked(skincareAPI.getSkincareProducts).mockResolvedValue(mockProducts as any);

      const tool = skincareTools.find((t) => t.definition.function.name === 'get_routine_suggestion');
      expect(tool).toBeDefined();

      const result = await tool!.execute(
        {
          time_of_day: 'am',
        },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.routine).toBeDefined();
      expect(result.routine?.steps).toBeDefined();
      expect(Array.isArray(result.routine?.steps)).toBe(true);
    });

    it('should get evening routine suggestion', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Cleanser',
          brand: 'CeraVe',
          category: 'cleanser' as const,
          in_use: true,
        },
        {
          id: '2',
          name: 'Retinol Serum',
          brand: 'The Ordinary',
          category: 'treatment' as const,
          in_use: true,
        },
      ];

      vi.mocked(skincareAPI.getSkincareProducts).mockResolvedValue(mockProducts as any);

      const tool = skincareTools.find((t) => t.definition.function.name === 'get_routine_suggestion');

      const result = await tool!.execute(
        {
          time_of_day: 'pm',
        },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.routine).toBeDefined();
    });

    it('should handle no products', async () => {
      vi.mocked(skincareAPI.getSkincareProducts).mockResolvedValue([]);

      const tool = skincareTools.find((t) => t.definition.function.name === 'get_routine_suggestion');

      const result = await tool!.execute({}, mockUserId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('no products');
    });
  });

  describe('track_product_usage tool', () => {
    it('should track product usage', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Vitamin C Serum',
        brand: 'The Ordinary',
        category: 'serum' as const,
        in_use: true,
        user_id: mockUserId,
      };

      vi.mocked(skincareAPI.getSkincareProducts).mockResolvedValue([mockProduct as any]);
      vi.mocked(skincareAPI.updateSkincareProduct).mockResolvedValue({
        ...mockProduct,
        last_used: '2025-01-15',
      } as any);

      const tool = skincareTools.find((t) => t.definition.function.name === 'track_product_usage');
      expect(tool).toBeDefined();

      const result = await tool!.execute(
        {
          product_name: 'Vitamin C Serum',
          date: '2025-01-15',
        },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.product).toBeDefined();
    });

    it('should handle product not found', async () => {
      vi.mocked(skincareAPI.getSkincareProducts).mockResolvedValue([]);

      const tool = skincareTools.find((t) => t.definition.function.name === 'track_product_usage');

      const result = await tool!.execute(
        {
          product_name: 'Nonexistent Product',
          date: '2025-01-15',
        },
        mockUserId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('get_skincare_stats tool', () => {
    it('should get skincare stats', async () => {
      const mockStats = {
        totalProducts: 10,
        productsInUse: 7,
        averageCondition: 4.2,
        recentLogs: [],
      };

      vi.mocked(skincareAPI.getSkincareStats).mockResolvedValue(mockStats);

      const tool = skincareTools.find((t) => t.definition.function.name === 'get_skincare_stats');
      expect(tool).toBeDefined();

      const result = await tool!.execute({}, mockUserId);

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats?.total_products).toBe(10);
      expect(result.stats?.products_in_use).toBe(7);
      expect(result.stats?.average_condition).toBe(4.2);
    });

    it('should handle API errors', async () => {
      vi.mocked(skincareAPI.getSkincareStats).mockRejectedValue(
        new Error('Database error')
      );

      const tool = skincareTools.find((t) => t.definition.function.name === 'get_skincare_stats');

      const result = await tool!.execute({}, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});
