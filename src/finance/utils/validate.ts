import type { TransactionInput, GoalInput } from '../types';

async function getZod() {
  try {
    // Dynamic to avoid mandatory dependency when using mock only
    const m = await import('zod');
    return m.z;
  } catch {
    return null;
  }
}

export async function validateTransactionInput(input: TransactionInput) {
  const z = await getZod();
  if (!z) return input;
  const schema = z.object({
    id: z.string().optional(),
    accountId: z.string(),
    dateISO: z.string(),
    description: z.string().min(1),
    categoryId: z.string().optional(),
    amount: z.number(),
    type: z.enum(['debit', 'credit']),
    notes: z.string().optional(),
  });
  return schema.parse(input);
}

export async function validateGoalInput(input: GoalInput) {
  const z = await getZod();
  if (!z) return input;
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

