import { z } from 'zod';

export const createTransactionBody = z.object({
  account_id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number(),
  description: z.string().optional(),
  payee: z.string().optional(),
  date: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: 'date must be a valid ISO date string'
    }),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export const listTransactionsQuery = z.object({
  limit: z
    .string()
    .optional()
    .transform((value) => (value ? Number.parseInt(value, 10) : undefined))
    .refine((value) => value === undefined || (Number.isInteger(value) && value > 0), {
      message: 'limit must be a positive integer'
    })
});

export type CreateTransactionBody = z.infer<typeof createTransactionBody>;
