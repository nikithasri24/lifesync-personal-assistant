import { z } from 'zod';

const statusEnum = z.enum(['todo', 'done', 'waiting', 'scheduled', 'in_progress']);
const priorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);
const categoryEnum = z.enum(['work', 'personal', 'learning', 'creative', 'health', 'other']);

export const createTaskBody = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  project_id: z.string().uuid().optional(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  estimated_time: z.number().int().positive().optional(),
  actual_time: z.number().int().nonnegative().optional(),
  due_date: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: 'due_date must be a valid ISO date string'
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  category: categoryEnum.optional(),
  notes: z.string().optional(),
  starred: z.boolean().optional(),
  archived: z.boolean().optional()
});

export const updateTaskBody = createTaskBody.partial().extend({
  deleted: z.boolean().optional()
});

export const taskIdParams = z.object({
  id: z.string().uuid()
});

export type CreateTaskBody = z.infer<typeof createTaskBody>;
export type UpdateTaskBody = z.infer<typeof updateTaskBody>;
