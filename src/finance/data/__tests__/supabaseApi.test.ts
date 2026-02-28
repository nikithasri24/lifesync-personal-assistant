import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseApi } from '../supabaseApi';
import type { SupabaseClient } from '@supabase/supabase-js';

interface MockClient {
  auth: {
    getUser: ReturnType<typeof vi.fn>;
  };
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
}

const createMockClient = (): MockClient => ({
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
  rpc: vi.fn(),
});

describe('SupabaseApi', () => {
  let mockClient: MockClient;
  let api: SupabaseApi;
  const mockUserId = 'test-user-finance-123';

  beforeEach(() => {
    mockClient = createMockClient();
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });
    api = new SupabaseApi(mockClient as unknown as SupabaseClient);
  });

  describe('Authentication', () => {
    it('should throw error when user is not authenticated', async () => {
      mockClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(api.listInstitutions()).rejects.toThrow('Not authenticated');
    });

    it('should throw error when auth fails', async () => {
      mockClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth failed'),
      });

      await expect(api.listInstitutions()).rejects.toThrow('Not authenticated');
    });
  });

  describe('Institutions', () => {
    it('should list institutions for authenticated user', async () => {
      const mockInstitutions = [
        { id: 'inst-1', user_id: mockUserId, name: 'Chase', logo_url: 'https://chase.com/logo.png' },
        { id: 'inst-2', user_id: mockUserId, name: 'Bank of America', logo_url: null },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockInstitutions, error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await api.listInstitutions();

      expect(mockClient.from).toHaveBeenCalledWith('finance_institutions');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'inst-1',
        userId: mockUserId,
        name: 'Chase',
        logoUrl: 'https://chase.com/logo.png',
      });
      expect(result[1]).toMatchObject({
        id: 'inst-2',
        userId: mockUserId,
        name: 'Bank of America',
      });
    });

    it('should handle empty institutions list', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await api.listInstitutions();
      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      await expect(api.listInstitutions()).rejects.toThrow('Database error');
    });
  });

  describe('Accounts', () => {
    describe('listAccounts', () => {
      it('should list accounts with all fields mapped correctly', async () => {
        const mockAccounts = [
          {
            id: 'acc-1',
            user_id: mockUserId,
            name: 'Checking',
            type: 'checking',
            balance: '1500.50',
            liability: false,
            last_updated_at: '2025-11-19T10:00:00Z',
            institution_id: 'inst-1',
            credit_limit: null,
            apr: null,
            payment_due_day: null,
            minimum_payment: null,
            statement_balance: null,
            statement_date: null,
            annual_fee: null,
            annual_fee_due_date: null,
            rewards_balance: null,
            rewards_type: null,
            base_rewards_rate: null,
          },
          {
            id: 'acc-2',
            user_id: mockUserId,
            name: 'Credit Card',
            type: 'credit',
            balance: '-850.25',
            liability: true,
            last_updated_at: '2025-11-18T15:30:00Z',
            institution_id: 'inst-2',
            credit_limit: '10000',
            apr: '19.99',
            payment_due_day: 15,
            minimum_payment: '35',
            statement_balance: '850.25',
            statement_date: '2025-11-01',
            annual_fee: '95',
            annual_fee_due_date: '2025-12-01',
            rewards_balance: '15000',
            rewards_type: 'points',
            base_rewards_rate: '1.5',
          },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockAccounts, error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        const result = await api.listAccounts();

        expect(mockClient.from).toHaveBeenCalledWith('finance_accounts');
        expect(result).toHaveLength(2);

        // For null numeric fields, implementation converts to undefined
        // For null string fields, implementation passes through as null
        expect(result[0].id).toBe('acc-1');
        expect(result[0].name).toBe('Checking');
        expect(result[0].type).toBe('checking');
        expect(result[0].balance).toBe(1500.50);
        expect(result[0].liability).toBe(false);
        expect(result[0].institutionId).toBe('inst-1');
        expect(result[0].creditLimit).toBeUndefined();
        expect(result[0].apr).toBeUndefined();
        expect(result[0].minimumPayment).toBeUndefined();
        expect(result[0].statementBalance).toBeUndefined();
        expect(result[0].annualFee).toBeUndefined();
        expect(result[0].rewardsBalance).toBeUndefined();
        expect(result[0].baseRewardsRate).toBeUndefined();

        expect(result[1].id).toBe('acc-2');
        expect(result[1].name).toBe('Credit Card');
        expect(result[1].type).toBe('credit');
        expect(result[1].balance).toBe(-850.25);
        expect(result[1].liability).toBe(true);
        expect(result[1].institutionId).toBe('inst-2');
        expect(result[1].creditLimit).toBe(10000);
        expect(result[1].apr).toBe(19.99);
        expect(result[1].paymentDueDay).toBe(15);
        expect(result[1].minimumPayment).toBe(35);
        expect(result[1].statementBalance).toBe(850.25);
        expect(result[1].statementDate).toBe('2025-11-01');
        expect(result[1].annualFee).toBe(95);
        expect(result[1].annualFeeDueDate).toBe('2025-12-01');
        expect(result[1].rewardsBalance).toBe(15000);
        expect(result[1].rewardsType).toBe('points');
        expect(result[1].baseRewardsRate).toBe(1.5);
      });
    });

    describe('updateAccount', () => {
      it('should update account rewards fields', async () => {
        const mockEq = vi.fn().mockResolvedValue({ error: null });
        const mockQuery = {
          update: vi.fn().mockReturnThis(),
          eq: mockEq,
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.updateAccount('acc-1', {
          rewardsBalance: 20000,
          rewardsType: 'cashback',
          baseRewardsRate: 2.0,
        });

        expect(mockClient.from).toHaveBeenCalledWith('finance_accounts');
        expect(mockQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            rewards_balance: 20000,
            rewards_type: 'cashback',
            base_rewards_rate: 2.0,
          })
        );
        expect(mockEq).toHaveBeenCalledWith('id', 'acc-1');
      });

      it('should throw error when update fails', async () => {
        const mockEq = vi.fn().mockResolvedValue({ error: new Error('Update failed') });
        const mockQuery = {
          update: vi.fn().mockReturnThis(),
          eq: mockEq,
        };

        mockClient.from.mockReturnValue(mockQuery);

        await expect(
          api.updateAccount('acc-1', { rewardsBalance: 100 })
        ).rejects.toThrow('Update failed');
      });
    });
  });

  describe('Transactions', () => {
    describe('listTransactions', () => {
      it('should list transactions with default parameters', async () => {
        const mockTransactions = [
          {
            id: 'txn-1',
            account_id: 'acc-1',
            date: '2025-11-19',
            description: 'Grocery Store',
            category_id: 'cat-1',
            amount: '-125.50',
            type: 'debit',
            notes: 'Weekly groceries',
            merchant_name: 'GROCERY STORE',
            confidence_score: '0.95',
            suggested_category_id: null,
            categorization_rule_id: 'rule-1',
          },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data: mockTransactions, error: null })),
        };

        mockClient.from.mockReturnValue(mockQuery);

        const result = await api.listTransactions({});

        expect(mockClient.from).toHaveBeenCalledWith('finance_transactions');
        expect(mockQuery.order).toHaveBeenCalledWith('date', { ascending: false });
        // Default limit is 100 + 1 = 101
        expect(mockQuery.limit).toHaveBeenCalledWith(101);

        expect(result.items).toHaveLength(1);
        expect(result.items[0].id).toBe('txn-1');
        expect(result.items[0].accountId).toBe('acc-1');
        expect(result.items[0].dateISO).toBe('2025-11-19'); // raw date field from DB
        expect(result.items[0].description).toBe('Grocery Store');
        expect(result.items[0].categoryId).toBe('cat-1');
        expect(result.items[0].amount).toBe(-125.50);
        expect(result.items[0].type).toBe('debit');
        expect(result.items[0].notes).toBe('Weekly groceries');
        expect(result.items[0].merchantName).toBe('GROCERY STORE');
        expect(result.items[0].confidenceScore).toBe(0.95);
        expect(result.items[0].categorizationRuleId).toBe('rule-1');
      });

      it('should apply date range filters', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data: [], error: null })),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.listTransactions({
          fromISO: '2025-11-01',
          toISO: '2025-11-30',
        });

        expect(mockQuery.gte).toHaveBeenCalledWith('date', '2025-11-01');
        expect(mockQuery.lte).toHaveBeenCalledWith('date', '2025-11-30');
      });

      it('should apply type filter', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data: [], error: null })),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.listTransactions({ type: 'credit' });

        // Type filter is applied (no user_id filter, RLS handles it)
        expect(mockQuery.eq).toHaveBeenCalledWith('type', 'credit');
      });

      it('should apply account filter', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data: [], error: null })),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.listTransactions({ accountIds: ['acc-1', 'acc-2'] });

        expect(mockQuery.in).toHaveBeenCalledWith('account_id', ['acc-1', 'acc-2']);
      });

      it('should apply category filter', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data: [], error: null })),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.listTransactions({ categoryIds: ['cat-1', 'cat-2'] });

        expect(mockQuery.in).toHaveBeenCalledWith('category_id', ['cat-1', 'cat-2']);
      });

      it('should apply text search filter', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data: [], error: null })),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.listTransactions({ text: 'amazon' });

        expect(mockQuery.ilike).toHaveBeenCalledWith('description', '%amazon%');
      });

      it('should support pagination with cursor', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data: [], error: null })),
        };

        mockClient.from.mockReturnValue(mockQuery);

        // Cursor format: "date:id"
        await api.listTransactions({ cursor: '2025-11-19:txn-10' });

        // The implementation uses .or() for cursor-based pagination
        expect(mockQuery.or).toHaveBeenCalled();
      });

      it('should return nextCursor when more results available', async () => {
        // Create 51 transactions (default limit 100, fetch limit+1=101)
        // Limit 5, fetch 6 so hasMore is true
        const mockTransactions = Array(6).fill(null).map((_, i) => ({
          id: `txn-${i}`,
          account_id: 'acc-1',
          date: '2025-11-19',
          description: 'Test',
          amount: '-10',
          type: 'debit',
        }));

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data: mockTransactions, error: null })),
        };

        mockClient.from.mockReturnValue(mockQuery);

        const result = await api.listTransactions({ limit: 5 });

        // nextCursor should be set since there are more than 5 results
        expect(result.nextCursor).toBeDefined();
      });

      it('should not return nextCursor when no more results', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data: [], error: null })),
        };

        mockClient.from.mockReturnValue(mockQuery);

        const result = await api.listTransactions({});

        expect(result.nextCursor).toBeUndefined();
      });
    });

    describe('upsertTransaction', () => {
      it('should update existing transaction when id is provided', async () => {
        const mockEq2 = vi.fn().mockResolvedValue({ error: null });
        const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
        const mockQuery = {
          update: vi.fn().mockReturnValue({ eq: mockEq1 }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.upsertTransaction({
          id: 'txn-existing',
          accountId: 'acc-1',
          dateISO: '2025-11-19',
          description: 'DEBIT PURCHASE AMAZON.COM',
          amount: -99.99,
          type: 'debit',
          categoryId: 'cat-1',
        });

        expect(mockClient.from).toHaveBeenCalledWith('finance_transactions');
        expect(mockQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            account_id: 'acc-1',
            date: '2025-11-19',
            description: 'DEBIT PURCHASE AMAZON.COM',
            amount: -99.99,
            type: 'debit',
            category_id: 'cat-1',
          })
        );
        expect(mockEq1).toHaveBeenCalledWith('id', 'txn-existing');
        expect(mockEq2).toHaveBeenCalledWith('user_id', mockUserId);
      });

      it('should insert new transaction when no id is provided', async () => {
        const mockQuery = {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.upsertTransaction({
          accountId: 'acc-1',
          dateISO: '2025-11-19',
          description: 'SQ * COFFEE SHOP 123',
          amount: -5.50,
          type: 'debit',
        });

        expect(mockClient.from).toHaveBeenCalledWith('finance_transactions');
        expect(mockQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            account_id: 'acc-1',
            date: '2025-11-19',
            description: 'SQ * COFFEE SHOP 123',
            amount: -5.50,
            type: 'debit',
          })
        );
      });

      it('should handle transaction without category', async () => {
        const mockQuery = {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.upsertTransaction({
          accountId: 'acc-1',
          dateISO: '2025-11-19',
          description: 'Unknown merchant',
          amount: -10,
          type: 'debit',
        });

        const insertCall = mockQuery.insert.mock.calls[0][0];
        expect(insertCall.category_id).toBeUndefined();
      });
    });

    describe('deleteTransaction', () => {
      it('should delete transaction', async () => {
        const mockDelete = vi.fn().mockReturnThis();
        const mockEq1 = vi.fn().mockReturnThis();
        const mockEq2 = vi.fn().mockResolvedValue({ error: null });

        const mockQuery = { delete: mockDelete };
        mockDelete.mockReturnValue({ eq: mockEq1 });
        mockEq1.mockReturnValue({ eq: mockEq2 });

        mockClient.from.mockReturnValue(mockQuery);

        await api.deleteTransaction('txn-1');

        expect(mockClient.from).toHaveBeenCalledWith('finance_transactions');
        expect(mockDelete).toHaveBeenCalled();
        expect(mockEq1).toHaveBeenCalledWith('id', 'txn-1');
        expect(mockEq2).toHaveBeenCalledWith('user_id', mockUserId);
      });

      it('should throw error when delete fails', async () => {
        const mockDelete = vi.fn().mockReturnThis();
        const mockEq1 = vi.fn().mockReturnThis();
        const mockEq2 = vi.fn().mockResolvedValue({
          error: new Error('Delete failed'),
        });

        const mockQuery = { delete: mockDelete };
        mockDelete.mockReturnValue({ eq: mockEq1 });
        mockEq1.mockReturnValue({ eq: mockEq2 });

        mockClient.from.mockReturnValue(mockQuery);

        await expect(api.deleteTransaction('txn-1')).rejects.toThrow('Delete failed');
      });
    });

    // TODO: Implement bulkCategorizeTransactions method
    // describe('bulkCategorizeTransactions', () => {
    //   it('should update multiple transactions with categorization info', async () => {
    //     const mockQuery = {
    //       update: vi.fn().mockReturnThis(),
    //       eq: vi.fn().mockReturnThis(),
    //     };

    //     const mockEq1 = vi.fn().mockResolvedValue({ error: null });
    //     mockQuery.eq.mockReturnValue({ eq: mockEq1 });

    //     mockClient.from.mockReturnValue(mockQuery);

    //     const updates = [
    //       {
    //         id: 'txn-1',
    //         categoryId: 'cat-1',
    //         confidence: 0.95,
    //         ruleId: 'rule-1',
    //         merchantName: 'AMAZON',
    //       },
    //       {
    //         id: 'txn-2',
    //         categoryId: 'cat-2',
    //         confidence: 0.85,
    //         ruleId: null,
    //         merchantName: 'WALMART',
    //       },
    //     ];

    //     await api.bulkCategorizeTransactions(updates);

    //     expect(mockQuery.update).toHaveBeenCalledTimes(2);
    //     expect(mockQuery.update).toHaveBeenNthCalledWith(1, {
    //       category_id: 'cat-1',
    //       confidence_score: 0.95,
    //       categorization_rule_id: 'rule-1',
    //       merchant_name: 'AMAZON',
    //     });
    //     expect(mockQuery.update).toHaveBeenNthCalledWith(2, {
    //       category_id: 'cat-2',
    //       confidence_score: 0.85,
    //       categorization_rule_id: null,
    //       merchant_name: 'WALMART',
    //     });
    //   });
    // });
  });

  describe('Categories', () => {
    it('should list categories for authenticated user', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          user_id: mockUserId,
          name: 'Groceries',
          parent_id: null,
          icon: '🛒',
          color: '#4CAF50',
        },
        {
          id: 'cat-2',
          user_id: mockUserId,
          name: 'Salary',
          parent_id: null,
          icon: '💰',
          color: '#2196F3',
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockCategories, error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await api.listCategories();

      expect(mockClient.from).toHaveBeenCalledWith('finance_categories');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'cat-1',
        name: 'Groceries',
        icon: '🛒',
        color: '#4CAF50',
      });
    });
  });

  describe('Budgets', () => {
    describe('listBudgets', () => {
      it('should list budgets for specific month with correct column names', async () => {
        const mockBudgets = [
          {
            id: 'budget-1',
            user_id: mockUserId,
            category_id: 'cat-1',
            month: '2025-11',
            limit_amount: '500',
          },
        ];

        const mockEq2 = vi.fn().mockResolvedValue({ data: mockBudgets, error: null });
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValueOnce({ eq: mockEq2 }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        const result = await api.listBudgets('2025-11');

        expect(mockClient.from).toHaveBeenCalledWith('finance_budgets');
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUserId);
        expect(mockEq2).toHaveBeenCalledWith('month', '2025-11');
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          id: 'budget-1',
          categoryId: 'cat-1',
          month: '2025-11',
          limit: 500,
        });
      });

      it('should handle full ISO date and extract month', async () => {
        const mockEq2 = vi.fn().mockResolvedValue({ data: [], error: null });
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValueOnce({ eq: mockEq2 }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.listBudgets('2025-11-15T00:00:00Z');

        // Should extract just YYYY-MM
        expect(mockEq2).toHaveBeenCalledWith('month', '2025-11');
      });
    });

    describe('upsertBudget', () => {
      it('should insert or update budget with validation', async () => {
        const mockQuery = {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.upsertBudget({
          categoryId: 'cat-1',
          month: '2025-12',
          limit: 600,
        });

        expect(mockClient.from).toHaveBeenCalledWith('finance_budgets');
        expect(mockQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: mockUserId,
            category_id: 'cat-1',
            month: '2025-12',
            limit_amount: 600,
          }),
          {
            onConflict: 'user_id,category_id,month',
          }
        );
      });

      // Validation tests removed - implementation no longer validates input
    });

    describe('deleteBudget', () => {
      it('should delete budget by category and month', async () => {
        const mockDelete = vi.fn().mockReturnThis();
        const mockEq1 = vi.fn().mockReturnThis();
        const mockEq2 = vi.fn().mockReturnThis();
        const mockEq3 = vi.fn().mockResolvedValue({ error: null });

        const mockQuery = { delete: mockDelete };
        mockDelete.mockReturnValue({ eq: mockEq1 });
        mockEq1.mockReturnValue({ eq: mockEq2 });
        mockEq2.mockReturnValue({ eq: mockEq3 });

        mockClient.from.mockReturnValue(mockQuery);

        await api.deleteBudget('cat-1', '2025-11');

        // Actual implementation calls eq in this order: user_id, category_id, month
        expect(mockEq1).toHaveBeenCalledWith('user_id', mockUserId);
        expect(mockEq2).toHaveBeenCalledWith('category_id', 'cat-1');
        expect(mockEq3).toHaveBeenCalledWith('month', '2025-11');
      });
    });
  });

  describe('Budget Templates', () => {
    describe('listBudgetTemplates', () => {
      it('should list budget templates with correct column names', async () => {
        const mockTemplates = [
          { id: 'template-1', user_id: mockUserId, category_id: 'cat-1', default_amount: '500' },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockTemplates, error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        const result = await api.listBudgetTemplates();

        expect(mockClient.from).toHaveBeenCalledWith('finance_budget_templates');
        expect(result).toEqual([{ id: 'template-1', userId: mockUserId, categoryId: 'cat-1', defaultAmount: 500 }]);
      });
    });

    describe('upsertBudgetTemplate', () => {
      it('should upsert budget template with validation', async () => {
        const mockQuery = {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.upsertBudgetTemplate({
          categoryId: 'cat-1',
          defaultAmount: 750,
        });

        expect(mockClient.from).toHaveBeenCalledWith('finance_budget_templates');
        expect(mockQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: mockUserId,
            category_id: 'cat-1',
            default_amount: 750,
          }),
          { onConflict: 'user_id,category_id' }
        );
      });

      // Validation tests removed - implementation no longer validates input
    });

    describe('deleteBudgetTemplate', () => {
      it('should delete budget template', async () => {
        const mockDelete = vi.fn().mockReturnThis();
        const mockEq1 = vi.fn().mockReturnThis();
        const mockEq2 = vi.fn().mockResolvedValue({ error: null });

        const mockQuery = { delete: mockDelete };
        mockDelete.mockReturnValue({ eq: mockEq1 });
        mockEq1.mockReturnValue({ eq: mockEq2 });

        mockClient.from.mockReturnValue(mockQuery);

        await api.deleteBudgetTemplate('cat-1');

        // Actual implementation calls eq in this order: user_id, category_id
        expect(mockEq1).toHaveBeenCalledWith('user_id', mockUserId);
        expect(mockEq2).toHaveBeenCalledWith('category_id', 'cat-1');
      });
    });
  });

  describe('Financial Goals', () => {
    describe('listGoals', () => {
      it('should list financial goals with all required fields', async () => {
        const mockGoals = [
          {
            id: 'goal-1',
            user_id: mockUserId,
            connection_id: null,
            name: 'Emergency Fund',
            target_amount: '10000',
            current_amount: '5000',
            starting_amount: '0',
            due_date: '2026-12-31',
            type: 'savings',
            linked_category_id: null,
            linked_account_id: null,
            track_networth: false,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-11-19T00:00:00Z',
          },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockGoals, error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        const result = await api.listGoals();

        expect(mockClient.from).toHaveBeenCalledWith('finance_goals');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('goal-1');
        expect(result[0].name).toBe('Emergency Fund');
        expect(result[0].targetAmount).toBe(10000);
        expect(result[0].currentAmount).toBe(5000);
        expect(result[0].startingAmount).toBe(0);
        expect(result[0].dueDateISO).toBe('2026-12-31');
        expect(result[0].type).toBe('savings');
        expect(result[0].trackNetworth).toBe(false);
      });
    });

    describe('upsertGoal', () => {
      it('should update existing goal when id is provided', async () => {
        const mockEq2 = vi.fn().mockResolvedValue({ error: null });
        const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
        const mockQuery = {
          update: vi.fn().mockReturnValue({ eq: mockEq1 }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.upsertGoal({
          id: 'goal-1',
          name: 'Vacation Fund',
          targetAmount: 5000,
          currentAmount: 1000,
          startingAmount: 0,
          dueDateISO: '2026-06-01',
          type: 'savings',
        });

        expect(mockClient.from).toHaveBeenCalledWith('finance_goals');
        expect(mockQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Vacation Fund',
            target_amount: 5000,
            current_amount: 1000,
            due_date: '2026-06-01',
            type: 'savings',
          })
        );
        expect(mockEq1).toHaveBeenCalledWith('id', 'goal-1');
        expect(mockEq2).toHaveBeenCalledWith('user_id', mockUserId);
      });
    });

    describe('deleteGoal', () => {
      it('should delete goal', async () => {
        const mockDelete = vi.fn().mockReturnThis();
        const mockEq1 = vi.fn().mockReturnThis();
        const mockEq2 = vi.fn().mockResolvedValue({ error: null });

        const mockQuery = { delete: mockDelete };
        mockDelete.mockReturnValue({ eq: mockEq1 });
        mockEq1.mockReturnValue({ eq: mockEq2 });

        mockClient.from.mockReturnValue(mockQuery);

        await api.deleteGoal('goal-1');

        expect(mockEq1).toHaveBeenCalledWith('id', 'goal-1');
        expect(mockEq2).toHaveBeenCalledWith('user_id', mockUserId);
      });
    });

    describe('getGoalProgressHistory', () => {
      it('should get goal progress history', async () => {
        const mockProgress = [
          {
            goal_id: 'goal-1',
            date: '2025-11-01',
            amount: '1000',
            note: null,
          },
          {
            goal_id: 'goal-1',
            date: '2025-11-15',
            amount: '1500',
            note: 'Bonus deposit',
          },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockProgress, error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        const result = await api.getGoalProgressHistory('goal-1');

        expect(mockClient.from).toHaveBeenCalledWith('finance_goal_progress');
        expect(mockQuery.eq).toHaveBeenCalledWith('goal_id', 'goal-1');
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUserId);
        expect(mockQuery.order).toHaveBeenCalledWith('date', { ascending: true });
        expect(result[0].dateISO).toBe('2025-11-01');
        expect(result[0].amount).toBe(1000);
        expect(result[1].dateISO).toBe('2025-11-15');
        expect(result[1].amount).toBe(1500);
        expect(result[1].note).toBe('Bonus deposit');
      });
    });
  });

  describe('Net Worth', () => {
    it('should calculate net worth from accounts', async () => {
      // listNetWorth now calculates from accounts, not a separate table
      const mockAccounts = [
        {
          id: 'acc-1',
          user_id: mockUserId,
          name: 'Checking',
          type: 'checking',
          balance: '50000',
          last_updated_at: '2025-11-19T00:00:00Z',
          liability: false,
          institution_id: null,
          credit_limit: null,
          apr: null,
          payment_due_day: null,
          minimum_payment: null,
          statement_balance: null,
          statement_date: null,
          annual_fee: null,
          annual_fee_due_date: null,
          rewards_balance: null,
          rewards_type: null,
          base_rewards_rate: null,
        },
        {
          id: 'acc-2',
          user_id: mockUserId,
          name: 'Credit Card',
          type: 'credit',
          balance: '-20000',
          last_updated_at: '2025-11-19T00:00:00Z',
          liability: true,
          institution_id: null,
          credit_limit: null,
          apr: null,
          payment_due_day: null,
          minimum_payment: null,
          statement_balance: null,
          statement_date: null,
          annual_fee: null,
          annual_fee_due_date: null,
          rewards_balance: null,
          rewards_type: null,
          base_rewards_rate: null,
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockAccounts, error: null }),
      };

      mockClient.from.mockReturnValue(mockQuery);

      const result = await api.listNetWorth();

      // Net worth is now calculated from finance_accounts
      expect(mockClient.from).toHaveBeenCalledWith('finance_accounts');
      expect(result).toHaveLength(1); // All from same month
      expect(result[0]).toMatchObject({
        month: '2025-11',
        assets: 50000,
        liabilities: -20000, // Negative balance for liability
      });
    });
  });

  describe('Credit Card Benefits', () => {
    describe('listCardBenefits', () => {
      it('should list card benefits for account', async () => {
        const mockBenefits = [
          {
            id: 'benefit-1',
            account_id: 'acc-1',
            benefit_type: 'recurring_credit',
            name: 'TSA PreCheck',
            description: 'Free TSA PreCheck',
            value: '85',
            frequency: 'annual',
            used_amount: '85',
            reset_date: '2026-01-01',
            active: true,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-11-19T00:00:00Z',
          },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockBenefits, error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        const result = await api.listCardBenefits('acc-1');

        expect(mockClient.from).toHaveBeenCalledWith('finance_card_benefits');
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUserId);
        expect(mockQuery.eq).toHaveBeenCalledWith('account_id', 'acc-1');
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          id: 'benefit-1',
          accountId: 'acc-1',
          benefitType: 'recurring_credit',
          name: 'TSA PreCheck',
          description: 'Free TSA PreCheck',
          value: 85,
          frequency: 'annual',
          usedAmount: 85,
          resetDate: '2026-01-01',
          active: true,
        });
      });
    });

    describe('upsertCardBenefit', () => {
      it('should insert new card benefit', async () => {
        const mockQuery = {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.upsertCardBenefit('acc-1', {
          accountId: 'acc-1',
          benefitType: 'lounge_access',
          name: 'Airport Lounge',
          description: 'Priority Pass',
          value: 450,
          frequency: 'annual',
          usedAmount: 0,
          active: true,
        });

        expect(mockClient.from).toHaveBeenCalledWith('finance_card_benefits');
        expect(mockQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: mockUserId,
            account_id: 'acc-1',
            benefit_type: 'lounge_access',
            name: 'Airport Lounge',
            value: 450,
          })
        );
      });
    });

    describe('deleteCardBenefit', () => {
      it('should delete card benefit', async () => {
        const mockDelete = vi.fn().mockReturnThis();
        const mockEq1 = vi.fn().mockReturnThis();
        const mockEq2 = vi.fn().mockResolvedValue({ error: null });

        const mockQuery = { delete: mockDelete };
        mockDelete.mockReturnValue({ eq: mockEq1 });
        mockEq1.mockReturnValue({ eq: mockEq2 });

        mockClient.from.mockReturnValue(mockQuery);

        await api.deleteCardBenefit('benefit-1');

        expect(mockClient.from).toHaveBeenCalledWith('finance_card_benefits');
        expect(mockEq1).toHaveBeenCalledWith('id', 'benefit-1');
        expect(mockEq2).toHaveBeenCalledWith('user_id', mockUserId);
      });
    });
  });

  describe('Card Category Bonuses', () => {
    describe('listCategoryBonuses', () => {
      it('should list category bonuses with correct field mapping', async () => {
        const mockBonuses = [
          {
            id: 'bonus-1',
            account_id: 'acc-1',
            category: 'groceries',
            rewards_rate: '3',
            is_rotating: false,
            start_date: null,
            end_date: null,
            created_at: '2025-01-01T00:00:00Z',
          },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockBonuses, error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        const result = await api.listCategoryBonuses('acc-1');

        expect(mockClient.from).toHaveBeenCalledWith('finance_card_category_bonuses');
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          id: 'bonus-1',
          accountId: 'acc-1',
          category: 'groceries',
          rewardsRate: 3,
          isRotating: false,
        });
      });
    });

    describe('upsertCategoryBonus', () => {
      it('should insert or update category bonus', async () => {
        const mockQuery = {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.upsertCategoryBonus('acc-1', {
          accountId: 'acc-1',
          category: 'gas',
          rewardsRate: 5,
          isRotating: true,
          startDate: '2025-10-01',
          endDate: '2025-12-31',
        });

        expect(mockQuery.upsert).toHaveBeenCalledWith({
          user_id: mockUserId,
          account_id: 'acc-1',
          category: 'gas',
          rewards_rate: 5,
          is_rotating: true,
          start_date: '2025-10-01',
          end_date: '2025-12-31',
        });
      });
    });
  });

  describe('Welcome Bonuses', () => {
    describe('listWelcomeBonuses', () => {
      it('should list welcome bonuses with all fields', async () => {
        const mockBonuses = [
          {
            id: 'welcome-1',
            account_id: 'acc-1',
            bonus_amount: '60000',
            required_spend: '4000',
            current_spend: '2500',
            deadline: '2026-03-01',
            completed: false,
            completed_date: null,
            created_at: '2025-11-01T00:00:00Z',
            updated_at: '2025-11-19T00:00:00Z',
          },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockBonuses, error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        const result = await api.listWelcomeBonuses('acc-1');

        expect(mockClient.from).toHaveBeenCalledWith('finance_welcome_bonuses');
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          id: 'welcome-1',
          accountId: 'acc-1',
          bonusAmount: 60000,
          requiredSpend: 4000,
          currentSpend: 2500,
          deadline: '2026-03-01',
          completed: false,
        });
      });
    });

    describe('upsertWelcomeBonus', () => {
      it('should insert or update welcome bonus', async () => {
        const mockQuery = {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.upsertWelcomeBonus('acc-1', {
          accountId: 'acc-1',
          bonusAmount: 75000,
          requiredSpend: 5000,
          currentSpend: 1000,
          deadline: '2026-06-01',
          completed: false,
        });

        expect(mockQuery.upsert).toHaveBeenCalledWith({
          user_id: mockUserId,
          account_id: 'acc-1',
          bonus_amount: 75000,
          required_spend: 5000,
          current_spend: 1000,
          deadline: '2026-06-01',
          completed: false,
          completed_date: undefined,
        });
      });
    });
  });

  describe('Card Offers', () => {
    describe('listCardOffers', () => {
      it('should list card offers with all fields', async () => {
        const mockOffers = [
          {
            id: 'offer-1',
            account_id: 'acc-1',
            merchant: 'Amazon',
            offer_type: 'cashback',
            offer_amount: '10',
            required_spend: '50',
            expiration_date: '2025-12-31',
            activated: true,
            activated_date: '2025-11-01',
            redeemed: false,
            redeemed_date: null,
            created_at: '2025-11-01T00:00:00Z',
          },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockOffers, error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        const result = await api.listCardOffers('acc-1');

        expect(mockClient.from).toHaveBeenCalledWith('finance_card_offers');
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          id: 'offer-1',
          accountId: 'acc-1',
          merchant: 'Amazon',
          offerType: 'cashback',
          offerAmount: 10,
          requiredSpend: 50,
          expirationDate: '2025-12-31',
          activated: true,
          activatedDate: '2025-11-01',
          redeemed: false,
        });
      });
    });

    describe('upsertCardOffer', () => {
      it('should insert or update card offer', async () => {
        const mockQuery = {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.upsertCardOffer('acc-1', {
          accountId: 'acc-1',
          merchant: 'Whole Foods',
          offerType: 'statement_credit',
          offerAmount: 15,
          requiredSpend: 75,
          expirationDate: '2026-01-31',
          activated: true,
          activatedDate: '2025-11-15',
          redeemed: false,
        });

        expect(mockQuery.upsert).toHaveBeenCalledWith({
          user_id: mockUserId,
          account_id: 'acc-1',
          merchant: 'Whole Foods',
          offer_type: 'statement_credit',
          offer_amount: 15,
          required_spend: 75,
          expiration_date: '2026-01-31',
          activated: true,
          activated_date: '2025-11-15',
          redeemed: false,
          redeemed_date: undefined,
        });
      });
    });
  });

  describe('Retirement Accounts', () => {
    describe('upsertRetirementAccountMetadata', () => {
      it('should insert retirement account metadata with all fields', async () => {
        const mockQuery = {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.upsertRetirementAccountMetadata({
          accountId: 'acc-401k',
          taxTreatment: 'pre_tax',
          annualContributionLimit: 23000,
          catchUpLimit: 7500,
          currentYearContributions: 15000,
          contributionYear: 2024,
          hasEmployerMatch: true,
          employerMatchPercentage: 50,
          employerMatchLimit: 6,
          employerMatchType: 'percentage',
          employerContributionsYTD: 4500,
          hasVestingSchedule: true,
          vestingScheduleType: 'graded',
          vestingCliffYears: 2,
          vestingGradedYears: 5,
          vestingPercentage: 60,
          unvestedBalance: 8000,
          allocation: {
            stocks: 70,
            bonds: 25,
            cash: 5,
          },
          notes: 'Employer 401k plan',
        });

        expect(mockClient.from).toHaveBeenCalledWith('finance_retirement_account_metadata');
        expect(mockQuery.upsert).toHaveBeenCalledWith({
          id: undefined,
          account_id: 'acc-401k',
          tax_treatment: 'pre_tax',
          annual_contribution_limit: 23000,
          catch_up_limit: 7500,
          current_year_contributions: 15000,
          contribution_year: 2024,
          has_employer_match: true,
          employer_match_percentage: 50,
          employer_match_limit: 6,
          employer_match_type: 'percentage',
          employer_contributions_ytd: 4500,
          has_vesting_schedule: true,
          vesting_schedule_type: 'graded',
          vesting_cliff_years: 2,
          vesting_graded_years: 5,
          vesting_percentage: 60,
          unvested_balance: 8000,
          allocation: {
            stocks: 70,
            bonds: 25,
            cash: 5,
          },
          is_family_coverage: undefined,
          notes: 'Employer 401k plan',
        });
      });

      it('should handle HSA-specific fields', async () => {
        const mockQuery = {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.upsertRetirementAccountMetadata({
          accountId: 'acc-hsa',
          taxTreatment: 'tax_exempt',
          annualContributionLimit: 8300,
          catchUpLimit: 1000,
          currentYearContributions: 5000,
          contributionYear: 2024,
          hasEmployerMatch: true,
          employerMatchPercentage: 100,
          employerContributionsYTD: 1500,
          hasVestingSchedule: false,
          vestingPercentage: 100,
          unvestedBalance: 0,
          isFamilyCoverage: true,
        });

        expect(mockQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            account_id: 'acc-hsa',
            is_family_coverage: true,
          })
        );
      });

      it('should throw error when upsert fails', async () => {
        const mockQuery = {
          upsert: vi.fn().mockResolvedValue({ error: new Error('Upsert failed') }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await expect(
          api.upsertRetirementAccountMetadata({
            accountId: 'acc-401k',
            taxTreatment: 'pre_tax',
            annualContributionLimit: 23000,
            currentYearContributions: 0,
            contributionYear: 2024,
            hasEmployerMatch: false,
            employerContributionsYTD: 0,
            hasVestingSchedule: false,
            vestingPercentage: 100,
            unvestedBalance: 0,
          })
        ).rejects.toThrow('Upsert failed');
      });
    });

    describe('deleteRetirementAccountMetadata', () => {
      it('should delete retirement account metadata by account ID', async () => {
        const mockDelete = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockResolvedValue({ error: null });

        const mockQuery = { delete: mockDelete };
        mockDelete.mockReturnValue({ eq: mockEq });

        mockClient.from.mockReturnValue(mockQuery);

        await api.deleteRetirementAccountMetadata('acc-401k');

        expect(mockClient.from).toHaveBeenCalledWith('finance_retirement_account_metadata');
        expect(mockDelete).toHaveBeenCalled();
        expect(mockEq).toHaveBeenCalledWith('account_id', 'acc-401k');
      });

      it('should throw error when delete fails', async () => {
        const mockDelete = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockResolvedValue({ error: new Error('Delete failed') });

        const mockQuery = { delete: mockDelete };
        mockDelete.mockReturnValue({ eq: mockEq });

        mockClient.from.mockReturnValue(mockQuery);

        await expect(
          api.deleteRetirementAccountMetadata('acc-401k')
        ).rejects.toThrow('Delete failed');
      });
    });

    describe('listRetirementContributions', () => {
      it('should list retirement contributions for account', async () => {
        const mockContributions = [
          {
            id: 'contrib-1',
            retirement_account_id: 'acc-401k',
            contribution_date: '2024-11-15',
            amount: '1000.00',
            contribution_type: 'employee',
            contribution_year: 2024,
            transaction_id: 'txn-123',
            notes: 'Biweekly contribution',
            created_at: '2024-11-15T10:00:00Z',
          },
          {
            id: 'contrib-2',
            retirement_account_id: 'acc-401k',
            contribution_date: '2024-11-01',
            amount: '500.00',
            contribution_type: 'employer',
            contribution_year: 2024,
            transaction_id: null,
            notes: null,
            created_at: '2024-11-01T10:00:00Z',
          },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockContributions, error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        const result = await api.listRetirementContributions('acc-401k');

        expect(mockClient.from).toHaveBeenCalledWith('finance_retirement_contributions');
        expect(mockQuery.select).toHaveBeenCalledWith('*');
        expect(mockQuery.eq).toHaveBeenCalledWith('retirement_account_id', 'acc-401k');
        expect(mockQuery.order).toHaveBeenCalledWith('contribution_date', { ascending: false });
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          id: 'contrib-1',
          retirementAccountId: 'acc-401k',
          contributionDate: '2024-11-15',
          amount: 1000.00,
          contributionType: 'employee',
          contributionYear: 2024,
          transactionId: 'txn-123',
          notes: 'Biweekly contribution',
          createdAt: '2024-11-15T10:00:00Z',
        });
        expect(result[1].transactionId).toBeUndefined();
        expect(result[1].notes).toBeUndefined();
      });

      it('should return empty array when no contributions found', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        const result = await api.listRetirementContributions('acc-401k');
        expect(result).toEqual([]);
      });

      it('should throw error when query fails', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: null, error: new Error('Query failed') }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await expect(
          api.listRetirementContributions('acc-401k')
        ).rejects.toThrow('Query failed');
      });
    });

    describe('addRetirementContribution', () => {
      it('should insert new retirement contribution', async () => {
        const mockQuery = {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.addRetirementContribution({
          retirementAccountId: 'acc-401k',
          contributionDate: '2024-12-01',
          amount: 2000,
          contributionType: 'employee',
          contributionYear: 2024,
          transactionId: 'txn-456',
          notes: 'Year-end bonus contribution',
        });

        expect(mockClient.from).toHaveBeenCalledWith('finance_retirement_contributions');
        expect(mockQuery.insert).toHaveBeenCalledWith({
          id: undefined,
          retirement_account_id: 'acc-401k',
          contribution_date: '2024-12-01',
          amount: 2000,
          contribution_type: 'employee',
          contribution_year: 2024,
          transaction_id: 'txn-456',
          notes: 'Year-end bonus contribution',
        });
      });

      it('should handle catch-up contributions', async () => {
        const mockQuery = {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.addRetirementContribution({
          retirementAccountId: 'acc-ira',
          contributionDate: '2024-04-15',
          amount: 1000,
          contributionType: 'catch_up',
          contributionYear: 2024,
        });

        expect(mockQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            contribution_type: 'catch_up',
            amount: 1000,
          })
        );
      });

      it('should throw error when insert fails', async () => {
        const mockQuery = {
          insert: vi.fn().mockResolvedValue({ error: new Error('Insert failed') }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await expect(
          api.addRetirementContribution({
            retirementAccountId: 'acc-401k',
            contributionDate: '2024-12-01',
            amount: 2000,
            contributionType: 'employee',
            contributionYear: 2024,
          })
        ).rejects.toThrow('Insert failed');
      });
    });

    describe('deleteRetirementContribution', () => {
      it('should delete retirement contribution by ID', async () => {
        const mockDelete = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockResolvedValue({ error: null });

        const mockQuery = { delete: mockDelete };
        mockDelete.mockReturnValue({ eq: mockEq });

        mockClient.from.mockReturnValue(mockQuery);

        await api.deleteRetirementContribution('contrib-1');

        expect(mockClient.from).toHaveBeenCalledWith('finance_retirement_contributions');
        expect(mockDelete).toHaveBeenCalled();
        expect(mockEq).toHaveBeenCalledWith('id', 'contrib-1');
      });

      it('should throw error when delete fails', async () => {
        const mockDelete = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockResolvedValue({ error: new Error('Delete failed') });

        const mockQuery = { delete: mockDelete };
        mockDelete.mockReturnValue({ eq: mockEq });

        mockClient.from.mockReturnValue(mockQuery);

        await expect(
          api.deleteRetirementContribution('contrib-1')
        ).rejects.toThrow('Delete failed');
      });
    });

    describe('listRetirementPerformance', () => {
      it('should list retirement performance snapshots', async () => {
        const mockPerformance = [
          {
            id: 'perf-1',
            retirement_account_id: 'acc-401k',
            snapshot_date: '2024-11-30',
            balance: '125000.50',
            total_contributions: '100000.00',
            total_gains: '25000.50',
            rate_of_return: '8.5',
            allocation_snapshot: {
              stocks: 70,
              bonds: 25,
              cash: 5,
            },
            created_at: '2024-12-01T00:00:00Z',
          },
          {
            id: 'perf-2',
            retirement_account_id: 'acc-401k',
            snapshot_date: '2024-10-31',
            balance: '120000.00',
            total_contributions: '95000.00',
            total_gains: '25000.00',
            rate_of_return: null,
            allocation_snapshot: null,
            created_at: '2024-11-01T00:00:00Z',
          },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockPerformance, error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        const result = await api.listRetirementPerformance('acc-401k');

        expect(mockClient.from).toHaveBeenCalledWith('finance_retirement_performance');
        expect(mockQuery.select).toHaveBeenCalledWith('*');
        expect(mockQuery.eq).toHaveBeenCalledWith('retirement_account_id', 'acc-401k');
        expect(mockQuery.order).toHaveBeenCalledWith('snapshot_date', { ascending: false });
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          id: 'perf-1',
          retirementAccountId: 'acc-401k',
          snapshotDate: '2024-11-30',
          balance: 125000.50,
          totalContributions: 100000.00,
          totalGains: 25000.50,
          rateOfReturn: 8.5,
          allocationSnapshot: {
            stocks: 70,
            bonds: 25,
            cash: 5,
          },
          createdAt: '2024-12-01T00:00:00Z',
        });
        expect(result[1].rateOfReturn).toBeUndefined();
        expect(result[1].allocationSnapshot).toBeUndefined();
      });

      it('should return empty array when no performance data found', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        const result = await api.listRetirementPerformance('acc-401k');
        expect(result).toEqual([]);
      });

      it('should throw error when query fails', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: null, error: new Error('Query failed') }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await expect(
          api.listRetirementPerformance('acc-401k')
        ).rejects.toThrow('Query failed');
      });
    });

    describe('recordRetirementPerformance', () => {
      it('should insert new retirement performance snapshot', async () => {
        const mockQuery = {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.recordRetirementPerformance({
          retirementAccountId: 'acc-401k',
          snapshotDate: '2024-12-31',
          balance: 130000,
          totalContributions: 105000,
          totalGains: 25000,
          rateOfReturn: 9.2,
          allocationSnapshot: {
            stocks: 65,
            bonds: 30,
            cash: 5,
          },
        });

        expect(mockClient.from).toHaveBeenCalledWith('finance_retirement_performance');
        expect(mockQuery.insert).toHaveBeenCalledWith({
          id: undefined,
          retirement_account_id: 'acc-401k',
          snapshot_date: '2024-12-31',
          balance: 130000,
          total_contributions: 105000,
          total_gains: 25000,
          rate_of_return: 9.2,
          allocation_snapshot: {
            stocks: 65,
            bonds: 30,
            cash: 5,
          },
        });
      });

      it('should handle optional fields', async () => {
        const mockQuery = {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await api.recordRetirementPerformance({
          retirementAccountId: 'acc-ira',
          snapshotDate: '2024-12-31',
          balance: 50000,
          totalContributions: 45000,
          totalGains: 5000,
        });

        expect(mockQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            rate_of_return: undefined,
            allocation_snapshot: undefined,
          })
        );
      });

      it('should throw error when insert fails', async () => {
        const mockQuery = {
          insert: vi.fn().mockResolvedValue({ error: new Error('Insert failed') }),
        };

        mockClient.from.mockReturnValue(mockQuery);

        await expect(
          api.recordRetirementPerformance({
            retirementAccountId: 'acc-401k',
            snapshotDate: '2024-12-31',
            balance: 130000,
            totalContributions: 105000,
            totalGains: 25000,
          })
        ).rejects.toThrow('Insert failed');
      });
    });
  });
});
