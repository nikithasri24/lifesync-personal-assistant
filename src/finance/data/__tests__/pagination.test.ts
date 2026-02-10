import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseApi } from '../supabaseApi';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Transaction Pagination', () => {
  let api: SupabaseApi;
  let mockClient: any;

  beforeEach(() => {
    // Create a minimal mock client
    mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn(),
    };

    api = new SupabaseApi(mockClient as unknown as SupabaseClient);
  });

  describe('listTransactions', () => {
    it('should return transactions without cursor for first page', async () => {
      const mockTransactions = [
        {
          id: 'txn-1',
          user_id: 'user-123',
          account_id: 'acc-1',
          date: '2024-01-15',
          description: 'Purchase 1',
          category_id: 'cat-1',
          amount: '100.00',
          type: 'debit',
          notes: null,
          merchant_name: null,
          confidence_score: null,
          suggested_category_id: null,
          categorization_rule_id: null,
        },
        {
          id: 'txn-2',
          user_id: 'user-123',
          account_id: 'acc-1',
          date: '2024-01-14',
          description: 'Purchase 2',
          category_id: 'cat-1',
          amount: '50.00',
          type: 'debit',
          notes: null,
          merchant_name: null,
          confidence_score: null,
          suggested_category_id: null,
          categorization_rule_id: null,
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockTransactions, error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await api.listTransactions({ limit: 10 });

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBeUndefined();
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.limit).toHaveBeenCalledWith(11); // limit + 1
    });

    it('should return nextCursor when there are more results', async () => {
      // Create 11 transactions (1 more than limit of 10)
      const mockTransactions = Array.from({ length: 11 }, (_, i) => ({
        id: `txn-${i + 1}`,
        user_id: 'user-123',
        account_id: 'acc-1',
        date: `2024-01-${String(20 - i).padStart(2, '0')}`,
        description: `Purchase ${i + 1}`,
        category_id: 'cat-1',
        amount: '100.00',
        type: 'debit',
        notes: null,
        merchant_name: null,
        confidence_score: null,
        suggested_category_id: null,
        categorization_rule_id: null,
      }));

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockTransactions, error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await api.listTransactions({ limit: 10 });

      expect(result.items).toHaveLength(10); // Should only return limit items
      expect(result.nextCursor).toBeDefined();
      expect(result.nextCursor).toMatch(/^\d{4}-\d{2}-\d{2}:txn-\d+$/); // Format: date:id
    });

    it('should use cursor for pagination', async () => {
      const cursor = '2024-01-15:txn-5';

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      await api.listTransactions({ cursor, limit: 10 });

      expect(mockQuery.or).toHaveBeenCalledWith(
        'date.lt.2024-01-15,and(date.eq.2024-01-15,id.lt.txn-5)'
      );
    });

    it('should apply filters correctly', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      await api.listTransactions({
        fromISO: '2024-01-01',
        toISO: '2024-01-31',
        accountIds: ['acc-1', 'acc-2'],
        categoryIds: ['cat-1'],
        type: 'debit',
        text: 'coffee',
        limit: 10,
      });

      expect(mockQuery.gte).toHaveBeenCalledWith('date', '2024-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('date', '2024-01-31');
      expect(mockQuery.in).toHaveBeenCalledWith('account_id', ['acc-1', 'acc-2']);
      expect(mockQuery.in).toHaveBeenCalledWith('category_id', ['cat-1']);
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'debit');
      expect(mockQuery.ilike).toHaveBeenCalledWith('description', '%coffee%');
    });

    it('should handle invalid cursor gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      // Invalid cursor format should be ignored
      await api.listTransactions({ cursor: 'invalid-cursor', limit: 10 });

      // Should not call .or() for invalid cursor
      expect(mockQuery.or).toBeUndefined();
    });

    it('should order by date DESC then id DESC', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      await api.listTransactions({ limit: 10 });

      expect(mockQuery.order).toHaveBeenCalledWith('date', { ascending: false });
      expect(mockQuery.order).toHaveBeenCalledWith('id', { ascending: false });
    });
  });
});
