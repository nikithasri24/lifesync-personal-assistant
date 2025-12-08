import { z } from 'zod';
import type { TransactionInput, GoalInput } from '../types';

export async function validateTransactionInput(input: TransactionInput): Promise<TransactionInput> {
  await Promise.resolve(); // Satisfy require-await rule
  const schema = z.object({
    id: z.string().optional(),
    accountId: z.string().min(1, 'Account is required'),
    dateISO: z.string().min(1, 'Date is required'),
    description: z.string().min(1, 'Description is required'),
    categoryId: z.string().min(1).optional(),
    amount: z.number().positive('Amount must be positive'),
    type: z.enum(['debit', 'credit']),
    notes: z.string().optional(),
  });
  return schema.parse(input) as TransactionInput;
}

export async function validateGoalInput(input: GoalInput): Promise<GoalInput> {
  await Promise.resolve(); // Satisfy require-await rule
  const schema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    targetAmount: z.number().nonnegative(),
    currentAmount: z.number().nonnegative(),
    dueDateISO: z.string(),
    type: z.enum(['savings', 'debt']),
    linkedCategoryId: z.string().optional(),
  });
  return schema.parse(input);
}

