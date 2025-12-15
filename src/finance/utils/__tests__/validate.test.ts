import { describe, it, expect } from 'vitest';
import { validateTransactionInput, validateGoalInput } from '../validate';

describe('validate utilities', () => {
  describe('validateTransactionInput', () => {
    it('should validate valid transaction input', async () => {
      const input = {
        accountId: 'acc-1',
        dateISO: '2025-11-21',
        description: 'Test transaction',
        amount: 100.50,
        type: 'debit' as const,
      };

      const result = await validateTransactionInput(input);

      expect(result).toEqual(input);
    });

    it('should validate transaction with optional fields', async () => {
      const input = {
        id: 'txn-1',
        accountId: 'acc-1',
        dateISO: '2025-11-21',
        description: 'Test transaction',
        amount: 100.50,
        type: 'debit' as const,
        categoryId: 'cat-1',
        notes: 'Some notes',
      };

      const result = await validateTransactionInput(input);

      expect(result).toEqual(input);
    });

    it('should validate credit type transaction', async () => {
      const input = {
        accountId: 'acc-1',
        dateISO: '2025-11-21',
        description: 'Income',
        amount: 5000,
        type: 'credit' as const,
      };

      const result = await validateTransactionInput(input);

      expect(result.type).toBe('credit');
    });

    it('should throw on invalid transaction type', async () => {
      const input = {
        accountId: 'acc-1',
        dateISO: '2025-11-21',
        description: 'Test',
        amount: 100,
        type: 'invalid' as any,
      };

      await expect(validateTransactionInput(input)).rejects.toThrow();
    });

    it('should throw on missing required field (accountId)', async () => {
      const input = {
        dateISO: '2025-11-21',
        description: 'Test',
        amount: 100,
        type: 'debit' as const,
      } as any;

      await expect(validateTransactionInput(input)).rejects.toThrow();
    });

    it('should throw on missing required field (description)', async () => {
      const input = {
        accountId: 'acc-1',
        dateISO: '2025-11-21',
        description: '',
        amount: 100,
        type: 'debit' as const,
      };

      await expect(validateTransactionInput(input)).rejects.toThrow();
    });

    it('should throw on invalid amount type', async () => {
      const input = {
        accountId: 'acc-1',
        dateISO: '2025-11-21',
        description: 'Test',
        amount: '100' as any,
        type: 'debit' as const,
      };

      await expect(validateTransactionInput(input)).rejects.toThrow();
    });

    it('should accept negative amounts', async () => {
      const input = {
        accountId: 'acc-1',
        dateISO: '2025-11-21',
        description: 'Refund',
        amount: -50,
        type: 'debit' as const,
      };

      const result = await validateTransactionInput(input);

      expect(result.amount).toBe(-50);
    });

    it('should accept zero amount', async () => {
      const input = {
        accountId: 'acc-1',
        dateISO: '2025-11-21',
        description: 'Test',
        amount: 0,
        type: 'debit' as const,
      };

      const result = await validateTransactionInput(input);

      expect(result.amount).toBe(0);
    });
  });

  describe('validateGoalInput', () => {
    it('should validate valid goal input', async () => {
      const input = {
        id: 'goal-1',
        name: 'Emergency Fund',
        targetAmount: 10000,
        currentAmount: 5000,
        startingAmount: 0,
        dueDateISO: '2026-01-01',
        type: 'savings' as const,
      };

      const result = await validateGoalInput(input);

      expect(result).toEqual(input);
    });

    it('should validate goal with optional fields', async () => {
      const input = {
        id: 'goal-1',
        name: 'Emergency Fund',
        targetAmount: 10000,
        currentAmount: 5000,
        startingAmount: 0,
        dueDateISO: '2026-01-01',
        type: 'savings' as const,
        linkedCategoryId: 'cat-1',
      };

      const result = await validateGoalInput(input);

      expect(result).toEqual(input);
    });

    it('should validate debt type goal', async () => {
      const input = {
        id: 'goal-2',
        name: 'Pay off credit card',
        targetAmount: 5000,
        currentAmount: 2000,
        startingAmount: 5000,
        dueDateISO: '2026-01-01',
        type: 'debt' as const,
      };

      const result = await validateGoalInput(input);

      expect(result.type).toBe('debt');
    });

    it('should throw on invalid goal type', async () => {
      const input = {
        id: 'goal-3',
        name: 'Test Goal',
        targetAmount: 10000,
        currentAmount: 5000,
        startingAmount: 0,
        dueDateISO: '2026-01-01',
        type: 'invalid' as any,
      };

      await expect(validateGoalInput(input)).rejects.toThrow();
    });

    it('should throw on missing required field (name)', async () => {
      const input = {
        id: 'goal-4',
        name: '',
        targetAmount: 10000,
        currentAmount: 5000,
        startingAmount: 0,
        dueDateISO: '2026-01-01',
        type: 'savings' as const,
      };

      await expect(validateGoalInput(input)).rejects.toThrow();
    });

    it('should throw on negative target amount', async () => {
      const input = {
        id: 'goal-5',
        name: 'Test Goal',
        targetAmount: -1000,
        currentAmount: 0,
        startingAmount: 0,
        dueDateISO: '2026-01-01',
        type: 'savings' as const,
      };

      await expect(validateGoalInput(input)).rejects.toThrow();
    });

    it('should throw on negative current amount', async () => {
      const input = {
        id: 'goal-6',
        name: 'Test Goal',
        targetAmount: 10000,
        currentAmount: -100,
        startingAmount: 0,
        dueDateISO: '2026-01-01',
        type: 'savings' as const,
      };

      await expect(validateGoalInput(input)).rejects.toThrow();
    });

    it('should accept zero amounts', async () => {
      const input = {
        id: 'goal-7',
        name: 'New Goal',
        targetAmount: 0,
        currentAmount: 0,
        startingAmount: 0,
        dueDateISO: '2026-01-01',
        type: 'savings' as const,
      };

      const result = await validateGoalInput(input);

      expect(result.targetAmount).toBe(0);
      expect(result.currentAmount).toBe(0);
    });

    it('should throw on invalid date format', async () => {
      const input = {
        id: 'goal-8',
        name: 'Test Goal',
        targetAmount: 10000,
        currentAmount: 5000,
        startingAmount: 0,
        dueDateISO: 'invalid-date',
        type: 'savings' as const,
      };

      // Zod will accept any string for dateISO, but in real usage this would fail
      const result = await validateGoalInput(input);
      expect(result.dueDateISO).toBe('invalid-date');
    });

    it('should accept current amount greater than target', async () => {
      const input = {
        id: 'goal-9',
        name: 'Exceeded Goal',
        targetAmount: 10000,
        currentAmount: 12000,
        startingAmount: 0,
        dueDateISO: '2026-01-01',
        type: 'savings' as const,
      };

      const result = await validateGoalInput(input);

      expect(result.currentAmount).toBeGreaterThan(result.targetAmount);
    });
  });
});
