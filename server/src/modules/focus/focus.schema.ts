import { z } from 'zod'

export const createFocusSessionBody = z.object({
  preset: z.string().min(1),
  duration: z.number().int().positive(),
  actual_duration: z.number().int().nonnegative().optional(),
  start_time: z.string(),
  end_time: z.string().optional(),
  status: z.enum(['active','completed','cancelled','paused']).optional(),
  task_id: z.string().uuid().optional(),
  notes: z.string().optional(),
})

export const sessionIdParams = z.object({ id: z.string().uuid() })
export const updateFocusSessionBody = createFocusSessionBody.partial()

