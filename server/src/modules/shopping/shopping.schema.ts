import { z } from 'zod'

export const createShoppingListBody = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
  store: z.string().optional(),
  shopping_date: z.string().optional(),
})

export const listIdParams = z.object({ id: z.string().uuid() })
export const itemIdParams = z.object({ id: z.string().uuid() })

export const createShoppingItemBody = z.object({
  name: z.string().min(1),
  quantity: z.number().int().positive().optional(),
  unit: z.string().optional(),
  estimated_price: z.number().optional(),
  actual_price: z.number().optional(),
  is_purchased: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  tags: z.array(z.string()).optional(),
})

export const updateShoppingItemBody = createShoppingItemBody.partial()

