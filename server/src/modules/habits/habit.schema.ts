import { z } from 'zod';

export const createHabitBody = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  target_value: z.number().int().positive().optional(),
  unit: z.string().optional(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, { message: 'color must be a valid hex value' })
    .optional(),
  icon: z.string().max(10).optional()
});

export const createHabitEntryBody = z.object({
  date: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: 'date must be a valid ISO date string'
    })
    .optional(),
  value: z.number().int().positive().optional(),
  notes: z.string().optional(),
  mood: z.string().optional()
});

export const habitIdParams = z.object({
  id: z.string().uuid()
});

export type CreateHabitBody = z.infer<typeof createHabitBody>;
export type CreateHabitEntryBody = z.infer<typeof createHabitEntryBody>;
